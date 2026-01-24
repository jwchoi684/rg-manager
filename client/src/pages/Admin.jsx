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

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">사용자 관리</h2>
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
                      <th>역할</th>
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
                          <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                            {u.username}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-gray'}`}>
                            {u.role === 'admin' ? '관리자' : '일반 사용자'}
                          </span>
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
                      <div className="list-item-title">
                        {u.username}
                        <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-gray'}`} style={{ marginLeft: '8px' }}>
                          {u.role === 'admin' ? '관리자' : '일반'}
                        </span>
                      </div>
                      <div className="list-item-subtitle">
                        #{u.id} | 가입일: {formatDate(u.createdAt)}
                      </div>
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
    </div>
  );
}

export default Admin;
