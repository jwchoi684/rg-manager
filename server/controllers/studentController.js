import Student from '../models/Student.js';

export const getStudents = (req, res) => {
  try {
    const students = Student.getAll();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createStudent = (req, res) => {
  try {
    const newStudent = Student.create(req.body);
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateStudent = (req, res) => {
  try {
    const { id } = req.params;
    const updatedStudent = Student.update(id, req.body);
    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteStudent = (req, res) => {
  try {
    const { id } = req.params;
    Student.delete(id);
    res.json({ message: '학생이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
