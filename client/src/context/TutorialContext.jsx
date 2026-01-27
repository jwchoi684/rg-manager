import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const TUTORIAL_STEPS = [
  {
    id: 'classes',
    title: '수업 등록하기',
    description: '먼저 수업을 등록해보세요. 수업명, 요일, 시간을 설정할 수 있습니다.',
    targetPath: '/classes',
    menuId: 'classes'
  },
  {
    id: 'students',
    title: '학생 등록하기',
    description: '학생을 등록하고 수업에 배정해보세요.',
    targetPath: '/students',
    menuId: 'students'
  },
  {
    id: 'attendance',
    title: '출석 체크하기',
    description: '수업별로 학생들의 출석을 체크할 수 있습니다.',
    targetPath: '/attendance',
    menuId: 'attendance'
  },
  {
    id: 'student-attendance',
    title: '출석 현황 확인',
    description: '학생별로 출석 현황을 확인하고 관리할 수 있습니다.',
    targetPath: '/student-attendance',
    menuId: 'student-attendance'
  }
];

const STORAGE_KEY = 'tutorial_completed';

const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const startTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
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

  const value = {
    isActive,
    currentStep,
    hasCompletedTutorial,
    steps: TUTORIAL_STEPS,
    currentStepData: TUTORIAL_STEPS[currentStep],
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial
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
