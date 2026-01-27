import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTutorial } from '../../context/TutorialContext';

function TutorialOverlay() {
  const navigate = useNavigate();
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
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
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
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
        viewportTop: rect.top,
        viewportLeft: rect.left
      });

      // 타겟이 뷰포트 밖에 있으면 스크롤
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStepData]);

  // 툴팁 위치 계산
  useEffect(() => {
    if (!tooltipRef.current || isMobile) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const padding = 16;

    if (targetRect) {
      let top = targetRect.viewportTop + targetRect.height + padding;
      let left = targetRect.viewportLeft;

      // 화면 오른쪽을 넘어가면 조정
      if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding;
      }

      // 화면 아래를 넘어가면 위에 표시
      if (top + tooltipRect.height > window.innerHeight - padding) {
        top = targetRect.viewportTop - tooltipRect.height - padding;
      }

      // 화면 왼쪽을 넘어가면 조정
      if (left < padding) {
        left = padding;
      }

      setTooltipPosition({ top, left });
    } else {
      // 타겟이 없으면 화면 중앙
      setTooltipPosition({
        top: window.innerHeight / 2 - tooltipRect.height / 2,
        left: window.innerWidth / 2 - tooltipRect.width / 2
      });
    }
  }, [targetRect, isMobile, currentStep]);

  useEffect(() => {
    if (isActive) {
      updateTargetRect();

      const observer = new MutationObserver(() => {
        setTimeout(updateTargetRect, 100);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      window.addEventListener('scroll', updateTargetRect, true);

      return () => {
        observer.disconnect();
        window.removeEventListener('scroll', updateTargetRect, true);
      };
    }
  }, [isActive, updateTargetRect, currentStep]);

  const handleComplete = () => {
    if (currentStepData?.action === 'complete') {
      completeTutorial();
    } else {
      nextStep();
    }
  };

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

  return (
    <>
      {/* 배경 오버레이 - 인트로/완료 시에만 차단, 나머지는 클릭 가능 */}
      {isIntroOrComplete && (
        <div className="tutorial-backdrop" />
      )}

      {/* 타겟 하이라이트 */}
      {targetRect && !isIntroOrComplete && (
        <div
          className="tutorial-highlight"
          style={{
            top: targetRect.viewportTop - 4,
            left: targetRect.viewportLeft - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8
          }}
        />
      )}

      {/* 툴팁 */}
      <div
        ref={tooltipRef}
        className={`tutorial-tooltip ${isMobile ? 'mobile' : ''} ${isIntroOrComplete ? 'centered' : ''}`}
        style={!isMobile && !isIntroOrComplete ? {
          position: 'fixed',
          top: tooltipPosition.top,
          left: tooltipPosition.left
        } : undefined}
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
          {currentStepData?.action === 'navigate' && (
            <p className="tutorial-hint">메뉴를 클릭하면 자동으로 진행됩니다</p>
          )}
          {currentStepData?.action === 'click' && (
            <p className="tutorial-hint">하이라이트된 버튼을 클릭하세요</p>
          )}
          {currentStepData?.action === 'form' && (
            <p className="tutorial-hint">정보를 입력하고 저장하면 자동으로 진행됩니다</p>
          )}
          {currentStepData?.action === 'interact' && (
            <button className="btn btn-secondary btn-block" onClick={nextStep}>
              다음 단계로
            </button>
          )}
        </div>

        {/* 건너뛰기 */}
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
