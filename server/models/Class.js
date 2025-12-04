import db from '../database.js';

class Class {
  static getAll() {
    return db.prepare('SELECT * FROM classes').all();
  }

  static getById(id) {
    return db.prepare('SELECT * FROM classes WHERE id = ?').get(id);
  }

  static create(data) {
    const { name, schedule, duration, instructor } = data;
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO classes (name, schedule, duration, instructor, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(name, schedule, duration, instructor, createdAt);

    return {
      id: result.lastInsertRowid,
      name,
      schedule,
      duration,
      instructor,
      createdAt
    };
  }

  static update(id, data) {
    const { name, schedule, duration, instructor } = data;

    const stmt = db.prepare(`
      UPDATE classes
      SET name = ?, schedule = ?, duration = ?, instructor = ?
      WHERE id = ?
    `);

    stmt.run(name, schedule, duration, instructor, id);

    return this.getById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM classes WHERE id = ?');
    stmt.run(id);
  }
}

export default Class;
