import pool from '../database.js';

// 로그 조회
export const getLogs = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM logs ORDER BY "createdAt" DESC LIMIT 1000'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('로그 조회 실패:', error);
    res.status(500).json({ error: '로그 조회 실패' });
  }
};
