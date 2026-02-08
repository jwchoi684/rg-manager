// API Base URL 설정
// 개발 환경: Vite 프록시를 통해 /api -> localhost:5001/api
// 프로덕션 환경: 상대 경로 사용 (서버가 클라이언트를 제공)
export const API_BASE_URL = '';

import { getToken, clearAuth } from './tokenStorage';

export const fetchWithAuth = async (url, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const data = await response.json();
    if (data.tokenExpired) {
      clearAuth();
      window.location.href = '/login';
      throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
    }
  }

  return response;
};
