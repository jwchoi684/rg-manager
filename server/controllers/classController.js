import Class from '../models/Class.js';

export const getClasses = (req, res) => {
  try {
    const classes = Class.getAll();
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createClass = (req, res) => {
  try {
    const newClass = Class.create(req.body);
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateClass = (req, res) => {
  try {
    const { id } = req.params;
    const updatedClass = Class.update(id, req.body);
    res.json(updatedClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteClass = (req, res) => {
  try {
    const { id } = req.params;
    Class.delete(id);
    res.json({ message: '수업이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
