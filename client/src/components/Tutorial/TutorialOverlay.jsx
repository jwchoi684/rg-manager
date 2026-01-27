import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTutorial } from '../../context/TutorialContext';

function TutorialOverlay() {
  const navigate = useNavigate();
  const {
    isActive,
    currentStep,
    steps,
    currentStepData,
    nextStep,
    prevStep,
    skipTutorial
  } = useTutorial();

  const [targetRect, setTargetRect] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateTargetRect = useCallback(() => {
    if (!currentStepData) return;

    const targetElement = document.querySelector(`[data-tutorial="${currentStepData.menuId}"]`);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    } else {
      setTargetRect(null);
    }
  }, [currentStepData]);

  useEffect(() => {
    if (isActive) {
      // body 스크롤 방지
      document.body.style.overflow = 'hidden';
      updateTargetRect();

      // 리사이즈 시 위치 업데이트
      window.addEventListener('resize', updateTargetRect);
      window.addEventListener('scroll', updateTargetRect);

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('resize', updateTargetRect);
        window.removeEventListener('scroll', updateTargetRect);
      };
    }
  }, [isActive, updateTargetRect]);

  useEffect(() => {
    if (isActive && currentStepData) {
      // 짧은 딜레이 후 타겟 위치 업데이트
      const timer = setTimeout(updateTargetRect, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentStep, updateTargetRect, currentStepData]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      nextStep();
    } else {
      skipTutorial();
    }
  };

  const handleMenuClick = () => {
    if (currentStepData) {
      navigate(currentStepData.targetPath);
      handleNext();
    }
  };

  if (!isActive) return null;

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="tutorial-overlay">
      {/* Spotlight 효과 - 데스크톱에서만 */}
      {!isMobile && targetRect && (
        <div
          className="tutorial-spotlight"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16
          }}
        />
      )}

      {/* 툴팁/카드 */}
      <div className={`tutorial-tooltip ${isMobile ? 'mobile' : ''}`}>
        {/* 진행 상태 */}
        <div className="tutorial-progress">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`tutorial-progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            />
          ))}
        </div>

        {/* 단계 표시 */}
        <div className="tutorial-step-indicator">
          {currentStep + 1} / {steps.length}
        </div>

        {/* 내용 */}
        <h3 className="tutorial-title">{currentStepData?.title}</h3>
        <p className="tutorial-description">{currentStepData?.description}</p>

        {/* 메뉴 이동 버튼 */}
        <button
          className="btn btn-primary btn-block tutorial-action-btn"
          onClick={handleMenuClick}
        >
          {currentStepData?.title.replace('하기', '')} 메뉴로 이동
        </button>

        {/* 네비게이션 버튼 */}
        <div className="tutorial-nav">
          <button
            className="btn btn-ghost"
            onClick={skipTutorial}
          >
            건너뛰기
          </button>
          <div className="tutorial-nav-buttons">
            {currentStep > 0 && (
              <button
                className="btn btn-secondary"
                onClick={prevStep}
              >
                이전
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={handleNext}
            >
              {isLastStep ? '완료' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialOverlay;
