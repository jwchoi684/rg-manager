import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

function CompetitionStudentManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const competition = location.state?.competition;

  const [students, setStudents] = useState([]);
  const [participantIds, setParticipantIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [enrolledSearch, setEnrolledSearch] = useState('');
  const [availableSearch, setAvailableSearch] = useState('');

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

    if (!competition) {
      navigate('/competitions');
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsRes, participantIdsRes] = await Promise.all([
        fetchWithAuth('/api/students'),
        fetchWithAuth(`/api/competitions/${competition.id}/student-ids`)
      ]);
      const studentsData = await studentsRes.json();
      const participantIdsData = await participantIdsRes.json();
      setStudents(studentsData);
      setParticipantIds(participantIdsData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  const getParticipants = () => {
    let filtered = students.filter(student => participantIds.includes(student.id));
    if (enrolledSearch) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(enrolledSearch.toLowerCase())
      );
    }
    return filtered;
  };

  const getNonParticipants = () => {
    let filtered = students.filter(student => !participantIds.includes(student.id));
    if (availableSearch) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(availableSearch.toLowerCase())
      );
    }
    return filtered;
  };

  const getParticipantCount = () => {
    return students.filter(student => participantIds.includes(student.id)).length;
  };

  const getNonParticipantCount = () => {
    return students.filter(student => !participantIds.includes(student.id)).length;
  };

  const toggleSelectStudent = (studentId) => {
    if (selectedIds.includes(studentId)) {
      setSelectedIds(selectedIds.filter(id => id !== studentId));
    } else {
      setSelectedIds([...selectedIds, studentId]);
    }
  };

  const selectAllAvailable = () => {
    const availableIds = getNonParticipants().map(s => s.id);
    setSelectedIds(availableIds);
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const addStudentToCompetition = async (studentId) => {
    try {
      const response = await fetchWithAuth(`/api/competitions/${competition.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      if (response.ok) {
        setParticipantIds([...participantIds, studentId]);
        setSelectedIds(selectedIds.filter(id => id !== studentId));
      }
    } catch (error) {
      console.error('학생 등록 실패:', error);
      alert('학생 등록에 실패했습니다.');
    }
  };

  const addSelectedStudents = async () => {
    if (selectedIds.length === 0) {
      alert('등록할 학생을 선택해주세요.');
      return;
    }

    try {
      const promises = selectedIds.map(studentId =>
        fetchWithAuth(`/api/competitions/${competition.id}/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId })
        })
      );
      await Promise.all(promises);
      setParticipantIds([...participantIds, ...selectedIds]);
      setSelectedIds([]);
    } catch (error) {
      console.error('학생 일괄 등록 실패:', error);
      alert('학생 등록에 실패했습니다.');
    }
  };

  const removeStudentFromCompetition = async (studentId) => {
    if (confirm('이 학생을 대회에서 제외하시겠습니까?')) {
      try {
        const response = await fetchWithAuth(`/api/competitions/${competition.id}/students/${studentId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setParticipantIds(participantIds.filter(id => id !== studentId));
        }
      } catch (error) {
        console.error('학생 제외 실패:', error);
        alert('학생 제외에 실패했습니다.');
      }
    }
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

  if (!competition) {
    return null;
  }

  const participants = getParticipants();
  const nonParticipants = getNonParticipants();
  const selectedCount = selectedIds.filter(id => nonParticipants.some(s => s.id === id)).length;

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">{competition.name} - 참가 학생</h2>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/competitions')}
        >
          목록으로
        </button>
      </div>

      {/* Competition Info Card */}
      <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div className="info-box" style={{ margin: 0 }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-lg)',
            fontSize: '0.9375rem'
          }}>
            <div>
              <span style={{ color: 'var(--color-gray-500)' }}>날짜</span>
              <span style={{ marginLeft: 'var(--spacing-sm)', fontWeight: 600 }}>
                {formatDate(competition.date)}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--color-gray-500)' }}>장소</span>
              <span style={{ marginLeft: 'var(--spacing-sm)', fontWeight: 600 }}>
                {competition.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Student Lists Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 'var(--spacing-lg)'
      }}>
        {/* Enrolled Students */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              참가 학생
              <span className="badge badge-success" style={{ marginLeft: '8px' }}>
                {getParticipantCount()}명
              </span>
            </h3>
          </div>

          {/* Search Input */}
          <div style={{ marginTop: 'var(--spacing-md)', position: 'relative' }}>
            <input
              type="text"
              placeholder="이름으로 검색"
              value={enrolledSearch}
              onChange={(e) => setEnrolledSearch(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              style={{ paddingRight: enrolledSearch ? '36px' : undefined }}
            />
            {enrolledSearch && (
              <button
                type="button"
                onClick={() => setEnrolledSearch('')}
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
                x
              </button>
            )}
          </div>

          {participants.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-sm)',
              marginTop: 'var(--spacing-lg)'
            }}>
              {participants.map(student => (
                <div
                  key={student.id}
                  className="list-item"
                  style={{
                    borderLeft: '4px solid var(--color-success)',
                    marginBottom: 0
                  }}
                >
                  <div className="list-item-content">
                    <div className="list-item-title">{student.name}</div>
                    <div className="list-item-subtitle">
                      {student.birthdate} ({calculateAge(student.birthdate)}세)
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removeStudentFromCompetition(student.id)}
                  >
                    제외
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--spacing-2xl) var(--spacing-lg)' }}>
              {enrolledSearch ? (
                <>
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">검색 결과가 없습니다</div>
                  <div className="empty-state-description">다른 이름으로 검색해보세요.</div>
                </>
              ) : (
                <>
                  <div className="empty-state-icon">🏆</div>
                  <div className="empty-state-title">참가 학생이 없습니다</div>
                  <div className="empty-state-description">{isMobile ? '아래에서' : '오른쪽에서'} 학생을 등록해주세요.</div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Available Students */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              등록 가능한 학생
              <span className="badge badge-primary" style={{ marginLeft: '8px' }}>
                {getNonParticipantCount()}명
              </span>
            </h3>
          </div>

          {/* Search Input */}
          <div style={{ marginTop: 'var(--spacing-md)', position: 'relative' }}>
            <input
              type="text"
              placeholder="이름으로 검색"
              value={availableSearch}
              onChange={(e) => setAvailableSearch(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              style={{ paddingRight: availableSearch ? '36px' : undefined }}
            />
            {availableSearch && (
              <button
                type="button"
                onClick={() => setAvailableSearch('')}
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
                x
              </button>
            )}
          </div>

          {/* Bulk Actions */}
          {nonParticipants.length > 0 && (
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-sm)',
              marginTop: 'var(--spacing-md)',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={selectedCount === nonParticipants.length ? deselectAll : selectAllAvailable}
              >
                {selectedCount === nonParticipants.length ? '선택 해제' : '전체 선택'}
              </button>
              {selectedCount > 0 && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={addSelectedStudents}
                >
                  선택한 {selectedCount}명 등록
                </button>
              )}
            </div>
          )}

          {nonParticipants.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-sm)',
              marginTop: 'var(--spacing-lg)'
            }}>
              {nonParticipants.map(student => (
                <div
                  key={student.id}
                  className="list-item"
                  style={{
                    borderLeft: selectedIds.includes(student.id)
                      ? '4px solid var(--color-primary)'
                      : '4px solid var(--color-gray-300)',
                    marginBottom: 0,
                    backgroundColor: selectedIds.includes(student.id)
                      ? 'var(--color-primary-light, rgba(59, 130, 246, 0.05))'
                      : undefined,
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleSelectStudent(student.id)}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                    flex: 1
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={() => toggleSelectStudent(student.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: 'var(--color-primary)'
                      }}
                    />
                    <div className="list-item-content">
                      <div className="list-item-title">{student.name}</div>
                      <div className="list-item-subtitle">
                        {student.birthdate} ({calculateAge(student.birthdate)}세)
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addStudentToCompetition(student.id);
                    }}
                  >
                    등록
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--spacing-2xl) var(--spacing-lg)' }}>
              {availableSearch ? (
                <>
                  <div className="empty-state-icon">🔍</div>
                  <div className="empty-state-title">검색 결과가 없습니다</div>
                  <div className="empty-state-description">다른 이름으로 검색해보세요.</div>
                </>
              ) : (
                <>
                  <div className="empty-state-icon">✓</div>
                  <div className="empty-state-title">모든 학생이 등록되어 있습니다</div>
                  <div className="empty-state-description">등록 가능한 학생이 없습니다.</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompetitionStudentManagement;
