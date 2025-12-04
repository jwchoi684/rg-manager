import pkg from 'pg';
const { Pool } = pkg;

// PostgreSQL 연결 설정
// Render 환경: DATABASE_URL 환경 변수 사용
// 로컬 환경: 기본 PostgreSQL 연결 또는 환경 변수
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://rg_manager_user:xgTkd8GYojqIOvkVluzIukCXriiAFNWU@dpg-d4ogj8a4i8rc73f3jeqg-a/rg_manager';

console.log(`데이터베이스 연결: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`); // 비밀번호 숨김

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
        phone TEXT,
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
        "createdAt" TEXT NOT NULL
      )
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

    // 기본 관리자 계정 생성 (username: admin, password: admin123)
    const adminCheck = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (adminCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (username, password, role, "createdAt")
         VALUES ($1, $2, $3, $4)`,
        ['admin', 'admin123', 'admin', new Date().toISOString()]
      );
      console.log('기본 관리자 계정 생성 완료 (username: admin, password: admin123)');
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
