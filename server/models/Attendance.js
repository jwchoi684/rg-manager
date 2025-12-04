import pool from '../database.js';

class Attendance {
  static async getAll() {
    const result = await pool.query('SELECT * FROM attendance ORDER BY id');
    return result.rows;
  }

  static async getByDate(date) {
    const result = await pool.query('SELECT * FROM attendance WHERE date = $1', [date]);
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM attendance WHERE id = $1', [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async create(data) {
    const { studentId, classId, date } = data;
    const checkedAt = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO attendance ("studentId", "classId", date, "checkedAt")
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [studentId, classId, date, checkedAt]
    );

    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM attendance WHERE id = $1', [id]);
  }

  static async deleteByDateAndClass(date, classId) {
    await pool.query('DELETE FROM attendance WHERE date = $1 AND "classId" = $2', [date, classId]);
  }
}

export default Attendance;
