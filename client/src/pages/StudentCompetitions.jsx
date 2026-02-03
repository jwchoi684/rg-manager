import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { matchKoreanSearch } from '../utils/koreanSearch';

const APPARATUS_NAMES = {
  freehand: '맨손',
  ball: '볼',
  hoop: '후프',
  clubs: '곤봉',
  ribbon: '리본',
  rope: '줄'
};

function StudentCompetitions() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [competitionStudentsWithEvents, setCompetitionStudentsWithEvents] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [searchText, setSearchText] = useState('');

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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsRes, competitionsRes] = await Promise.all([
        fetchWithAuth('/api/students'),
        fetchWithAuth('/api/competitions')
      ]);
      const studentsData = await studentsRes.json();
      const competitionsData = await competitionsRes.json();

      // Sort competitions by date (newest first)
      competitionsData.sort((a, b) => new Date(b.date) - new Date(a.date));

      setStudents(studentsData);
      setCompetitions(competitionsData);

      // Load participants with events for each competition
      const compStudentsWithEvents = {};
      await Promise.all(
        competitionsData.map(async (comp) => {
          const res = await fetchWithAuth(`/api/competitions/${comp.id}/students-with-events`);
          const studentsWithEvents = await res.json();
          compStudentsWithEvents[comp.id] = studentsWithEvents;
        })
      );
      setCompetitionStudentsWithEvents(compStudentsWithEvents);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
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

  const isUpcoming = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const competitionDate = new Date(dateString);
    return competitionDate >= today;
  };

  // Format events for display
  const formatEvents = (events) => {
    if (!events || events.length === 0) return '-';
    return events.map(e => {
      let name = APPARATUS_NAMES[e.apparatus] || e.apparatus;
      if (e.routine) name += ` (${e.routine})`;
      if (e.level) name += ` ${e.level}`;
      return name;
    }).join(', ');
  };

  // Format awards for display
  const formatAwards = (events) => {
    if (!events || events.length === 0) return '-';
    const awards = events.filter(e => e.award).map(e => {
      const name = APPARATUS_NAMES[e.apparatus] || e.apparatus;
      return `${name}: ${e.award}`;
    });
    return awards.length > 0 ? awards.join(', ') : '-';
  };

  // Build all participation records (student + competition)
  const getAllParticipationRecords = () => {
    const records = [];

    competitions.forEach(comp => {
      const participantsWithEvents = competitionStudentsWithEvents[comp.id] || [];
      participantsWithEvents.forEach(participant => {
        records.push({
          id: `${comp.id}-${participant.id}`,
          student: participant,
          competition: comp,
          events: participant.events || []
        });
      });
    });

    // Sort by competition date (newest first), then by student name
    records.sort((a, b) => {
      const dateCompare = new Date(b.competition.date) - new Date(a.competition.date);
      if (dateCompare !== 0) return dateCompare;
      return a.student.name.localeCompare(b.student.name, 'ko');
    });

    return records;
  };

  const getFilteredRecords = () => {
    const allRecords = getAllParticipationRecords();

    if (!searchText.trim()) {
      return allRecords;
    }

    return allRecords.filter(record =>
      matchKoreanSearch(searchText, record.student.name)
    );
  };

  const filteredRecords = getFilteredRecords();
  const totalRecords = getAllParticipationRecords().length;

  // Group records by student for summary
  const getStudentSummary = () => {
    const summary = {};
    getAllParticipationRecords().forEach(record => {
      if (!summary[record.student.id]) {
        summary[record.student.id] = {
          student: record.student,
          count: 0
        };
      }
      summary[record.student.id].count++;
    });
    return Object.values(summary).sort((a, b) => b.count - a.count);
  };

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">
          학생별 대회 기록
          <span className="badge badge-primary" style={{ marginLeft: '8px' }}>
            {totalRecords}건
          </span>
        </h2>
      </div>

      {/* Search Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">학생 검색</h3>
          {searchText && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSearchText('')}
            >
              초기화
            </button>
          )}
        </div>

        <div className="form-group" style={{ marginTop: 'var(--spacing-lg)', marginBottom: 0 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="학생 이름으로 검색"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => setSearchText('')}
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
        </div>

        {searchText && (
          <div style={{
            marginTop: 'var(--spacing-md)',
            fontSize: '0.875rem',
            color: 'var(--color-gray-500)'
          }}>
            "{searchText}" 검색 결과: {filteredRecords.length}건
          </div>
        )}
      </div>

      {/* Records List */}
      <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="card-header">
          <h3 className="card-title">
            대회 참가 기록
            <span className="badge badge-primary" style={{ marginLeft: '8px' }}>
              {filteredRecords.length}건
            </span>
          </h3>
        </div>

        {filteredRecords.length > 0 ? (
          <>
            {/* Desktop Table */}
            {!isMobile && (
              <div className="table-container" style={{ marginTop: 'var(--spacing-lg)' }}>
                <table>
                  <thead>
                    <tr>
                      <th>학생</th>
                      <th>날짜</th>
                      <th>대회명</th>
                      <th>종목</th>
                      <th>수상 기록</th>
                      <th style={{ textAlign: 'center' }}>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(record => (
                      <tr key={record.id}>
                        <td>
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>
                              {record.student.name}
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              color: 'var(--color-gray-500)',
                              marginLeft: '8px'
                            }}>
                              ({calculateAge(record.student.birthdate)}세)
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 500 }}>{formatDate(record.competition.date)}</span>
                        </td>
                        <td>
                          <div>
                            <span style={{ fontWeight: 500 }}>
                              {record.competition.name}
                            </span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                              {record.competition.location}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.875rem' }}>
                            {formatEvents(record.events)}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.875rem',
                            color: formatAwards(record.events) !== '-' ? 'var(--color-primary)' : 'inherit',
                            fontWeight: formatAwards(record.events) !== '-' ? 500 : 400
                          }}>
                            {formatAwards(record.events)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {isUpcoming(record.competition.date) ? (
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
                {filteredRecords.map(record => (
                  <div
                    key={record.id}
                    className="list-item"
                    style={{
                      borderLeft: isUpcoming(record.competition.date)
                        ? '4px solid var(--color-primary)'
                        : '4px solid var(--color-gray-300)',
                      marginBottom: 'var(--spacing-sm)'
                    }}
                  >
                    <div className="list-item-content">
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 'var(--spacing-xs)'
                      }}>
                        <div className="list-item-title" style={{ margin: 0 }}>
                          {record.student.name}
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-gray-500)',
                            fontWeight: 400,
                            marginLeft: '4px'
                          }}>
                            ({calculateAge(record.student.birthdate)}세)
                          </span>
                        </div>
                        {isUpcoming(record.competition.date) ? (
                          <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                            예정
                          </span>
                        ) : (
                          <span className="badge badge-gray" style={{ fontSize: '0.6875rem' }}>
                            완료
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontWeight: 600,
                        color: 'var(--color-gray-800)',
                        marginBottom: '2px'
                      }}>
                        {record.competition.name}
                      </div>
                      <div className="list-item-subtitle">
                        {formatDate(record.competition.date)} · {record.competition.location}
                      </div>
                      {record.events && record.events.length > 0 && (
                        <div style={{
                          marginTop: 'var(--spacing-sm)',
                          paddingTop: 'var(--spacing-sm)',
                          borderTop: '1px solid var(--color-gray-200)'
                        }}>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-gray-500)',
                            marginBottom: '2px'
                          }}>
                            종목
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-700)' }}>
                            {formatEvents(record.events)}
                          </div>
                          {formatAwards(record.events) !== '-' && (
                            <>
                              <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-gray-500)',
                                marginTop: 'var(--spacing-xs)',
                                marginBottom: '2px'
                              }}>
                                수상 기록
                              </div>
                              <div style={{
                                fontSize: '0.875rem',
                                color: 'var(--color-primary)',
                                fontWeight: 500
                              }}>
                                {formatAwards(record.events)}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <div className="empty-state-title">
              {searchText ? '검색 결과가 없습니다' : '대회 참가 기록이 없습니다'}
            </div>
            <div className="empty-state-description">
              {searchText
                ? '다른 이름으로 검색해보세요.'
                : '학생을 대회에 등록하면 여기에 표시됩니다.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentCompetitions;
