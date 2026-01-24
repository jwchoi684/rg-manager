import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

function AttendanceCheck() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [checkedStudents, setCheckedStudents] = useState(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const calculateAge = (birthdate) => {
    if (!birthdate) return "-";
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
    setSelectedClass("");
  }, [selectedUserId]);

  useEffect(() => {
    loadAttendance();
  }, [selectedDate, selectedClass]);

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
        : "/api/students";
      const classesUrl = user?.role === 'admin' && selectedUserId !== 'all'
        ? `/api/classes?filterUserId=${selectedUserId}`
        : "/api/classes";

      const [studentsRes, classesRes] = await Promise.all([
        fetchWithAuth(studentsUrl),
        fetchWithAuth(classesUrl),
      ]);
      const studentsData = await studentsRes.json();
      const classesData = await classesRes.json();
      setStudents(studentsData);
      setClasses(classesData);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    }
  };

  const loadAttendance = async () => {
    try {
      const url = user?.role === 'admin' && selectedUserId !== 'all'
        ? `/api/attendance/date/${selectedDate}?filterUserId=${selectedUserId}`
        : `/api/attendance/date/${selectedDate}`;
      const response = await fetchWithAuth(url);
      const allAttendance = await response.json();
      const filtered = allAttendance.filter(
        (a) => !selectedClass || a.classId === parseInt(selectedClass)
      );
      setCheckedStudents(new Set(filtered.map((a) => a.studentId)));
      setHasChanges(false);
    } catch (error) {
      console.error("출석 기록 로드 실패:", error);
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
      alert("수업을 선택해주세요!");
      return;
    }

    try {
      await fetchWithAuth("/api/attendance/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          classId: parseInt(selectedClass),
        }),
      });

      const attendancePromises = Array.from(checkedStudents).map((studentId) =>
        fetchWithAuth("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            classId: parseInt(selectedClass),
            date: selectedDate,
          }),
        })
      );

      await Promise.all(attendancePromises);

      setHasChanges(false);
      alert(`출석 체크가 완료되었습니다! (${checkedStudents.size}명)`);
    } catch (error) {
      console.error("출석 체크 제출 실패:", error);
      alert("출석 체크 제출에 실패했습니다.");
    }
  };

  const getFilteredStudents = () => {
    if (!selectedClass) {
      return students;
    }
    return students.filter(
      (student) =>
        student.classIds && student.classIds.includes(parseInt(selectedClass))
    );
  };

  const filteredStudents = getFilteredStudents();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${month}월 ${day}일 (${weekday})`;
  };

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">출석 체크</h2>
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

      {/* Date & Class Selection */}
      <div className="card">
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 'var(--spacing-lg)'
        }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">날짜</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">수업 선택</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">수업을 선택하세요</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.schedule}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedClass && (
          <div className="info-box" style={{ marginTop: 'var(--spacing-lg)' }}>
            <div className="info-box-title">
              {(() => {
                const selectedClassData = classes.find(
                  (c) => c.id === parseInt(selectedClass)
                );
                return `${selectedClassData?.name} (${selectedClassData?.schedule}) - ${formatDate(selectedDate)}`;
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Attendance Content */}
      {!selectedClass ? (
        <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
          <div className="empty-state">
            <div className="empty-state-icon">✓</div>
            <div className="empty-state-title">수업을 선택하세요</div>
            <div className="empty-state-description">위에서 수업을 선택하여 출석 체크를 시작하세요.</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
          <div className="card-header">
            <h3 className="card-title">
              학생 목록
              <span className="badge badge-primary" style={{ marginLeft: '8px' }}>
                {filteredStudents.length}명
              </span>
            </h3>
            {hasChanges && (
              <span className="badge badge-warning">변경사항 있음</span>
            )}
          </div>

          {filteredStudents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">등록된 학생이 없습니다</div>
              <div className="empty-state-description">이 수업에 학생을 등록해주세요.</div>
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 'var(--spacing-md)',
                marginTop: 'var(--spacing-lg)'
              }}>
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => toggleAttendance(student.id)}
                    className={`attendance-card ${checkedStudents.has(student.id) ? 'checked' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                      <input
                        type="checkbox"
                        checked={checkedStudents.has(student.id)}
                        onChange={() => {}}
                        style={{ pointerEvents: 'none' }}
                      />
                      <div>
                        <div style={{
                          fontWeight: 600,
                          color: checkedStudents.has(student.id) ? 'var(--color-success)' : 'var(--color-gray-900)'
                        }}>
                          {student.name}
                        </div>
                        <div style={{
                          fontSize: '0.8125rem',
                          color: checkedStudents.has(student.id) ? 'var(--color-success)' : 'var(--color-gray-500)'
                        }}>
                          {student.birthdate || "-"} ({calculateAge(student.birthdate)}세)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Bar */}
              <div style={{
                marginTop: 'var(--spacing-xl)',
                padding: 'var(--spacing-lg)',
                backgroundColor: 'var(--color-gray-50)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--spacing-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                    출석: <span style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }}>{checkedStudents.size}</span>
                    <span style={{ color: 'var(--color-gray-500)' }}> / {filteredStudents.length}명</span>
                  </span>
                  {checkedStudents.size > 0 && (
                    <span className="badge badge-success">
                      {Math.round((checkedStudents.size / filteredStudents.length) * 100)}%
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-success btn-lg"
                  onClick={handleSubmit}
                  style={{ minWidth: isMobile ? '100%' : '160px' }}
                >
                  출석 체크 저장
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AttendanceCheck;
