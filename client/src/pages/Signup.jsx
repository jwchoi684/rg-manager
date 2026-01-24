import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      await signup(username, password);
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
            회원가입
          </h1>
          <p style={{
            color: 'var(--color-gray-500)',
            fontSize: '0.9375rem'
          }}>
            새 계정을 만들어 시작하세요
          </p>
        </div>

        {/* Signup Card */}
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
                placeholder="비밀번호를 입력하세요 (최소 6자)"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="비밀번호를 다시 입력하세요"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              style={{ marginTop: 'var(--spacing-lg)' }}
            >
              회원가입
            </button>
          </form>
        </div>

        {/* Login link */}
        <p style={{
          textAlign: 'center',
          marginTop: 'var(--spacing-xl)',
          color: 'var(--color-gray-500)',
          fontSize: '0.9375rem'
        }}>
          이미 계정이 있으신가요?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--color-primary)',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
