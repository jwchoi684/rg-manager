import db from '../database.js';

class Attendance {
  static getAll() {
    return db.prepare('SELECT * FROM attendance').all();
  }

  static getByDate(date) {
    return db.prepare('SELECT * FROM attendance WHERE date = ?').all(date);
  }

  static getById(id) {
    return db.prepare('SELECT * FROM attendance WHERE id = ?').get(id);
  }

  static create(data) {
    const { studentId, classId, date } = data;
    const checkedAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO attendance (studentId, classId, date, checkedAt)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(studentId, classId, date, checkedAt);

    return {
      id: result.lastInsertRowid,
      studentId,
      classId,
      date,
      checkedAt
    };
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM attendance WHERE id = ?');
    stmt.run(id);
  }

  static deleteByDateAndClass(date, classId) {
    const stmt = db.prepare('DELETE FROM attendance WHERE date = ? AND classId = ?');
    stmt.run(date, classId);
  }
}

export default Attendance;
