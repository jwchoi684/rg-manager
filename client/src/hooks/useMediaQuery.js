import { useState, useEffect } from 'react';

/**
 * 미디어 쿼리 커스텀 훅
 * @param {number} breakpoint - 브레이크포인트 (px)
 * @returns {boolean} - breakpoint 이하이면 true
 */
export const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};
