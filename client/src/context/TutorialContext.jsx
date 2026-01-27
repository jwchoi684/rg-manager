import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// 세부 튜토리얼 스텝 정의
const TUTORIAL_STEPS = [
  {
    id: 'intro',
    title: '튜토리얼 시작',
    description: '리듬체조 출석 관리 시스템의 사용법을 알아볼까요? 각 단계를 직접 따라해보세요.',
    targetSelector: null,
    targetPath: null,
    action: 'start'
  },
  {
    id: 'go-to-classes',
    title: '수업 관리로 이동',
    description: '먼저 수업을 등록해봅시다. "수업 관리" 메뉴를 클릭하세요.',
    targetSelector: '[data-tutorial="classes"]',
    targetPath: null,
    expectedPath: '/classes',
    action: 'navigate'
  },
  {
    id: 'click-new-class',
    title: '새 수업 등록',
    description: '"+ 새 수업 등록" 버튼을 클릭하세요.',
    targetSelector: '[data-tutorial-action="new-class"]',
    targetPath: '/classes',
    expectedPath: '/classes/new',
    action: 'click'
  },
  {
    id: 'fill-class-form',
    title: '수업 정보 입력',
    description: '수업명, 수업 시간, 시간(분) 등을 입력하고 저장하세요.',
    targetSelector: '[data-tutorial-action="class-form"]',
    targetPath: '/classes/new',
    expectedPath: '/classes',
    action: 'form'
  },
  {
    id: 'go-to-students',
    title: '학생 관리로 이동',
    description: '이제 학생을 등록해봅시다. "학생 관리" 메뉴를 클릭하세요.',
    targetSelector: '[data-tutorial="students"]',
    targetPath: '/classes',
    expectedPath: '/students',
    action: 'navigate'
  },
  {
    id: 'click-new-student',
    title: '새 학생 등록',
    description: '"+ 새 학생 등록" 버튼을 클릭하세요.',
    targetSelector: '[data-tutorial-action="new-student"]',
    targetPath: '/students',
    expectedPath: '/students/new',
    action: 'click'
  },
  {
    id: 'fill-student-form',
    title: '학생 정보 입력',
    description: '학생 이름, 생년월일을 입력하고 수업을 선택한 후 저장하세요.',
    targetSelector: '[data-tutorial-action="student-form"]',
    targetPath: '/students/new',
    expectedPath: '/students',
    action: 'form'
  },
  {
    id: 'go-to-attendance',
    title: '출석 체크로 이동',
    description: '이제 출석을 체크해봅시다. "출석 체크" 메뉴를 클릭하세요.',
    targetSelector: '[data-tutorial="attendance"]',
    targetPath: '/students',
    expectedPath: '/attendance',
    action: 'navigate'
  },
  {
    id: 'check-attendance',
    title: '출석 체크하기',
    description: '수업을 선택하고 학생의 출석을 체크해보세요. 학생 카드를 클릭하면 출석이 체크됩니다.',
    targetSelector: '[data-tutorial-action="attendance-check"]',
    targetPath: '/attendance',
    expectedPath: null,
    action: 'interact'
  },
  {
    id: 'go-to-student-attendance',
    title: '학생별 출석 확인',
    description: '마지막으로 학생별 출석 현황을 확인해봅시다. "학생별 출석" 메뉴를 클릭하세요.',
    targetSelector: '[data-tutorial="student-attendance"]',
    targetPath: '/attendance',
    expectedPath: '/student-attendance',
    action: 'navigate'
  },
  {
    id: 'complete',
    title: '튜토리얼 완료!',
    description: '축하합니다! 이제 리듬체조 출석 관리 시스템을 자유롭게 사용할 수 있습니다.',
    targetSelector: null,
    targetPath: '/student-attendance',
    action: 'complete'
  }
];

const STORAGE_KEY = 'tutorial_completed';

const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const currentStepData = TUTORIAL_STEPS[currentStep];

  // 경로 변경 감지하여 자동으로 다음 스텝으로 이동
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const { expectedPath, action } = currentStepData;

    if (expectedPath && location.pathname === expectedPath) {
      // 예상 경로에 도달하면 다음 스텝으로
      if (action === 'navigate' || action === 'click' || action === 'form') {
        setTimeout(() => {
          if (currentStep < TUTORIAL_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
          }
        }, 300);
      }
    }
  }, [location.pathname, isActive, currentStepData, currentStep]);

  const startTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    setIsMinimized(false);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setHasCompletedTutorial(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const completeTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setHasCompletedTutorial(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  // 특정 액션 완료 시 호출 (폼 저장 등)
  const completeAction = useCallback((actionId) => {
    if (!isActive || !currentStepData) return;

    if (currentStepData.id === actionId || currentStepData.action === 'interact') {
      nextStep();
    }
  }, [isActive, currentStepData, nextStep]);

  const value = {
    isActive,
    currentStep,
    isMinimized,
    hasCompletedTutorial,
    steps: TUTORIAL_STEPS,
    totalSteps: TUTORIAL_STEPS.length,
    currentStepData,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    toggleMinimize,
    completeAction
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}

export { TUTORIAL_STEPS };
