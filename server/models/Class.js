import pool from '../database.js';

class Class {
  static async getAll(userId, role) {
    let query = 'SELECT * FROM classes';
    let params = [];

    // Admin이 아닌 경우 userId로 필터링
    if (role !== 'admin') {
      query += ' WHERE "userId" = $1';
      params.push(userId);
    }

    query += ' ORDER BY "displayOrder", id';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getById(id, userId, role) {
    let query = 'SELECT * FROM classes WHERE id = $1';
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
    const { name, schedule, duration, instructor } = data;
    const createdAt = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO classes (name, schedule, duration, instructor, "userId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, schedule, duration, instructor, userId, createdAt]
    );

    return result.rows[0];
  }

  static async update(id, data, userId, role) {
    const { name, schedule, duration, instructor } = data;

    let query = `UPDATE classes
       SET name = $1, schedule = $2, duration = $3, instructor = $4
       WHERE id = $5`;
    let params = [name, schedule, duration, instructor, id];

    // Admin이 아닌 경우 userId로 추가 필터링
    if (role !== 'admin') {
      query += ' AND "userId" = $6';
      params.push(userId);
    }

    query += ' RETURNING *';
    const result = await pool.query(query, params);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async delete(id, userId, role) {
    let query = 'DELETE FROM classes WHERE id = $1';
    let params = [id];

    // Admin이 아닌 경우 userId로 추가 필터링
    if (role !== 'admin') {
      query += ' AND "userId" = $2';
      params.push(userId);
    }

    await pool.query(query, params);
  }

  static async updateOrder(classIds, userId, role) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < classIds.length; i++) {
        let query = 'UPDATE classes SET "displayOrder" = $1 WHERE id = $2';
        let params = [i, classIds[i]];

        // Admin이 아닌 경우 userId로 추가 필터링
        if (role !== 'admin') {
          query += ' AND "userId" = $3';
          params.push(userId);
        }

        await client.query(query, params);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default Class;
