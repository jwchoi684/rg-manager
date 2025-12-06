import React, { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
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
import Signup from './pages/Signup';
import Admin from './pages/Admin';
import Logs from './pages/Logs';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      로딩 중...
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

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

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>리듬체조 출석 관리</h1>
        <button className="mobile-menu-button" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
        <nav className={mobileMenuOpen ? 'mobile-open' : ''}>
          <Link to="/" onClick={closeMobileMenu}>대시보드</Link>
          <Link to="/students" onClick={closeMobileMenu}>학생 관리</Link>
          <Link to="/classes" onClick={closeMobileMenu}>수업 관리</Link>
          <Link to="/attendance" onClick={closeMobileMenu}>출석 체크</Link>
          <Link to="/student-attendance" onClick={closeMobileMenu}>학생별 출석</Link>
          {user?.role === 'admin' && (
            <>
              <Link to="/logs" onClick={closeMobileMenu}>로그</Link>
              <Link to="/admin" onClick={closeMobileMenu}>관리자</Link>
            </>
          )}
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              fontSize: 'inherit'
            }}
          >
            로그아웃 ({user?.username})
          </button>
        </nav>
      </header>

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
          <Route path="/attendance" element={<ProtectedRoute><AttendanceCheck /></ProtectedRoute>} />
          <Route path="/student-attendance" element={<ProtectedRoute><StudentAttendance /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
