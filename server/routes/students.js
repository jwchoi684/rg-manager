import express from 'express';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../controllers/studentController.js';
import { verifyToken } from '../middleware/auth.js';
import { logAction } from '../middleware/logger.js';

const router = express.Router();

router.get('/', verifyToken, getStudents);
router.post('/', verifyToken, logAction('CREATE_STUDENT'), createStudent);
router.put('/:id', verifyToken, logAction('UPDATE_STUDENT'), updateStudent);
router.delete('/:id', verifyToken, logAction('DELETE_STUDENT'), deleteStudent);

export default router;
