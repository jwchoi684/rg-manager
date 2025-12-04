import express from 'express';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../controllers/studentController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getStudents);
router.post('/', verifyToken, createStudent);
router.put('/:id', verifyToken, updateStudent);
router.delete('/:id', verifyToken, deleteStudent);

export default router;
