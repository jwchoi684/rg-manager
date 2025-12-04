import pool from '../database.js';

class Class {
  static async getAll() {
    const result = await pool.query('SELECT * FROM classes ORDER BY id');
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM classes WHERE id = $1', [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async create(data) {
    const { name, schedule, duration, instructor } = data;
    const createdAt = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO classes (name, schedule, duration, instructor, "createdAt")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, schedule, duration, instructor, createdAt]
    );

    return result.rows[0];
  }

  static async update(id, data) {
    const { name, schedule, duration, instructor } = data;

    const result = await pool.query(
      `UPDATE classes
       SET name = $1, schedule = $2, duration = $3, instructor = $4
       WHERE id = $5
       RETURNING *`,
      [name, schedule, duration, instructor, id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async delete(id) {
    await pool.query('DELETE FROM classes WHERE id = $1', [id]);
  }
}

export default Class;
