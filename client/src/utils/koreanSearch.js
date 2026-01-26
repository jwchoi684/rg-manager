// 한글 초성 검색 유틸리티

// 초성 리스트
const CHOSUNG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// 한글 유니코드 범위
const HANGUL_START = 0xAC00;
const HANGUL_END = 0xD7A3;

// 초성만 있는 문자인지 확인
const isChosung = (char) => {
  return CHOSUNG_LIST.includes(char);
};

// 한글 완성형 문자인지 확인
const isHangulSyllable = (char) => {
  const code = char.charCodeAt(0);
  return code >= HANGUL_START && code <= HANGUL_END;
};

// 한글 완성형에서 초성 추출
const getChosung = (char) => {
  if (!isHangulSyllable(char)) return char;
  const code = char.charCodeAt(0) - HANGUL_START;
  const chosungIndex = Math.floor(code / (21 * 28));
  return CHOSUNG_LIST[chosungIndex];
};

// 문자열에서 초성만 추출
export const extractChosung = (str) => {
  if (!str) return '';
  return str.split('').map(char => getChosung(char)).join('');
};

// 초성 검색 매칭 함수
// query: 검색어 (초성 또는 일반 텍스트)
// target: 검색 대상 문자열
export const matchKoreanSearch = (query, target) => {
  if (!query || !target) return false;

  const lowerQuery = query.toLowerCase();
  const lowerTarget = target.toLowerCase();

  // 1. 일반 포함 검색 (기존 방식)
  if (lowerTarget.includes(lowerQuery)) {
    return true;
  }

  // 2. 초성 검색
  // 검색어가 초성으로만 이루어져 있는지 확인
  const isChosungQuery = query.split('').every(char => isChosung(char));

  if (isChosungQuery) {
    // 대상 문자열의 초성 추출
    const targetChosung = extractChosung(target);
    return targetChosung.includes(query);
  }

  // 3. 혼합 검색 (일부 초성 + 일부 완성형)
  // 검색어의 각 문자를 초성으로 변환하여 비교
  const queryChosung = extractChosung(query);
  const targetChosung = extractChosung(target);

  return targetChosung.includes(queryChosung);
};

export default matchKoreanSearch;
