import pool from '../database.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

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
    // 사용자 조회
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  static async create(data) {
    const { username, password, role = 'user' } = data;
    const createdAt = new Date().toISOString();

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (username, password, role, "createdAt")
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, role, "createdAt"`,
      [username, hashedPassword, role, createdAt]
    );

    return result.rows[0];
  }

  static async update(id, data) {
    const { username, password, role } = data;

    // 비밀번호가 제공된 경우에만 해싱
    let hashedPassword = password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    }

    const result = await pool.query(
      `UPDATE users
       SET username = $1, password = $2, role = $3
       WHERE id = $4
       RETURNING id, username, role, "createdAt"`,
      [username, hashedPassword, role, id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

export default User;
