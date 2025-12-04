import db from '../database.js';

export const getClasses = (req, res) => {
  try {
    const classes = db.prepare('SELECT * FROM classes').all();
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createClass = (req, res) => {
  try {
    const { name, schedule, duration, instructor } = req.body;
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO classes (name, schedule, duration, instructor, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(name, schedule, duration, instructor, createdAt);

    const newClass = {
      id: result.lastInsertRowid,
      name,
      schedule,
      duration,
      instructor,
      createdAt
    };

    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateClass = (req, res) => {
  try {
    const { id } = req.params;
    const { name, schedule, duration, instructor } = req.body;

    const stmt = db.prepare(`
      UPDATE classes
      SET name = ?, schedule = ?, duration = ?, instructor = ?
      WHERE id = ?
    `);

    stmt.run(name, schedule, duration, instructor, id);

    const updatedClass = db.prepare('SELECT * FROM classes WHERE id = ?').get(id);

    res.json(updatedClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteClass = (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM classes WHERE id = ?');
    stmt.run(id);

    res.json({ message: '수업이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
