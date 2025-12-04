import Attendance from '../models/Attendance.js';

export const getAttendance = (req, res) => {
  try {
    const attendance = Attendance.getAll();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const checkAttendance = (req, res) => {
  try {
    const newRecord = Attendance.create(req.body);
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAttendanceByDate = (req, res) => {
  try {
    const { date } = req.params;
    const attendance = Attendance.getByDate(date);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAttendance = (req, res) => {
  try {
    const { id } = req.params;
    Attendance.delete(id);
    res.json({ message: '출석 기록이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAttendanceByDateAndClass = (req, res) => {
  try {
    const { date, classId } = req.body;
    Attendance.deleteByDateAndClass(date, classId);
    res.json({ message: '출석 기록이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
