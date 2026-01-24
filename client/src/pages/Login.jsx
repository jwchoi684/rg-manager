import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
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
