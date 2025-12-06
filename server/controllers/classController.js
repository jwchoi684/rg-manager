import Class from '../models/Class.js';

export const getClasses = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const classes = await Class.getAll(userId, role);
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createClass = async (req, res) => {
  try {
    const userId = req.user.id;
    const newClass = await Class.create(req.body, userId);
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    const updatedClass = await Class.update(id, req.body, userId, role);
    res.json(updatedClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    await Class.delete(id, userId, role);
    res.json({ message: '수업이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateClassOrder = async (req, res) => {
  try {
    const { classIds } = req.body;
    const userId = req.user.id;
    const role = req.user.role;
    await Class.updateOrder(classIds, userId, role);
    res.json({ message: '수업 순서가 업데이트되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
