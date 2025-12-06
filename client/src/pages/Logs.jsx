import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';

function Logs() {
  const [logs, setLogs] = useState([]);
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

  const loadLogs = async () => {
    try {
      const response = await fetchWithAuth('/api/logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('로그 로드 실패:', error);
    }
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

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>전체 로그 ({logs.length}개)</h3>
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
