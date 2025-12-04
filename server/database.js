import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Render persistent disk 경로 사용 (환경 변수로 설정)
// 로컬 개발: ./attendance.db
// Render: /var/data/attendance.db (Persistent Disk 마운트 경로)
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'attendance.db');

// 데이터베이스 디렉토리가 존재하는지 확인
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`데이터베이스 디렉토리 생성: ${dbDir}`);
}

console.log(`데이터베이스 경로: ${DB_PATH}`);
const db = new Database(DB_PATH);

// 데이터베이스 초기화
const initDatabase = () => {
  // Students 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      birthdate TEXT NOT NULL,
      phone TEXT,
      parentPhone TEXT,
      classIds TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  // Classes 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      schedule TEXT NOT NULL,
      duration TEXT NOT NULL,
      instructor TEXT,
      createdAt TEXT NOT NULL
    )
  `);

  // Attendance 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      classId INTEGER,
      date TEXT NOT NULL,
      checkedAt TEXT NOT NULL,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (classId) REFERENCES classes(id) ON DELETE CASCADE
    )
  `);

  // Users 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      createdAt TEXT NOT NULL
    )
  `);

  // 기본 관리자 계정 생성 (username: admin, password: admin123)
  const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    db.prepare(`
      INSERT INTO users (username, password, role, createdAt)
      VALUES (?, ?, ?, ?)
    `).run('admin', 'admin123', 'admin', new Date().toISOString());
    console.log('기본 관리자 계정 생성 완료 (username: admin, password: admin123)');
  }

  console.log('데이터베이스 초기화 완료');
};

initDatabase();

export default db;
