import express from 'express';
import { getAttendance, checkAttendance, getAttendanceByDate, deleteAttendanceByDateAndClass } from '../controllers/attendanceController.js';

const router = express.Router();

router.get('/', getAttendance);
router.post('/', checkAttendance);
router.get('/date/:date', getAttendanceByDate);
router.delete('/bulk', deleteAttendanceByDateAndClass);

export default router;
