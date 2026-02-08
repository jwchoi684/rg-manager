import Student from '../models/Student.js';

export const getStudents = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const filterUserId = req.query.filterUserId;

    // Admin이 특정 사용자로 필터링하는 경우
    if (role === 'admin' && filterUserId && filterUserId !== 'all') {
      const targetUserId = parseInt(filterUserId, 10);
      if (isNaN(targetUserId)) {
        return res.status(400).json({ error: '잘못된 사용자 ID입니다.' });
      }
      const students = await Student.getAll(targetUserId, 'user');
      res.json(students);
    } else {
      const students = await Student.getAll(userId, role);
      res.json(students);
    }
  } catch (error) {
    console.error('학생 목록 조회 오류:', error);
    res.status(500).json({ error: '학생 목록 조회 중 오류가 발생했습니다.' });
  }
};

export const createStudent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, birthdate } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: '학생 이름은 필수입니다.' });
    }
    if (!birthdate) {
      return res.status(400).json({ error: '생년월일은 필수입니다.' });
    }

    const newStudent = await Student.create(req.body, userId);
    res.status(201).json(newStudent);
  } catch (error) {
    console.error('학생 등록 오류:', error);
    res.status(500).json({ error: '학생 등록 중 오류가 발생했습니다.' });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    const updatedStudent = await Student.update(id, req.body, userId, role);
    if (!updatedStudent) {
      return res.status(404).json({ error: '학생을 찾을 수 없습니다.' });
    }
    res.json(updatedStudent);
  } catch (error) {
    console.error('학생 수정 오류:', error);
    res.status(500).json({ error: '학생 수정 중 오류가 발생했습니다.' });
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
    console.error('학생 삭제 오류:', error);
    res.status(500).json({ error: '학생 삭제 중 오류가 발생했습니다.' });
  }
};
