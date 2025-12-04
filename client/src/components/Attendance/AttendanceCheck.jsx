import React, { useState, useEffect } from 'react';

function AttendanceCheck() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkedStudents, setCheckedStudents] = useState(new Set());
  const [hasChanges, setHasChanges] = useState(false);

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
    loadData();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [selectedDate, selectedClass]);

  const loadData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/classes')
      ]);
      const studentsData = await studentsRes.json();
      const classesData = await classesRes.json();
      setStudents(studentsData);
      setClasses(classesData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  const loadAttendance = async () => {
    try {
      const response = await fetch(`/api/attendance/date/${selectedDate}`);
      const allAttendance = await response.json();
      const filtered = allAttendance.filter(a =>
        !selectedClass || a.classId === parseInt(selectedClass)
      );
      setCheckedStudents(new Set(filtered.map(a => a.studentId)));
      setHasChanges(false);
    } catch (error) {
      console.error('출석 기록 로드 실패:', error);
      setCheckedStudents(new Set());
      setHasChanges(false);
    }
  };

  const toggleAttendance = (studentId) => {
    const newChecked = new Set(checkedStudents);
    if (newChecked.has(studentId)) {
      newChecked.delete(studentId);
    } else {
      newChecked.add(studentId);
    }
    setCheckedStudents(newChecked);
    setHasChanges(true);
  };

  const handleSubmit = async () => {
    if (!selectedClass) {
      alert('수업을 선택해주세요!');
      return;
    }

    try {
      // 해당 날짜와 수업의 기존 출석 기록 삭제
      await fetch('/api/attendance/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          classId: parseInt(selectedClass)
        })
      });

      // 새로운 출석 기록 추가
      const attendancePromises = Array.from(checkedStudents).map(studentId =>
        fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            classId: parseInt(selectedClass),
            date: selectedDate
          })
        })
      );

      await Promise.all(attendancePromises);
      setHasChanges(false);
      alert(`출석 체크가 완료되었습니다! (${checkedStudents.size}명)`);
    } catch (error) {
      console.error('출석 체크 제출 실패:', error);
      alert('출석 체크 제출에 실패했습니다.');
    }
  };

  // 선택한 수업을 수강하는 학생만 필터링
  const getFilteredStudents = () => {
    if (!selectedClass) {
      return students;
    }
    return students.filter(student =>
      student.classIds && student.classIds.includes(parseInt(selectedClass))
    );
  };

  const filteredStudents = getFilteredStudents();

  return (
    <div>
      <h2>출석 체크</h2>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>날짜</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>수업 선택</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{ minWidth: '200px' }}
            >
              <option value="">수업을 선택하세요</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedClass && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e0e7ff', borderRadius: '4px', border: '2px solid #6366f1' }}>
            <strong style={{ color: '#4338ca' }}>
              {classes.find(c => c.id === parseInt(selectedClass))?.name} - {selectedDate}
            </strong>
          </div>
        )}
      </div>

      {!selectedClass ? (
        <div className="card" style={{ marginTop: '1rem' }}>
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
            위에서 수업을 선택하여 출석 체크를 시작하세요.
          </p>
        </div>
      ) : (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>학생 목록</h3>
            {hasChanges && (
              <span style={{ color: '#f59e0b', fontSize: '0.875rem', fontWeight: 'bold' }}>
                * 변경사항이 있습니다. 제출 버튼을 눌러주세요.
              </span>
            )}
          </div>
          <div style={{ marginTop: '1rem' }}>
            {filteredStudents.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                이 수업에 등록된 학생이 없습니다.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {filteredStudents.map(student => (
                  <div
                    key={student.id}
                    onClick={() => toggleAttendance(student.id)}
                    style={{
                      padding: '1rem',
                      border: '2px solid',
                      borderColor: checkedStudents.has(student.id) ? '#10b981' : '#e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: checkedStudents.has(student.id) ? '#d1fae5' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={checkedStudents.has(student.id)}
                        onChange={() => {}}
                        style={{ width: '20px', height: '20px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{student.name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {student.birthdate || '-'} ({calculateAge(student.birthdate)}세)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
            <strong>출석: {checkedStudents.size}명 / {filteredStudents.length}명</strong>
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}
            >
              출석 체크 제출
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceCheck;
