import pool from '../database.js';

class Competition {
  static async getAll(userId, role) {
    let query = 'SELECT * FROM competitions';
    let params = [];

    if (role !== 'admin') {
      query += ' WHERE "userId" = $1';
      params.push(userId);
    }

    query += ' ORDER BY date DESC, id DESC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getById(id, userId, role) {
    let query = 'SELECT * FROM competitions WHERE id = $1';
    let params = [id];

    if (role !== 'admin') {
      query += ' AND "userId" = $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async create(data, userId) {
    const { name, date, location } = data;
    const createdAt = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO competitions (name, date, location, "userId", "createdAt")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, date, location, userId, createdAt]
    );

    return result.rows[0];
  }

  static async update(id, data, userId, role) {
    const { name, date, location } = data;

    let query = `UPDATE competitions
       SET name = $1, date = $2, location = $3
       WHERE id = $4`;
    let params = [name, date, location, id];

    if (role !== 'admin') {
      query += ' AND "userId" = $5';
      params.push(userId);
    }

    query += ' RETURNING *';
    const result = await pool.query(query, params);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async delete(id, userId, role) {
    let query = 'DELETE FROM competitions WHERE id = $1';
    let params = [id];

    if (role !== 'admin') {
      query += ' AND "userId" = $2';
      params.push(userId);
    }

    await pool.query(query, params);
  }

  // 대회 참가 학생 관련 메서드
  static async getStudents(competitionId, userId, role) {
    let query = `
      SELECT s.* FROM students s
      INNER JOIN competition_students cs ON s.id = cs."studentId"
      WHERE cs."competitionId" = $1
    `;
    let params = [competitionId];

    if (role !== 'admin') {
      query += ' AND s."userId" = $2';
      params.push(userId);
    }

    query += ' ORDER BY s.name';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async addStudent(competitionId, studentId, events = null, award = null) {
    // 먼저 이미 등록되어 있는지 확인
    const existing = await pool.query(
      'SELECT id FROM competition_students WHERE "competitionId" = $1 AND "studentId" = $2',
      [competitionId, studentId]
    );

    if (existing.rows.length > 0) {
      // 이미 존재하면 events, award 업데이트
      if (events || award !== undefined) {
        const result = await pool.query(
          `UPDATE competition_students SET events = $1, award = $2 WHERE "competitionId" = $3 AND "studentId" = $4 RETURNING *`,
          [events ? JSON.stringify(events) : null, award, competitionId, studentId]
        );
        return result.rows[0];
      }
      return existing.rows[0];
    }

    const createdAt = new Date().toISOString();
    const eventsJson = events ? JSON.stringify(events) : null;

    const result = await pool.query(
      `INSERT INTO competition_students ("competitionId", "studentId", events, award, "createdAt")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [competitionId, studentId, eventsJson, award, createdAt]
    );

    return result.rows[0];
  }

  static async updateStudentEvents(competitionId, studentId, events, award = null) {
    const eventsJson = events ? JSON.stringify(events) : null;
    const result = await pool.query(
      `UPDATE competition_students SET events = $1, award = $2 WHERE "competitionId" = $3 AND "studentId" = $4 RETURNING *`,
      [eventsJson, award, competitionId, studentId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async getStudentEvents(competitionId, studentId) {
    const result = await pool.query(
      'SELECT events, award FROM competition_students WHERE "competitionId" = $1 AND "studentId" = $2',
      [competitionId, studentId]
    );
    if (result.rows.length > 0) {
      return {
        events: result.rows[0].events ? JSON.parse(result.rows[0].events) : [],
        award: result.rows[0].award || ''
      };
    }
    return { events: [], award: '' };
  }

  static async getStudentsWithEvents(competitionId, userId, role) {
    let query = `
      SELECT s.*, cs.events, cs.award FROM students s
      INNER JOIN competition_students cs ON s.id = cs."studentId"
      WHERE cs."competitionId" = $1
    `;
    let params = [competitionId];

    if (role !== 'admin') {
      query += ' AND s."userId" = $2';
      params.push(userId);
    }

    query += ' ORDER BY s.name';
    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      ...row,
      events: row.events ? JSON.parse(row.events) : [],
      award: row.award || ''
    }));
  }

  static async removeStudent(competitionId, studentId) {
    await pool.query(
      'DELETE FROM competition_students WHERE "competitionId" = $1 AND "studentId" = $2',
      [competitionId, studentId]
    );
  }

  static async getStudentIds(competitionId) {
    const result = await pool.query(
      'SELECT "studentId" FROM competition_students WHERE "competitionId" = $1',
      [competitionId]
    );
    return result.rows.map(row => row.studentId);
  }
}

export default Competition;
