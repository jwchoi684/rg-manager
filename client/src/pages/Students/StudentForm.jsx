import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

function StudentForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const editStudent = location.state?.student; // 수정 모드일 때 전달된 학생 데이터

  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    birthdate: "",
    classIds: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // 페이지 로드 시 스크롤을 맨 위로 이동
    window.scrollTo(0, 0);
    loadClasses();

    // 수정 모드인 경우 학생 데이터 설정
    if (editStudent) {
      setFormData({
        name: editStudent.name,
        birthdate: editStudent.birthdate,
        classIds: editStudent.classIds || [],
      });
      setIsEditing(true);
      setEditId(editStudent.id);
    }
  }, []);

  const loadClasses = async () => {
    try {
      const response = await fetchWithAuth("/api/classes");
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error("수업 목록 로드 실패:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const response = await fetchWithAuth(`/api/students/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          alert("학생 정보가 수정되었습니다.");
          navigate("/students");
        }
      } else {
        const response = await fetchWithAuth("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          alert("학생이 등록되었습니다.");
          navigate("/students");
        }
      }
    } catch (error) {
      console.error("학생 저장 실패:", error);
      alert("학생 정보 저장에 실패했습니다.");
    }
  };

  const handleClassToggle = (classId) => {
    const currentClassIds = formData.classIds || [];
    if (currentClassIds.includes(classId)) {
      setFormData({
        ...formData,
        classIds: currentClassIds.filter((id) => id !== classId),
      });
    } else {
      setFormData({
        ...formData,
        classIds: [...currentClassIds, classId],
      });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{isEditing ? "학생 수정" : "새 학생 등록"}</h2>
        <button
          className="btn"
          onClick={() => navigate("/students")}
          style={{ backgroundColor: '#6b7280', color: 'white' }}
        >
          목록으로
        </button>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <input
              type="text"
              placeholder="이름"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <input
              type={formData.birthdate ? "date" : "text"}
              placeholder="생년월일"
              value={formData.birthdate}
              onFocus={(e) => {
                e.target.type = "date";
              }}
              onChange={(e) =>
                setFormData({ ...formData, birthdate: e.target.value })
              }
              required
            />
          </div>

          {classes.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                수강 수업 선택
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                {classes.map((cls) => (
                  <label
                    key={cls.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      padding: "0.75rem",
                      border: "2px solid",
                      borderColor: (formData.classIds || []).includes(cls.id)
                        ? "#6366f1"
                        : "#e5e7eb",
                      borderRadius: "4px",
                      cursor: "pointer",
                      backgroundColor: (formData.classIds || []).includes(
                        cls.id
                      )
                        ? "#e0e7ff"
                        : "white",
                      transition: "all 0.2s",
                      width: isMobile ? "100%" : "fit-content",
                      boxSizing: "border-box",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={(formData.classIds || []).includes(cls.id)}
                      onChange={() => handleClassToggle(cls.id)}
                      style={{
                        marginRight: "0.5rem",
                        marginTop: "0.25rem",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "row",
                        gap: "0.5rem",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "bold",
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          whiteSpace: "normal",
                        }}
                      >
                        {cls.name}
                      </span>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "#6b7280",
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          whiteSpace: "normal",
                        }}
                      >
                        ({cls.schedule})
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="btn btn-primary">
              {isEditing ? "수정" : "등록"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => navigate("/students")}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentForm;
