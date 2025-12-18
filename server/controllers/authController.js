import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.getByCredentials(username, password);

    if (!user) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = user;

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: '로그인 성공',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const signup = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 중복 확인
    const existingUser = await User.getByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: '이미 존재하는 사용자입니다.' });
    }

    const newUser = await User.create({ username, password });

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: '회원가입 성공',
      user: newUser,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.update(id, req.body);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.delete(id);
    res.json({ message: '사용자가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyTokenEndpoint = async (req, res) => {
  try {
    // req.user is set by verifyToken middleware
    const user = await User.getById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다.', tokenExpired: true });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
