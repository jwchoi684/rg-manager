import express from 'express';
import { getAttendance, checkAttendance, getAttendanceByDate, deleteAttendance, deleteAttendanceByDateAndClass } from '../controllers/attendanceController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getAttendance);
router.post('/', verifyToken, checkAttendance);
router.get('/date/:date', verifyToken, getAttendanceByDate);
router.delete('/bulk', verifyToken, deleteAttendanceByDateAndClass);
router.delete('/:id', verifyToken, deleteAttendance);

export default router;
