import pool from '../database.js';

// 로그 기록 미들웨어
export const logAction = (action, target = null) => {
  return async (req, res, next) => {
    // 원본 응답 메서드 저장
    const originalJson = res.json;
    const originalSend = res.send;
    let logged = false; // 중복 방지 플래그

    // 응답 성공 시 로그 기록
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && !logged) {
        logged = true;
        saveLog(req, action, target, data);
      }
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && !logged) {
        logged = true;
        saveLog(req, action, target, data);
      }
      return originalSend.call(this, data);
    };

    next();
  };
};

// 로그 저장 함수
const saveLog = async (req, action, target, responseData) => {
  try {
    const username = req.user?.username || 'unknown';
    let details = null;

    // 액션별 상세 정보 생성
    if (action === 'CREATE_STUDENT' && responseData) {
      details = `이름: ${responseData.name}`;
    } else if (action === 'UPDATE_STUDENT' && req.body) {
      details = `이름: ${req.body.name}`;
    } else if (action === 'DELETE_STUDENT' && target) {
      details = `ID: ${target}`;
    } else if (action === 'CREATE_CLASS' && responseData) {
      details = `수업명: ${responseData.name}`;
    } else if (action === 'UPDATE_CLASS' && req.body) {
      details = `수업명: ${req.body.name}`;
    } else if (action === 'DELETE_CLASS' && target) {
      details = `ID: ${target}`;
    } else if (action === 'CREATE_ATTENDANCE' && req.body) {
      details = `날짜: ${req.body.date}`;
    } else if (action === 'DELETE_ATTENDANCE' && target) {
      details = `ID: ${target}`;
    } else if (action === 'LOGIN') {
      details = `로그인 성공`;
    } else if (action === 'SIGNUP' && req.body) {
      details = `사용자명: ${req.body.username}`;
    }

    await pool.query(
      `INSERT INTO logs (username, action, target, details, "createdAt")
       VALUES ($1, $2, $3, $4, $5)`,
      [username, action, target, details, new Date().toISOString()]
    );
  } catch (error) {
    console.error('로그 저장 실패:', error);
    // 로그 저장 실패가 응답에 영향을 주지 않도록 에러를 무시
  }
};
