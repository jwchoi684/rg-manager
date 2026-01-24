import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import DateRangePicker from '../components/common/DateRangePicker';

function StudentAttendance() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('all');

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    window.scrollTo(0, 0);
    if (user?.role === 'admin') {
      loadUsers();
    }
    loadData();
  }, []);

  useEffect(() => {
    loadData();
    setSelectedStudent('');
    setSelectedClass('');
  }, [selectedUserId]);

  useEffect(() => {
    if (students.length > 0) {
      loadAttendanceRecords();
    }
  }, [startDate, endDate, selectedStudent, selectedClass, students]);

  const loadUsers = async () => {
    try {
      const response = await fetchWithAuth("/api/auth/users");
      const data = await response.json();
      setUsers(data.filter(u => u.role !== 'admin'));
    } catch (error) {
      console.error("사용자 목록 로드 실패:", error);
    }
  };

  const loadData = async () => {
    try {
      const studentsUrl = user?.role === 'admin' && selectedUserId !== 'all'
        ? `/api/students?filterUserId=${selectedUserId}`
        : '/api/students';
      const classesUrl = user?.role === 'admin' && selectedUserId !== 'all'
        ? `/api/classes?filterUserId=${selectedUserId}`
        : '/api/classes';

      const [studentsRes, classesRes] = await Promise.all([
        fetchWithAuth(studentsUrl),
        fetchWithAuth(classesUrl)
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
      const url = user?.role === 'admin' && selectedUserId !== 'all'
        ? `/api/attendance?filterUserId=${selectedUserId}`
        : '/api/attendance';
      const response = await fetchWithAuth(url);
      let records = await response.json();

      if (startDate && endDate) {
        records = records.filter(r => r.date >= startDate && r.date <= endDate);
      }

      if (selectedStudent) {
        records = records.filter(r => r.studentId === parseInt(selectedStudent));
      }

      if (selectedClass) {
        records = records.filter(r => r.classId === parseInt(selectedClass));
      }

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

  const getClassInfo = (classId) => {
    return classes.find(c => c.id === classId);
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : '-';
  };

  const getStudentInfo = (studentId) => {
    return students.find(s => s.id === studentId);
  };

  const getFilteredStudents = () => {
    if (!selectedClass) {
      return students;
    }
    return students.filter(student =>
      student.classIds && student.classIds.includes(parseInt(selectedClass))
    );
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${month}/${day}(${weekday})`;
  };

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">학생별 출석 조회</h2>
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

      {/* Filter Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">조회 조건</h3>
          {(selectedStudent || selectedClass || startDate !== getThisMonthRange().start || endDate !== getThisMonthRange().end) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const thisMonth = getThisMonthRange();
                setStartDate(thisMonth.start);
                setEndDate(thisMonth.end);
                setSelectedClass('');
                setSelectedStudent('');
              }}
            >
              초기화
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr 1fr',
          gap: 'var(--spacing-lg)',
          marginTop: 'var(--spacing-lg)'
        }}>
          <div>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateChange={(newStartDate, newEndDate) => {
                setStartDate(newStartDate);
                setEndDate(newEndDate);
              }}
              isMobile={isMobile}
              label="기간 선택"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">수업</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedStudent('');
              }}
            >
              <option value="">전체 수업</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">학생</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">전체 학생</option>
              {getFilteredStudents().map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Filter Info */}
        <div className="info-box" style={{ marginTop: 'var(--spacing-lg)' }}>
          <div className="info-box-title">
            {startDate} ~ {endDate}
            {selectedClass && ` | ${getClassName(parseInt(selectedClass))}`}
            {selectedStudent && ` | ${getStudentName(parseInt(selectedStudent))}`}
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-md)' }}>
          <h3 className="card-title">출석 현황</h3>
          <span style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--color-success)'
          }}>
            {attendanceRecords.length}
          </span>
          <span style={{ color: 'var(--color-gray-500)' }}>명 출석</span>
        </div>
      </div>

      {/* Attendance List */}
      <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="card-header">
          <h3 className="card-title">
            출석 기록
            <span className="badge badge-success" style={{ marginLeft: '8px' }}>
              {attendanceRecords.length}건
            </span>
          </h3>
        </div>

        {attendanceRecords.length > 0 ? (
          <>
            {/* Desktop Table */}
            {!isMobile && (
              <div className="table-container" style={{ marginTop: 'var(--spacing-lg)' }}>
                <table>
                  <thead>
                    <tr>
                      <th>출석 날짜</th>
                      <th>이름</th>
                      <th>생년월일 / 나이</th>
                      <th>수업</th>
                      <th style={{ width: '80px' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map(record => {
                      const student = getStudentInfo(record.studentId);
                      const classInfo = getClassInfo(record.classId);
                      return (
                        <tr key={record.id}>
                          <td>
                            <span style={{ fontWeight: 600 }}>{formatDisplayDate(record.date)}</span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                              {student?.name || '-'}
                            </span>
                          </td>
                          <td>
                            <span>{student?.birthdate || '-'}</span>
                            {student?.birthdate && (
                              <span className="badge badge-gray" style={{ marginLeft: '8px' }}>
                                {calculateAge(student.birthdate)}세
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{classInfo?.name || '-'}</div>
                            {classInfo?.schedule && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                                {classInfo.schedule}
                              </div>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteAttendance(record.id)}
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Cards - Toss Style with Date Grouping */}
            {isMobile && (
              <div style={{ marginTop: 'var(--spacing-lg)' }}>
                {(() => {
                  const groupedByDate = attendanceRecords.reduce((acc, record) => {
                    const date = record.date;
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(record);
                    return acc;
                  }, {});

                  return Object.entries(groupedByDate).map(([date, records]) => (
                    <div key={date} className="toss-list" style={{ marginBottom: 'var(--spacing-md)' }}>
                      <div className="toss-list-header">
                        {formatDisplayDate(date)}
                      </div>
                      {records.map(record => {
                        const student = getStudentInfo(record.studentId);
                        const classInfo = getClassInfo(record.classId);
                        return (
                          <div
                            key={record.id}
                            className="toss-list-item"
                            style={{ cursor: 'default' }}
                          >
                            <div className="toss-list-item-icon success">
                              {student?.name?.charAt(0) || '?'}
                            </div>
                            <div className="toss-list-item-content">
                              <div className="toss-list-item-title">
                                {student?.name || '-'}
                              </div>
                              <div className="toss-list-item-subtitle">
                                {classInfo?.name || '-'}
                              </div>
                            </div>
                            <div className="toss-list-item-value">
                              <div className="toss-list-item-value-main" style={{ color: 'var(--color-success)' }}>
                                {calculateAge(student?.birthdate)}세
                              </div>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleDeleteAttendance(record.id)}
                                style={{
                                  color: 'var(--color-danger)',
                                  padding: '4px 8px',
                                  fontSize: '0.75rem',
                                  marginTop: '2px'
                                }}
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">출석 기록이 없습니다</div>
            <div className="empty-state-description">선택한 조건에 해당하는 출석 기록이 없습니다.</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentAttendance;
