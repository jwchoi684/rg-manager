import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const adminTabs = [
  { path: '/admin/students', label: '학생', icon: '👥' },
  { path: '/admin/classes', label: '수업', icon: '📚' },
  { path: '/admin/competitions', label: '대회', icon: '🏆' },
  { path: '/admin/attendance', label: '출석', icon: '✓' },
  { path: '/admin/users', label: '사용자', icon: '👤' },
  { path: '/admin/logs', label: '로그', icon: '📝' },
  { path: '/admin/notifications', label: '알림', icon: '🔔' },
];

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path) => {
    if (path === '/admin/students') {
      return location.pathname === '/admin' || location.pathname.startsWith('/admin/students');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-dashboard">
      {/* Desktop Header */}
      <header className="admin-dashboard-header">
        <h1 className="admin-dashboard-title">관리자 대시보드</h1>
        <Link to="/" className="admin-dashboard-back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>메인으로</span>
        </Link>
      </header>

      {/* Mobile Header */}
      <div className="admin-mobile-header">
        <Link to="/" className="admin-mobile-back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </Link>
        <span className="admin-mobile-title">관리자 대시보드</span>
        <div style={{ width: 36 }}></div>
      </div>

      {/* Desktop Tabs */}
      <nav className="admin-tabs">
        {adminTabs.map(tab => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`admin-tab ${isActive(tab.path) ? 'active' : ''}`}
          >
            <span className="admin-tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>

      {/* Mobile Dropdown */}
      <div className="admin-mobile-dropdown">
        <select
          value={adminTabs.find(tab => isActive(tab.path))?.path || '/admin/students'}
          onChange={(e) => navigate(e.target.value)}
          className="admin-mobile-select"
        >
          {adminTabs.map(tab => (
            <option key={tab.path} value={tab.path}>
              {tab.icon} {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <main className="admin-dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
