import express from 'express';
import { login, signup, getUsers, updateUser, deleteUser } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { logAction } from '../middleware/logger.js';

const router = express.Router();

router.post('/login', logAction('LOGIN'), login);
router.post('/signup', logAction('SIGNUP'), signup);
router.get('/users', verifyToken, getUsers);
router.put('/users/:id', verifyToken, logAction('UPDATE_USER'), updateUser);
router.delete('/users/:id', verifyToken, logAction('DELETE_USER'), deleteUser);

export default router;
