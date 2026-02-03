import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterName() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, updateUserName } = useAuth();
  const navigate = useNavigate();

  // 로그인 안 되어 있으면 로그인 페이지로
  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (name.trim().length < 2) {
      setError('이름은 2자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      await updateUserName(name.trim());
      navigate('/');
    } catch (err) {
      setError(err.message || '이름 설정에 실패했습니다.');
    } finally {
      setLoading(false);
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
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: 'var(--spacing-3xl)'
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 'var(--radius-xl)',
            backgroundColor: '#FEE500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--spacing-xl)',
            fontSize: '2.5rem'
          }}>
            👋
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--color-gray-900)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            환영합니다!
          </h1>
          <p style={{
            color: 'var(--color-gray-500)',
            fontSize: '0.9375rem',
            lineHeight: 1.6
          }}>
            사용하실 이름을 입력해주세요
          </p>
        </div>

        {/* Form Card */}
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
              <label className="form-label">이름</label>
              <input
                type="text"
                placeholder="예: 홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                style={{
                  fontSize: '1.125rem',
                  padding: '16px'
                }}
              />
              <p style={{
                color: 'var(--color-gray-500)',
                fontSize: '0.8125rem',
                marginTop: 'var(--spacing-sm)'
              }}>
                관리자 화면에서 표시되는 이름입니다.
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1.0625rem',
                marginTop: 'var(--spacing-lg)'
              }}
            >
              {loading ? '설정 중...' : '시작하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterName;
