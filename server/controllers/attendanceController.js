import db from '../database.js';

export const getAttendance = (req, res) => {
  try {
    const attendance = db.prepare('SELECT * FROM attendance').all();
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const checkAttendance = (req, res) => {
  try {
    const { studentId, classId, date } = req.body;
    const checkedAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO attendance (studentId, classId, date, checkedAt)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(studentId, classId, date, checkedAt);

    const newRecord = {
      id: result.lastInsertRowid,
      studentId,
      classId,
      date,
      checkedAt
    };

    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAttendanceByDate = (req, res) => {
  try {
    const { date } = req.params;

    const attendance = db.prepare('SELECT * FROM attendance WHERE date = ?').all(date);

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAttendance = (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM attendance WHERE id = ?');
    stmt.run(id);

    res.json({ message: '출석 기록이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAttendanceByDateAndClass = (req, res) => {
  try {
    const { date, classId } = req.body;

    const stmt = db.prepare('DELETE FROM attendance WHERE date = ? AND classId = ?');
    stmt.run(date, classId);

    res.json({ message: '출석 기록이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
