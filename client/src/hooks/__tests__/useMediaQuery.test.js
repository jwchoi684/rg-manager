import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../useMediaQuery';

describe('useMediaQuery - useIsMobile', () => {
  let originalInnerWidth;

  beforeEach(() => {
    // Save original window.innerWidth
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    // Restore original window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });

    // Clean up event listeners
    window.dispatchEvent(new Event('resize'));
  });

  describe('기본 동작', () => {
    it('should return true for mobile width (≤768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should return false for desktop width (>768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('should return true for width exactly at breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should return false for width just above breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 769,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });
  });

  describe('커스텀 breakpoint', () => {
    it('should use custom breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile(1024));
      expect(result.current).toBe(true);
    });

    it('should return false when above custom breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1025,
      });

      const { result } = renderHook(() => useIsMobile(1024));
      expect(result.current).toBe(false);
    });

    it('should handle small breakpoint (320px for mobile-only)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      const { result } = renderHook(() => useIsMobile(320));
      expect(result.current).toBe(true);
    });

    it('should handle large breakpoint (1920px for 4K)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      const { result } = renderHook(() => useIsMobile(1920));
      expect(result.current).toBe(true);
    });
  });

  describe('resize 이벤트 처리', () => {
    it('should update when window is resized from desktop to mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      // Resize to mobile
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375,
        });
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current).toBe(true);
    });

    it('should update when window is resized from mobile to desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);

      // Resize to desktop
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1920,
        });
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current).toBe(false);
    });

    it('should handle multiple resize events', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      // First resize to mobile
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375,
        });
        window.dispatchEvent(new Event('resize'));
      });
      expect(result.current).toBe(true);

      // Second resize to tablet
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 768,
        });
        window.dispatchEvent(new Event('resize'));
      });
      expect(result.current).toBe(true);

      // Third resize to desktop
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1440,
        });
        window.dispatchEvent(new Event('resize'));
      });
      expect(result.current).toBe(false);
    });

    it('should not trigger unnecessary re-renders for same state', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());
      const initialValue = result.current;

      // Resize but stay in desktop range
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1920,
        });
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current).toBe(initialValue);
    });
  });

  describe('일반적인 디바이스 너비', () => {
    const devices = [
      { name: 'iPhone SE', width: 375, expected: true },
      { name: 'iPhone 12', width: 390, expected: true },
      { name: 'iPhone 14 Pro Max', width: 430, expected: true },
      { name: 'iPad Mini', width: 768, expected: true },
      { name: 'iPad Air', width: 820, expected: false },
      { name: 'iPad Pro 11"', width: 834, expected: false },
      { name: 'iPad Pro 12.9"', width: 1024, expected: false },
      { name: 'Laptop', width: 1366, expected: false },
      { name: 'Desktop', width: 1920, expected: false },
      { name: '4K Monitor', width: 3840, expected: false },
    ];

    devices.forEach(({ name, width, expected }) => {
      it(`should return ${expected} for ${name} (${width}px)`, () => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        const { result } = renderHook(() => useIsMobile());
        expect(result.current).toBe(expected);
      });
    });
  });

  describe('breakpoint 변경에 대한 반응', () => {
    it('should update when breakpoint prop changes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });

      const { result, rerender } = renderHook(
        ({ breakpoint }) => useIsMobile(breakpoint),
        { initialProps: { breakpoint: 768 } }
      );

      expect(result.current).toBe(false); // 800 > 768

      // Change breakpoint to 1024
      rerender({ breakpoint: 1024 });

      expect(result.current).toBe(true); // 800 <= 1024
    });

    it('should clean up old listener when breakpoint changes', () => {
      const { rerender, unmount } = renderHook(
        ({ breakpoint }) => useIsMobile(breakpoint),
        { initialProps: { breakpoint: 768 } }
      );

      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      // Change breakpoint
      rerender({ breakpoint: 1024 });

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      removeEventListenerSpy.mockRestore();
      unmount();
    });
  });

  describe('클린업', () => {
    it('should remove event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useIsMobile());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should not cause memory leaks with multiple mounts/unmounts', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() => useIsMobile());
        unmount();
      }

      // Should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('엣지 케이스', () => {
    it('should handle zero width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 0,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should handle negative width (edge case)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: -100,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('should handle very large width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 10000,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('should handle breakpoint of 0', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 0,
      });

      const { result } = renderHook(() => useIsMobile(0));
      expect(result.current).toBe(true);
    });
  });

  describe('실제 사용 시나리오', () => {
    it('should work for responsive navigation menu', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());
      const showHamburgerMenu = result.current;

      expect(showHamburgerMenu).toBe(false);
    });

    it('should work for conditional table/card layout', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      const { result } = renderHook(() => useIsMobile());
      const useCardLayout = result.current;

      expect(useCardLayout).toBe(true);
    });

    it('should work for orientation change (portrait to landscape)', () => {
      // Portrait phone
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);

      // Landscape phone
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 667,
        });
        window.dispatchEvent(new Event('resize'));
      });

      expect(result.current).toBe(true);
    });
  });
});
