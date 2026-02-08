import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// PostgreSQL 연결 설정
// DATABASE_URL 환경 변수 필수
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

// 데이터베이스 초기화
const initDatabase = async () => {
  const client = await pool.connect();

  try {
    // Students 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        birthdate TEXT NOT NULL,
        "classIds" TEXT,
        "createdAt" TEXT NOT NULL
      )
    `);

    // Classes 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        schedule TEXT NOT NULL,
        duration TEXT NOT NULL,
        instructor TEXT,
        "displayOrder" INTEGER DEFAULT 0,
        "createdAt" TEXT NOT NULL
      )
    `);

    // students 테이블에 phone, parentPhone 컬럼 추가
    await client.query(`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS phone TEXT
    `);

    await client.query(`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS "parentPhone" TEXT
    `);

    // displayOrder 컬럼이 없는 경우 추가 (기존 테이블 마이그레이션)
    await client.query(`
      ALTER TABLE classes
      ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER DEFAULT 0
    `);

    // userId 컬럼 추가 (멀티테넌시)
    await client.query(`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS "userId" INTEGER
    `);

    await client.query(`
      ALTER TABLE classes
      ADD COLUMN IF NOT EXISTS "userId" INTEGER
    `);

    await client.query(`
      ALTER TABLE attendance
      ADD COLUMN IF NOT EXISTS "userId" INTEGER
    `);

    // Attendance 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        "studentId" INTEGER NOT NULL,
        "classId" INTEGER,
        date TEXT NOT NULL,
        "checkedAt" TEXT NOT NULL,
        FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY ("classId") REFERENCES classes(id) ON DELETE CASCADE
      )
    `);

    // attendance 테이블에 UNIQUE 제약 추가
    try {
      await client.query(`
        ALTER TABLE attendance
        ADD CONSTRAINT attendance_unique UNIQUE ("studentId", "classId", date)
      `);
    } catch (e) {
      // constraint가 이미 존재하면 무시
    }

    // Users 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        "createdAt" TEXT NOT NULL
      )
    `);

    // Logs 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT,
        details TEXT,
        "createdAt" TEXT NOT NULL
      )
    `);

    // Competitions 테이블 (대회)
    await client.query(`
      CREATE TABLE IF NOT EXISTS competitions (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        location TEXT NOT NULL,
        "userId" INTEGER,
        "createdAt" TEXT NOT NULL
      )
    `);

    // Competition Students 테이블 (대회 참가 학생)
    await client.query(`
      CREATE TABLE IF NOT EXISTS competition_students (
        id SERIAL PRIMARY KEY,
        "competitionId" INTEGER NOT NULL,
        "studentId" INTEGER NOT NULL,
        "createdAt" TEXT NOT NULL,
        FOREIGN KEY ("competitionId") REFERENCES competitions(id) ON DELETE CASCADE,
        FOREIGN KEY ("studentId") REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // competition_students 테이블에 UNIQUE constraint 추가 (기존 테이블 마이그레이션)
    try {
      await client.query(`
        ALTER TABLE competition_students
        ADD CONSTRAINT competition_students_unique UNIQUE ("competitionId", "studentId")
      `);
    } catch (e) {
      // constraint가 이미 존재하면 무시
    }

    // competition_students 테이블에 events 컬럼 추가 (종목 정보)
    await client.query(`
      ALTER TABLE competition_students
      ADD COLUMN IF NOT EXISTS events TEXT
    `);

    // competition_students 테이블에 award 컬럼 추가 (수상 기록)
    await client.query(`
      ALTER TABLE competition_students
      ADD COLUMN IF NOT EXISTS award TEXT
    `);

    // competition_students 테이블에 paid 컬럼 추가 (참가비 납부 여부)
    await client.query(`
      ALTER TABLE competition_students
      ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE
    `);

    // competition_students 테이블에 coachFeePaid 컬럼 추가 (출강비 납부 여부)
    await client.query(`
      ALTER TABLE competition_students
      ADD COLUMN IF NOT EXISTS "coachFeePaid" BOOLEAN DEFAULT FALSE
    `);

    // users 테이블에 카카오 로그인 관련 컬럼 추가
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS "kakaoId" TEXT UNIQUE
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email TEXT
    `);

    // 카카오 메시지 알림 관련 컬럼 추가
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS "kakaoAccessToken" TEXT
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS "kakaoRefreshToken" TEXT
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS "kakaoTokenExpiresAt" TEXT
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS "kakaoMessageConsent" BOOLEAN DEFAULT FALSE
    `);

    // 카카오 메시지 로그 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS kakao_message_logs (
        id SERIAL PRIMARY KEY,
        "senderId" INTEGER NOT NULL,
        "recipientId" INTEGER NOT NULL,
        "messageType" TEXT NOT NULL,
        "messageContent" TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        "errorMessage" TEXT,
        "createdAt" TEXT NOT NULL,
        FOREIGN KEY ("senderId") REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY ("recipientId") REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 기본 관리자 계정 생성 (최초 1회만, 기존 계정이 없을 때)
    const adminCheck = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (adminCheck.rows.length === 0) {
      const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin123';
      const hashedAdminPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      await client.query(
        `INSERT INTO users (username, password, role, "createdAt")
         VALUES ($1, $2, $3, $4)`,
        ['admin', hashedAdminPassword, 'admin', new Date().toISOString()]
      );
      console.log('기본 관리자 계정 생성 완료. 즉시 비밀번호를 변경하세요.');
    }

    console.log('데이터베이스 초기화 완료');
  } catch (error) {
    console.error('데이터베이스 초기화 실패:', error);
    throw error;
  } finally {
    client.release();
  }
};

// 초기화 실행
initDatabase().catch(console.error);

export default pool;
