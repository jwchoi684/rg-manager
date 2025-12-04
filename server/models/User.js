import pool from '../database.js';

class User {
  static async getAll() {
    const result = await pool.query('SELECT id, username, role, "createdAt" FROM users ORDER BY id');
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT id, username, role, "createdAt" FROM users WHERE id = $1', [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async getByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async getByCredentials(username, password) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async create(data) {
    const { username, password, role = 'user' } = data;
    const createdAt = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO users (username, password, role, "createdAt")
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, role, "createdAt"`,
      [username, password, role, createdAt]
    );

    return result.rows[0];
  }

  static async update(id, data) {
    const { username, password, role } = data;

    const result = await pool.query(
      `UPDATE users
       SET username = $1, password = $2, role = $3
       WHERE id = $4
       RETURNING id, username, role, "createdAt"`,
      [username, password, role, id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

export default User;
