import express from 'express';
import { getAttendance, checkAttendance, getAttendanceByDate, deleteAttendanceByDateAndClass } from '../controllers/attendanceController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getAttendance);
router.post('/', verifyToken, checkAttendance);
router.get('/date/:date', verifyToken, getAttendanceByDate);
router.delete('/bulk', verifyToken, deleteAttendanceByDateAndClass);

export default router;
