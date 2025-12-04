import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function StudentAttendance() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // 나이 계산 함수
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
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadAttendanceRecords();
    }
  }, [selectedStudent, filterClass, filterMonth]);

  const loadData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch('http://localhost:5001/api/students'),
        fetch('http://localhost:5001/api/classes')
      ]);
      const studentsData = await studentsRes.json();
      const classesData = await classesRes.json();
      setStudents(studentsData);
      setClasses(classesData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    }
  };

  const loadAttendanceRecords = async () => {
    if (!selectedStudent) return;

    try {
      const response = await fetch('http://localhost:5001/api/attendance');
      let allRecords = await response.json();

      // 선택한 학생의 모든 기록
      const studentRecords = allRecords.filter(r => r.studentId === selectedStudent.id);
      setAllAttendanceRecords(studentRecords);

      // 필터링된 기록
      let filteredRecords = [...studentRecords];

      // 수업 필터
      if (filterClass) {
        filteredRecords = filteredRecords.filter(r => r.classId === parseInt(filterClass));
      }

      // 월 필터
      if (filterMonth) {
        filteredRecords = filteredRecords.filter(r => r.date.startsWith(filterMonth));
      }

      // 날짜 역순 정렬 (최신순)
      filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

      setAttendanceRecords(filteredRecords);
    } catch (error) {
      console.error('출석 기록 로드 실패:', error);
    }
  };

  // 학생 필터링 및 정렬
  const getFilteredAndSortedStudents = () => {
    let filtered = students;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 반별 필터
    if (classFilter) {
      // student.classIds에 해당 클래스가 포함된 학생만 필터
      filtered = filtered.filter(student =>
        student.classIds && student.classIds.includes(parseInt(classFilter))
      );
    }

    // 이름순 오름차순 정렬
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

    return filtered;
  };

  const filteredStudents = getFilteredAndSortedStudents();

  const getClassName = (classId) => {
    const classItem = classes.find(c => c.id === classId);
    return classItem ? classItem.name : '-';
  };

  const getStats = () => {
    if (!selectedStudent) return { totalDays: 0, currentMonth: 0, lastMonth: 0 };

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    // Use allAttendanceRecords which contains all records for the selected student
    return {
      totalDays: allAttendanceRecords.length,
      currentMonth: allAttendanceRecords.filter(r => r.date.startsWith(currentMonth)).length,
      lastMonth: allAttendanceRecords.filter(r => r.date.startsWith(lastMonth)).length
    };
  };

  const stats = getStats();

  // 월 옵션 생성 (최근 6개월)
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
      options.push({ value, label });
    }
    return options;
  };

  // PDF 다운로드 함수
  const downloadPDF = () => {
    if (!selectedStudent) {
      alert('학생을 선택해주세요!');
      return;
    }

    try {
      const doc = new jsPDF();

      // 제목
      doc.setFontSize(20);
      doc.text('Student Attendance Report', 14, 20);

      // 학생 정보 (한글 이름은 Student ID로 표시)
      doc.setFontSize(12);
      doc.text(`Student ID: ${selectedStudent.id}`, 14, 35);
      doc.text(`Student Name: ${selectedStudent.name || 'N/A'}`, 14, 42);
      doc.text(`Age: ${selectedStudent.age || 'N/A'}`, 14, 49);
      doc.text(`Phone: ${selectedStudent.phone || 'N/A'}`, 14, 56);
      doc.text(`Parent Phone: ${selectedStudent.parentPhone || 'N/A'}`, 14, 63);

      // 통계
      doc.setFontSize(14);
      doc.text('Attendance Statistics', 14, 77);
      doc.setFontSize(11);
      doc.text(`Total Days: ${stats.totalDays || 0}`, 14, 85);
      doc.text(`Current Month: ${stats.currentMonth || 0}`, 14, 92);
      doc.text(`Last Month: ${stats.lastMonth || 0}`, 14, 99);

      // 출석 기록 테이블
      if (allAttendanceRecords && allAttendanceRecords.length > 0) {
        // 날짜순으로 정렬 (최신순)
        const sortedRecords = [...allAttendanceRecords].sort((a, b) =>
          new Date(b.date) - new Date(a.date)
        );

        const tableData = sortedRecords.map(record => {
          const date = new Date(record.date);
          const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const checkedTime = new Date(record.checkedAt);

          // 클래스 이름 가져오기
          const className = getClassName(record.classId) || `Class ${record.classId}`;

          return [
            record.date || 'N/A',
            weekdays[date.getDay()] || 'N/A',
            `Class ${record.classId}`,  // 한글 클래스명 대신 ID 사용
            checkedTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          ];
        });

        doc.autoTable({
          startY: 110,
          head: [['Date', 'Day', 'Class', 'Check Time']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [99, 102, 241],
            textColor: [255, 255, 255]
          },
          styles: {
            fontSize: 9,
            cellPadding: 3
          },
          margin: { top: 110 }
        });
      } else {
        doc.setFontSize(11);
        doc.text('No attendance records found.', 14, 115);
      }

      // 하단 정보
      doc.setFontSize(9);
      const generatedDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(
        `Generated on ${generatedDate}`,
        14,
        doc.internal.pageSize.height - 10
      );

      // 파일 저장
      const fileName = `attendance_student_${selectedStudent.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      console.log('PDF generated successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(`PDF generation failed: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>학생별 출석 조회</h2>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>학생 선택</h3>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: '1', minWidth: '200px' }}
          />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="">전체 반</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {(searchTerm || classFilter) && (
            <button
              className="btn"
              onClick={() => {
                setSearchTerm('');
                setClassFilter('');
              }}
            >
              초기화
            </button>
          )}
        </div>

        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
          {filteredStudents.map(student => (
            <div
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              style={{
                padding: '1rem',
                border: '2px solid',
                borderColor: selectedStudent?.id === student.id ? '#6366f1' : '#e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: selectedStudent?.id === student.id ? '#e0e7ff' : 'white'
              }}
              onMouseEnter={(e) => {
                if (selectedStudent?.id !== student.id) {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.backgroundColor = '#f5f5ff';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStudent?.id !== student.id) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{student.name}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {student.birthdate || '-'} ({calculateAge(student.birthdate)}세)
              </div>
            </div>
          ))}
          {filteredStudents.length === 0 && (
            <p style={{ gridColumn: '1 / -1', color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
              {students.length === 0 ? '등록된 학생이 없습니다.' : '조건에 맞는 학생이 없습니다.'}
            </p>
          )}
        </div>

        {selectedStudent && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '2px solid #6366f1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>{selectedStudent.name}</h3>
                <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280' }}>
                  {selectedStudent.birthdate || '-'} ({calculateAge(selectedStudent.birthdate)}세) | {selectedStudent.phone || '연락처 없음'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={downloadPDF}
                  style={{ backgroundColor: '#10b981', color: 'white' }}
                >
                  📄 PDF 다운로드
                </button>
                <button
                  className="btn"
                  onClick={() => setSelectedStudent(null)}
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                >
                  선택 해제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedStudent && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="card">
              <h3>총 출석일</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1', margin: '0.5rem 0 0 0' }}>
                {stats.totalDays}일
              </p>
            </div>
            <div className="card">
              <h3>이번 달 출석</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: '0.5rem 0 0 0' }}>
                {stats.currentMonth}일
              </p>
            </div>
            <div className="card">
              <h3>지난 달 출석</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', margin: '0.5rem 0 0 0' }}>
                {stats.lastMonth}일
              </p>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>출석 기록</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  style={{ minWidth: '150px' }}
                >
                  <option value="">전체 수업</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  style={{ minWidth: '150px' }}
                >
                  <option value="">전체 기간</option>
                  {getMonthOptions().map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {(filterClass || filterMonth) && (
                  <button
                    className="btn"
                    onClick={() => {
                      setFilterClass('');
                      setFilterMonth('');
                    }}
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            </div>

            {attendanceRecords.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>요일</th>
                    <th>수업</th>
                    <th>체크 시간</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map(record => {
                    const date = new Date(record.date);
                    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                    const checkedTime = new Date(record.checkedAt);

                    return (
                      <tr key={record.id}>
                        <td>{record.date}</td>
                        <td>{weekdays[date.getDay()]}요일</td>
                        <td>{getClassName(record.classId)}</td>
                        <td>{checkedTime.toLocaleTimeString('ko-KR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                출석 기록이 없습니다.
              </p>
            )}
          </div>
        </>
      )}

      {!selectedStudent && students.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
            위의 학생 목록에서 학생을 선택하여 출석 기록을 확인하세요.
          </p>
        </div>
      )}
    </div>
  );
}

export default StudentAttendance;
