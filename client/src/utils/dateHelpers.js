/**
 * 생년월일로부터 나이 계산
 */
export const calculateAge = (birthdate) => {
  if (!birthdate) return '-';
  const birth = new Date(birthdate);
  if (isNaN(birth.getTime())) return '-';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * 날짜 포맷팅 (한국어)
 * @param {string} dateString - ISO 날짜 문자열
 * @param {'full'|'short'|'compact'} format - 포맷 유형
 */
export const formatDate = (dateString, format = 'short') => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[date.getDay()];

  switch (format) {
    case 'full':
      return `${year}년 ${month}월 ${day}일 (${weekday})`;
    case 'short':
      return `${month}월 ${day}일 (${weekday})`;
    case 'compact':
      return `${month}/${day}(${weekday})`;
    default:
      return `${month}월 ${day}일`;
  }
};
