import db from '../database.js';

class User {
  static getAll() {
    return db.prepare('SELECT id, username, role, createdAt FROM users').all();
  }

  static getById(id) {
    return db.prepare('SELECT id, username, role, createdAt FROM users WHERE id = ?').get(id);
  }

  static getByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  }

  static getByCredentials(username, password) {
    return db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  }

  static create(data) {
    const { username, password, role = 'user' } = data;
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (username, password, role, createdAt)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(username, password, role, createdAt);

    return {
      id: result.lastInsertRowid,
      username,
      role,
      createdAt
    };
  }

  static update(id, data) {
    const { username, password, role } = data;

    const stmt = db.prepare(`
      UPDATE users
      SET username = ?, password = ?, role = ?
      WHERE id = ?
    `);

    stmt.run(username, password, role, id);

    return this.getById(id);
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
  }
}

export default User;
