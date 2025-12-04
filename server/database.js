import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'attendance.db'));

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
