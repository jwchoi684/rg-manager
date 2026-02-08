import Attendance from '../models/Attendance.js';
import { sendAttendanceEmail } from '../utils/mailer.js';
import { sendAttendanceKakaoMessage } from '../utils/kakaoMessage.js';
import Class from '../models/Class.js';
import Student from '../models/Student.js';

export const getAttendance = async (req, res) => {
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
      const attendance = await Attendance.getAll(targetUserId, 'user');
      res.json(attendance);
    } else {
      const attendance = await Attendance.getAll(userId, role);
      res.json(attendance);
    }
  } catch (error) {
    console.error('출석 조회 오류:', error);
    res.status(500).json({ error: '출석 조회 중 오류가 발생했습니다.' });
  }
};

export const checkAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const newRecord = await Attendance.create(req.body, userId);
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('출석 체크 오류:', error);
    res.status(500).json({ error: '출석 체크 중 오류가 발생했습니다.' });
  }
};

export const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    const filterUserId = req.query.filterUserId;

    // Admin이 특정 사용자로 필터링하는 경우
    if (role === 'admin' && filterUserId && filterUserId !== 'all') {
      const targetUserId = parseInt(filterUserId, 10);
      if (isNaN(targetUserId)) {
        return res.status(400).json({ error: '잘못된 사용자 ID입니다.' });
      }
      const attendance = await Attendance.getByDate(date, targetUserId, 'user');
      res.json(attendance);
    } else {
      const attendance = await Attendance.getByDate(date, userId, role);
      res.json(attendance);
    }
  } catch (error) {
    console.error('출석 처리 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    await Attendance.delete(id, userId, role);
    res.json({ message: '출석 기록이 삭제되었습니다.' });
  } catch (error) {
    console.error('출석 처리 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

export const deleteAttendanceByDateAndClass = async (req, res) => {
  try {
    const { date, classId } = req.body;
    const userId = req.user.id;
    const role = req.user.role;
    await Attendance.deleteByDateAndClass(date, classId, userId, role);
    res.json({ message: '출석 기록이 삭제되었습니다.' });
  } catch (error) {
    console.error('출석 처리 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 출석 제출 후 이메일 발송
export const submitAttendanceWithEmail = async (req, res) => {
  try {
    const { date, classId, className, schedule, students, presentStudentIds } = req.body;

    // 이메일 발송
    const emailResult = await sendAttendanceEmail({
      date,
      className,
      schedule,
      students,
      presentStudentIds
    });

    if (emailResult.success) {
      res.json({ message: '출석 이메일이 발송되었습니다.', messageId: emailResult.messageId });
    } else {
      res.status(500).json({ error: '이메일 발송 실패', details: emailResult.error });
    }
  } catch (error) {
    console.error('출석 처리 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};

// 일괄 출석 제출 + 카카오톡 알림
export const submitBulkAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { date, classId, studentIds, sendKakaoMessage } = req.body;

    // 1. 기존 출석 삭제 (해당 날짜 + 수업)
    await Attendance.deleteByDateAndClass(date, classId, userId, role);

    // 2. 새 출석 기록 생성
    const attendancePromises = studentIds.map((studentId) =>
      Attendance.create({ studentId, classId, date }, userId)
    );
    await Promise.all(attendancePromises);

    // 3. 카카오 메시지 전송 (요청된 경우)
    let kakaoResult = { skipped: true };
    if (sendKakaoMessage) {
      try {
        const classInfo = await Class.getById(classId, userId, role);
        const allStudents = await Student.getByClassId(classId, userId, role);

        kakaoResult = await sendAttendanceKakaoMessage({
          userId,
          date,
          className: classInfo?.name || '알 수 없는 수업',
          schedule: classInfo?.schedule || '',
          students: allStudents,
          presentStudentIds: studentIds,
        });
      } catch (kakaoError) {
        console.error('카카오 메시지 전송 중 오류:', kakaoError);
        kakaoResult = { success: false, error: '메시지 전송 실패' };
      }
    }

    res.json({
      message: '출석 체크가 완료되었습니다.',
      attendanceCount: studentIds.length,
      kakaoMessage: kakaoResult,
    });
  } catch (error) {
    console.error('출석 처리 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};
