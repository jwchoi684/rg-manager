import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// 세부 튜토리얼 스텝 정의
const TUTORIAL_STEPS = [
  {
    id: 'intro',
    title: '튜토리얼 시작',
    description: '리듬체조 출석 관리 시스템의 사용법을 알아볼까요? 각 단계를 직접 따라해보세요.',
    targetSelector: null,
    requiredPath: null,
    action: 'start'
  },
  {
    id: 'click-new-class',
    title: '새 수업 등록',
    description: '"+ 새 수업 등록" 버튼을 클릭해서 수업을 등록해보세요.',
    targetSelector: '[data-tutorial-action="new-class"]',
    requiredPath: '/classes',
    action: 'click'
  },
  {
    id: 'fill-class-form',
    title: '수업 정보 입력',
    description: '수업명, 수업 시간, 시간(분)을 입력하고 "등록하기" 버튼을 누르세요.',
    targetSelector: '[data-tutorial-action="class-form"]',
    requiredPath: '/classes/new',
    action: 'form'
  },
  {
    id: 'click-new-student',
    title: '새 학생 등록',
    description: '이제 학생을 등록해봅시다. "+ 새 학생 등록" 버튼을 클릭하세요.',
    targetSelector: '[data-tutorial-action="new-student"]',
    requiredPath: '/students',
    action: 'click'
  },
  {
    id: 'fill-student-form',
    title: '학생 정보 입력',
    description: '학생 이름, 생년월일을 입력하고 수업을 선택한 후 "등록하기" 버튼을 누르세요.',
    targetSelector: '[data-tutorial-action="student-form"]',
    requiredPath: '/students/new',
    action: 'form'
  },
  {
    id: 'check-attendance',
    title: '출석 체크하기',
    description: '수업을 선택하고 학생 카드를 클릭하면 출석이 체크됩니다. 체크해보세요!',
    targetSelector: '[data-tutorial-action="attendance-check"]',
    requiredPath: '/attendance',
    action: 'interact'
  },
  {
    id: 'view-student-attendance',
    title: '학생별 출석 확인',
    description: '이곳에서 학생별로 출석 현황을 확인할 수 있습니다.',
    targetSelector: null,
    requiredPath: '/student-attendance',
    action: 'view'
  },
  {
    id: 'complete',
    title: '튜토리얼 완료!',
    description: '축하합니다! 이제 리듬체조 출석 관리 시스템을 자유롭게 사용할 수 있습니다.',
    targetSelector: null,
    requiredPath: null,
    action: 'complete'
  }
];

const STORAGE_KEY = 'tutorial_completed';

const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const currentStepData = TUTORIAL_STEPS[currentStep];

  // 현재 스텝에 필요한 페이지로 이동
  const navigateToRequiredPath = useCallback((step) => {
    const stepData = TUTORIAL_STEPS[step];
    if (stepData?.requiredPath && location.pathname !== stepData.requiredPath) {
      navigate(stepData.requiredPath);
    }
  }, [location.pathname, navigate]);

  // 스텝 변경 시 필요한 페이지로 이동
  useEffect(() => {
    if (isActive && currentStepData?.requiredPath) {
      navigateToRequiredPath(currentStep);
    }
  }, [currentStep, isActive, currentStepData, navigateToRequiredPath]);

  // 경로 변경 감지 - form 액션에서 저장 후 목록으로 돌아오면 다음 스텝
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const { action, requiredPath } = currentStepData;

    // form 액션: /classes/new -> /classes 또는 /students/new -> /students 이동 감지
    if (action === 'form') {
      if (requiredPath === '/classes/new' && location.pathname === '/classes') {
        // 수업 등록 완료 -> 다음 스텝 (학생 등록)
        setTimeout(() => setCurrentStep(prev => prev + 1), 300);
      } else if (requiredPath === '/students/new' && location.pathname === '/students') {
        // 학생 등록 완료 -> 다음 스텝 (출석 체크)
        setTimeout(() => setCurrentStep(prev => prev + 1), 300);
      }
    }

    // click 액션: 버튼 클릭 후 페이지 이동 감지
    if (action === 'click') {
      if (requiredPath === '/classes' && location.pathname === '/classes/new') {
        // 새 수업 등록 버튼 클릭 -> 다음 스텝
        setTimeout(() => setCurrentStep(prev => prev + 1), 300);
      } else if (requiredPath === '/students' && location.pathname === '/students/new') {
        // 새 학생 등록 버튼 클릭 -> 다음 스텝
        setTimeout(() => setCurrentStep(prev => prev + 1), 300);
      }
    }
  }, [location.pathname, isActive, currentStepData]);

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

  const goToStep = useCallback((step) => {
    if (step >= 0 && step < TUTORIAL_STEPS.length) {
      setCurrentStep(step);
    }
  }, []);

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
    goToStep,
    skipTutorial,
    completeTutorial,
    toggleMinimize
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
