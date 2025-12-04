import Attendance from '../models/Attendance.js';

export const getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.getAll();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const checkAttendance = async (req, res) => {
  try {
    const newRecord = await Attendance.create(req.body);
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const attendance = await Attendance.getByDate(date);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    await Attendance.delete(id);
    res.json({ message: '출석 기록이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAttendanceByDateAndClass = async (req, res) => {
  try {
    const { date, classId } = req.body;
    await Attendance.deleteByDateAndClass(date, classId);
    res.json({ message: '출석 기록이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
