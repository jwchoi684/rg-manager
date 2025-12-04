import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'user' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 페이지 로드 시 스크롤을 맨 위로 이동
    window.scrollTo(0, 0);

    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadUsers();
  }, [user, navigate]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/auth/users');
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
        const response = await fetch(`/api/auth/users/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          await loadUsers();
          setIsEditing(false);
          setEditId(null);
        }
      }
      setFormData({ username: '', password: '', role: 'user' });
    } catch (error) {
      console.error('사용자 저장 실패:', error);
      alert('사용자 정보 저장에 실패했습니다.');
    }
  };

  const handleEdit = (user) => {
    setFormData({
      username: user.username,
      password: '',
      role: user.role
    });
    setIsEditing(true);
    setEditId(user.id);
  };

  const handleDelete = async (id) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/auth/users/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await loadUsers();
        }
      } catch (error) {
        console.error('사용자 삭제 실패:', error);
        alert('사용자 삭제에 실패했습니다.');
      }
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div>
      <h2>관리자 - 사용자 관리</h2>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>{isEditing ? '사용자 수정' : '사용자 정보'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <input
            type="text"
            placeholder="사용자 이름"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
            disabled={isEditing}
          />
          <input
            type="password"
            placeholder={isEditing ? "새 비밀번호 (변경시에만 입력)" : "비밀번호"}
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required={!isEditing}
          />
          <select
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          >
            <option value="user">일반 사용자</option>
            <option value="admin">관리자</option>
          </select>
          <button type="submit" className="btn btn-primary">
            {isEditing ? '수정' : '추가'}
          </button>
          {isEditing && (
            <button type="button" className="btn" onClick={() => {
              setIsEditing(false);
              setEditId(null);
              setFormData({ username: '', password: '', role: 'user' });
            }}>
              취소
            </button>
          )}
        </form>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>사용자 목록 ({users.length}명)</h3>
        <table style={{ marginTop: '1rem' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>사용자 이름</th>
              <th>역할</th>
              <th>생성일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: user.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                    color: user.role === 'admin' ? '#1e40af' : '#374151',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}>
                    {user.role === 'admin' ? '관리자' : '일반 사용자'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleString('ko-KR')}</td>
                <td>
                  <button className="btn btn-primary" onClick={() => handleEdit(user)} style={{ marginRight: '0.5rem' }}>
                    수정
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(user.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '1rem' }}>
            등록된 사용자가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

export default Admin;
