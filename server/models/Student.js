import db from '../database.js';

class Student {
  static getAll() {
    const students = db.prepare('SELECT * FROM students').all();

    // classIds를 JSON 파싱
    return students.map(student => ({
      ...student,
      classIds: student.classIds ? JSON.parse(student.classIds) : []
    }));
  }

  static getById(id) {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);

    if (!student) return null;

    return {
      ...student,
      classIds: student.classIds ? JSON.parse(student.classIds) : []
    };
  }

  static create(data) {
    const { name, birthdate, phone, parentPhone, classIds } = data;
    const createdAt = new Date().toISOString();
    const classIdsJson = JSON.stringify(classIds || []);

    const stmt = db.prepare(`
      INSERT INTO students (name, birthdate, phone, parentPhone, classIds, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(name, birthdate, phone, parentPhone, classIdsJson, createdAt);

    return {
      id: result.lastInsertRowid,
      name,
      birthdate,
      phone,
      parentPhone,
      classIds: classIds || [],
      createdAt
    };
  }

  static update(id, data) {
    const { name, birthdate, phone, parentPhone, classIds } = data;
    const classIdsJson = JSON.stringify(classIds || []);

    const stmt = db.prepare(`
      UPDATE students
      SET name = ?, birthdate = ?, phone = ?, parentPhone = ?, classIds = ?
      WHERE id = ?
    `);

    stmt.run(name, birthdate, phone, parentPhone, classIdsJson, id);

    return this.getById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM students WHERE id = ?');
    stmt.run(id);
  }
}

export default Student;
