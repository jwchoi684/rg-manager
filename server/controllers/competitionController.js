import Competition from '../models/Competition.js';

export const getCompetitions = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const filterUserId = req.query.filterUserId;

    if (role === 'admin' && filterUserId && filterUserId !== 'all') {
      const competitions = await Competition.getAll(parseInt(filterUserId), 'user');
      res.json(competitions);
    } else {
      const competitions = await Competition.getAll(userId, role);
      res.json(competitions);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    const competition = await Competition.getById(id, userId, role);

    if (!competition) {
      return res.status(404).json({ error: '대회를 찾을 수 없습니다.' });
    }

    res.json(competition);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCompetition = async (req, res) => {
  try {
    const userId = req.user.id;
    const newCompetition = await Competition.create(req.body, userId);
    res.status(201).json(newCompetition);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    const updatedCompetition = await Competition.update(id, req.body, userId, role);

    if (!updatedCompetition) {
      return res.status(404).json({ error: '대회를 찾을 수 없습니다.' });
    }

    res.json(updatedCompetition);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    await Competition.delete(id, userId, role);
    res.json({ message: '대회가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 대회 참가 학생 관련
export const getCompetitionStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    const students = await Competition.getStudents(id, userId, role);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addStudentToCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, events } = req.body;
    await Competition.addStudent(id, studentId, events);
    res.status(201).json({ message: '학생이 대회에 등록되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateStudentEvents = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const { events } = req.body;
    const result = await Competition.updateStudentEvents(id, studentId, events);
    if (!result) {
      return res.status(404).json({ error: '등록 정보를 찾을 수 없습니다.' });
    }
    res.json({ message: '종목 정보가 업데이트되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getStudentEvents = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const events = await Competition.getStudentEvents(id, studentId);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCompetitionStudentsWithEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    const students = await Competition.getStudentsWithEvents(id, userId, role);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeStudentFromCompetition = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    await Competition.removeStudent(id, studentId);
    res.json({ message: '학생이 대회에서 제외되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCompetitionStudentIds = async (req, res) => {
  try {
    const { id } = req.params;
    const studentIds = await Competition.getStudentIds(id);
    res.json(studentIds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
