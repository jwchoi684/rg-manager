import express from 'express';
import { getAttendance, checkAttendance, getAttendanceByDate, deleteAttendance, deleteAttendanceByDateAndClass, submitBulkAttendance } from '../controllers/attendanceController.js';
import { verifyToken } from '../middleware/auth.js';
import { logAction } from '../middleware/logger.js';

const router = express.Router();

router.get('/', verifyToken, getAttendance);
router.post('/', verifyToken, logAction('CREATE_ATTENDANCE'), checkAttendance);
router.post('/bulk', verifyToken, logAction('SUBMIT_BULK_ATTENDANCE'), submitBulkAttendance);
router.get('/date/:date', verifyToken, getAttendanceByDate);
router.delete('/bulk', verifyToken, logAction('DELETE_ATTENDANCE_BULK'), deleteAttendanceByDateAndClass);
router.delete('/:id', verifyToken, logAction('DELETE_ATTENDANCE'), deleteAttendance);

export default router;
