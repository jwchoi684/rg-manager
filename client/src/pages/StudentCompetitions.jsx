import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function StudentCompetitions() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [competitionStudents, setCompetitionStudents] = useState({});
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // 학생 검색 상태
  const [studentSearchText, setStudentSearchText] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [dropdownTouchStartY, setDropdownTouchStartY] = useState(null);

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
    setStudentSearchText('');
  }, [selectedUserId]);

  // 학생 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showStudentDropdown && !e.target.closest('.student-search-container')) {
        setShowStudentDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showStudentDropdown]);

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

      const competitionsUrl = user?.role === 'admin' && selectedUserId !== 'all'
        ? `/api/competitions?filterUserId=${selectedUserId}`
        : '/api/competitions';

      const [studentsRes, competitionsRes] = await Promise.all([
        fetchWithAuth(studentsUrl),
        fetchWithAuth(competitionsUrl)
      ]);
      const studentsData = await studentsRes.json();
      const competitionsData = await competitionsRes.json();

      // Sort competitions by date (newest first)
      competitionsData.sort((a, b) => new Date(b.date) - new Date(a.date));

      setStudents(studentsData);
      setCompetitions(competitionsData);

      // Load participant IDs for each competition
      const compStudents = {};
      await Promise.all(
        competitionsData.map(async (comp) => {
          const res = await fetchWithAuth(`/api/competitions/${comp.id}/student-ids`);
          const studentIds = await res.json();
          compStudents[comp.id] = studentIds;
        })
      );
      setCompetitionStudents(compStudents);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  const getFilteredStudents = () => {
    let filtered = students;
    if (studentSearchText) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(studentSearchText.toLowerCase())
      );
    }
    return filtered;
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudent(studentId.toString());
    const student = students.find(s => s.id === studentId);
    setStudentSearchText(student ? student.name : '');
    setShowStudentDropdown(false);
  };

  const handleClearStudent = () => {
    setSelectedStudent('');
    setStudentSearchText('');
    setShowStudentDropdown(false);
  };

  const getStudentCompetitions = () => {
    if (!selectedStudent) return [];

    const studentId = parseInt(selectedStudent);
    return competitions.filter(comp =>
      competitionStudents[comp.id]?.includes(studentId)
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const competitionDate = new Date(dateString);
    return competitionDate >= today;
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === parseInt(studentId));
    return student ? student.name : '-';
  };

  const studentCompetitions = getStudentCompetitions();

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">학생별 대회 기록</h2>
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
          <h3 className="card-title">학생 선택</h3>
          {selectedStudent && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleClearStudent}
            >
              초기화
            </button>
          )}
        </div>

        <div className="form-group student-search-container" style={{ marginTop: 'var(--spacing-lg)', marginBottom: 0, position: 'relative' }}>
          <label className="form-label">학생</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="학생 이름 검색"
              value={studentSearchText}
              onChange={(e) => {
                setStudentSearchText(e.target.value);
                setSelectedStudent('');
                setShowStudentDropdown(true);
              }}
              onFocus={() => setShowStudentDropdown(true)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            {(selectedStudent || studentSearchText) && (
              <button
                type="button"
                onClick={handleClearStudent}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'var(--color-gray-300)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'white',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            )}
          </div>
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
              {getFilteredStudents().map(s => (
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
                    if (distance < 10) {
                      handleSelectStudent(s.id);
                    }
                  }}
                  style={{
                    padding: 'var(--spacing-md)',
                    cursor: 'pointer',
                    backgroundColor: selectedStudent === s.id.toString() ? 'var(--color-primary-bg)' : 'transparent',
                    borderBottom: '1px solid var(--color-gray-100)'
                  }}
                >
                  <div style={{ fontWeight: 500, pointerEvents: 'none' }}>{s.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', pointerEvents: 'none' }}>
                    {s.birthdate || '-'} ({calculateAge(s.birthdate)}세)
                  </div>
                </div>
              ))}
              {getFilteredStudents().length === 0 && (
                <div style={{ padding: 'var(--spacing-md)', color: 'var(--color-gray-500)', textAlign: 'center' }}>
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Student Info */}
        {selectedStudent && (
          <div className="info-box" style={{ marginTop: 'var(--spacing-lg)' }}>
            <div className="info-box-title">
              {getStudentName(selectedStudent)}
            </div>
          </div>
        )}
      </div>

      {/* Stats Card */}
      {selectedStudent && (
        <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-md)' }}>
            <h3 className="card-title">대회 참가</h3>
            <span style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--color-primary)'
            }}>
              {studentCompetitions.length}
            </span>
            <span style={{ color: 'var(--color-gray-500)' }}>회</span>
          </div>
        </div>
      )}

      {/* Competition List */}
      {selectedStudent && (
        <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
          <div className="card-header">
            <h3 className="card-title">
              대회 기록
              <span className="badge badge-primary" style={{ marginLeft: '8px' }}>
                {studentCompetitions.length}건
              </span>
            </h3>
          </div>

          {studentCompetitions.length > 0 ? (
            <>
              {/* Desktop Table */}
              {!isMobile && (
                <div className="table-container" style={{ marginTop: 'var(--spacing-lg)' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>날짜</th>
                        <th>대회명</th>
                        <th>장소</th>
                        <th style={{ textAlign: 'center' }}>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentCompetitions.map(comp => (
                        <tr key={comp.id}>
                          <td>
                            <span style={{ fontWeight: 600 }}>{formatDate(comp.date)}</span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                              {comp.name}
                            </span>
                          </td>
                          <td>{comp.location}</td>
                          <td style={{ textAlign: 'center' }}>
                            {isUpcoming(comp.date) ? (
                              <span className="badge badge-success">예정</span>
                            ) : (
                              <span className="badge badge-gray">완료</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile Cards */}
              {isMobile && (
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'var(--spacing-lg)' }}>
                  {studentCompetitions.map(comp => (
                    <div
                      key={comp.id}
                      className="list-item"
                      style={{
                        borderLeft: isUpcoming(comp.date)
                          ? '4px solid var(--color-primary)'
                          : '4px solid var(--color-gray-300)',
                        marginBottom: 'var(--spacing-sm)'
                      }}
                    >
                      <div className="list-item-content">
                        <div className="list-item-title">
                          {comp.name}
                          {isUpcoming(comp.date) && (
                            <span className="badge badge-success" style={{ marginLeft: '6px', fontSize: '0.6875rem' }}>
                              예정
                            </span>
                          )}
                        </div>
                        <div className="list-item-subtitle">
                          {formatDate(comp.date)}
                        </div>
                        <div className="list-item-subtitle">
                          {comp.location}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏆</div>
              <div className="empty-state-title">대회 기록이 없습니다</div>
              <div className="empty-state-description">이 학생은 아직 대회에 참가한 기록이 없습니다.</div>
            </div>
          )}
        </div>
      )}

      {/* No Student Selected */}
      {!selectedStudent && (
        <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
          <div className="empty-state">
            <div className="empty-state-icon">👆</div>
            <div className="empty-state-title">학생을 선택해주세요</div>
            <div className="empty-state-description">위에서 학생을 선택하면 대회 참가 기록을 확인할 수 있습니다.</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentCompetitions;
