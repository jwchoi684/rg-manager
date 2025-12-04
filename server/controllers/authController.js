import db from '../database.js';

export const login = (req, res) => {
  try {
    const { username, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);

    if (!user) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: '로그인 성공',
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const signup = (req, res) => {
  try {
    const { username, password } = req.body;

    // 중복 확인
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ error: '이미 존재하는 사용자입니다.' });
    }

    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (username, password, role, createdAt)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(username, password, 'user', createdAt);

    const newUser = {
      id: result.lastInsertRowid,
      username,
      role: 'user',
      createdAt
    };

    res.status(201).json({
      message: '회원가입 성공',
      user: newUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, role, createdAt FROM users').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;

    const stmt = db.prepare(`
      UPDATE users
      SET username = ?, password = ?, role = ?
      WHERE id = ?
    `);

    stmt.run(username, password, role, id);

    const updatedUser = db.prepare('SELECT id, username, role, createdAt FROM users WHERE id = ?').get(id);

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);

    res.json({ message: '사용자가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
