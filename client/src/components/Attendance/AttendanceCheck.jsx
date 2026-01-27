import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { matchKoreanSearch } from "../../utils/koreanSearch";

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

  // 보강 수업 추가 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormStudent, setAddFormStudent] = useState('');
  const [addFormClass, setAddFormClass] = useState('');
  const [addFormDate, setAddFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentSearchText, setStudentSearchText] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [dropdownTouchStartY, setDropdownTouchStartY] = useState(null);

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

  const handleAddAttendance = async () => {
    if (!addFormStudent || !addFormClass || !addFormDate) {
      alert('학생, 수업, 날짜를 모두 선택해주세요.');
      return;
    }

    try {
      // 중복 체크
      const checkUrl = user?.role === 'admin' && selectedUserId !== 'all'
        ? `/api/attendance/date/${addFormDate}?filterUserId=${selectedUserId}`
        : `/api/attendance/date/${addFormDate}`;
      const checkResponse = await fetchWithAuth(checkUrl);
      const existingRecords = await checkResponse.json();

      const duplicate = existingRecords.find(
        r => r.studentId === parseInt(addFormStudent) &&
             r.classId === parseInt(addFormClass)
      );

      if (duplicate) {
        alert('이미 해당 날짜에 동일한 출석 기록이 있습니다.');
        return;
      }

      const response = await fetchWithAuth('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: parseInt(addFormStudent),
          classId: parseInt(addFormClass),
          date: addFormDate
        })
      });

      if (response.ok) {
        await loadAttendance();
        setShowAddModal(false);
        setAddFormStudent('');
        setAddFormClass('');
        setAddFormDate(new Date().toISOString().split('T')[0]);
        alert('보강 출석이 추가되었습니다.');
      }
    } catch (error) {
      console.error('출석 추가 실패:', error);
      alert('출석 추가에 실패했습니다.');
    }
  };

  const openAddModal = () => {
    setAddFormStudent('');
    setAddFormClass('');
    setAddFormDate(selectedDate);
    setStudentSearchText('');
    setShowStudentDropdown(false);
    setShowAddModal(true);
  };

  const getFilteredStudentsForModal = () => {
    if (!studentSearchText) return students;
    return students.filter(s =>
      matchKoreanSearch(studentSearchText, s.name)
    );
  };

  const getSelectedStudentName = () => {
    if (!addFormStudent) return '';
    const student = students.find(s => s.id === parseInt(addFormStudent));
    return student ? student.name : '';
  };

  const handleSelectStudent = (studentId) => {
    setAddFormStudent(studentId.toString());
    const student = students.find(s => s.id === studentId);
    setStudentSearchText(student ? student.name : '');
    setShowStudentDropdown(false);
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
    <div className="animate-fadeIn" data-tutorial-action="attendance-check">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">출석 체크</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          + 보강 출석 추가
        </button>
      </div>

      {/* Add Attendance Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--spacing-lg)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '400px',
              maxHeight: '90vh',
              overflow: 'visible'
            }}
          >
            <div className="card-header">
              <h3 className="card-title">보강 출석 추가</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--color-gray-500)',
                  padding: '0',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginTop: 'var(--spacing-lg)', overflow: 'visible' }} onClick={() => setShowStudentDropdown(false)}>
              <div className="form-group">
                <label className="form-label">날짜 *</label>
                <input
                  type="date"
                  value={addFormDate}
                  onChange={(e) => setAddFormDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">수업 *</label>
                <select
                  value={addFormClass}
                  onChange={(e) => setAddFormClass(e.target.value)}
                >
                  <option value="">수업을 선택하세요</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                <label className="form-label">학생 *</label>
                <input
                  type="text"
                  placeholder="학생 이름을 검색하세요"
                  value={studentSearchText}
                  onChange={(e) => {
                    setStudentSearchText(e.target.value);
                    setAddFormStudent('');
                    setShowStudentDropdown(true);
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {showStudentDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      backgroundColor: 'white',
                      border: '1px solid var(--color-gray-200)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                      zIndex: 9999,
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {getFilteredStudentsForModal().length > 0 ? (
                      getFilteredStudentsForModal().map(s => (
                        <div
                          key={s.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectStudent(s.id);
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            setDropdownTouchStartY(e.touches[0].clientY);
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const touchEndY = e.changedTouches[0].clientY;
                            const distance = Math.abs(touchEndY - dropdownTouchStartY);
                            // 10px 이상 이동했으면 스크롤로 판단하여 선택하지 않음
                            if (distance < 10) {
                              handleSelectStudent(s.id);
                            }
                          }}
                          style={{
                            padding: 'var(--spacing-md)',
                            cursor: 'pointer',
                            backgroundColor: addFormStudent === s.id.toString() ? 'var(--color-primary-bg)' : 'transparent',
                            borderBottom: '1px solid var(--color-gray-100)'
                          }}
                        >
                          <div style={{ fontWeight: 500, pointerEvents: 'none' }}>{s.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', pointerEvents: 'none' }}>
                            {s.birthdate || '-'} ({calculateAge(s.birthdate)}세)
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: 'var(--spacing-md)', color: 'var(--color-gray-500)', textAlign: 'center' }}>
                        검색 결과가 없습니다
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-xl)'
              }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowAddModal(false)}
                >
                  취소
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleAddAttendance}
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
