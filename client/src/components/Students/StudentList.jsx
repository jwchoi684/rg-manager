import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchWithAuth } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { matchKoreanSearch } from "../../utils/koreanSearch";
import { calculateAge } from "../../utils/dateHelpers";
import { useIsMobile } from "../../hooks/useMediaQuery";

function StudentList({ basePath = '/students' }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const isMobile = useIsMobile();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [classFilter, setClassFilter] = useState('');
  const [searchName, setSearchName] = useState('');
  const [swipedId, setSwipedId] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
    loadStudents();
    loadClasses();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await fetchWithAuth("/api/students");
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error("학생 목록 로드 실패:", error);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await fetchWithAuth("/api/classes");
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error("수업 목록 로드 실패:", error);
    }
  };

  const handleEdit = (student) => {
    navigate(`${basePath}/edit`, { state: { student } });
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

  const getClassNames = useCallback((classIds) => {
    if (!classIds || classIds.length === 0) return "-";
    return classIds
      .map((id) => {
        const cls = classes.find((c) => c.id === id);
        return cls ? cls.name : "";
      })
      .filter((name) => name)
      .join(", ");
  }, [classes]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStudents = useMemo(() => {
    let result = [...students];

    if (searchName) {
      result = result.filter(student =>
        matchKoreanSearch(searchName, student.name)
      );
    }

    if (classFilter) {
      result = result.filter(student =>
        student.classIds && student.classIds.includes(parseInt(classFilter))
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
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

    return result;
  }, [students, searchName, classFilter, sortConfig, getClassNames]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  const minSwipeDistance = 50;

  const handleTouchStart = (e, id) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    if (swipedId && swipedId !== id) {
      setSwipedId(null);
      setSwipeOffset({});
    }
  };

  const swipeRevealWidth = 72;

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
      handleEdit(student);
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">학생 관리</h2>
        <button
          className="btn btn-primary"
          data-tutorial-action="new-student"
          onClick={() => navigate(`${basePath}/new`)}
        >
          + 새 학생 등록
        </button>
      </div>

      {/* Student List Card */}
      <div className="card">
        {/* Filter Bar */}
        <div className="card-header" style={{
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: 'var(--spacing-md)'
        }}>
          <h3 className="card-title">
            학생 목록 <span className="badge badge-primary" style={{ marginLeft: '8px' }}>{sortedStudents.length}명</span>
          </h3>
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-sm)',
            flexWrap: 'wrap',
            flex: isMobile ? '1' : '0 0 auto'
          }}>
            <div className="search-input" style={{ flex: isMobile ? '1' : '0 0 150px' }}>
              <input
                type="text"
                placeholder="이름 검색"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              style={{ flex: isMobile ? '1' : '0 0 150px' }}
            >
              <option value="">전체 수업</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop View - Table */}
        {!isMobile && (
          <div className="table-container" style={{ marginTop: 'var(--spacing-lg)' }}>
            <table>
              <thead>
                <tr>
                  <th>
                    <span
                      className={`sortable ${sortConfig.key === 'name' ? 'active' : ''}`}
                      onClick={() => handleSort('name')}
                    >
                      이름 <span className="sort-icon">{getSortIcon('name')}</span>
                    </span>
                  </th>
                  <th>
                    <span
                      className={`sortable ${sortConfig.key === 'birthdate' ? 'active' : ''}`}
                      onClick={() => handleSort('birthdate')}
                    >
                      생년월일 / 나이 <span className="sort-icon">{getSortIcon('birthdate')}</span>
                    </span>
                  </th>
                  <th>
                    <span
                      className={`sortable ${sortConfig.key === 'classes' ? 'active' : ''}`}
                      onClick={() => handleSort('classes')}
                    >
                      수강 수업 <span className="sort-icon">{getSortIcon('classes')}</span>
                    </span>
                  </th>
                                    <th style={{ width: '160px' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-gray-900)' }}>{student.name}</span>
                    </td>
                    <td>
                      <span>{student.birthdate || "-"}</span>
                      {student.birthdate && (
                        <span className="badge badge-gray" style={{ marginLeft: '8px' }}>
                          {calculateAge(student.birthdate)}세
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ color: 'var(--color-gray-600)' }}>{getClassNames(student.classIds)}</span>
                    </td>
                                        <td>
                      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(student)}>
                          수정
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(student.id)}>
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile View - Toss Style */}
        {isMobile && (
          <>
            {/* Mobile Sort Buttons */}
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-sm)',
              flexWrap: 'wrap',
              marginTop: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-md)'
            }}>
              <button
                onClick={() => handleSort('name')}
                className={`tag ${sortConfig.key === 'name' ? 'active' : ''}`}
              >
                이름 {getSortIcon('name')}
              </button>
              <button
                onClick={() => handleSort('birthdate')}
                className={`tag ${sortConfig.key === 'birthdate' ? 'active' : ''}`}
              >
                생년월일 {getSortIcon('birthdate')}
              </button>
              <button
                onClick={() => handleSort('classes')}
                className={`tag ${sortConfig.key === 'classes' ? 'active' : ''}`}
              >
                수강 수업 {getSortIcon('classes')}
              </button>
            </div>

            {/* Student Cards - Swipeable */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {sortedStudents.map((student) => (
                <div key={student.id} className="swipeable-container">
                  <div className="swipeable-actions">
                    <button
                      className="swipeable-action-btn delete"
                      onClick={() => handleDelete(student.id)}
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
                      transform: `translateX(-${swipeOffset[student.id] || 0}px)`
                    }}
                    onTouchStart={(e) => handleTouchStart(e, student.id)}
                    onTouchMove={(e) => handleTouchMove(e, student.id)}
                    onTouchEnd={() => handleTouchEnd(student.id)}
                    onClick={() => handleCardClick(student)}
                  >
                    <div className="toss-card-item-content">
                      <div className="toss-list-item-icon primary">
                        {student.name.charAt(0)}
                      </div>
                      <div className="toss-list-item-content">
                        <div className="toss-list-item-title">{student.name}</div>
                        <div className="toss-list-item-subtitle">
                          {getClassNames(student.classIds)}
                        </div>
                      </div>
                      <div className="toss-list-item-value">
                        <div className="toss-list-item-value-main">
                          {calculateAge(student.birthdate)}세
                        </div>
                        <div className="toss-list-item-value-sub">
                          {student.birthdate || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {students.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">등록된 학생이 없습니다</div>
            <div className="empty-state-description">새 학생을 등록하여 시작하세요.</div>
          </div>
        )}

        {/* No Results */}
        {students.length > 0 && sortedStudents.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">검색 결과가 없습니다</div>
            <div className="empty-state-description">다른 검색어나 필터를 사용해보세요.</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentList;
