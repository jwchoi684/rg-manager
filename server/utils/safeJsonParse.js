/**
 * 안전한 JSON.parse - 파싱 실패 시 기본값 반환
 */
export const safeJsonParse = (str, defaultValue = []) => {
  if (!str) return defaultValue;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('JSON 파싱 오류:', e.message);
    return defaultValue;
  }
};
