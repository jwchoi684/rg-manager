import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const { login, getKakaoLoginUrl } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleKakaoLogin = async () => {
    setError('');
    setKakaoLoading(true);
    try {
      const url = await getKakaoLoginUrl();
      window.location.href = url;
    } catch (err) {
      setError(err.message || '카카오 로그인을 시작할 수 없습니다.');
      setKakaoLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      padding: 'var(--spacing-lg)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Logo / Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: 'var(--spacing-3xl)'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--spacing-lg)',
            fontSize: '1.75rem'
          }}>
            🎀
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-gray-900)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            리듬체조 출석 관리
          </h1>
          <p style={{
            color: 'var(--color-gray-500)',
            fontSize: '0.9375rem'
          }}>
            계정에 로그인하세요
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{
          padding: 'var(--spacing-2xl)',
          border: 'none',
          boxShadow: 'var(--shadow-md)'
        }}>
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-lg)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">사용자 이름</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="사용자 이름을 입력하세요"
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              style={{ marginTop: 'var(--spacing-lg)' }}
            >
              로그인
            </button>
          </form>

          {/* 구분선 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: 'var(--spacing-xl) 0',
            gap: 'var(--spacing-md)'
          }}>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-gray-200)' }} />
            <span style={{ color: 'var(--color-gray-400)', fontSize: '0.875rem' }}>또는</span>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-gray-200)' }} />
          </div>

          {/* 카카오 로그인 버튼 */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={kakaoLoading}
            style={{
              width: '100%',
              padding: '14px 20px',
              backgroundColor: '#FEE500',
              color: '#000000',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: kakaoLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-sm)',
              opacity: kakaoLoading ? 0.7 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.89 5.33 4.71 6.73-.14.51-.93 3.3-.96 3.51 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.68-2.42 4.26-2.83.55.08 1.1.12 1.66.12 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8z"/>
            </svg>
            {kakaoLoading ? '로그인 중...' : '카카오 로그인'}
          </button>
        </div>

        {/* Sign up link */}
        <p style={{
          textAlign: 'center',
          marginTop: 'var(--spacing-xl)',
          color: 'var(--color-gray-500)',
          fontSize: '0.9375rem'
        }}>
          계정이 없으신가요?{' '}
          <Link
            to="/signup"
            style={{
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
