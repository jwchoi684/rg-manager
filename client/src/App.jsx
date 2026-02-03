import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import StudentList from './components/Students/StudentList';
import StudentForm from './pages/Students/StudentForm';
import ClassList from './components/Classes/ClassList';
import ClassForm from './pages/Classes/ClassForm';
import ClassStudentManagement from './pages/Classes/ClassStudentManagement';
import AttendanceCheck from './components/Attendance/AttendanceCheck';
import Dashboard from './pages/Dashboard';
import StudentAttendance from './pages/StudentAttendance';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Logs from './pages/Logs';
import CompetitionList from './pages/Competitions/CompetitionList';
import CompetitionForm from './pages/Competitions/CompetitionForm';
import CompetitionStudentManagement from './pages/Competitions/CompetitionStudentManagement';
import StudentCompetitions from './pages/StudentCompetitions';
import KakaoCallback from './pages/KakaoCallback';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px' }}></div>
          <div style={{ color: 'var(--color-gray-500)', fontSize: '0.9375rem' }}>로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // 메뉴 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Navigate to="/login" />} />
        <Route path="/oauth/kakao/callback" element={<KakaoCallback />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  const navLinks = [
    { path: '/', label: '대시보드', icon: '📊' },
    { path: '/students', label: '학생 관리', icon: '👥' },
    { path: '/classes', label: '수업 관리', icon: '📚' },
    { path: '/competitions', label: '대회 관리', icon: '🏆' },
    { path: '/attendance', label: '출석 체크', icon: '✓' },
    { path: '/student-attendance', label: '학생별 출석', icon: '📋' },
    { path: '/student-competitions', label: '학생별 대회', icon: '🎖️' },
  ];

  const adminLinks = [
    { path: '/logs', label: '로그', icon: '📝' },
    { path: '/notifications', label: '알림', icon: '🔔' },
    { path: '/admin', label: '관리자', icon: '⚙️' },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ marginBottom: 0 }}>리듬체조 출석</h1>
          <button className="mobile-menu-button" onClick={toggleMobileMenu}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={isActive(link.path) ? 'active' : ''}
            >
              {link.label}
            </Link>
          ))}
          {user?.role === 'admin' && adminLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={isActive(link.path) ? 'active' : ''}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/settings"
            className={isActive('/settings') ? 'active' : ''}
          >
            설정
          </Link>
          <button
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{
              fontSize: '0.875rem',
            }}
          >
            로그아웃
          </button>
        </nav>
      </header>

      {/* Mobile Fullscreen Menu */}
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <span className="mobile-menu-title">메뉴</span>
          <button className="mobile-menu-close" onClick={closeMobileMenu}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="mobile-menu-content">
          <div className="mobile-menu-section">
            <div className="mobile-menu-section-title">메인</div>
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeMobileMenu}
                className={`mobile-menu-item ${isActive(link.path) ? 'active' : ''}`}
              >
                <span className="mobile-menu-icon">{link.icon}</span>
                <span className="mobile-menu-label">{link.label}</span>
              </Link>
            ))}
          </div>
          {user?.role === 'admin' && (
            <div className="mobile-menu-section">
              <div className="mobile-menu-section-title">관리</div>
              {adminLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={`mobile-menu-item ${isActive(link.path) ? 'active' : ''}`}
                >
                  <span className="mobile-menu-icon">{link.icon}</span>
                  <span className="mobile-menu-label">{link.label}</span>
                </Link>
              ))}
            </div>
          )}
          <div className="mobile-menu-section">
            <div className="mobile-menu-section-title">계정</div>
            <Link
              to="/settings"
              onClick={closeMobileMenu}
              className={`mobile-menu-item ${isActive('/settings') ? 'active' : ''}`}
            >
              <span className="mobile-menu-icon">⚙️</span>
              <span className="mobile-menu-label">설정</span>
            </Link>
            <button
              onClick={handleLogout}
              className="mobile-menu-item"
            >
              <span className="mobile-menu-icon">🚪</span>
              <span className="mobile-menu-label">로그아웃</span>
            </button>
          </div>
        </div>
      </div>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
          <Route path="/students/new" element={<ProtectedRoute><StudentForm /></ProtectedRoute>} />
          <Route path="/students/edit" element={<ProtectedRoute><StudentForm /></ProtectedRoute>} />
          <Route path="/classes" element={<ProtectedRoute><ClassList /></ProtectedRoute>} />
          <Route path="/classes/new" element={<ProtectedRoute><ClassForm /></ProtectedRoute>} />
          <Route path="/classes/edit" element={<ProtectedRoute><ClassForm /></ProtectedRoute>} />
          <Route path="/classes/manage-students" element={<ProtectedRoute><ClassStudentManagement /></ProtectedRoute>} />
          <Route path="/competitions" element={<ProtectedRoute><CompetitionList /></ProtectedRoute>} />
          <Route path="/competitions/new" element={<ProtectedRoute><CompetitionForm /></ProtectedRoute>} />
          <Route path="/competitions/edit" element={<ProtectedRoute><CompetitionForm /></ProtectedRoute>} />
          <Route path="/competitions/manage-students" element={<ProtectedRoute><CompetitionStudentManagement /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><AttendanceCheck /></ProtectedRoute>} />
          <Route path="/student-attendance" element={<ProtectedRoute><StudentAttendance /></ProtectedRoute>} />
          <Route path="/student-competitions" element={<ProtectedRoute><StudentCompetitions /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
