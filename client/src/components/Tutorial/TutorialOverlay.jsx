import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTutorial } from '../../context/TutorialContext';

function TutorialOverlay() {
  const {
    isActive,
    currentStep,
    totalSteps,
    currentStepData,
    isMinimized,
    nextStep,
    skipTutorial,
    completeTutorial,
    toggleMinimize
  } = useTutorial();

  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState('bottom');
  const [isReady, setIsReady] = useState(false);
  const tooltipRef = useRef(null);
  const overlayRef = useRef(null);

  // 타겟 요소 위치 업데이트
  const updateTargetRect = useCallback(() => {
    if (!currentStepData?.targetSelector) {
      setTargetRect(null);
      setIsReady(true);
      return;
    }

    const targetElement = document.querySelector(currentStepData.targetSelector);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const padding = 8;

      const newRect = {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        bottom: rect.bottom + padding,
        right: rect.right + padding,
        elementTop: rect.top,
        elementBottom: rect.bottom
      };

      setTargetRect(newRect);

      // 툴팁 위치 결정 (타겟 위 또는 아래)
      const viewportHeight = window.innerHeight;
      const spaceAbove = rect.top;
      const spaceBelow = viewportHeight - rect.bottom;

      // 아래 공간이 200px 이상이면 아래에, 아니면 위에
      if (spaceBelow >= 200) {
        setTooltipPosition('bottom');
      } else if (spaceAbove >= 200) {
        setTooltipPosition('top');
      } else {
        // 둘 다 부족하면 더 넓은 쪽에
        setTooltipPosition(spaceBelow >= spaceAbove ? 'bottom' : 'top');
      }

      // 타겟이 뷰포트 밖에 있으면 스크롤
      const tooltipHeight = 180; // 예상 툴팁 높이
      const margin = 20;

      if (rect.top < margin + (tooltipPosition === 'top' ? tooltipHeight : 0)) {
        // 타겟이 너무 위에 있음 - 아래로 스크롤
        window.scrollTo({
          top: window.scrollY + rect.top - margin - (tooltipPosition === 'top' ? tooltipHeight + 20 : 80),
          behavior: 'smooth'
        });
      } else if (rect.bottom > viewportHeight - margin - (tooltipPosition === 'bottom' ? tooltipHeight : 0)) {
        // 타겟이 너무 아래에 있음 - 위로 스크롤
        window.scrollTo({
          top: window.scrollY + rect.bottom - viewportHeight + margin + (tooltipPosition === 'bottom' ? tooltipHeight + 20 : 80),
          behavior: 'smooth'
        });
      }

      setIsReady(true);
    } else {
      setTargetRect(null);
      setIsReady(true);
    }
  }, [currentStepData, tooltipPosition]);

  // 스텝 변경 시 초기화 및 업데이트
  useEffect(() => {
    if (isActive && !isMinimized) {
      setIsReady(false);

      // 페이지 렌더링 대기 후 타겟 업데이트
      const timer = setTimeout(() => {
        updateTargetRect();
      }, 300);

      // DOM 변화 감지
      const observer = new MutationObserver(() => {
        setTimeout(updateTargetRect, 100);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // 스크롤 이벤트
      const handleScroll = () => {
        requestAnimationFrame(updateTargetRect);
      };
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', updateTargetRect);

      return () => {
        clearTimeout(timer);
        observer.disconnect();
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', updateTargetRect);
      };
    }
  }, [isActive, isMinimized, updateTargetRect, currentStep]);

  if (!isActive) return null;

  const isIntroOrComplete = currentStepData?.action === 'start' || currentStepData?.action === 'complete';
  const isFormStep = currentStepData?.action === 'form';
  const progress = ((currentStep) / (totalSteps - 1)) * 100;

  // 최소화된 상태
  if (isMinimized) {
    return (
      <button
        className="tutorial-minimized"
        onClick={toggleMinimize}
      >
        <span className="tutorial-minimized-icon">📖</span>
        <span className="tutorial-minimized-text">튜토리얼</span>
        <span className="tutorial-minimized-step">{currentStep + 1}/{totalSteps}</span>
      </button>
    );
  }

  // 힌트 아이콘
  const getHintIcon = () => {
    switch (currentStepData?.action) {
      case 'click': return '👆';
      case 'form': return '✏️';
      case 'interact': return '👆';
      case 'view': return '👀';
      default: return null;
    }
  };

  // 힌트 메시지
  const getHintMessage = () => {
    switch (currentStepData?.action) {
      case 'click': return '버튼을 클릭하세요';
      case 'form': return '정보를 입력하세요';
      case 'interact': return '직접 체험해보세요';
      case 'view': return '확인해보세요';
      default: return null;
    }
  };

  // 4개 오버레이로 스포트라이트 효과 생성
  const getOverlayParts = () => {
    // form 스텝에서는 오버레이를 표시하지 않음 (입력창을 가리지 않도록)
    if (!targetRect || isIntroOrComplete || isFormStep) return null;

    const overlayStyle = {
      position: 'fixed',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      pointerEvents: 'none',
      zIndex: 9998
    };

    return (
      <>
        {/* 상단 */}
        <div style={{ ...overlayStyle, top: 0, left: 0, right: 0, height: targetRect.top }} />
        {/* 하단 */}
        <div style={{ ...overlayStyle, top: targetRect.bottom, left: 0, right: 0, bottom: 0 }} />
        {/* 좌측 */}
        <div style={{ ...overlayStyle, top: targetRect.top, left: 0, width: targetRect.left, height: targetRect.height }} />
        {/* 우측 */}
        <div style={{ ...overlayStyle, top: targetRect.top, left: targetRect.right, right: 0, height: targetRect.height }} />
      </>
    );
  };

  // 툴팁 위치 스타일
  const getTooltipStyle = () => {
    if (isIntroOrComplete || !targetRect) {
      return {}; // centered 클래스가 처리
    }

    const margin = 16;
    const style = {
      position: 'fixed',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '400px'
    };

    // form 스텝에서는 하단에 고정 (입력창을 가리지 않도록)
    if (isFormStep) {
      delete style.top;
      style.bottom = `${margin}px`;
      return style;
    }

    if (tooltipPosition === 'bottom') {
      style.top = `${Math.min(targetRect.bottom + margin, window.innerHeight - 200)}px`;
    } else {
      style.bottom = `${window.innerHeight - targetRect.top + margin}px`;
    }

    return style;
  };

  return (
    <>
      {/* 인트로/완료 시 전체 배경 */}
      {isIntroOrComplete && (
        <div className="tutorial-backdrop" />
      )}

      {/* 스포트라이트 오버레이 (4개 영역) - form 스텝에서는 표시 안함 */}
      {targetRect && !isIntroOrComplete && !isFormStep && isReady && getOverlayParts()}

      {/* 타겟 하이라이트 테두리 + 펄스 애니메이션 - form 스텝에서는 표시 안함 */}
      {targetRect && !isIntroOrComplete && !isFormStep && isReady && (
        <div
          className="tutorial-spotlight-ring"
          style={{
            position: 'fixed',
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            pointerEvents: 'none',
            zIndex: 9999
          }}
        />
      )}

      {/* 툴팁 */}
      <div
        ref={tooltipRef}
        className={`tutorial-tooltip-v2 ${isIntroOrComplete ? 'centered' : ''} ${isFormStep ? 'form-step' : ''}`}
        style={!isIntroOrComplete ? getTooltipStyle() : {}}
      >
        {/* 진행 바 */}
        <div className="tutorial-v2-progress">
          <div className="tutorial-v2-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* 헤더 */}
        <div className="tutorial-v2-header">
          <div className="tutorial-v2-step">{currentStep + 1} / {totalSteps}</div>
          <div className="tutorial-v2-actions">
            {!isIntroOrComplete && (
              <button className="tutorial-v2-icon-btn" onClick={toggleMinimize} title="최소화">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            )}
            <button className="tutorial-v2-icon-btn" onClick={skipTutorial} title="닫기">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="tutorial-v2-body">
          <h3 className="tutorial-v2-title">{currentStepData?.title}</h3>
          <p className="tutorial-v2-description">{currentStepData?.description}</p>
        </div>

        {/* 하단 액션 */}
        <div className="tutorial-v2-footer">
          {currentStepData?.action === 'start' && (
            <button className="tutorial-v2-btn primary" onClick={nextStep}>
              시작하기
            </button>
          )}
          {currentStepData?.action === 'complete' && (
            <button className="tutorial-v2-btn primary" onClick={completeTutorial}>
              완료
            </button>
          )}
          {getHintMessage() && (
            <div className="tutorial-v2-hint">
              <span className="tutorial-v2-hint-icon">{getHintIcon()}</span>
              <span className="tutorial-v2-hint-text">{getHintMessage()}</span>
              {(currentStepData?.action === 'interact' || currentStepData?.action === 'view') && (
                <button className="tutorial-v2-btn small" onClick={nextStep}>
                  다음
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default TutorialOverlay;
