import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function ClassList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user?.role === 'admin') {
      loadUsers();
    }
    loadClasses();
    loadStudents();
  }, []);

  useEffect(() => {
    loadClasses();
    loadStudents();
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const response = await fetchWithAuth("/api/auth/users");
      const data = await response.json();
      setUsers(data.filter(u => u.role !== 'admin'));
    } catch (error) {
      console.error("사용자 목록 로드 실패:", error);
    }
  };

  const loadClasses = async () => {
    try {
      const url = user?.role === 'admin' && selectedUserId !== 'all'
        ? `/api/classes?filterUserId=${selectedUserId}`
        : '/api/classes';
      const response = await fetchWithAuth(url);
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('수업 목록 로드 실패:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const url = user?.role === 'admin' && selectedUserId !== 'all'
        ? `/api/students?filterUserId=${selectedUserId}`
        : '/api/students';
      const response = await fetchWithAuth(url);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('학생 목록 로드 실패:', error);
    }
  };

  const handleEdit = (classItem) => {
    navigate('/classes/edit', { state: { classItem } });
  };

  const handleDelete = async (id) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        for (const student of students) {
          if (student.classIds && student.classIds.includes(id)) {
            const updatedClassIds = student.classIds.filter(classId => classId !== id);
            await fetchWithAuth(`/api/students/${student.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...student, classIds: updatedClassIds })
            });
          }
        }

        const response = await fetchWithAuth(`/api/classes/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await loadClasses();
          await loadStudents();
        }
      } catch (error) {
        console.error('수업 삭제 실패:', error);
        alert('수업 삭제에 실패했습니다.');
      }
    }
  };

  const getStudentsInClass = (classId) => {
    return students.filter(student =>
      student.classIds && student.classIds.includes(classId)
    );
  };

  const handleManageStudents = (classItem) => {
    navigate('/classes/manage-students', { state: { classItem } });
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newClasses = [...classes];
    const draggedItem = newClasses[draggedIndex];
    newClasses.splice(draggedIndex, 1);
    newClasses.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setClasses(newClasses);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      try {
        const classIds = classes.map(c => c.id);
        await fetchWithAuth('/api/classes/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classIds })
        });
      } catch (error) {
        console.error('순서 업데이트 실패:', error);
        alert('순서 업데이트에 실패했습니다.');
        await loadClasses();
      }
    }
    setDraggedIndex(null);
  };

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">수업 관리</h2>
        <button className="btn btn-primary" onClick={() => navigate('/classes/new')}>
          + 새 수업 등록
        </button>
      </div>

      {/* Admin User Filter */}
      {user?.role === 'admin' && (
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            flexWrap: 'wrap'
          }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
              사용자 선택
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{ flex: 1, minWidth: '200px', maxWidth: isMobile ? '100%' : '300px' }}
            >
              <option value="all">전체 사용자</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Class List Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            수업 목록 <span className="badge badge-success" style={{ marginLeft: '8px' }}>{classes.length}개</span>
          </h3>
        </div>

        {/* Desktop View - Table */}
        {!isMobile && (
          <div className="table-container" style={{ marginTop: 'var(--spacing-lg)' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>수업명</th>
                  <th>수업 시간</th>
                  <th>시간</th>
                  <th>강사</th>
                  <th style={{ textAlign: 'center' }}>등록 학생</th>
                  <th style={{ width: '220px' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((classItem, index) => (
                  <tr
                    key={classItem.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      opacity: draggedIndex === index ? 0.5 : 1,
                      backgroundColor: draggedIndex === index ? 'var(--color-primary-bg)' : 'transparent'
                    }}
                  >
                    <td>
                      <span style={{ cursor: 'grab', color: 'var(--color-gray-400)', fontSize: '1rem' }}>⋮⋮</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>{classItem.name}</span>
                    </td>
                    <td>{classItem.schedule}</td>
                    <td>{classItem.duration}</td>
                    <td>{classItem.instructor || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-primary">{getStudentsInClass(classItem.id).length}명</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(classItem)}>
                          수정
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => handleManageStudents(classItem)}>
                          학생 관리
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(classItem.id)}>
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

        {/* Mobile View - Cards */}
        {isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
            {classes.map((classItem, index) => (
              <div
                key={classItem.id}
                className="list-item"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  opacity: draggedIndex === index ? 0.5 : 1,
                  backgroundColor: draggedIndex === index ? 'var(--color-primary-bg)' : 'var(--bg-secondary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                  <span style={{
                    cursor: 'grab',
                    color: 'var(--color-gray-400)',
                    fontSize: '1.25rem',
                    marginRight: 'var(--spacing-md)',
                    marginTop: '2px'
                  }}>⋮⋮</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div className="list-item-title">{classItem.name}</div>
                        <div className="list-item-subtitle">{classItem.schedule}</div>
                      </div>
                      <span className="badge badge-primary">{getStudentsInClass(classItem.id).length}명</span>
                    </div>
                    <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.8125rem', color: 'var(--color-gray-500)' }}>
                      <span>시간: {classItem.duration}</span>
                      <span style={{ margin: '0 8px' }}>|</span>
                      <span>강사: {classItem.instructor || '-'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <button className="btn btn-secondary" onClick={() => handleEdit(classItem)} style={{ flex: 1 }}>
                    수정
                  </button>
                  <button className="btn btn-primary" onClick={() => handleManageStudents(classItem)} style={{ flex: 1 }}>
                    학생 관리
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(classItem.id)} style={{ flex: 1 }}>
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {classes.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <div className="empty-state-title">등록된 수업이 없습니다</div>
            <div className="empty-state-description">새 수업을 등록하여 시작하세요.</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassList;
