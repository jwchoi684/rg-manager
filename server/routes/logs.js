import express from 'express';
import { getLogs } from '../controllers/logController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', verifyToken, getLogs);

export default router;
