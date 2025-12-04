import React, { useState, useEffect } from 'react';

function StudentList() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({ name: '', birthdate: '', phone: '', parentPhone: '', classIds: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
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
    loadStudents();
    loadClasses();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('학생 목록 로드 실패:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('수업 목록 로드 실패:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const response = await fetch(`/api/students/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          await loadStudents();
          setIsEditing(false);
          setEditId(null);
        }
      } else {
        const response = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (response.ok) {
          await loadStudents();
        }
      }
      setFormData({ name: '', birthdate: '', phone: '', parentPhone: '', classIds: [] });
    } catch (error) {
      console.error('학생 저장 실패:', error);
      alert('학생 정보 저장에 실패했습니다.');
    }
  };

  const handleEdit = (student) => {
    setFormData({
      name: student.name,
      birthdate: student.birthdate,
      phone: student.phone,
      parentPhone: student.parentPhone,
      classIds: student.classIds || []
    });
    setIsEditing(true);
    setEditId(student.id);
  };

  const handleDelete = async (id) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/students/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await loadStudents();
        }
      } catch (error) {
        console.error('학생 삭제 실패:', error);
        alert('학생 삭제에 실패했습니다.');
      }
    }
  };

  const handleClassToggle = (classId) => {
    const currentClassIds = formData.classIds || [];
    if (currentClassIds.includes(classId)) {
      setFormData({
        ...formData,
        classIds: currentClassIds.filter(id => id !== classId)
      });
    } else {
      setFormData({
        ...formData,
        classIds: [...currentClassIds, classId]
      });
    }
  };

  const getClassNames = (classIds) => {
    if (!classIds || classIds.length === 0) return '-';
    return classIds
      .map(id => {
        const cls = classes.find(c => c.id === id);
        return cls ? cls.name : '';
      })
      .filter(name => name)
      .join(', ');
  };

  return (
    <div>
      <h2>학생 관리</h2>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>{isEditing ? '학생 수정' : '새 학생 등록'}</h3>
        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="이름"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
            <input
              type="date"
              placeholder="생년월일"
              value={formData.birthdate}
              onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
              required
            />
            <input
              type="tel"
              placeholder="연락처"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <input
              type="tel"
              placeholder="학부모 연락처"
              value={formData.parentPhone}
              onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
            />
          </div>

          {classes.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                수강 수업 선택
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {classes.map(cls => (
                  <label
                    key={cls.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.5rem 1rem',
                      border: '2px solid',
                      borderColor: (formData.classIds || []).includes(cls.id) ? '#6366f1' : '#e5e7eb',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: (formData.classIds || []).includes(cls.id) ? '#e0e7ff' : 'white',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      minWidth: 'fit-content'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={(formData.classIds || []).includes(cls.id)}
                      onChange={() => handleClassToggle(cls.id)}
                      style={{ marginRight: '0.5rem', flexShrink: 0 }}
                    />
                    <span>{cls.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              {isEditing ? '수정' : '등록'}
            </button>
            {isEditing && (
              <button type="button" className="btn" onClick={() => {
                setIsEditing(false);
                setEditId(null);
                setFormData({ name: '', birthdate: '', phone: '', parentPhone: '', classIds: [] });
              }}>
                취소
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>학생 목록 ({students.length}명)</h3>

        {/* 데스크탑 뷰 - 테이블 */}
        {!isMobile && (
          <table style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>이름</th>
                <th>생년월일 / 나이</th>
                <th>수강 수업</th>
                <th>연락처</th>
                <th>학부모 연락처</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>
                    {student.birthdate || '-'}
                    {student.birthdate && (
                      <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                        ({calculateAge(student.birthdate)}세)
                      </span>
                    )}
                  </td>
                  <td>{getClassNames(student.classIds)}</td>
                  <td>{student.phone || '-'}</td>
                  <td>{student.parentPhone || '-'}</td>
                  <td>
                    <button className="btn btn-primary" onClick={() => handleEdit(student)} style={{ marginRight: '0.5rem' }}>
                      수정
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDelete(student.id)}>
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
            {students.map(student => (
              <div key={student.id} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                backgroundColor: 'white'
              }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    {student.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    생년월일: {student.birthdate || '-'} ({calculateAge(student.birthdate)}세)
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    수강 수업: {getClassNames(student.classIds)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    연락처: {student.phone || '-'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    학부모 연락처: {student.parentPhone || '-'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEdit(student)}
                    style={{ flex: 1 }}
                  >
                    수정
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(student.id)}
                    style={{ flex: 1 }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {students.length === 0 && (
          <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '1rem' }}>
            등록된 학생이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

export default StudentList;
