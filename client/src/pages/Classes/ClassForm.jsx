import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

function ClassForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editClass = location.state?.classItem; // 수정 모드일 때 전달된 수업 데이터

  const [formData, setFormData] = useState({ name: '', schedule: '', duration: '', instructor: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    // 페이지 로드 시 스크롤을 맨 위로 이동
    window.scrollTo(0, 0);

    // 수정 모드인 경우 수업 데이터 설정
    if (editClass) {
      setFormData({
        name: editClass.name,
        schedule: editClass.schedule,
        duration: editClass.duration,
        instructor: editClass.instructor
      });
      setIsEditing(true);
      setEditId(editClass.id);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const response = await fetchWithAuth(`/api/classes/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          alert('수업 정보가 수정되었습니다.');
          navigate('/classes');
        }
      } else {
        const response = await fetchWithAuth('/api/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          alert('수업이 등록되었습니다.');
          navigate('/classes');
        }
      }
    } catch (error) {
      console.error('수업 저장 실패:', error);
      alert('수업 정보 저장에 실패했습니다.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{isEditing ? '수업 수정' : '새 수업 등록'}</h2>
        <button
          className="btn"
          onClick={() => navigate('/classes')}
          style={{ backgroundColor: '#6b7280', color: 'white' }}
        >
          목록으로
        </button>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <input
            type="text"
            placeholder="수업명 (예: 초급반)"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="수업 시간 (예: 화/목 14:00)"
            value={formData.schedule}
            onChange={(e) => setFormData({...formData, schedule: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="수업 시간 (예: 90분)"
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="강사명"
            value={formData.instructor}
            onChange={(e) => setFormData({...formData, instructor: e.target.value})}
          />
          <button type="submit" className="btn btn-primary">
            {isEditing ? '수정' : '등록'}
          </button>
          <button type="button" className="btn" onClick={() => navigate('/classes')}>
            취소
          </button>
        </form>
      </div>
    </div>
  );
}

export default ClassForm;
