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
  const [swipedId, setSwipedId] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState({});

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

  const minSwipeDistance = 50;

  const handleTouchStart = (e, id) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    if (swipedId && swipedId !== id) {
      setSwipedId(null);
      setSwipeOffset({});
    }
  };

  const swipeRevealWidth = 124;

  const handleTouchMove = (e, id) => {
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    const diff = touchStart - currentTouch;
    if (diff > 0) {
      setSwipeOffset({ [id]: Math.min(diff, swipeRevealWidth) });
    } else if (swipedId === id) {
      setSwipeOffset({ [id]: Math.max(swipeRevealWidth + diff, 0) });
    }
  };

  const handleTouchEnd = (id) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setSwipedId(id);
      setSwipeOffset({ [id]: swipeRevealWidth });
    } else if (isRightSwipe || distance < minSwipeDistance) {
      setSwipedId(null);
      setSwipeOffset({});
    }
  };

  const handleCardClick = (classItem) => {
    if (swipedId === classItem.id) {
      setSwipedId(null);
      setSwipeOffset({});
    } else if (!swipedId) {
      handleEdit(classItem);
    }
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

        {/* Mobile View - Swipeable */}
        {isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'var(--spacing-lg)' }}>
            {classes.map((classItem) => (
              <div key={classItem.id} className="swipeable-container">
                <div className="swipeable-actions" style={{ gap: 'var(--spacing-xs)' }}>
                  <button
                    className="swipeable-action-btn"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                    onClick={() => handleManageStudents(classItem)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </button>
                  <button
                    className="swipeable-action-btn delete"
                    onClick={() => handleDelete(classItem.id)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <div
                  className="swipeable-card"
                  style={{
                    transform: `translateX(-${swipeOffset[classItem.id] || 0}px)`
                  }}
                  onTouchStart={(e) => handleTouchStart(e, classItem.id)}
                  onTouchMove={(e) => handleTouchMove(e, classItem.id)}
                  onTouchEnd={() => handleTouchEnd(classItem.id)}
                  onClick={() => handleCardClick(classItem)}
                >
                  <div className="toss-card-item-content">
                    <div className="toss-list-item-icon success">
                      📚
                    </div>
                    <div className="toss-list-item-content">
                      <div className="toss-list-item-title">{classItem.name}</div>
                      <div className="toss-list-item-subtitle">
                        {classItem.schedule} · {classItem.duration}
                      </div>
                      {classItem.instructor && (
                        <div className="toss-list-item-subtitle">
                          강사: {classItem.instructor}
                        </div>
                      )}
                    </div>
                    <div className="toss-list-item-value">
                      <div className="toss-list-item-value-main" style={{ color: 'var(--color-primary)' }}>
                        {getStudentsInClass(classItem.id).length}명
                      </div>
                      <div className="toss-list-item-value-sub">
                        등록 학생
                      </div>
                    </div>
                  </div>
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
