import express from 'express';
import { getClasses, createClass, updateClass, deleteClass, updateClassOrder } from '../controllers/classController.js';
import { verifyToken } from '../middleware/auth.js';
import { logAction } from '../middleware/logger.js';

const router = express.Router();

router.get('/', verifyToken, getClasses);
router.post('/', verifyToken, logAction('CREATE_CLASS'), createClass);
router.put('/:id', verifyToken, logAction('UPDATE_CLASS'), updateClass);
router.delete('/:id', verifyToken, logAction('DELETE_CLASS'), deleteClass);
router.post('/reorder', verifyToken, logAction('REORDER_CLASSES'), updateClassOrder);

export default router;
