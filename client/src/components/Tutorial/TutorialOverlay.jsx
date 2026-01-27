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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      updateTargetRect();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateTargetRect = useCallback(() => {
    if (!currentStepData?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const targetElement = document.querySelector(currentStepData.targetSelector);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });

      // 타겟이 뷰포트 밖에 있으면 스크롤
      if (rect.top < 100 || rect.bottom > window.innerHeight - 100) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStepData]);

  useEffect(() => {
    if (isActive && !isMinimized) {
      // 딜레이 후 타겟 업데이트 (페이지 렌더링 대기)
      const timer = setTimeout(updateTargetRect, 200);

      const observer = new MutationObserver(() => {
        setTimeout(updateTargetRect, 100);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      window.addEventListener('scroll', updateTargetRect, true);

      return () => {
        clearTimeout(timer);
        observer.disconnect();
        window.removeEventListener('scroll', updateTargetRect, true);
      };
    }
  }, [isActive, isMinimized, updateTargetRect, currentStep]);

  if (!isActive) return null;

  const isIntroOrComplete = currentStepData?.action === 'start' || currentStepData?.action === 'complete';
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

  // 힌트 메시지
  const getHintMessage = () => {
    switch (currentStepData?.action) {
      case 'click':
        return '👆 하이라이트된 버튼을 클릭하세요';
      case 'form':
        return '✏️ 정보를 입력하고 저장하세요';
      case 'interact':
        return '👆 직접 체험해보세요';
      case 'view':
        return '👀 확인해보세요';
      default:
        return null;
    }
  };

  return (
    <>
      {/* 배경 오버레이 - 인트로/완료 시에만 */}
      {isIntroOrComplete && (
        <div className="tutorial-backdrop" />
      )}

      {/* 타겟 하이라이트 - 클릭 가능하도록 pointer-events: none */}
      {targetRect && !isIntroOrComplete && (
        <div
          className="tutorial-highlight"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8
          }}
        />
      )}

      {/* 툴팁 - 모바일에서 폼/인터랙션 시 상단, 그 외 하단 고정 */}
      <div
        ref={tooltipRef}
        className={`tutorial-tooltip ${isIntroOrComplete ? 'centered' : (isMobile && (currentStepData?.action === 'form' || currentStepData?.action === 'interact') ? 'top-fixed' : 'bottom-fixed')}`}
      >
        {/* 헤더 */}
        <div className="tutorial-tooltip-header">
          <div className="tutorial-progress-bar">
            <div
              className="tutorial-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="tutorial-header-content">
            <span className="tutorial-step-badge">
              {currentStep + 1} / {totalSteps}
            </span>
            <div className="tutorial-header-actions">
              {!isIntroOrComplete && (
                <button
                  className="tutorial-icon-btn"
                  onClick={toggleMinimize}
                  title="최소화"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              )}
              <button
                className="tutorial-icon-btn"
                onClick={skipTutorial}
                title="닫기"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 내용 */}
        <div className="tutorial-tooltip-body">
          <h3 className="tutorial-title">{currentStepData?.title}</h3>
          <p className="tutorial-description">{currentStepData?.description}</p>
        </div>

        {/* 액션 버튼 */}
        <div className="tutorial-tooltip-footer">
          {currentStepData?.action === 'start' && (
            <button className="btn btn-primary btn-block" onClick={nextStep}>
              시작하기
            </button>
          )}
          {currentStepData?.action === 'complete' && (
            <button className="btn btn-primary btn-block" onClick={completeTutorial}>
              완료
            </button>
          )}
          {getHintMessage() && (
            <div className="tutorial-hint-row">
              <p className="tutorial-hint">{getHintMessage()}</p>
              {(currentStepData?.action === 'interact' || currentStepData?.action === 'view') && (
                <button className="btn btn-primary btn-sm" onClick={nextStep}>
                  다음
                </button>
              )}
            </div>
          )}
        </div>

        {/* 건너뛰기 링크 */}
        {!isIntroOrComplete && (
          <button className="tutorial-skip-link" onClick={skipTutorial}>
            튜토리얼 건너뛰기
          </button>
        )}
      </div>
    </>
  );
}

export default TutorialOverlay;
