import React, { useState, useEffect } from 'react';

function ClassList() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({ name: '', schedule: '', duration: '', instructor: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);
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
    loadClasses();
    loadStudents();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('수업 목록 로드 실패:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('학생 목록 로드 실패:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const response = await fetch(`/api/classes/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          await loadClasses();
          setIsEditing(false);
          setEditId(null);
        }
      } else {
        const response = await fetch('/api/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          await loadClasses();
        }
      }
      setFormData({ name: '', schedule: '', duration: '', instructor: '' });
    } catch (error) {
      console.error('수업 저장 실패:', error);
      alert('수업 정보 저장에 실패했습니다.');
    }
  };

  const handleEdit = (classItem) => {
    setFormData({
      name: classItem.name,
      schedule: classItem.schedule,
      duration: classItem.duration,
      instructor: classItem.instructor
    });
    setIsEditing(true);
    setEditId(classItem.id);
  };

  const handleDelete = async (id) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        // 수업 삭제 시 학생들의 classIds에서도 제거
        for (const student of students) {
          if (student.classIds && student.classIds.includes(id)) {
            const updatedClassIds = student.classIds.filter(classId => classId !== id);
            await fetch(`/api/students/${student.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...student, classIds: updatedClassIds })
            });
          }
        }

        const response = await fetch(`/api/classes/${id}`, {
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

  const getStudentsNotInClass = (classId) => {
    return students.filter(student =>
      !student.classIds || !student.classIds.includes(classId)
    );
  };

  const addStudentToClass = async (studentId, classId) => {
    try {
      const student = students.find(s => s.id === studentId);
      const updatedClassIds = [...(student.classIds || []), classId];
      const response = await fetch(`/api/students/${studentId}`, {
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

  const removeStudentFromClass = async (studentId, classId) => {
    if (confirm('이 학생을 수업에서 제외하시겠습니까?')) {
      try {
        const student = students.find(s => s.id === studentId);
        const updatedClassIds = (student.classIds || []).filter(id => id !== classId);
        const response = await fetch(`/api/students/${studentId}`, {
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

  return (
    <div>
      <h2>수업 관리</h2>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>{isEditing ? '수업 수정' : '새 수업 등록'}</h3>
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
          {isEditing && (
            <button type="button" className="btn" onClick={() => {
              setIsEditing(false);
              setEditId(null);
              setFormData({ name: '', schedule: '', duration: '', instructor: '' });
            }}>
              취소
            </button>
          )}
        </form>
      </div>

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
              {classes.map(classItem => (
                <tr key={classItem.id}>
                  <td>{classItem.name}</td>
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
                      onClick={() => setSelectedClassForStudents(classItem)}
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
            {classes.map(classItem => (
              <div key={classItem.id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                backgroundColor: 'white'
              }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
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
                    onClick={() => setSelectedClassForStudents(classItem)}
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

      {selectedClassForStudents && (
        <div className="card" style={{ marginTop: '1rem', border: '2px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>{selectedClassForStudents.name} - 학생 관리</h3>
            <button
              className="btn"
              onClick={() => setSelectedClassForStudents(null)}
              style={{ backgroundColor: '#6b7280', color: 'white' }}
            >
              닫기
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
            {/* 등록된 학생 */}
            <div>
              <h4 style={{ marginBottom: '0.5rem', color: '#10b981' }}>
                등록된 학생 ({getStudentsInClass(selectedClassForStudents.id).length}명)
              </h4>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', minHeight: '200px', maxHeight: '400px', overflowY: 'auto' }}>
                {getStudentsInClass(selectedClassForStudents.id).length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center' }}>등록된 학생이 없습니다.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {getStudentsInClass(selectedClassForStudents.id).map(student => (
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
                          onClick={() => removeStudentFromClass(student.id, selectedClassForStudents.id)}
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
            <div>
              <h4 style={{ marginBottom: '0.5rem', color: '#6366f1' }}>
                등록 가능한 학생 ({getStudentsNotInClass(selectedClassForStudents.id).length}명)
              </h4>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1rem', minHeight: '200px', maxHeight: '400px', overflowY: 'auto' }}>
                {getStudentsNotInClass(selectedClassForStudents.id).length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center' }}>등록 가능한 학생이 없습니다.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {getStudentsNotInClass(selectedClassForStudents.id).map(student => (
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
                          onClick={() => addStudentToClass(student.id, selectedClassForStudents.id)}
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
      )}
    </div>
  );
}

export default ClassList;
