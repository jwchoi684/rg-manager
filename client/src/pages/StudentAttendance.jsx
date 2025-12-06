import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { ko } from 'date-fns/locale';

function StudentAttendance() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // 날짜를 YYYY-MM-DD 형식으로 변환 (타임존 문제 해결)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 이번 달 시작일과 종료일 계산
  const getThisMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay),
      startDate: firstDay,
      endDate: lastDay
    };
  };

  const thisMonth = getThisMonthRange();
  const [startDate, setStartDate] = useState(thisMonth.start);
  const [endDate, setEndDate] = useState(thisMonth.end);
  const [dateRange, setDateRange] = useState({
    startDate: thisMonth.startDate,
    endDate: thisMonth.endDate,
    key: 'selection'
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  // 날짜 선택기 외부 클릭 감지 (데스크탑 전용)
  useEffect(() => {
    if (isMobile) return; // 모바일에서는 오버레이 클릭으로 처리
    const handleClickOutside = (event) => {
      if (showDatePicker && !event.target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker, isMobile]);

  // 모바일에서 모달 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isMobile && showDatePicker) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDatePicker, isMobile]);

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
    if (students.length > 0) {
      loadAttendanceRecords();
    }
  }, [startDate, endDate, selectedStudent, selectedClass, students]);

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
      const response = await fetchWithAuth('/api/attendance');
      let records = await response.json();

      // 기간 필터
      if (startDate && endDate) {
        records = records.filter(r => r.date >= startDate && r.date <= endDate);
      }

      // 학생 필터
      if (selectedStudent) {
        records = records.filter(r => r.studentId === parseInt(selectedStudent));
      }

      // 수업 필터
      if (selectedClass) {
        records = records.filter(r => r.classId === parseInt(selectedClass));
      }

      // 날짜 역순 정렬 (최신순)
      records.sort((a, b) => new Date(b.date) - new Date(a.date));

      setAttendanceRecords(records);
    } catch (error) {
      console.error('출석 기록 로드 실패:', error);
      setAttendanceRecords([]);
    }
  };

  const handleDeleteAttendance = async (recordId) => {
    if (!confirm('이 출석 기록을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/attendance/${recordId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadAttendanceRecords();
        alert('출석 기록이 삭제되었습니다.');
      }
    } catch (error) {
      console.error('출석 삭제 실패:', error);
      alert('출석 삭제에 실패했습니다.');
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
          {/* 날짜 범위 선택 */}
          <div className="date-picker-container" style={{ flex: isMobile ? '1' : '0 0 auto', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              기간 선택
            </label>
            <button
              className="btn"
              onClick={() => setShowDatePicker(!showDatePicker)}
              style={{
                width: isMobile ? '100%' : 'auto',
                minWidth: '200px',
                textAlign: 'left',
                padding: '0.5rem 1rem'
              }}
            >
              {startDate} ~ {endDate}
            </button>
            {showDatePicker && (
              <>
                {/* 모바일: 전체 화면 오버레이 */}
                {isMobile && (
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      zIndex: 999
                    }}
                    onClick={() => setShowDatePicker(false)}
                  />
                )}
                <div style={{
                  position: isMobile ? 'fixed' : 'absolute',
                  top: isMobile ? '50%' : '100%',
                  left: isMobile ? '50%' : 0,
                  transform: isMobile ? 'translate(-50%, -50%)' : 'none',
                  zIndex: 1000,
                  backgroundColor: 'white',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  marginTop: isMobile ? 0 : '0.5rem',
                  maxWidth: isMobile ? '95vw' : 'none',
                  maxHeight: isMobile ? '90vh' : 'none',
                  overflow: isMobile ? 'auto' : 'visible'
                }}>
                  <DateRange
                    ranges={[dateRange]}
                    onChange={(item) => {
                      setDateRange(item.selection);
                      // 로컬 날짜로 변환 (타임존 문제 해결)
                      setStartDate(formatDate(item.selection.startDate));
                      setEndDate(formatDate(item.selection.endDate));
                    }}
                    months={isMobile ? 1 : 2}
                    direction={isMobile ? 'vertical' : 'horizontal'}
                    locale={ko}
                    rangeColors={['#6366f1']}
                  />
                  <div style={{
                    padding: '1rem',
                    borderTop: '1px solid #e5e7eb',
                    textAlign: 'right'
                  }}>
                    <button
                      className="btn"
                      onClick={() => setShowDatePicker(false)}
                      style={{ fontSize: '0.875rem' }}
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </>
            )}
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
          {(selectedStudent || selectedClass || startDate !== getThisMonthRange().start || endDate !== getThisMonthRange().end) && (
            <div style={{ flex: isMobile ? '1' : '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn"
                onClick={() => {
                  const thisMonth = getThisMonthRange();
                  setStartDate(thisMonth.start);
                  setEndDate(thisMonth.end);
                  setDateRange({
                    startDate: thisMonth.startDate,
                    endDate: thisMonth.endDate,
                    key: 'selection'
                  });
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
            {startDate} ~ {endDate}
            {selectedClass && ` - ${getClassName(parseInt(selectedClass))}`}
            {selectedStudent && ` - ${getStudentName(parseInt(selectedStudent))}`}
          </strong>
        </div>
      </div>

      {/* 출석 통계 */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>출석 현황</h3>
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981', margin: '0.5rem 0 0 0' }}>
          총 {attendanceRecords.length}명 출석
        </p>
      </div>

      {/* 출석 학생 목록 */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ color: '#10b981' }}>출석 학생 목록</h3>
        {attendanceRecords.length > 0 ? (
          <div style={{ marginTop: '1rem' }}>
            {/* 데스크탑 - 테이블 */}
            {!isMobile && (
              <table>
                <thead>
                  <tr>
                    <th>출석 날짜</th>
                    <th>이름</th>
                    <th>생년월일</th>
                    <th>수업</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map(record => {
                    const student = getStudentInfo(record.studentId);
                    return (
                      <tr key={record.id}>
                        <td>{record.date}</td>
                        <td>{student?.name || '-'}</td>
                        <td>
                          {student?.birthdate || '-'}
                          {student?.birthdate && (
                            <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>
                              ({calculateAge(student.birthdate)}세)
                            </span>
                          )}
                        </td>
                        <td>{getClassName(record.classId)}</td>
                        <td>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteAttendance(record.id)}
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* 모바일 - 카드 */}
            {isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {attendanceRecords.map(record => {
                  const student = getStudentInfo(record.studentId);
                  return (
                    <div
                      key={record.id}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#d1fae5',
                        borderRadius: '8px',
                        border: '1px solid #10b981',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          {record.date} - {student?.name || '-'}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {student?.birthdate} ({calculateAge(student?.birthdate)}세)
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem' }}>
                          {getClassName(record.classId)}
                        </div>
                      </div>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteAttendance(record.id)}
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        삭제
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
            출석한 학생이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

export default StudentAttendance;
