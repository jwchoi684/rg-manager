import Student from '../models/Student.js';

export const getStudents = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const students = await Student.getAll(userId, role);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createStudent = async (req, res) => {
  try {
    const userId = req.user.id;
    const newStudent = await Student.create(req.body, userId);
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    const updatedStudent = await Student.update(id, req.body, userId, role);
    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    await Student.delete(id, userId, role);
    res.json({ message: '학생이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
