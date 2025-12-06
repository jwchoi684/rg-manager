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

  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 나이 계산 함수
  const calculateAge = (birthdate) => {
    if (!birthdate) return '-';
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    // 페이지 로드 시 스크롤을 맨 위로 이동
    window.scrollTo(0, 0);
    if (user?.role === 'admin') {
      loadUsers();
    }
    loadClasses();
    loadStudents();
  }, []);

  useEffect(() => {
    // 선택된 사용자가 변경되면 데이터 다시 로드
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
        // 수업 삭제 시 학생들의 classIds에서도 제거
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
        await loadClasses(); // 실패 시 원래 순서로 복구
      }
    }
    setDraggedIndex(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>수업 관리</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/classes/new')}
        >
          새 수업 등록
        </button>
      </div>

      {/* 관리자용 사용자 선택 */}
      {user?.role === 'admin' && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <label style={{
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}>
              사용자 선택:
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                minWidth: '200px',
                flex: 1
              }}
            >
              <option value="all">전체 사용자</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>수업 목록 ({classes.length}개)</h3>

        {/* 데스크탑 뷰 - 테이블 */}
        {!isMobile && (
          <table style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>수업명</th>
                <th>수업 시간</th>
                <th>시간</th>
                <th>강사</th>
                <th>등록 학생</th>
                <th>관리</th>
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
                    cursor: 'move',
                    opacity: draggedIndex === index ? 0.5 : 1,
                    backgroundColor: draggedIndex === index ? '#f0f9ff' : 'transparent'
                  }}
                >
                  <td>
                    <span style={{ marginRight: '0.5rem', color: '#6b7280', cursor: 'grab' }}>⋮⋮</span>
                    {classItem.name}
                  </td>
                  <td>{classItem.schedule}</td>
                  <td>{classItem.duration}</td>
                  <td>{classItem.instructor || '-'}</td>
                  <td>{getStudentsInClass(classItem.id).length}명</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => handleEdit(classItem)} style={{ marginRight: '0.5rem' }}>
                      수정
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={() => handleManageStudents(classItem)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      학생 관리
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(classItem.id)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 모바일 뷰 - 카드 */}
        {isMobile && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {classes.map((classItem, index) => (
              <div
                key={classItem.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1rem',
                  backgroundColor: draggedIndex === index ? '#f0f9ff' : 'white',
                  opacity: draggedIndex === index ? 0.5 : 1,
                  cursor: 'move'
                }}
              >
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.125rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#6b7280', cursor: 'grab' }}>⋮⋮</span>
                    {classItem.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    수업 시간: {classItem.schedule}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    시간: {classItem.duration}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    강사: {classItem.instructor || '-'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    등록 학생: {getStudentsInClass(classItem.id).length}명
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEdit(classItem)}
                    style={{ width: '100%' }}
                  >
                    수정
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => handleManageStudents(classItem)}
                    style={{ width: '100%' }}
                  >
                    학생 관리
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(classItem.id)}
                    style={{ width: '100%' }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {classes.length === 0 && (
          <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '1rem' }}>
            등록된 수업이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

export default ClassList;
