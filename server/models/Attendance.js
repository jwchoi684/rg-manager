import pool from '../database.js';

class Attendance {
  static async getAll(userId, role) {
    let query = 'SELECT * FROM attendance';
    let params = [];

    // Admin이 아닌 경우 userId로 필터링
    if (role !== 'admin') {
      query += ' WHERE "userId" = $1';
      params.push(userId);
    }

    query += ' ORDER BY id';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getByDate(date, userId, role) {
    let query = 'SELECT * FROM attendance WHERE date = $1';
    let params = [date];

    // Admin이 아닌 경우 userId로 추가 필터링
    if (role !== 'admin') {
      query += ' AND "userId" = $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getById(id, userId, role) {
    let query = 'SELECT * FROM attendance WHERE id = $1';
    let params = [id];

    // Admin이 아닌 경우 userId로 추가 필터링
    if (role !== 'admin') {
      query += ' AND "userId" = $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async create(data, userId) {
    const { studentId, classId, date } = data;
    const checkedAt = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO attendance ("studentId", "classId", date, "userId", "checkedAt")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [studentId, classId, date, userId, checkedAt]
    );

    return result.rows[0];
  }

  static async delete(id, userId, role) {
    let query = 'DELETE FROM attendance WHERE id = $1';
    let params = [id];

    // Admin이 아닌 경우 userId로 추가 필터링
    if (role !== 'admin') {
      query += ' AND "userId" = $2';
      params.push(userId);
    }

    await pool.query(query, params);
  }

  static async deleteByDateAndClass(date, classId, userId, role) {
    let query = 'DELETE FROM attendance WHERE date = $1 AND "classId" = $2';
    let params = [date, classId];

    // Admin이 아닌 경우 userId로 추가 필터링
    if (role !== 'admin') {
      query += ' AND "userId" = $3';
      params.push(userId);
    }

    await pool.query(query, params);
  }
}

export default Attendance;
