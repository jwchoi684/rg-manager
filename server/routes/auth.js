import express from 'express';
import { login, signup, getUsers, updateUser, deleteUser, verifyTokenEndpoint, getKakaoAuthUrl, kakaoCallback, transferUserData, updateKakaoMessageConsent, getKakaoMessageLogs, sendKakaoMessage, getKakaoUsers, testKakaoMessage, updateUsername } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
import { logAction } from '../middleware/logger.js';

const router = express.Router();

router.post('/login', logAction('LOGIN'), login);
router.post('/signup', logAction('SIGNUP'), signup);
router.get('/verify', verifyToken, verifyTokenEndpoint);
router.get('/users', verifyToken, getUsers);
router.put('/users/:id', verifyToken, logAction('UPDATE_USER'), updateUser);
router.delete('/users/:id', verifyToken, logAction('DELETE_USER'), deleteUser);

// 데이터 이전 (관리자 전용)
router.post('/users/transfer', verifyToken, logAction('TRANSFER_DATA'), transferUserData);

// 카카오 로그인
router.get('/kakao', getKakaoAuthUrl);
router.post('/kakao/callback', logAction('KAKAO_LOGIN'), kakaoCallback);
router.put('/kakao/consent', verifyToken, updateKakaoMessageConsent);

// 사용자 이름 설정
router.put('/username', verifyToken, logAction('UPDATE_USERNAME'), updateUsername);

// 카카오 메시지 (관리자 전용)
router.get('/kakao/messages', verifyToken, getKakaoMessageLogs);
router.post('/kakao/messages', verifyToken, logAction('SEND_KAKAO_MESSAGE'), sendKakaoMessage);
router.get('/kakao/users', verifyToken, getKakaoUsers);

// 카카오 메시지 테스트
router.post('/kakao/test', verifyToken, testKakaoMessage);

export default router;
