import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import DateRangePicker from '../components/common/DateRangePicker';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    todayAttendance: 0
  });
  const [classes, setClasses] = useState([]);
  const [attendanceByClass, setAttendanceByClass] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [yearlyTotal, setYearlyTotal] = useState(0);
  const [monthlyDistinctStudents, setMonthlyDistinctStudents] = useState([]);
  const [classDistinctStudents, setClassDistinctStudents] = useState([]);
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState([]);
  const [monthlyAttendanceData, setMonthlyAttendanceData] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('all');

  const getDefaultDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const defaultRange = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (user?.role === 'admin') {
      loadUsers();
    }
    loadData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedUserId]);

  useEffect(() => {
    if (classes.length > 0) {
      loadData();
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (classes.length > 0) {
      loadData();
    }
  }, [selectedDate]);

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
      const attendanceUrl = user?.role === 'admin' && selectedUserId !== 'all'
        ? `/api/attendance?filterUserId=${selectedUserId}`
        : '/api/attendance';

      const [studentsRes, classesRes, attendanceRes] = await Promise.all([
        fetchWithAuth(studentsUrl),
        fetchWithAuth(classesUrl),
        fetchWithAuth(attendanceUrl)
      ]);

      const students = await studentsRes.json();
      const classesData = await classesRes.json();
      const attendance = await attendanceRes.json();

      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance.filter(a => a.date === today);

      setStats({
        totalStudents: students.length,
        totalClasses: classesData.length,
        todayAttendance: todayAttendance.length
      });

      setClasses(classesData);

      const dateRange = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dateRange.push(d.toISOString().split('T')[0]);
      }

      const classAttendance = classesData.map(classItem => {
        const dailyAttendance = dateRange.map(date => {
          const count = attendance.filter(a =>
            a.classId === classItem.id && a.date === date
          ).length;
          return { date, count };
        });

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

      // 주간 출석 합계 (최근 7일)
      let weeklyCount = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        weeklyCount += attendance.filter(a => a.date === dateStr).length;
      }
      setWeeklyTotal(weeklyCount);

      // 월간 출석 합계 (최근 30일)
      let monthlyCount = 0;
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        monthlyCount += attendance.filter(a => a.date === dateStr).length;
      }
      setMonthlyTotal(monthlyCount);

      // 연간 출석 합계 (최근 365일)
      let yearlyCount = 0;
      for (let i = 0; i < 365; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        yearlyCount += attendance.filter(a => a.date === dateStr).length;
      }
      setYearlyTotal(yearlyCount);

      // 월별 고유 학생 수 계산 (최근 6개월)
      const monthlyStudents = [];
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() - i);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        // 해당 월의 시작일과 마지막일
        const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        // 해당 월의 출석 기록에서 고유 학생 수 계산
        const monthAttendance = attendance.filter(a => a.date >= monthStart && a.date <= monthEnd);
        const distinctStudents = new Set(monthAttendance.map(a => a.studentId));

        monthlyStudents.push({
          month: `${month + 1}월`,
          학생수: distinctStudents.size
        });
      }
      setMonthlyDistinctStudents(monthlyStudents);

      // 수업별 고유 학생 수 계산 (지난달)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthYear = lastMonth.getFullYear();
      const lastMonthMonth = lastMonth.getMonth();
      const lastMonthStart = `${lastMonthYear}-${String(lastMonthMonth + 1).padStart(2, '0')}-01`;
      const lastMonthLastDay = new Date(lastMonthYear, lastMonthMonth + 1, 0).getDate();
      const lastMonthEnd = `${lastMonthYear}-${String(lastMonthMonth + 1).padStart(2, '0')}-${String(lastMonthLastDay).padStart(2, '0')}`;

      const classStudents = classesData.map(classItem => {
        const classAttendance = attendance.filter(a =>
          a.classId === classItem.id &&
          a.date >= lastMonthStart &&
          a.date <= lastMonthEnd
        );
        const distinctStudents = new Set(classAttendance.map(a => a.studentId));
        return {
          name: classItem.name,
          학생수: distinctStudents.size
        };
      }).sort((a, b) => b.학생수 - a.학생수);
      setClassDistinctStudents(classStudents);

      // 주별 출석 수 그래프 데이터 (최근 8주)
      const weeklyChartData = [];
      for (let i = 7; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);

        let weekCount = 0;
        for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          weekCount += attendance.filter(a => a.date === dateStr).length;
        }

        const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
        weeklyChartData.push({
          week: weekLabel,
          출석수: weekCount
        });
      }
      setWeeklyAttendanceData(weeklyChartData);

      // 월별 출석 수 그래프 데이터 (최근 6개월)
      const monthlyChartData = [];
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() - i);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();

        const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const monthCount = attendance.filter(a => a.date >= monthStart && a.date <= monthEnd).length;

        monthlyChartData.push({
          month: `${month + 1}월`,
          출석수: monthCount
        });
      }
      setMonthlyAttendanceData(monthlyChartData);
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
    if (count === 0) return 'var(--color-gray-200)';
    const ratio = total > 0 ? count / total : 0;
    if (ratio >= 0.8) return 'var(--color-success)';
    if (ratio >= 0.5) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getAttendanceBgColor = (count, total) => {
    if (count === 0) return 'var(--color-gray-100)';
    const ratio = total > 0 ? count / total : 0;
    if (ratio >= 0.8) return 'var(--color-success-bg)';
    if (ratio >= 0.5) return 'var(--color-warning-bg)';
    return 'var(--color-danger-bg)';
  };

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">대시보드</h2>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-3" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="stat-card">
          <div className="stat-label">전체 학생</div>
          <div className="stat-value primary">{stats.totalStudents}명</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">전체 수업</div>
          <div className="stat-value success">{stats.totalClasses}개</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">오늘 출석</div>
          <div className="stat-value warning">{stats.todayAttendance}명</div>
        </div>
      </div>

      {/* Weekly, Monthly, Yearly Attendance Stats */}
      <div className="grid grid-cols-3" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="stat-card">
          <div className="stat-label">주간 출석</div>
          <div className="stat-value primary">{weeklyTotal}명</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '4px' }}>최근 7일</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">월간 출석</div>
          <div className="stat-value success">{monthlyTotal}명</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '4px' }}>최근 30일</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">연간 출석</div>
          <div className="stat-value warning">{yearlyTotal}명</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '4px' }}>최근 365일</div>
        </div>
      </div>

      {/* Weekly & Monthly Attendance Charts */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          marginBottom: 'var(--spacing-lg)'
        }}
      >
        {/* Weekly Attendance Chart */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 'var(--spacing-lg)' }}>
            주별 출석 수
          </h3>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-lg)' }}>
            최근 8주간 주별 총 출석 횟수
          </div>
          {weeklyAttendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyAttendanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: 'var(--color-gray-600)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-gray-200)' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-gray-600)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-gray-200)' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--color-gray-200)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                  labelStyle={{ color: 'var(--color-gray-700)', fontWeight: 600 }}
                  formatter={(value) => [`${value}회`, '출석']}
                />
                <Bar
                  dataKey="출석수"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={35}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
              <div className="empty-state-description">데이터를 불러오는 중...</div>
            </div>
          )}
        </div>

        {/* Monthly Attendance Chart */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 'var(--spacing-lg)' }}>
            월별 출석 수
          </h3>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-lg)' }}>
            최근 6개월간 월별 총 출석 횟수
          </div>
          {monthlyAttendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyAttendanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--color-gray-600)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-gray-200)' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-gray-600)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-gray-200)' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--color-gray-200)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                  labelStyle={{ color: 'var(--color-gray-700)', fontWeight: 600 }}
                  formatter={(value) => [`${value}회`, '출석']}
                />
                <Bar
                  dataKey="출석수"
                  fill="var(--color-success)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
              <div className="empty-state-description">데이터를 불러오는 중...</div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Distinct Students Chart */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3 className="card-title" style={{ marginBottom: 'var(--spacing-lg)' }}>
          월별 수업 참여 학생 수
        </h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-lg)' }}>
          매월 1회 이상 출석한 고유 학생 수 (최근 6개월)
        </div>
        {monthlyDistinctStudents.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyDistinctStudents} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: 'var(--color-gray-600)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-gray-200)' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-gray-600)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-gray-200)' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--color-gray-200)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)'
                }}
                labelStyle={{ color: 'var(--color-gray-700)', fontWeight: 600 }}
                formatter={(value) => [`${value}명`, '참여 학생']}
              />
              <Bar
                dataKey="학생수"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
            <div className="empty-state-description">데이터를 불러오는 중...</div>
          </div>
        )}
      </div>

      {/* Class Distinct Students Chart */}
      {classDistinctStudents.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h3 className="card-title" style={{ marginBottom: 'var(--spacing-lg)' }}>
            수업별 참여 학생 수
          </h3>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)', marginBottom: 'var(--spacing-lg)' }}>
            각 수업에 1회 이상 출석한 고유 학생 수 (지난달)
          </div>
          <ResponsiveContainer width="100%" height={Math.max(200, classDistinctStudents.length * 45)}>
            <BarChart
              data={classDistinctStudents}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-200)" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: 'var(--color-gray-600)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-gray-200)' }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: 'var(--color-gray-700)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-gray-200)' }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--color-gray-200)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)'
                }}
                labelStyle={{ color: 'var(--color-gray-700)', fontWeight: 600 }}
                formatter={(value) => [`${value}명`, '참여 학생']}
              />
              <Bar
                dataKey="학생수"
                fill="var(--color-success)"
                radius={[0, 4, 4, 0]}
                maxBarSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Attendance by Class */}
      <div className="card">
        <div className="card-header" style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
          <h3 className="card-title">수업별 출석 현황</h3>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateChange={(newStartDate, newEndDate) => {
              setStartDate(newStartDate);
              setEndDate(newEndDate);
            }}
            isMobile={isMobile}
            label={isMobile ? "기간 선택" : "기간"}
          />
        </div>

        {classes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <div className="empty-state-title">등록된 수업이 없습니다</div>
            <div className="empty-state-description">수업을 등록하면 출석 현황을 확인할 수 있습니다.</div>
          </div>
        ) : (
          <>
            <div className="table-container" style={{ marginTop: 'var(--spacing-lg)' }}>
              <table style={{ minWidth: '600px' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: '120px' }}>수업명</th>
                    <th style={{ minWidth: '80px', textAlign: 'center' }}>등록</th>
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
                        <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>{item.class.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                          {item.class.schedule}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-gray">{item.enrolledStudents}명</span>
                      </td>
                      {item.dailyAttendance.map((day, dayIdx) => (
                        <td key={dayIdx} style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: getAttendanceBgColor(day.count, item.enrolledStudents),
                              color: day.count === 0 ? 'var(--color-gray-400)' : getAttendanceColor(day.count, item.enrolledStudents),
                              fontWeight: 600,
                              fontSize: '0.8125rem',
                              minWidth: '36px'
                            }}
                          >
                            {day.count > 0 ? `${day.count}` : '-'}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="legend" style={{ marginTop: 'var(--spacing-lg)' }}>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: 'var(--color-success)' }}></div>
                <span>80% 이상</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: 'var(--color-warning)' }}></div>
                <span>50-80%</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: 'var(--color-danger)' }}></div>
                <span>50% 미만</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: 'var(--color-gray-200)' }}></div>
                <span>출석 없음</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Daily Attendance Rate */}
      {classes.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
          <div className="card-header" style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
            <h3 className="card-title">선택한 날짜의 출석률</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: isMobile ? '100%' : '180px' }}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--spacing-md)',
            marginTop: 'var(--spacing-lg)'
          }}>
            {attendanceByClass
              .filter((item) => {
                const selectedDateAttendance = item.dailyAttendance.find(d => d.date === selectedDate);
                const attendanceCount = selectedDateAttendance ? selectedDateAttendance.count : 0;
                return attendanceCount > 0;
              })
              .map((item, idx) => {
                const selectedDateAttendance = item.dailyAttendance.find(d => d.date === selectedDate);
                const attendanceCount = selectedDateAttendance ? selectedDateAttendance.count : 0;
                const attendanceRate = item.enrolledStudents > 0
                  ? Math.round((attendanceCount / item.enrolledStudents) * 100)
                  : 0;

                return (
                  <div
                    key={idx}
                    className="list-item"
                    style={{
                      borderLeft: `4px solid ${getAttendanceColor(attendanceCount, item.enrolledStudents)}`,
                      marginBottom: 0
                    }}
                  >
                    <div className="list-item-content">
                      <div className="list-item-title">{item.class.name}</div>
                      <div className="list-item-subtitle">{item.class.schedule}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: getAttendanceColor(attendanceCount, item.enrolledStudents)
                      }}>
                        {attendanceRate}%
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-gray-500)' }}>
                        {attendanceCount} / {item.enrolledStudents}명
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {attendanceByClass.filter((item) => {
            const selectedDateAttendance = item.dailyAttendance.find(d => d.date === selectedDate);
            return selectedDateAttendance ? selectedDateAttendance.count > 0 : false;
          }).length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-title">출석 기록이 없습니다</div>
              <div className="empty-state-description">선택한 날짜에 출석 기록이 없습니다.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
