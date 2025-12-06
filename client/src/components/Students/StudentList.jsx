import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function StudentList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [classFilter, setClassFilter] = useState('');
  const [searchName, setSearchName] = useState('');

  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 나이 계산 함수
  const calculateAge = (birthdate) => {
    if (!birthdate) return "-";
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    // 페이지 로드 시 스크롤을 맨 위로 이동
    window.scrollTo(0, 0);
    if (user?.role === 'admin') {
      loadUsers();
    }
    loadStudents();
    loadClasses();
  }, []);

  useEffect(() => {
    // 선택된 사용자가 변경되면 데이터 다시 로드
    loadStudents();
    loadClasses();
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const response = await fetchWithAuth("/api/auth/users");
      const data = await response.json();
      setUsers(data.filter(u => u.role !== 'admin'));
    } catch (error) {
      console.error("사용자 목록 로드 실패:", error);
    }
  };

  const loadStudents = async () => {
    try {
      const url = user?.role === 'admin' && selectedUserId !== 'all'
        ? `/api/students?filterUserId=${selectedUserId}`
        : "/api/students";
      const response = await fetchWithAuth(url);
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error("학생 목록 로드 실패:", error);
    }
  };

  const loadClasses = async () => {
    try {
      const url = user?.role === 'admin' && selectedUserId !== 'all'
        ? `/api/classes?filterUserId=${selectedUserId}`
        : "/api/classes";
      const response = await fetchWithAuth(url);
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error("수업 목록 로드 실패:", error);
    }
  };

  const handleEdit = (student) => {
    navigate('/students/edit', { state: { student } });
  };

  const handleDelete = async (id) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      try {
        const response = await fetchWithAuth(`/api/students/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          await loadStudents();
        }
      } catch (error) {
        console.error("학생 삭제 실패:", error);
        alert("학생 삭제에 실패했습니다.");
      }
    }
  };

  const getClassNames = (classIds) => {
    if (!classIds || classIds.length === 0) return "-";
    return classIds
      .map((id) => {
        const cls = classes.find((c) => c.id === id);
        return cls ? cls.name : "";
      })
      .filter((name) => name)
      .join(", ");
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedStudents = () => {
    let sortedStudents = [...students];

    // 이름 검색 필터링
    if (searchName) {
      sortedStudents = sortedStudents.filter(student =>
        student.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // 반별 필터링
    if (classFilter) {
      sortedStudents = sortedStudents.filter(student =>
        student.classIds && student.classIds.includes(parseInt(classFilter))
      );
    }

    // 정렬
    if (sortConfig.key) {
      sortedStudents.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'name') {
          aValue = a.name;
          bValue = b.name;
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue, 'ko')
            : bValue.localeCompare(aValue, 'ko');
        } else if (sortConfig.key === 'birthdate') {
          aValue = a.birthdate || '';
          bValue = b.birthdate || '';
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else if (sortConfig.key === 'classes') {
          aValue = getClassNames(a.classIds);
          bValue = getClassNames(b.classIds);
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue, 'ko')
            : bValue.localeCompare(aValue, 'ko');
        }

        return 0;
      });
    }

    return sortedStudents;
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return '⇅';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>학생 관리</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/students/new')}
        >
          새 학생 등록
        </button>
      </div>

      {/* 관리자용 사용자 선택 */}
      {user?.role === 'admin' && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <label style={{
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}>
              사용자 선택:
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{
                minWidth: '200px',
                flex: 1
              }}
            >
              <option value="all">전체 사용자</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: "1rem" }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: 0, width: isMobile ? '100%' : 'auto' }}>학생 목록 ({getSortedStudents().length}명)</h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            width: isMobile ? '100%' : 'auto',
            minWidth: 0,
            maxWidth: '100%',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              placeholder="이름 검색"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{
                minWidth: isMobile ? 0 : '150px',
                width: isMobile ? '100%' : '150px',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}
            />
            <label style={{
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              display: isMobile ? 'none' : 'block'
            }}>
              반 선택:
            </label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              style={{
                minWidth: isMobile ? 0 : '150px',
                width: isMobile ? '100%' : '150px',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}
            >
              <option value="">전체 학생</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 데스크탑 뷰 - 테이블 */}
        {!isMobile && (
          <table style={{ marginTop: "1rem" }}>
            <thead>
              <tr>
                <th>
                  <span
                    onClick={() => handleSort('name')}
                    style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    이름 <span style={{ fontSize: '0.875rem' }}>{getSortIcon('name')}</span>
                  </span>
                </th>
                <th>
                  <span
                    onClick={() => handleSort('birthdate')}
                    style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    생년월일 / 나이 <span style={{ fontSize: '0.875rem' }}>{getSortIcon('birthdate')}</span>
                  </span>
                </th>
                <th>
                  <span
                    onClick={() => handleSort('classes')}
                    style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    수강 수업 <span style={{ fontSize: '0.875rem' }}>{getSortIcon('classes')}</span>
                  </span>
                </th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {getSortedStudents().map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>
                    {student.birthdate || "-"}
                    {student.birthdate && (
                      <span style={{ color: "#6b7280", marginLeft: "0.5rem" }}>
                        ({calculateAge(student.birthdate)}세)
                      </span>
                    )}
                  </td>
                  <td>{getClassNames(student.classIds)}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEdit(student)}
                      style={{ marginRight: "0.5rem" }}
                    >
                      수정
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(student.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 모바일 뷰 - 카드 */}
        {isMobile && (
          <>
            {/* 모바일 정렬 버튼 */}
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={() => handleSort('name')}
                className="btn"
                style={{
                  fontSize: "0.875rem",
                  backgroundColor: sortConfig.key === 'name' ? '#6366f1' : '#e5e7eb',
                  color: sortConfig.key === 'name' ? 'white' : '#374151'
                }}
              >
                이름 {getSortIcon('name')}
              </button>
              <button
                onClick={() => handleSort('birthdate')}
                className="btn"
                style={{
                  fontSize: "0.875rem",
                  backgroundColor: sortConfig.key === 'birthdate' ? '#6366f1' : '#e5e7eb',
                  color: sortConfig.key === 'birthdate' ? 'white' : '#374151'
                }}
              >
                생년월일 {getSortIcon('birthdate')}
              </button>
              <button
                onClick={() => handleSort('classes')}
                className="btn"
                style={{
                  fontSize: "0.875rem",
                  backgroundColor: sortConfig.key === 'classes' ? '#6366f1' : '#e5e7eb',
                  color: sortConfig.key === 'classes' ? 'white' : '#374151'
                }}
              >
                수강 수업 {getSortIcon('classes')}
              </button>
            </div>

            <div
              style={{
                marginTop: "0.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {getSortedStudents().map((student) => (
              <div
                key={student.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "1rem",
                  backgroundColor: "white",
                }}
              >
                <div style={{ marginBottom: "0.75rem" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "1.125rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {student.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#6b7280",
                      marginBottom: "0.25rem",
                    }}
                  >
                    생년월일: {student.birthdate || "-"} (
                    {calculateAge(student.birthdate)}세)
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                    수강 수업: {getClassNames(student.classIds)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEdit(student)}
                    style={{ flex: 1 }}
                  >
                    수정
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(student.id)}
                    style={{ flex: 1 }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
            </div>
          </>
        )}

        {students.length === 0 && (
          <p
            style={{ textAlign: "center", color: "#6b7280", marginTop: "1rem" }}
          >
            등록된 학생이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}

export default StudentList;
