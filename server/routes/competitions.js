import express from 'express';
import {
  getCompetitions,
  getCompetition,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  getCompetitionStudents,
  addStudentToCompetition,
  removeStudentFromCompetition,
  getCompetitionStudentIds,
  updateStudentEvents,
  getStudentEvents,
  getCompetitionStudentsWithEvents,
  updateStudentPaid
} from '../controllers/competitionController.js';
import { verifyToken } from '../middleware/auth.js';
import { logAction } from '../middleware/logger.js';

const router = express.Router();

// 대회 CRUD
router.get('/', verifyToken, getCompetitions);
router.get('/:id', verifyToken, getCompetition);
router.post('/', verifyToken, logAction('CREATE_COMPETITION'), createCompetition);
router.put('/:id', verifyToken, logAction('UPDATE_COMPETITION'), updateCompetition);
router.delete('/:id', verifyToken, logAction('DELETE_COMPETITION'), deleteCompetition);

// 대회 참가 학생 관리
router.get('/:id/students', verifyToken, getCompetitionStudents);
router.get('/:id/students-with-events', verifyToken, getCompetitionStudentsWithEvents);
router.get('/:id/student-ids', verifyToken, getCompetitionStudentIds);
router.post('/:id/students', verifyToken, logAction('ADD_COMPETITION_STUDENT'), addStudentToCompetition);
router.delete('/:id/students/:studentId', verifyToken, logAction('REMOVE_COMPETITION_STUDENT'), removeStudentFromCompetition);

// 종목 관리
router.get('/:id/students/:studentId/events', verifyToken, getStudentEvents);
router.put('/:id/students/:studentId/events', verifyToken, logAction('UPDATE_COMPETITION_EVENTS'), updateStudentEvents);

// 참가비 납부 관리
router.put('/:id/students/:studentId/paid', verifyToken, updateStudentPaid);

export default router;
