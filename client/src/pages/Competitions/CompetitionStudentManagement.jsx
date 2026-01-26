import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const APPARATUS_LIST = [
  { id: 'freehand', name: '맨손', hasLevel: true },
  { id: 'ball', name: '볼', hasLevel: false },
  { id: 'hoop', name: '후프', hasLevel: false },
  { id: 'clubs', name: '곤봉', hasLevel: false },
  { id: 'ribbon', name: '리본', hasLevel: false },
  { id: 'rope', name: '줄', hasLevel: false }
];

const LEVELS = ['레벨 1', '레벨 2', '레벨 3'];

function CompetitionStudentManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const competition = location.state?.competition;

  const [students, setStudents] = useState([]);
  const [participantsWithEvents, setParticipantsWithEvents] = useState([]);
  const [participantIds, setParticipantIds] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [enrolledSearch, setEnrolledSearch] = useState('');
  const [availableSearch, setAvailableSearch] = useState('');

  // 종목 선택 모달 상태
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventModalStudent, setEventModalStudent] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState({});
  const [isEditingEvents, setIsEditingEvents] = useState(false);

  // 스와이프 상태
  const [swipedId, setSwipedId] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState({});

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
      const [studentsRes, participantIdsRes, participantsWithEventsRes] = await Promise.all([
        fetchWithAuth('/api/students'),
        fetchWithAuth(`/api/competitions/${competition.id}/student-ids`),
        fetchWithAuth(`/api/competitions/${competition.id}/students-with-events`)
      ]);
      const studentsData = await studentsRes.json();
      const participantIdsData = await participantIdsRes.json();
      const participantsWithEventsData = await participantsWithEventsRes.json();
      setStudents(studentsData);
      setParticipantIds(participantIdsData);
      setParticipantsWithEvents(participantsWithEventsData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  const getParticipants = () => {
    let filtered = participantsWithEvents;
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
    return participantIds.length;
  };

  const getNonParticipantCount = () => {
    return students.filter(student => !participantIds.includes(student.id)).length;
  };

  // 종목 선택 모달 열기
  const openEventModal = (student, isEditing = false) => {
    setEventModalStudent(student);
    setIsEditingEvents(isEditing);

    if (isEditing && student.events && student.events.length > 0) {
      // 기존 종목 정보 로드
      const eventsMap = {};
      student.events.forEach(event => {
        eventsMap[event.apparatus] = {
          selected: true,
          routine: event.routine || '규정',
          level: event.level || '',
          award: event.award || ''
        };
      });
      setSelectedEvents(eventsMap);
    } else {
      setSelectedEvents({});
    }

    setShowEventModal(true);
  };

  // 종목 토글
  const toggleApparatus = (apparatusId) => {
    setSelectedEvents(prev => {
      if (prev[apparatusId]?.selected) {
        const { [apparatusId]: _, ...rest } = prev;
        return rest;
      } else {
        return {
          ...prev,
          [apparatusId]: { selected: true, routine: '규정', level: '', award: '' }
        };
      }
    });
  };

  // 루틴 타입 변경
  const setRoutineType = (apparatusId, routineType) => {
    setSelectedEvents(prev => ({
      ...prev,
      [apparatusId]: { ...prev[apparatusId], routine: routineType }
    }));
  };

  // 레벨 변경
  const setLevel = (apparatusId, level) => {
    setSelectedEvents(prev => ({
      ...prev,
      [apparatusId]: { ...prev[apparatusId], level }
    }));
  };

  // 수상 기록 변경
  const setAward = (apparatusId, award) => {
    setSelectedEvents(prev => ({
      ...prev,
      [apparatusId]: { ...prev[apparatusId], award }
    }));
  };

  // 선택된 종목 수 계산
  const getSelectedEventCount = () => {
    return Object.values(selectedEvents).filter(e => e.selected).length;
  };

  // 자유 종목 수 계산
  const getFreestyleCount = () => {
    return Object.values(selectedEvents).filter(e => e.selected && e.routine === '자유').length;
  };

  // 종목 정보를 배열로 변환
  const getEventsArray = () => {
    return Object.entries(selectedEvents)
      .filter(([_, value]) => value.selected)
      .map(([apparatus, value]) => ({
        apparatus,
        routine: value.routine,
        level: value.level || null,
        award: value.award || null
      }));
  };

  // 학생 등록 (종목 포함)
  const addStudentWithEvents = async () => {
    if (getSelectedEventCount() === 0) {
      alert('최소 1개 이상의 종목을 선택해주세요.');
      return;
    }

    try {
      const events = getEventsArray();
      const response = await fetchWithAuth(`/api/competitions/${competition.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: eventModalStudent.id, events })
      });
      if (response.ok) {
        setShowEventModal(false);
        setSelectedEvents({});
        setEventModalStudent(null);
        loadData();
      }
    } catch (error) {
      console.error('학생 등록 실패:', error);
      alert('학생 등록에 실패했습니다.');
    }
  };

  // 종목 정보 수정
  const updateEvents = async () => {
    if (getSelectedEventCount() === 0) {
      alert('최소 1개 이상의 종목을 선택해주세요.');
      return;
    }

    try {
      const events = getEventsArray();
      const response = await fetchWithAuth(
        `/api/competitions/${competition.id}/students/${eventModalStudent.id}/events`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events })
        }
      );
      if (response.ok) {
        setShowEventModal(false);
        setSelectedEvents({});
        setEventModalStudent(null);
        loadData();
      }
    } catch (error) {
      console.error('종목 수정 실패:', error);
      alert('종목 수정에 실패했습니다.');
    }
  };

  const removeStudentFromCompetition = async (studentId) => {
    if (confirm('이 학생을 대회에서 제외하시겠습니까?')) {
      try {
        const response = await fetchWithAuth(`/api/competitions/${competition.id}/students/${studentId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setSwipedId(null);
          setSwipeOffset({});
          loadData();
        }
      } catch (error) {
        console.error('학생 제외 실패:', error);
        alert('학생 제외에 실패했습니다.');
      }
    }
  };

  // 스와이프 핸들러
  const minSwipeDistance = 50;
  const swipeRevealWidth = 72;

  const handleTouchStart = (e, id) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    if (swipedId && swipedId !== id) {
      setSwipedId(null);
      setSwipeOffset({});
    }
  };

  const handleTouchMove = (e, id) => {
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    const diff = touchStart - currentTouch;
    if (diff > 0) {
      setSwipeOffset({ [id]: Math.min(diff, swipeRevealWidth) });
    } else if (swipedId === id) {
      setSwipeOffset({ [id]: Math.max(swipeRevealWidth + diff, 0) });
    }
  };

  const handleTouchEnd = (id) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setSwipedId(id);
      setSwipeOffset({ [id]: swipeRevealWidth });
    } else if (isRightSwipe || distance < minSwipeDistance) {
      setSwipedId(null);
      setSwipeOffset({});
    }
  };

  const handleCardClick = (student) => {
    if (swipedId === student.id) {
      setSwipedId(null);
      setSwipeOffset({});
    } else if (!swipedId) {
      openEventModal(student, true);
    }
  };

  // 참가비 납부 상태 토글
  const togglePaid = async (studentId, currentPaid, e) => {
    e.stopPropagation();
    try {
      const response = await fetchWithAuth(
        `/api/competitions/${competition.id}/students/${studentId}/paid`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paid: !currentPaid })
        }
      );
      if (response.ok) {
        // 로컬 상태 업데이트
        setParticipantsWithEvents(prev =>
          prev.map(p =>
            p.id === studentId ? { ...p, paid: !currentPaid } : p
          )
        );
      }
    } catch (error) {
      console.error('납부 상태 변경 실패:', error);
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
              marginTop: 'var(--spacing-lg)'
            }}>
              {participants.map(student => (
                <div key={student.id} className="swipeable-container">
                  <div className="swipeable-actions">
                    <button
                      className="swipeable-action-btn delete"
                      onClick={() => removeStudentFromCompetition(student.id)}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  <div
                    className="swipeable-card"
                    style={{
                      transform: `translateX(-${swipeOffset[student.id] || 0}px)`,
                      borderLeft: '4px solid var(--color-success)'
                    }}
                    onTouchStart={(e) => handleTouchStart(e, student.id)}
                    onTouchMove={(e) => handleTouchMove(e, student.id)}
                    onTouchEnd={() => handleTouchEnd(student.id)}
                    onClick={() => handleCardClick(student)}
                  >
                    <div style={{ padding: 'var(--spacing-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>{student.name}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
                            {student.birthdate} ({calculateAge(student.birthdate)}세)
                          </div>
                        </div>
                        <div
                          onClick={(e) => togglePaid(student.id, student.paid, e)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: student.paid ? 'var(--color-success-bg)' : 'var(--color-gray-100)',
                            cursor: 'pointer',
                            border: student.paid ? '1px solid var(--color-success)' : '1px solid var(--color-gray-300)'
                          }}
                        >
                          <span style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            border: student.paid ? '2px solid var(--color-success)' : '2px solid var(--color-gray-400)',
                            backgroundColor: student.paid ? 'var(--color-success)' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}>
                            {student.paid && '✓'}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: student.paid ? 'var(--color-success)' : 'var(--color-gray-500)'
                          }}>
                            납부
                          </span>
                        </div>
                      </div>
                      {student.events && student.events.length > 0 && (
                        <div style={{
                          marginTop: 'var(--spacing-sm)',
                          paddingTop: 'var(--spacing-sm)',
                          borderTop: '1px solid var(--color-gray-200)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          {student.events.map((event, idx) => {
                            const apparatus = APPARATUS_LIST.find(a => a.id === event.apparatus);
                            return (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                flexWrap: 'wrap'
                              }}>
                                <span
                                  className={`badge ${event.routine === '자유' ? 'badge-primary' : 'badge-gray'}`}
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  {apparatus?.name || event.apparatus}
                                  {event.level && ` ${event.level}`}
                                  {' '}({event.routine})
                                </span>
                                {event.award && (
                                  <span style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--color-warning)',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px'
                                  }}>
                                    🏅 {event.award}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
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
                    borderLeft: '4px solid var(--color-gray-300)',
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
                    className="btn btn-primary btn-sm"
                    onClick={() => openEventModal(student, false)}
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

      {/* Event Selection Modal */}
      {showEventModal && eventModalStudent && (
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
            zIndex: 10000,
            padding: 'var(--spacing-md)'
          }}
          onClick={() => setShowEventModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              margin: 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <h3 className="card-title">
                {isEditingEvents ? '종목 및 수상 기록' : '참가 종목 선택'}
              </h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowEventModal(false)}
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginTop: 'var(--spacing-md)' }}>
              <div className="info-box" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ fontWeight: 600 }}>{eventModalStudent.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)' }}>
                  {eventModalStudent.birthdate} ({calculateAge(eventModalStudent.birthdate)}세)
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">참가 종목 * (복수 선택 가능)</label>
                <div style={{
                  border: '1px solid var(--color-gray-200)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden'
                }}>
                  {APPARATUS_LIST.map((apparatus, index) => {
                    const isSelected = selectedEvents[apparatus.id]?.selected;
                    const routine = selectedEvents[apparatus.id]?.routine || '규정';
                    const level = selectedEvents[apparatus.id]?.level || '';
                    const eventAward = selectedEvents[apparatus.id]?.award || '';

                    return (
                      <div
                        key={apparatus.id}
                        style={{
                          padding: 'var(--spacing-md)',
                          borderBottom: index < APPARATUS_LIST.length - 1 ? '1px solid var(--color-gray-100)' : 'none',
                          backgroundColor: isSelected ? 'var(--color-primary-bg)' : 'transparent'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-md)'
                        }}>
                          <input
                            type="checkbox"
                            checked={isSelected || false}
                            onChange={() => toggleApparatus(apparatus.id)}
                            style={{
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              accentColor: 'var(--color-primary)'
                            }}
                          />
                          <span style={{
                            fontWeight: 500,
                            minWidth: '50px'
                          }}>
                            {apparatus.name}
                          </span>

                          {isSelected && (
                            <div style={{
                              display: 'flex',
                              gap: 'var(--spacing-xs)',
                              marginLeft: 'auto',
                              flexWrap: 'wrap',
                              justifyContent: 'flex-end'
                            }}>
                              <button
                                type="button"
                                onClick={() => setRoutineType(apparatus.id, '규정')}
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: 'var(--radius-full)',
                                  border: routine === '규정' ? '2px solid var(--color-primary)' : '1px solid var(--color-gray-300)',
                                  backgroundColor: routine === '규정' ? 'var(--color-primary)' : 'white',
                                  color: routine === '규정' ? 'white' : 'var(--color-gray-700)',
                                  fontWeight: 500,
                                  fontSize: '0.8125rem',
                                  cursor: 'pointer'
                                }}
                              >
                                규정
                              </button>
                              <button
                                type="button"
                                onClick={() => setRoutineType(apparatus.id, '자유')}
                                style={{
                                  padding: '4px 12px',
                                  borderRadius: 'var(--radius-full)',
                                  border: routine === '자유' ? '2px solid var(--color-primary)' : '1px solid var(--color-gray-300)',
                                  backgroundColor: routine === '자유' ? 'var(--color-primary)' : 'white',
                                  color: routine === '자유' ? 'white' : 'var(--color-gray-700)',
                                  fontWeight: 500,
                                  fontSize: '0.8125rem',
                                  cursor: 'pointer'
                                }}
                              >
                                자유
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Level selection for freehand */}
                        {isSelected && apparatus.hasLevel && (
                          <div style={{
                            marginTop: 'var(--spacing-sm)',
                            marginLeft: '36px',
                            display: 'flex',
                            gap: 'var(--spacing-xs)',
                            flexWrap: 'wrap'
                          }}>
                            {LEVELS.map(lvl => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => setLevel(apparatus.id, level === lvl ? '' : lvl)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 'var(--radius-md)',
                                  border: level === lvl ? '2px solid var(--color-success)' : '1px solid var(--color-gray-300)',
                                  backgroundColor: level === lvl ? 'var(--color-success)' : 'white',
                                  color: level === lvl ? 'white' : 'var(--color-gray-700)',
                                  fontWeight: 500,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Award input for each apparatus */}
                        {isSelected && (
                          <div
                            style={{
                              marginTop: 'var(--spacing-sm)',
                              marginLeft: '36px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              placeholder="수상 기록 (예: 금상, 1등)"
                              value={eventAward}
                              onChange={(e) => setAward(apparatus.id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '16px',
                                border: '1px solid var(--color-gray-200)',
                                borderRadius: 'var(--radius-md)'
                              }}
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck="false"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div style={{
                marginTop: 'var(--spacing-md)',
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-gray-50)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                color: 'var(--color-gray-600)'
              }}>
                선택된 종목: {getSelectedEventCount()}개
                {getFreestyleCount() > 0 && (
                  <span style={{ marginLeft: '8px' }}>
                    (자유 {getFreestyleCount()}개)
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: 'var(--spacing-md)',
                marginTop: 'var(--spacing-lg)'
              }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={isEditingEvents ? updateEvents : addStudentWithEvents}
                  disabled={getSelectedEventCount() === 0}
                >
                  {isEditingEvents ? '저장' : '등록하기'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowEventModal(false)}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompetitionStudentManagement;
