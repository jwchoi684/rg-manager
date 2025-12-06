import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    todayAttendance: 0
  });
  const [classes, setClasses] = useState([]);
  const [attendanceByClass, setAttendanceByClass] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    // 페이지 로드 시 스크롤을 맨 위로 이동
    window.scrollTo(0, 0);
    loadData();
  }, []);

  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 날짜 변경시 출석률 다시 계산
  useEffect(() => {
    if (classes.length > 0) {
      loadData();
    }
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const [studentsRes, classesRes, attendanceRes] = await Promise.all([
        fetchWithAuth('/api/students'),
        fetchWithAuth('/api/classes'),
        fetchWithAuth('/api/attendance')
      ]);

      const students = await studentsRes.json();
      const classesData = await classesRes.json();
      const attendance = await attendanceRes.json();

      const selectedDateAttendance = attendance.filter(a => a.date === selectedDate);

      setStats({
        totalStudents: students.length,
        totalClasses: classesData.length,
        todayAttendance: selectedDateAttendance.length
      });

      setClasses(classesData);

      // 최근 7일간의 날짜 생성
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
      }

      // 수업별 출석 현황 계산
      const classAttendance = classesData.map(classItem => {
        const dailyAttendance = last7Days.map(date => {
          const count = attendance.filter(a =>
            a.classId === classItem.id && a.date === date
          ).length;
          return { date, count };
        });

        // 등록된 학생 수
        const enrolledStudents = students.filter(s =>
          s.classIds && s.classIds.includes(classItem.id)
        ).length;

        return {
          class: classItem,
          enrolledStudents,
          dailyAttendance
        };
      });

      setAttendanceByClass(classAttendance);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${month}/${day}(${weekday})`;
  };

  const getAttendanceColor = (count, total) => {
    if (count === 0) return '#e5e7eb';
    const ratio = total > 0 ? count / total : 0;
    if (ratio >= 0.8) return '#10b981';
    if (ratio >= 0.5) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div>
      <h2>대시보드</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <div className="card">
          <h3>전체 학생</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1' }}>{stats.totalStudents}명</p>
        </div>
        <div className="card">
          <h3>전체 수업</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{stats.totalClasses}개</p>
        </div>
        <div className="card">
          <h3>선택한 날짜 출석</h3>
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: isMobile ? '100%' : '180px' }}
            />
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.todayAttendance}명</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>수업별 출석 현황 (최근 7일)</h3>
        {classes.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
            등록된 수업이 없습니다.
          </p>
        ) : (
          <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '120px' }}>수업명</th>
                  <th style={{ minWidth: '80px' }}>등록 학생</th>
                  {attendanceByClass.length > 0 && attendanceByClass[0].dailyAttendance.map((day, idx) => (
                    <th key={idx} style={{ minWidth: '70px', textAlign: 'center' }}>
                      {formatDate(day.date)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendanceByClass.map((item, classIdx) => (
                  <tr key={classIdx}>
                    <td>
                      <strong>{item.class.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {item.class.schedule}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{item.enrolledStudents}명</td>
                    {item.dailyAttendance.map((day, dayIdx) => (
                      <td key={dayIdx} style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: getAttendanceColor(day.count, item.enrolledStudents),
                            color: day.count === 0 ? '#6b7280' : 'white',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            minWidth: '40px'
                          }}
                        >
                          {day.count > 0 ? `${day.count}명` : '-'}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {classes.length > 0 && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px', fontSize: '0.875rem' }}>
            <strong>색상 범례:</strong>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#10b981', borderRadius: '4px' }}></div>
                <span>출석률 80% 이상</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#f59e0b', borderRadius: '4px' }}></div>
                <span>출석률 50-80%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#ef4444', borderRadius: '4px' }}></div>
                <span>출석률 50% 미만</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
                <span>출석 없음</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {classes.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>선택한 날짜의 수업별 출석률</h3>
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {attendanceByClass.map((item, idx) => {
              const selectedDateAttendance = item.dailyAttendance.find(d => d.date === selectedDate);
              const attendanceCount = selectedDateAttendance ? selectedDateAttendance.count : 0;
              const attendanceRate = item.enrolledStudents > 0
                ? Math.round((attendanceCount / item.enrolledStudents) * 100)
                : 0;

              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    border: '2px solid',
                    borderColor: getAttendanceColor(attendanceCount, item.enrolledStudents)
                  }}
                >
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{item.class.name}</h4>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                    {item.class.schedule}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6366f1' }}>
                        {attendanceCount} / {item.enrolledStudents}명
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 'bold',
                        color: getAttendanceColor(attendanceCount, item.enrolledStudents),
                        padding: '0.5rem',
                        backgroundColor: `${getAttendanceColor(attendanceCount, item.enrolledStudents)}20`,
                        borderRadius: '4px'
                      }}
                    >
                      {attendanceRate}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
