import db from '../database.js';

export const getStudents = (req, res) => {
  try {
    const students = db.prepare('SELECT * FROM students').all();

    // classIds를 JSON 파싱
    const studentsWithParsedClassIds = students.map(student => ({
      ...student,
      classIds: student.classIds ? JSON.parse(student.classIds) : []
    }));

    res.json(studentsWithParsedClassIds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createStudent = (req, res) => {
  try {
    const { name, birthdate, phone, parentPhone, classIds } = req.body;
    const createdAt = new Date().toISOString();
    const classIdsJson = JSON.stringify(classIds || []);

    const stmt = db.prepare(`
      INSERT INTO students (name, birthdate, phone, parentPhone, classIds, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(name, birthdate, phone, parentPhone, classIdsJson, createdAt);

    const newStudent = {
      id: result.lastInsertRowid,
      name,
      birthdate,
      phone,
      parentPhone,
      classIds: classIds || [],
      createdAt
    };

    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateStudent = (req, res) => {
  try {
    const { id } = req.params;
    const { name, birthdate, phone, parentPhone, classIds } = req.body;
    const classIdsJson = JSON.stringify(classIds || []);

    const stmt = db.prepare(`
      UPDATE students
      SET name = ?, birthdate = ?, phone = ?, parentPhone = ?, classIds = ?
      WHERE id = ?
    `);

    stmt.run(name, birthdate, phone, parentPhone, classIdsJson, id);

    const updatedStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(id);

    res.json({
      ...updatedStudent,
      classIds: updatedStudent.classIds ? JSON.parse(updatedStudent.classIds) : []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteStudent = (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM students WHERE id = ?');
    stmt.run(id);

    res.json({ message: '학생이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
