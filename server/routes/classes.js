import express from 'express';
import { getClasses, createClass, updateClass, deleteClass, updateClassOrder } from '../controllers/classController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getClasses);
router.post('/', verifyToken, createClass);
router.put('/:id', verifyToken, updateClass);
router.delete('/:id', verifyToken, deleteClass);
router.post('/reorder', verifyToken, updateClassOrder);

export default router;
