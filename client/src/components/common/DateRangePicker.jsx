import React, { useState, useEffect } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { ko } from 'date-fns/locale';

/**
 * 날짜 범위 선택 공통 컴포넌트
 * @param {Object} props
 * @param {string} props.startDate - 시작 날짜 (YYYY-MM-DD 형식)
 * @param {string} props.endDate - 종료 날짜 (YYYY-MM-DD 형식)
 * @param {Function} props.onDateChange - 날짜 변경 콜백 함수 (startDate, endDate)
 * @param {boolean} props.isMobile - 모바일 여부
 * @param {string} props.label - 라벨 텍스트 (기본값: "기간 선택")
 */
function DateRangePicker({ startDate, endDate, onDateChange, isMobile = false, label = "기간 선택" }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    key: 'selection'
  });

  // startDate, endDate props가 변경될 때 dateRange 업데이트
  useEffect(() => {
    setDateRange({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      key: 'selection'
    });
  }, [startDate, endDate]);

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  const handleDateRangeChange = (item) => {
    setDateRange(item.selection);
    const newStartDate = formatDate(item.selection.startDate);
    const newEndDate = formatDate(item.selection.endDate);
    onDateChange(newStartDate, newEndDate);
  };

  return (
    <div className="date-picker-container" style={{ position: 'relative' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
        {label}
      </label>
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
              onChange={handleDateRangeChange}
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
  );
}

export default DateRangePicker;
