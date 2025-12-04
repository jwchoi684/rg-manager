import User from '../models/User.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.getByCredentials(username, password);

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

export const signup = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 중복 확인
    const existingUser = await User.getByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: '이미 존재하는 사용자입니다.' });
    }

    const newUser = await User.create({ username, password });

    res.status(201).json({
      message: '회원가입 성공',
      user: newUser
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
