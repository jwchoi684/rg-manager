import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';

function StudentAttendance() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
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

  // 요일 변환 함수
  const getDayOfWeek = (dateString) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const date = new Date(dateString);
    return days[date.getDay()];
  };

  useEffect(() => {
    // 페이지 로드 시 스크롤을 맨 위로 이동
    window.scrollTo(0, 0);
    loadData();
  }, []);

  useEffect(() => {
    loadAttendanceRecords();
  }, [selectedDate, selectedStudent, selectedClass]);

  const loadData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetchWithAuth('/api/students'),
        fetchWithAuth('/api/classes')
      ]);
      const studentsData = await studentsRes.json();
      const classesData = await classesRes.json();
      setStudents(studentsData);
      setClasses(classesData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      const response = await fetchWithAuth(`/api/attendance/date/${selectedDate}`);
      let records = await response.json();

      // 학생 필터
      if (selectedStudent) {
        records = records.filter(r => r.studentId === parseInt(selectedStudent));
      }

      // 수업 필터
      if (selectedClass) {
        records = records.filter(r => r.classId === parseInt(selectedClass));
      }

      setAttendanceRecords(records);
    } catch (error) {
      console.error('출석 기록 로드 실패:', error);
      setAttendanceRecords([]);
    }
  };

  const getClassName = (classId) => {
    const classItem = classes.find(c => c.id === classId);
    return classItem ? classItem.name : '-';
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : '-';
  };

  const getStudentInfo = (studentId) => {
    return students.find(s => s.id === studentId);
  };

  // 필터링된 학생 목록 (선택된 수업에 속한 학생들만)
  const getFilteredStudents = () => {
    if (!selectedClass) {
      return students;
    }
    return students.filter(student =>
      student.classIds && student.classIds.includes(parseInt(selectedClass))
    );
  };

  // 출석한 학생과 결석한 학생 분리
  const getAttendanceStats = () => {
    const filteredStudents = getFilteredStudents();
    const presentStudentIds = attendanceRecords.map(r => r.studentId);

    // 선택된 학생 필터가 있으면 해당 학생만 포함
    let studentsToCheck = filteredStudents;
    if (selectedStudent) {
      studentsToCheck = filteredStudents.filter(s => s.id === parseInt(selectedStudent));
    }

    const presentStudents = studentsToCheck.filter(s => presentStudentIds.includes(s.id));
    const absentStudents = studentsToCheck.filter(s => !presentStudentIds.includes(s.id));

    return { presentStudents, absentStudents };
  };

  const { presentStudents, absentStudents } = getAttendanceStats();

  return (
    <div>
      <h2>학생별 출석 조회</h2>

      {/* 필터 영역 */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>조회 조건</h3>
        <div style={{
          marginTop: '1rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          {/* 날짜 선택 */}
          <div style={{ flex: isMobile ? '1' : '0 0 auto' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              날짜
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: isMobile ? '100%' : '180px' }}
            />
          </div>

          {/* 수업 선택 */}
          <div style={{ flex: isMobile ? '1' : '0 0 auto' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              수업
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedStudent(''); // 수업 변경 시 학생 선택 초기화
              }}
              style={{ width: isMobile ? '100%' : '180px' }}
            >
              <option value="">전체 수업</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 학생 선택 */}
          <div style={{ flex: isMobile ? '1' : '0 0 auto' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              학생
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              style={{ width: isMobile ? '100%' : '180px' }}
            >
              <option value="">전체 학생</option>
              {getFilteredStudents().map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 필터 초기화 버튼 */}
          {(selectedStudent || selectedClass || selectedDate !== new Date().toISOString().split('T')[0]) && (
            <div style={{ flex: isMobile ? '1' : '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn"
                onClick={() => {
                  setSelectedDate(new Date().toISOString().split('T')[0]);
                  setSelectedClass('');
                  setSelectedStudent('');
                }}
                style={{ width: isMobile ? '100%' : 'auto' }}
              >
                초기화
              </button>
            </div>
          )}
        </div>

        {/* 선택된 조건 표시 */}
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#e0e7ff',
          borderRadius: '4px',
          border: '2px solid #6366f1'
        }}>
          <strong style={{ color: '#4338ca' }}>
            {selectedDate} ({getDayOfWeek(selectedDate)}요일)
            {selectedClass && ` - ${getClassName(parseInt(selectedClass))}`}
            {selectedStudent && ` - ${getStudentName(parseInt(selectedStudent))}`}
          </strong>
        </div>
      </div>

      {/* 출석 통계 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginTop: '1rem'
      }}>
        <div className="card">
          <h3>출석</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: '0.5rem 0 0 0' }}>
            {presentStudents.length}명
          </p>
        </div>
        <div className="card">
          <h3>결석</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444', margin: '0.5rem 0 0 0' }}>
            {absentStudents.length}명
          </p>
        </div>
        <div className="card">
          <h3>출석률</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1', margin: '0.5rem 0 0 0' }}>
            {presentStudents.length + absentStudents.length > 0
              ? Math.round((presentStudents.length / (presentStudents.length + absentStudents.length)) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* 출석 학생 목록 */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ color: '#10b981' }}>출석 학생 ({presentStudents.length}명)</h3>
        {presentStudents.length > 0 ? (
          <div style={{
            marginTop: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.5rem'
          }}>
            {presentStudents.map(student => {
              const record = attendanceRecords.find(r => r.studentId === student.id);
              return (
                <div
                  key={student.id}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#d1fae5',
                    borderRadius: '8px',
                    border: '1px solid #10b981'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{student.name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {student.birthdate} ({calculateAge(student.birthdate)}세)
                  </div>
                  {record && (
                    <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem' }}>
                      {getClassName(record.classId)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
            출석한 학생이 없습니다.
          </p>
        )}
      </div>

      {/* 결석 학생 목록 */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ color: '#ef4444' }}>결석 학생 ({absentStudents.length}명)</h3>
        {absentStudents.length > 0 ? (
          <div style={{
            marginTop: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '0.5rem'
          }}>
            {absentStudents.map(student => (
              <div
                key={student.id}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#fee2e2',
                  borderRadius: '8px',
                  border: '1px solid #ef4444'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{student.name}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {student.birthdate} ({calculateAge(student.birthdate)}세)
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
            결석한 학생이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

export default StudentAttendance;
