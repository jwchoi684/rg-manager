import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';

function Admin() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'user' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadUsers();
  }, [user, navigate]);

  const loadUsers = async () => {
    try {
      const response = await fetchWithAuth('/api/auth/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const response = await fetchWithAuth(`/api/auth/users/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          await loadUsers();
          setIsEditing(false);
          setEditId(null);
          alert('사용자 정보가 수정되었습니다.');
        }
      }
      setFormData({ username: '', password: '', role: 'user' });
    } catch (error) {
      console.error('사용자 저장 실패:', error);
      alert('사용자 정보 저장에 실패했습니다.');
    }
  };

  const handleEdit = (targetUser) => {
    setFormData({
      username: targetUser.username,
      password: '',
      role: targetUser.role
    });
    setIsEditing(true);
    setEditId(targetUser.id);
  };

  const handleDelete = async (id) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetchWithAuth(`/api/auth/users/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await loadUsers();
          alert('사용자가 삭제되었습니다.');
        }
      } catch (error) {
        console.error('사용자 삭제 실패:', error);
        alert('사용자 삭제에 실패했습니다.');
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ username: '', password: '', role: 'user' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const handleToggleKakaoConsent = async (userId, currentConsent) => {
    try {
      // 관리자가 다른 사용자의 설정을 변경하는 것이므로 별도 API 필요
      // 일단 현재 로그인한 사용자의 설정만 변경 가능하도록 구현
      const response = await fetchWithAuth('/api/auth/kakao/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: !currentConsent })
      });

      if (response.ok) {
        await loadUsers();
      } else {
        const data = await response.json();
        alert(data.error || '알림 설정 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('알림 설정 변경 실패:', error);
      alert('알림 설정 변경에 실패했습니다.');
    }
  };

  const handleTransfer = async () => {
    if (!transferFrom || !transferTo) {
      alert('이전할 사용자와 대상 사용자를 모두 선택해주세요.');
      return;
    }

    if (transferFrom === transferTo) {
      alert('같은 사용자에게 데이터를 이전할 수 없습니다.');
      return;
    }

    const fromUser = users.find(u => u.id === parseInt(transferFrom));
    const toUser = users.find(u => u.id === parseInt(transferTo));

    if (!confirm(`"${fromUser?.username}"의 모든 데이터를 "${toUser?.username}"에게 이전하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setTransferLoading(true);
    try {
      const response = await fetchWithAuth('/api/auth/users/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: parseInt(transferFrom),
          toUserId: parseInt(transferTo)
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`데이터 이전이 완료되었습니다.\n\n이전된 항목:\n- 학생: ${data.transferred.students}명\n- 수업: ${data.transferred.classes}개\n- 출석: ${data.transferred.attendance}건\n- 대회: ${data.transferred.competitions}개`);
        setShowTransferModal(false);
        setTransferFrom('');
        setTransferTo('');
      } else {
        alert(data.error || '데이터 이전에 실패했습니다.');
      }
    } catch (error) {
      console.error('데이터 이전 실패:', error);
      alert('데이터 이전에 실패했습니다.');
    } finally {
      setTransferLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">사용자 관리</h2>
        <button
          className="btn btn-secondary"
          onClick={() => setShowTransferModal(true)}
        >
          데이터 이전
        </button>
      </div>

      {/* Edit Form Card */}
      {isEditing && (
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div className="card-header">
            <h3 className="card-title">사용자 수정</h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCancel}
            >
              취소
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
              gap: 'var(--spacing-lg)',
              marginTop: 'var(--spacing-lg)'
            }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">사용자 이름</label>
                <input
                  type="text"
                  placeholder="사용자 이름"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                  disabled={isEditing}
                  style={{ backgroundColor: 'var(--color-gray-100)' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">새 비밀번호</label>
                <input
                  type="password"
                  placeholder="변경시에만 입력"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">역할</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="user">일반 사용자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              marginTop: 'var(--spacing-xl)',
              paddingTop: 'var(--spacing-xl)',
              borderTop: '1px solid var(--color-gray-200)'
            }}>
              <button type="submit" className="btn btn-primary">
                수정 완료
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User List Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            사용자 목록
            <span className="badge badge-primary" style={{ marginLeft: '8px' }}>
              {users.length}명
            </span>
          </h3>
        </div>

        {users.length > 0 ? (
          <>
            {/* Desktop Table */}
            {!isMobile && (
              <div className="table-container" style={{ marginTop: 'var(--spacing-lg)' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>ID</th>
                      <th>사용자 이름</th>
                      <th>이메일</th>
                      <th>역할</th>
                      <th>카카오 알림</th>
                      <th>가입일</th>
                      <th style={{ width: '160px' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>
                          <span style={{ color: 'var(--color-gray-500)' }}>#{u.id}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                              {u.username}
                            </span>
                            {u.kakaoId && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 20,
                                height: 20,
                                backgroundColor: '#FEE500',
                                borderRadius: '4px',
                                fontSize: '0.75rem'
                              }} title="카카오 계정">
                                💬
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{ color: 'var(--color-gray-600)', fontSize: '0.875rem' }}>
                            {u.email || '-'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-gray'}`}>
                            {u.role === 'admin' ? '관리자' : '일반 사용자'}
                          </span>
                        </td>
                        <td>
                          {u.kakaoId ? (
                            <label style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              cursor: u.id === user.id ? 'pointer' : 'not-allowed',
                              opacity: u.id === user.id ? 1 : 0.5
                            }}>
                              <input
                                type="checkbox"
                                checked={u.kakaoMessageConsent || false}
                                onChange={() => u.id === user.id && handleToggleKakaoConsent(u.id, u.kakaoMessageConsent)}
                                disabled={u.id !== user.id}
                                style={{ marginRight: '6px' }}
                              />
                              <span style={{ fontSize: '0.8125rem', color: u.kakaoMessageConsent ? 'var(--color-success)' : 'var(--color-gray-500)' }}>
                                {u.kakaoMessageConsent ? '활성' : '비활성'}
                              </span>
                            </label>
                          ) : (
                            <span style={{ color: 'var(--color-gray-400)', fontSize: '0.8125rem' }}>-</span>
                          )}
                        </td>
                        <td>
                          <span style={{ color: 'var(--color-gray-600)' }}>
                            {formatDate(u.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleEdit(u)}
                            >
                              수정
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(u.id)}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Cards */}
            {isMobile && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
                marginTop: 'var(--spacing-lg)'
              }}>
                {users.map(u => (
                  <div
                    key={u.id}
                    className="list-item"
                    style={{
                      borderLeft: `4px solid ${u.role === 'admin' ? 'var(--color-primary)' : 'var(--color-gray-300)'}`,
                      marginBottom: 0
                    }}
                  >
                    <div className="list-item-content">
                      <div className="list-item-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {u.username}
                        {u.kakaoId && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 18,
                            height: 18,
                            backgroundColor: '#FEE500',
                            borderRadius: '4px',
                            fontSize: '0.625rem'
                          }}>
                            💬
                          </span>
                        )}
                        <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-gray'}`} style={{ marginLeft: '4px' }}>
                          {u.role === 'admin' ? '관리자' : '일반'}
                        </span>
                      </div>
                      <div className="list-item-subtitle">
                        #{u.id} | {u.email || '이메일 없음'} | {formatDate(u.createdAt)}
                      </div>
                      {u.kakaoId && u.id === user.id && (
                        <div style={{ marginTop: '8px' }}>
                          <label style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            fontSize: '0.8125rem'
                          }}>
                            <input
                              type="checkbox"
                              checked={u.kakaoMessageConsent || false}
                              onChange={() => handleToggleKakaoConsent(u.id, u.kakaoMessageConsent)}
                              style={{ marginRight: '6px' }}
                            />
                            <span style={{ color: u.kakaoMessageConsent ? 'var(--color-success)' : 'var(--color-gray-500)' }}>
                              카카오 알림 {u.kakaoMessageConsent ? '활성' : '비활성'}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(u)}
                      >
                        수정
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <div className="empty-state-title">등록된 사용자가 없습니다</div>
            <div className="empty-state-description">사용자가 등록되면 여기에 표시됩니다.</div>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--spacing-lg)'
          }}
          onClick={() => setShowTransferModal(false)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="card-header">
              <h3 className="card-title">데이터 이전</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowTransferModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 'var(--spacing-lg)' }}>
              <p style={{
                color: 'var(--color-gray-600)',
                fontSize: '0.9375rem',
                marginBottom: 'var(--spacing-xl)',
                lineHeight: 1.6
              }}>
                한 사용자의 모든 데이터(학생, 수업, 출석, 대회)를 다른 사용자에게 이전합니다.
                <br />
                <strong style={{ color: 'var(--color-danger)' }}>이 작업은 되돌릴 수 없습니다.</strong>
              </p>

              <div className="form-group">
                <label className="form-label">데이터를 가져올 사용자 (From)</label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                >
                  <option value="">선택하세요</option>
                  {users.filter(u => u.role !== 'admin').map(u => (
                    <option key={u.id} value={u.id}>
                      {u.username} (#{u.id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'center',
                margin: 'var(--spacing-md) 0',
                color: 'var(--color-gray-400)'
              }}>
                ↓
              </div>

              <div className="form-group">
                <label className="form-label">데이터를 받을 사용자 (To)</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                >
                  <option value="">선택하세요</option>
                  {users.filter(u => u.role !== 'admin' && u.id !== parseInt(transferFrom)).map(u => (
                    <option key={u.id} value={u.id}>
                      {u.username} (#{u.id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{
                display: 'flex',
                gap: 'var(--spacing-md)',
                marginTop: 'var(--spacing-xl)',
                paddingTop: 'var(--spacing-lg)',
                borderTop: '1px solid var(--color-gray-200)'
              }}>
                <button
                  className="btn btn-primary"
                  onClick={handleTransfer}
                  disabled={transferLoading || !transferFrom || !transferTo}
                  style={{ flex: 1 }}
                >
                  {transferLoading ? '이전 중...' : '데이터 이전'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowTransferModal(false)}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
