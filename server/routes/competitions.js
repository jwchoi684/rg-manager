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
  getCompetitionStudentIds
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
router.get('/:id/student-ids', verifyToken, getCompetitionStudentIds);
router.post('/:id/students', verifyToken, logAction('ADD_COMPETITION_STUDENT'), addStudentToCompetition);
router.delete('/:id/students/:studentId', verifyToken, logAction('REMOVE_COMPETITION_STUDENT'), removeStudentFromCompetition);

export default router;
