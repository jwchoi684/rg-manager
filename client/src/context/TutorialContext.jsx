import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// 세부 튜토리얼 스텝 정의 (개별 입력창 하이라이트)
const TUTORIAL_STEPS = [
  {
    id: 'intro',
    title: '튜토리얼 시작',
    description: '리듬체조 출석 관리 시스템의 사용법을 알아볼까요? 각 단계를 직접 따라해보세요.',
    targetSelector: null,
    requiredPath: null,
    action: 'start'
  },
  // 수업 등록 - 개별 입력창
  {
    id: 'class-name',
    title: '수업명 입력',
    description: '수업 이름을 입력하세요. (예: 초급반, 중급반)',
    targetSelector: '[data-tutorial="class-name"]',
    requiredPath: '/classes/new',
    action: 'input'
  },
  {
    id: 'class-schedule',
    title: '수업 시간 입력',
    description: '수업 요일과 시간을 입력하세요. (예: 월/수 14:00)',
    targetSelector: '[data-tutorial="class-schedule"]',
    requiredPath: '/classes/new',
    action: 'input'
  },
  {
    id: 'class-duration',
    title: '수업 길이 입력',
    description: '수업 시간(분)을 입력하세요. (예: 60, 90)',
    targetSelector: '[data-tutorial="class-duration"]',
    requiredPath: '/classes/new',
    action: 'input'
  },
  {
    id: 'class-submit',
    title: '수업 등록',
    description: '"등록하기" 버튼을 눌러 수업을 등록하세요.',
    targetSelector: '[data-tutorial="class-submit"]',
    requiredPath: '/classes/new',
    action: 'click'
  },
  // 학생 등록 - 개별 입력창
  {
    id: 'student-name',
    title: '학생 이름 입력',
    description: '학생 이름을 입력하세요.',
    targetSelector: '[data-tutorial="student-name"]',
    requiredPath: '/students/new',
    action: 'input'
  },
  {
    id: 'student-birthdate',
    title: '생년월일 입력',
    description: '학생의 생년월일을 선택하세요.',
    targetSelector: '[data-tutorial="student-birthdate"]',
    requiredPath: '/students/new',
    action: 'input'
  },
  {
    id: 'student-class',
    title: '수업 선택',
    description: '학생이 수강할 수업을 선택하세요.',
    targetSelector: '[data-tutorial="student-class"]',
    requiredPath: '/students/new',
    action: 'input'
  },
  {
    id: 'student-submit',
    title: '학생 등록',
    description: '"등록하기" 버튼을 눌러 학생을 등록하세요.',
    targetSelector: '[data-tutorial="student-submit"]',
    requiredPath: '/students/new',
    action: 'click'
  },
  // 출석 체크
  {
    id: 'check-attendance',
    title: '출석 체크하기',
    description: '수업을 선택하고 학생 카드를 클릭하면 출석이 체크됩니다.',
    targetSelector: '[data-tutorial="attendance-area"]',
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

  // 스텝 변경 시 필요한 페이지로 이동 (nextStep 호출 시에만)
  const prevStepRef = useRef(currentStep);

  useEffect(() => {
    // 스텝이 실제로 변경되었을 때만 네비게이션
    if (isActive && currentStepData?.requiredPath && prevStepRef.current !== currentStep) {
      prevStepRef.current = currentStep;
      // 현재 위치가 이미 목표 위치면 네비게이션 하지 않음
      if (location.pathname !== currentStepData.requiredPath) {
        navigate(currentStepData.requiredPath);
      }
    }
  }, [currentStep, isActive, currentStepData, navigate, location.pathname]);

  // 이미 처리된 스텝/경로 조합 추적 (중복 실행 방지)
  const processedRef = useRef({ step: -1, path: '' });

  // 경로 변경 감지 - 등록 후 목록으로 돌아오면 다음 스텝
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const { id, requiredPath } = currentStepData;
    let timeoutId = null;
    let shouldAdvance = false;

    // 이미 이 스텝/경로 조합에서 처리했으면 스킵
    if (processedRef.current.step === currentStep && processedRef.current.path === location.pathname) {
      return;
    }

    // class-submit 클릭 후 /classes로 이동하면 다음 스텝 (student-name)
    if (id === 'class-submit' && location.pathname === '/classes') {
      shouldAdvance = true;
    }
    // student-submit 클릭 후 /students로 이동하면 다음 스텝 (check-attendance)
    else if (id === 'student-submit' && location.pathname === '/students') {
      shouldAdvance = true;
    }

    if (shouldAdvance) {
      processedRef.current = { step: currentStep, path: location.pathname };
      timeoutId = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 300);
    }

    // 클린업: 컴포넌트 언마운트 또는 의존성 변경 시 타임아웃 취소
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
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
