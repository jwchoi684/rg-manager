import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

function ClassStudentManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const classItem = location.state?.classItem; // 전달된 수업 데이터

  const [students, setStudents] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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

    if (!classItem) {
      // classItem이 없으면 수업 목록으로 이동
      navigate('/classes');
      return;
    }

    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await fetchWithAuth('/api/students');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('학생 목록 로드 실패:', error);
    }
  };

  const getStudentsInClass = () => {
    if (!classItem) return [];
    return students.filter(student =>
      student.classIds && student.classIds.includes(classItem.id)
    );
  };

  const getStudentsNotInClass = () => {
    if (!classItem) return [];
    return students.filter(student =>
      !student.classIds || !student.classIds.includes(classItem.id)
    );
  };

  const addStudentToClass = async (studentId) => {
    try {
      const student = students.find(s => s.id === studentId);
      const updatedClassIds = [...(student.classIds || []), classItem.id];
      const response = await fetchWithAuth(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...student, classIds: updatedClassIds })
      });
      if (response.ok) {
        await loadStudents();
      }
    } catch (error) {
      console.error('학생 등록 실패:', error);
      alert('학생 등록에 실패했습니다.');
    }
  };

  const removeStudentFromClass = async (studentId) => {
    if (confirm('이 학생을 수업에서 제외하시겠습니까?')) {
      try {
        const student = students.find(s => s.id === studentId);
        const updatedClassIds = (student.classIds || []).filter(id => id !== classItem.id);
        const response = await fetchWithAuth(`/api/students/${studentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...student, classIds: updatedClassIds })
        });
        if (response.ok) {
          await loadStudents();
        }
      } catch (error) {
        console.error('학생 제외 실패:', error);
        alert('학생 제외에 실패했습니다.');
      }
    }
  };

  if (!classItem) {
    return null;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{classItem.name} - 학생 관리</h2>
        <button
          className="btn"
          onClick={() => navigate('/classes')}
          style={{ backgroundColor: '#6b7280', color: 'white' }}
        >
          목록으로
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#f9fafb' }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          <div><strong>수업 시간:</strong> {classItem.schedule}</div>
          <div><strong>시간:</strong> {classItem.duration}</div>
          {classItem.instructor && <div><strong>강사:</strong> {classItem.instructor}</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
        {/* 등록된 학생 */}
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem', color: '#10b981' }}>
            등록된 학생 ({getStudentsInClass().length}명)
          </h3>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', backgroundColor: 'white' }}>
            {getStudentsInClass().length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>등록된 학생이 없습니다.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {getStudentsInClass().map(student => (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: '#d1fae5',
                      borderRadius: '4px',
                      border: '1px solid #10b981'
                    }}
                  >
                    <div>
                      <strong>{student.name}</strong>
                      <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        ({calculateAge(student.birthdate)}세)
                      </span>
                    </div>
                    <button
                      className="btn btn-danger"
                      onClick={() => removeStudentFromClass(student.id)}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                    >
                      제외
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 등록 가능한 학생 */}
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem', color: '#6366f1' }}>
            등록 가능한 학생 ({getStudentsNotInClass().length}명)
          </h3>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', backgroundColor: 'white' }}>
            {getStudentsNotInClass().length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>등록 가능한 학생이 없습니다.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {getStudentsNotInClass().map(student => (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <div>
                      <strong>{student.name}</strong>
                      <span style={{ marginLeft: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        ({calculateAge(student.birthdate)}세)
                      </span>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => addStudentToClass(student.id)}
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                    >
                      등록
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassStudentManagement;
