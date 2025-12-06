import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { ko } from 'date-fns/locale';

function Logs() {
  // 날짜를 YYYY-MM-DD 형식으로 변환 (타임존 문제 해결)
  const formatDateOnly = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 이번 달 시작일과 종료일 계산
  const getThisMonthRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: formatDateOnly(firstDay),
      end: formatDateOnly(lastDay),
      startDate: firstDay,
      endDate: lastDay
    };
  };

  const thisMonth = getThisMonthRange();
  const [logs, setLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [startDate, setStartDate] = useState(thisMonth.start);
  const [endDate, setEndDate] = useState(thisMonth.end);
  const [dateRange, setDateRange] = useState({
    startDate: thisMonth.startDate,
    endDate: thisMonth.endDate,
    key: 'selection'
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadLogs();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 날짜 선택기 외부 클릭 감지 (데스크탑 전용)
  useEffect(() => {
    if (isMobile) return;
    const handleClickOutside = (event) => {
      if (showDatePicker && !event.target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker, isMobile]);

  // 모바일에서 모달 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isMobile && showDatePicker) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDatePicker, isMobile]);

  // 날짜 범위 변경 시 필터링
  useEffect(() => {
    filterLogs();
  }, [startDate, endDate, allLogs]);

  const loadLogs = async () => {
    try {
      const response = await fetchWithAuth('/api/logs');
      const data = await response.json();
      setAllLogs(data);
    } catch (error) {
      console.error('로그 로드 실패:', error);
    }
  };

  const filterLogs = () => {
    const filtered = allLogs.filter(log => {
      const logDate = log.createdAt.split('T')[0];
      return logDate >= startDate && logDate <= endDate;
    });
    setLogs(filtered);
  };

  const getActionText = (action) => {
    const actionMap = {
      'LOGIN': '로그인',
      'SIGNUP': '회원가입',
      'CREATE_STUDENT': '학생 생성',
      'UPDATE_STUDENT': '학생 수정',
      'DELETE_STUDENT': '학생 삭제',
      'CREATE_CLASS': '수업 생성',
      'UPDATE_CLASS': '수업 수정',
      'DELETE_CLASS': '수업 삭제',
      'REORDER_CLASSES': '수업 순서 변경',
      'CREATE_ATTENDANCE': '출석 체크',
      'DELETE_ATTENDANCE': '출석 삭제',
      'DELETE_ATTENDANCE_BULK': '출석 일괄 삭제',
      'UPDATE_USER': '사용자 수정',
      'DELETE_USER': '사용자 삭제'
    };
    return actionMap[action] || action;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div>
      <h2>시스템 로그</h2>

      {/* 날짜 범위 선택 */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>조회 기간</h3>
        <div className="date-picker-container" style={{ marginTop: '1rem', position: 'relative' }}>
          <button
            className="btn"
            onClick={() => setShowDatePicker(!showDatePicker)}
            style={{
              width: isMobile ? '100%' : 'auto',
              minWidth: '200px',
              textAlign: 'left',
              padding: '0.5rem 1rem'
            }}
          >
            {startDate} ~ {endDate}
          </button>
          {showDatePicker && (
            <>
              {/* 모바일: 전체 화면 오버레이 */}
              {isMobile && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 999
                  }}
                  onClick={() => setShowDatePicker(false)}
                />
              )}
              <div style={{
                position: isMobile ? 'fixed' : 'absolute',
                top: isMobile ? '50%' : '100%',
                left: isMobile ? '50%' : 0,
                transform: isMobile ? 'translate(-50%, -50%)' : 'none',
                zIndex: 1000,
                backgroundColor: 'white',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                marginTop: isMobile ? 0 : '0.5rem',
                maxWidth: isMobile ? '95vw' : 'none',
                maxHeight: isMobile ? '90vh' : 'none',
                overflow: isMobile ? 'auto' : 'visible'
              }}>
                <DateRange
                  ranges={[dateRange]}
                  onChange={(item) => {
                    setDateRange(item.selection);
                    setStartDate(formatDateOnly(item.selection.startDate));
                    setEndDate(formatDateOnly(item.selection.endDate));
                  }}
                  months={isMobile ? 1 : 2}
                  direction={isMobile ? 'vertical' : 'horizontal'}
                  locale={ko}
                  rangeColors={['#6366f1']}
                />
                <div style={{
                  padding: '1rem',
                  borderTop: '1px solid #e5e7eb',
                  textAlign: 'right'
                }}>
                  <button
                    className="btn"
                    onClick={() => setShowDatePicker(false)}
                    style={{ fontSize: '0.875rem' }}
                  >
                    닫기
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>로그 목록 ({logs.length}개)</h3>
        {logs.length > 0 ? (
          <div style={{ marginTop: '1rem' }}>
            {/* 데스크탑 - 테이블 */}
            {!isMobile && (
              <table>
                <thead>
                  <tr>
                    <th>시간</th>
                    <th>사용자</th>
                    <th>작업</th>
                    <th>상세</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(log.createdAt)}</td>
                      <td>{log.username}</td>
                      <td>{getActionText(log.action)}</td>
                      <td>{log.details || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 모바일 - 카드 */}
            {isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {logs.map(log => (
                  <div
                    key={log.id}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {getActionText(log.action)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      사용자: {log.username}
                    </div>
                    {log.details && (
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {log.details}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      {formatDate(log.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
            로그가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

export default Logs;
