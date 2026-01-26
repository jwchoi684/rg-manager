import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// PostgreSQL 연결 설정
// Render 환경: DATABASE_URL 환경 변수 사용
// 로컬 환경: 기본 PostgreSQL 연결 또는 환경 변수
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://rg_manager_user:xgTkd8GYojqIOvkVluzIukCXriiAFNWU@dpg-d4ogj8a4i8rc73f3jeqg-a.oregon-postgres.render.com/rg_manager';

console.log(`데이터베이스 연결: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`); // 비밀번호 숨김

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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

    // 기본 관리자 계정 생성 (username: admin, password: admin123)
    const adminCheck = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
    const hashedAdminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
    if (adminCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (username, password, role, "createdAt")
         VALUES ($1, $2, $3, $4)`,
        ['admin', hashedAdminPassword, 'admin', new Date().toISOString()]
      );
      console.log('기본 관리자 계정 생성 완료 (username: admin, password: admin123)');
    } else {
      // admin 계정 비밀번호를 admin123으로 리셋
      await client.query(
        'UPDATE users SET password = $1 WHERE username = $2',
        [hashedAdminPassword, 'admin']
      );
      console.log('관리자 계정 비밀번호 리셋 완료 (password: admin123)');
    }

    // 이재림 사용자 생성
    const jaerimCheck = await client.query('SELECT * FROM users WHERE username = $1', ['이재림']);
    let jaerimUserId;
    if (jaerimCheck.rows.length === 0) {
      const hashedJaerimPassword = await bcrypt.hash('jaerim123', SALT_ROUNDS);
      const jaerimResult = await client.query(
        `INSERT INTO users (username, password, role, "createdAt")
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        ['이재림', hashedJaerimPassword, 'user', new Date().toISOString()]
      );
      jaerimUserId = jaerimResult.rows[0].id;
      console.log('이재림 사용자 계정 생성 완료 (username: 이재림, password: jaerim123)');
    } else {
      jaerimUserId = jaerimCheck.rows[0].id;
      // 기존 이재림 계정의 비밀번호가 평문이면 해싱된 비밀번호로 업데이트
      const jaerim = jaerimCheck.rows[0];
      if (jaerim.password === 'jaerim123') {
        const hashedJaerimPassword = await bcrypt.hash('jaerim123', SALT_ROUNDS);
        await client.query(
          'UPDATE users SET password = $1 WHERE username = $2',
          [hashedJaerimPassword, '이재림']
        );
        console.log('기존 이재림 계정 비밀번호 암호화 완료');
      }
    }

    // 기존 데이터를 이재림 사용자에게 할당
    await client.query(`
      UPDATE students
      SET "userId" = $1
      WHERE "userId" IS NULL
    `, [jaerimUserId]);

    await client.query(`
      UPDATE classes
      SET "userId" = $1
      WHERE "userId" IS NULL
    `, [jaerimUserId]);

    await client.query(`
      UPDATE attendance
      SET "userId" = $1
      WHERE "userId" IS NULL
    `, [jaerimUserId]);

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
