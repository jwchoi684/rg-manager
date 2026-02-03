import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';

function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [kakaoMessageConsent, setKakaoMessageConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const response = await fetchWithAuth('/api/auth/verify');
      const data = await response.json();
      if (data.user) {
        setKakaoMessageConsent(data.user.kakaoMessageConsent || false);
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  };

  const handleToggleKakaoConsent = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/api/auth/kakao/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: !kakaoMessageConsent })
      });

      if (response.ok) {
        setKakaoMessageConsent(!kakaoMessageConsent);
        alert(kakaoMessageConsent ? '카카오톡 알림이 비활성화되었습니다.' : '카카오톡 알림이 활성화되었습니다.');
      } else {
        const data = await response.json();
        alert(data.error || '설정 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('설정 변경 실패:', error);
      alert('설정 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">설정</h2>
      </div>

      {/* User Info Card */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="card-header">
          <h3 className="card-title">내 정보</h3>
        </div>
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '120px 1fr',
            gap: 'var(--spacing-md)',
            alignItems: 'center'
          }}>
            <span style={{ color: 'var(--color-gray-500)', fontWeight: 500 }}>사용자명</span>
            <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>{user?.username}</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '120px 1fr',
            gap: 'var(--spacing-md)',
            alignItems: 'center',
            marginTop: 'var(--spacing-md)'
          }}>
            <span style={{ color: 'var(--color-gray-500)', fontWeight: 500 }}>이메일</span>
            <span style={{ color: 'var(--color-gray-900)' }}>{user?.email || '-'}</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '120px 1fr',
            gap: 'var(--spacing-md)',
            alignItems: 'center',
            marginTop: 'var(--spacing-md)'
          }}>
            <span style={{ color: 'var(--color-gray-500)', fontWeight: 500 }}>계정 유형</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user?.kakaoId ? (
                <>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    backgroundColor: '#FEE500',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}>
                    💬
                  </span>
                  <span style={{ color: 'var(--color-gray-900)' }}>카카오 계정</span>
                </>
              ) : (
                <span style={{ color: 'var(--color-gray-900)' }}>일반 계정</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">알림 설정</h3>
        </div>
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          {user?.kakaoId ? (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 'var(--spacing-lg)',
              padding: 'var(--spacing-lg)',
              backgroundColor: 'var(--color-gray-50)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    backgroundColor: '#FEE500',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}>
                    💬
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                    카카오톡 출석 알림
                  </span>
                </div>
                <p style={{
                  color: 'var(--color-gray-600)',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  출석 체크를 저장하면 카카오톡 "나와의 채팅"으로<br />
                  날짜, 수업명, 출석 학생 명단을 알림으로 받습니다.
                </p>
              </div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: loading ? 'wait' : 'pointer',
                flexShrink: 0
              }}>
                <div
                  onClick={loading ? undefined : handleToggleKakaoConsent}
                  style={{
                    width: 52,
                    height: 28,
                    backgroundColor: kakaoMessageConsent ? 'var(--color-success)' : 'var(--color-gray-300)',
                    borderRadius: 14,
                    position: 'relative',
                    transition: 'background-color 0.2s',
                    cursor: loading ? 'wait' : 'pointer'
                  }}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: 2,
                    left: kakaoMessageConsent ? 26 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </label>
            </div>
          ) : (
            <div style={{
              padding: 'var(--spacing-xl)',
              backgroundColor: 'var(--color-gray-50)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              <div style={{
                width: 48,
                height: 48,
                backgroundColor: 'var(--color-gray-200)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '1.5rem'
              }}>
                🔔
              </div>
              <p style={{
                color: 'var(--color-gray-600)',
                fontSize: '0.9375rem',
                margin: 0,
                lineHeight: 1.6
              }}>
                카카오 계정으로 로그인하면<br />
                카카오톡 알림 기능을 사용할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      {user?.kakaoId && (
        <div className="info-box" style={{ marginTop: 'var(--spacing-lg)' }}>
          <div className="info-box-title">알림 설정 안내</div>
          <ul style={{
            margin: '8px 0 0 0',
            paddingLeft: '20px',
            color: 'var(--color-gray-600)',
            fontSize: '0.875rem',
            lineHeight: 1.8
          }}>
            <li>알림을 받으려면 카카오 개발자 콘솔에서 "카카오톡 메시지 전송" 동의항목이 활성화되어 있어야 합니다.</li>
            <li>알림 활성화 후 카카오로 다시 로그인하면 권한 동의 화면이 나타날 수 있습니다.</li>
            <li>메시지는 "나와의 채팅"으로 전송됩니다.</li>
          </ul>
        </div>
      )}

      {/* Account Actions */}
      <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="card-header">
          <h3 className="card-title">계정</h3>
        </div>
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <div
            onClick={() => navigate('/settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              backgroundColor: 'var(--color-primary-bg)',
              marginBottom: 'var(--spacing-sm)'
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>⚙️</span>
            <span style={{ fontWeight: 500, color: 'var(--color-gray-900)' }}>설정</span>
          </div>
          <div
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-100)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '1.25rem' }}>🚪</span>
            <span style={{ fontWeight: 500, color: 'var(--color-danger)' }}>로그아웃</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
