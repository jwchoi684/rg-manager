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

// 카카오 로그인 URL 생성
export const getKakaoAuthUrl = (req, res) => {
  if (!KAKAO_CLIENT_ID) {
    return res.status(500).json({ error: '카카오 로그인이 설정되지 않았습니다.' });
  }
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&response_type=code`;
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
      // 새 사용자 생성
      user = await User.createWithKakao({
        kakaoId,
        username: nickname,
        email,
      });
    } else {
      // 기존 사용자 이메일 업데이트 (변경된 경우)
      if (email && user.email !== email) {
        await User.updateKakaoInfo(user.id, { email });
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
