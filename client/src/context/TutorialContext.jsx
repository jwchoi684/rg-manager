import React, { createContext, useContext, useState, useCallback } from 'react';

const TUTORIAL_PAGES = [
  {
    id: 'welcome',
    title: '리듬체조 출석 관리 시스템',
    description: '리듬체조 학원의 학생, 수업, 출석, 대회를 효율적으로 관리할 수 있는 시스템입니다.',
    icon: '🎀',
    features: [
      '학생 정보 등록 및 관리',
      '수업 생성 및 학생 배정',
      '간편한 출석 체크',
      '대회 일정 및 참가자 관리'
    ]
  },
  {
    id: 'class-management',
    title: '수업 관리',
    description: '수업을 생성하고 관리하세요.',
    icon: '📚',
    features: [
      '수업 메뉴에서 "새 수업" 버튼 클릭',
      '수업명, 수업 시간, 수업 길이 입력',
      '"등록하기" 버튼으로 수업 생성',
      '수업 목록에서 학생 배정 가능'
    ]
  },
  {
    id: 'student-management',
    title: '학생 관리',
    description: '학생을 등록하고 수업에 배정하세요.',
    icon: '👥',
    features: [
      '학생 메뉴에서 "새 학생" 버튼 클릭',
      '이름, 생년월일 입력',
      '수강할 수업 선택',
      '"등록하기" 버튼으로 학생 등록'
    ]
  },
  {
    id: 'attendance',
    title: '출석 체크',
    description: '수업별로 간편하게 출석을 체크하세요.',
    icon: '✅',
    features: [
      '출석 체크 메뉴로 이동',
      '날짜와 수업 선택',
      '학생 카드를 클릭하여 출석 체크',
      '다시 클릭하면 출석 취소'
    ]
  },
  {
    id: 'competition-create',
    title: '대회 생성',
    description: '대회 일정을 등록하세요.',
    icon: '🏆',
    features: [
      '대회 관리 메뉴에서 "새 대회" 버튼 클릭',
      '대회명, 날짜, 장소 입력',
      '세부 종목 정보 입력 (선택)',
      '"등록하기" 버튼으로 대회 생성'
    ]
  },
  {
    id: 'competition-manage',
    title: '대회 참가자 관리',
    description: '대회에 참가할 학생을 관리하세요.',
    icon: '🎖️',
    features: [
      '대회 목록에서 "학생 관리" 버튼 클릭',
      '참가할 학생 선택',
      '종목별 참가 여부 설정',
      '학생별 대회 메뉴에서 전체 현황 확인'
    ]
  }
];

const STORAGE_KEY = 'tutorial_completed';

const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const startTutorial = useCallback(() => {
    setCurrentPage(0);
    setIsOpen(true);
  }, []);

  const closeTutorial = useCallback(() => {
    setIsOpen(false);
    setHasCompletedTutorial(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const nextPage = useCallback(() => {
    if (currentPage < TUTORIAL_PAGES.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      closeTutorial();
    }
  }, [currentPage, closeTutorial]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((page) => {
    if (page >= 0 && page < TUTORIAL_PAGES.length) {
      setCurrentPage(page);
    }
  }, []);

  const value = {
    isOpen,
    currentPage,
    totalPages: TUTORIAL_PAGES.length,
    currentPageData: TUTORIAL_PAGES[currentPage],
    pages: TUTORIAL_PAGES,
    hasCompletedTutorial,
    startTutorial,
    closeTutorial,
    nextPage,
    prevPage,
    goToPage
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

export { TUTORIAL_PAGES };
