import pool from '../database.js';

class Student {
  static async getAll() {
    const result = await pool.query('SELECT * FROM students ORDER BY id');

    // classIds를 JSON 파싱
    return result.rows.map(student => ({
      ...student,
      classIds: student.classIds ? JSON.parse(student.classIds) : []
    }));
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);

    if (result.rows.length === 0) return null;

    const student = result.rows[0];
    return {
      ...student,
      classIds: student.classIds ? JSON.parse(student.classIds) : []
    };
  }

  static async create(data) {
    const { name, birthdate, phone, parentPhone, classIds } = data;
    const createdAt = new Date().toISOString();
    const classIdsJson = JSON.stringify(classIds || []);

    const result = await pool.query(
      `INSERT INTO students (name, birthdate, phone, "parentPhone", "classIds", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, birthdate, phone, parentPhone, classIdsJson, createdAt]
    );

    const newStudent = result.rows[0];
    return {
      ...newStudent,
      classIds: newStudent.classIds ? JSON.parse(newStudent.classIds) : []
    };
  }

  static async update(id, data) {
    const { name, birthdate, phone, parentPhone, classIds } = data;
    const classIdsJson = JSON.stringify(classIds || []);

    const result = await pool.query(
      `UPDATE students
       SET name = $1, birthdate = $2, phone = $3, "parentPhone" = $4, "classIds" = $5
       WHERE id = $6
       RETURNING *`,
      [name, birthdate, phone, parentPhone, classIdsJson, id]
    );

    if (result.rows.length === 0) return null;

    const updatedStudent = result.rows[0];
    return {
      ...updatedStudent,
      classIds: updatedStudent.classIds ? JSON.parse(updatedStudent.classIds) : []
    };
  }

  static async delete(id) {
    await pool.query('DELETE FROM students WHERE id = $1', [id]);
  }
}

export default Student;
