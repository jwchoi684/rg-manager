import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function CompetitionList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    try {
      const response = await fetchWithAuth('/api/competitions');
      const data = await response.json();
      setCompetitions(data);
    } catch (error) {
      console.error('Failed to load competitions:', error);
    }
  };

  const deleteCompetition = async (id) => {
    if (confirm('이 대회를 삭제하시겠습니까?')) {
      try {
        const response = await fetchWithAuth(`/api/competitions/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          loadCompetitions();
        }
      } catch (error) {
        console.error('Failed to delete competition:', error);
        alert('대회 삭제에 실패했습니다.');
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

  const isUpcoming = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const competitionDate = new Date(dateString);
    return competitionDate >= today;
  };

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">
          대회 관리
          <span className="badge badge-primary" style={{ marginLeft: '8px' }}>
            {competitions.length}개
          </span>
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/competitions/new')}
        >
          + 대회 등록
        </button>
      </div>

      {/* Competition List */}
      {competitions.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-md)'
        }}>
          {competitions.map(competition => (
            <div
              key={competition.id}
              className="card"
              style={{
                borderLeft: isUpcoming(competition.date)
                  ? '4px solid var(--color-primary)'
                  : '4px solid var(--color-gray-300)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 'var(--spacing-md)'
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>
                      {competition.name}
                    </h3>
                    {isUpcoming(competition.date) && (
                      <span className="badge badge-success">예정</span>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-lg)',
                    fontSize: '0.9375rem',
                    color: 'var(--color-gray-600)'
                  }}>
                    <div>
                      <span style={{ color: 'var(--color-gray-500)' }}>날짜</span>
                      <span style={{ marginLeft: 'var(--spacing-sm)', fontWeight: 500 }}>
                        {formatDate(competition.date)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-gray-500)' }}>장소</span>
                      <span style={{ marginLeft: 'var(--spacing-sm)', fontWeight: 500 }}>
                        {competition.location}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: 'var(--spacing-sm)',
                  flexWrap: 'wrap',
                  width: isMobile ? '100%' : 'auto'
                }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/competitions/manage-students', { state: { competition } })}
                    style={isMobile ? { flex: 1 } : {}}
                  >
                    참가 학생
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/competitions/edit', { state: { competition } })}
                    style={isMobile ? { flex: 1 } : {}}
                  >
                    수정
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteCompetition(competition.id)}
                    style={isMobile ? { flex: 1 } : {}}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <div className="empty-state-title">등록된 대회가 없습니다</div>
            <div className="empty-state-description">
              새 대회를 등록하여 참가 학생을 관리해보세요.
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/competitions/new')}
              style={{ marginTop: 'var(--spacing-lg)' }}
            >
              + 대회 등록
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompetitionList;
