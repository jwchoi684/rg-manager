import Class from '../models/Class.js';

export const getClasses = async (req, res) => {
  try {
    const classes = await Class.getAll();
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createClass = async (req, res) => {
  try {
    const newClass = await Class.create(req.body);
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedClass = await Class.update(id, req.body);
    res.json(updatedClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    await Class.delete(id);
    res.json({ message: '수업이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateClassOrder = async (req, res) => {
  try {
    const { classIds } = req.body;
    await Class.updateOrder(classIds);
    res.json({ message: '수업 순서가 업데이트되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
