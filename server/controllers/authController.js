import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '365d';

// 카카오 OAuth 설정 (환경 변수에서 로드)
const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID;
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI || (
  process.env.NODE_ENV === 'production'
    ? 'https://rg-manager.onrender.com/oauth/kakao/callback'
    : 'http://localhost:3000/oauth/kakao/callback'
);

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.getByCredentials(username, password);

    if (!user) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = user;

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: '로그인 성공',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const signup = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 중복 확인
    const existingUser = await User.getByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: '이미 존재하는 사용자입니다.' });
    }

    const newUser = await User.create({ username, password });

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: '회원가입 성공',
      user: newUser,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.update(id, req.body);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.delete(id);
    res.json({ message: '사용자가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyTokenEndpoint = async (req, res) => {
  try {
    // req.user is set by verifyToken middleware
    const user = await User.getById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다.', tokenExpired: true });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 사용자 데이터 이전 (관리자 전용)
export const transferUserData = async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;

    if (!fromUserId || !toUserId) {
      return res.status(400).json({ error: '이전할 사용자와 대상 사용자를 모두 선택해주세요.' });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ error: '같은 사용자에게 데이터를 이전할 수 없습니다.' });
    }

    const result = await User.transferData(fromUserId, toUserId);
    res.json(result);
  } catch (error) {
    console.error('데이터 이전 오류:', error);
    res.status(500).json({ error: error.message });
  }
};

// 카카오 로그인 URL 생성
export const getKakaoAuthUrl = (req, res) => {
  if (!KAKAO_CLIENT_ID) {
    return res.status(500).json({ error: '카카오 로그인이 설정되지 않았습니다.' });
  }
  // talk_message scope 추가 (카카오톡 메시지 전송 권한)
  const scope = 'talk_message';
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&response_type=code&scope=${scope}`;
  res.json({ url: kakaoAuthUrl });
};

// 카카오 콜백 처리
export const kakaoCallback = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: '인증 코드가 없습니다.' });
    }

    // 1. 인증 코드로 액세스 토큰 발급
    const tokenParams = {
      grant_type: 'authorization_code',
      client_id: KAKAO_CLIENT_ID,
      redirect_uri: KAKAO_REDIRECT_URI,
      code,
    };

    // Client Secret이 설정된 경우 추가
    if (KAKAO_CLIENT_SECRET) {
      tokenParams.client_secret = KAKAO_CLIENT_SECRET;
    }

    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams(tokenParams),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('카카오 토큰 발급 실패:', tokenData);
      return res.status(400).json({ error: '카카오 인증에 실패했습니다.' });
    }

    // 토큰 정보 추출
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in; // 초 단위
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 2. 액세스 토큰으로 사용자 정보 가져오기
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    const kakaoUser = await userResponse.json();

    if (!kakaoUser.id) {
      return res.status(400).json({ error: '카카오 사용자 정보를 가져올 수 없습니다.' });
    }

    const kakaoId = kakaoUser.id.toString();
    const nickname = kakaoUser.properties?.nickname || `카카오${kakaoId.slice(-4)}`;
    const email = kakaoUser.kakao_account?.email || null;

    // 3. 기존 사용자 확인 또는 새 사용자 생성
    let user = await User.getByKakaoId(kakaoId);

    if (!user) {
      // 새 사용자 생성 (토큰 포함)
      user = await User.createWithKakao({
        kakaoId,
        username: nickname,
        email,
        accessToken,
        refreshToken,
        tokenExpiresAt,
      });
    } else {
      // 기존 사용자 토큰 및 이메일 업데이트
      const updatedUser = await User.updateKakaoTokens(user.id, {
        email,
        accessToken,
        refreshToken,
        tokenExpiresAt,
      });
      if (updatedUser) {
        user = updatedUser;
      }
    }

    // 4. JWT 토큰 생성
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: '카카오 로그인 성공',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('카카오 로그인 오류:', error);
    res.status(500).json({ error: '카카오 로그인 처리 중 오류가 발생했습니다.' });
  }
};

// 카카오 메시지 알림 동의 설정
export const updateKakaoMessageConsent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { consent } = req.body;

    const user = await User.updateMessageConsent(userId, consent);

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.json({
      message: consent ? '카카오톡 알림이 활성화되었습니다.' : '카카오톡 알림이 비활성화되었습니다.',
      user
    });
  } catch (error) {
    console.error('알림 설정 변경 오류:', error);
    res.status(500).json({ error: error.message });
  }
};

// 카카오 메시지 로그 조회 (관리자 전용)
export const getKakaoMessageLogs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const { default: KakaoMessageLog } = await import('../models/KakaoMessageLog.js');
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    const logs = await KakaoMessageLog.getAll(limit, offset);
    const total = await KakaoMessageLog.getCount();

    res.json({ logs, total });
  } catch (error) {
    console.error('카카오 메시지 로그 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
};

// 카카오 메시지 전송 (관리자 전용)
export const sendKakaoMessage = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const { recipientId, message } = req.body;

    if (!recipientId || !message) {
      return res.status(400).json({ error: '수신자와 메시지 내용을 입력해주세요.' });
    }

    // 수신자가 카카오 사용자인지 확인
    const recipient = await User.getById(recipientId);
    if (!recipient || !recipient.kakaoId) {
      return res.status(400).json({ error: '수신자가 카카오 계정이 아닙니다.' });
    }

    const { sendCustomKakaoMessage } = await import('../utils/kakaoMessage.js');
    const result = await sendCustomKakaoMessage({
      senderId: req.user.id,
      recipientId,
      message,
    });

    if (result.success) {
      res.json({ message: '메시지가 전송되었습니다.' });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('카카오 메시지 전송 오류:', error);
    res.status(500).json({ error: error.message });
  }
};

// 카카오 사용자 목록 조회 (관리자 전용)
export const getKakaoUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const users = await User.getAll();
    const kakaoUsers = users.filter(u => u.kakaoId);

    res.json(kakaoUsers);
  } catch (error) {
    console.error('카카오 사용자 조회 오류:', error);
    res.status(500).json({ error: error.message });
  }
};

// 카카오 토큰 상태 확인 및 테스트 메시지 전송
export const testKakaoMessage = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. 토큰 정보 가져오기
    const tokens = await User.getKakaoTokens(userId);
    console.log('=== 카카오 토큰 테스트 ===');
    console.log('userId:', userId);
    console.log('토큰 존재 여부:', !!tokens);

    if (!tokens) {
      return res.json({
        status: 'NO_TOKENS',
        message: '카카오 토큰이 없습니다. 카카오로 다시 로그인해주세요.',
        tokens: null
      });
    }

    console.log('kakaoAccessToken 존재:', !!tokens.kakaoAccessToken);
    console.log('kakaoRefreshToken 존재:', !!tokens.kakaoRefreshToken);
    console.log('kakaoTokenExpiresAt:', tokens.kakaoTokenExpiresAt);
    console.log('kakaoMessageConsent:', tokens.kakaoMessageConsent);

    // 토큰 만료 여부 확인
    const now = new Date();
    const expiresAt = tokens.kakaoTokenExpiresAt ? new Date(tokens.kakaoTokenExpiresAt) : null;
    const isExpired = expiresAt ? now > expiresAt : true;

    if (!tokens.kakaoAccessToken) {
      return res.json({
        status: 'NO_ACCESS_TOKEN',
        message: '액세스 토큰이 없습니다. 카카오로 다시 로그인해주세요.',
        tokens: {
          hasAccessToken: false,
          hasRefreshToken: !!tokens.kakaoRefreshToken,
          expiresAt: tokens.kakaoTokenExpiresAt,
          messageConsent: tokens.kakaoMessageConsent
        }
      });
    }

    if (!tokens.kakaoMessageConsent) {
      return res.json({
        status: 'NO_CONSENT',
        message: '카카오톡 알림에 동의하지 않았습니다. 설정에서 알림을 활성화해주세요.',
        tokens: {
          hasAccessToken: true,
          hasRefreshToken: !!tokens.kakaoRefreshToken,
          expiresAt: tokens.kakaoTokenExpiresAt,
          isExpired,
          messageConsent: false
        }
      });
    }

    // 2. 테스트 메시지 전송 시도
    const { sendAttendanceKakaoMessage } = await import('../utils/kakaoMessage.js');

    const testResult = await sendAttendanceKakaoMessage({
      userId,
      date: new Date().toISOString().split('T')[0],
      className: '테스트 수업',
      schedule: '테스트 시간',
      students: [{ id: 1, name: '테스트학생' }],
      presentStudentIds: [1]
    });

    console.log('테스트 메시지 결과:', testResult);

    res.json({
      status: testResult.success ? 'SUCCESS' : 'FAILED',
      message: testResult.success ? '테스트 메시지가 전송되었습니다!' : testResult.error,
      tokens: {
        hasAccessToken: true,
        hasRefreshToken: !!tokens.kakaoRefreshToken,
        expiresAt: tokens.kakaoTokenExpiresAt,
        isExpired,
        messageConsent: true
      },
      testResult
    });
  } catch (error) {
    console.error('카카오 테스트 오류:', error);
    res.status(500).json({ error: error.message });
  }
};
