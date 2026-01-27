import React from 'react';
import { useTutorial } from '../../context/TutorialContext';

function TutorialModal() {
  const {
    isOpen,
    currentPage,
    totalPages,
    currentPageData,
    closeTutorial,
    nextPage,
    prevPage,
    goToPage
  } = useTutorial();

  if (!isOpen) return null;

  const progress = ((currentPage + 1) / totalPages) * 100;
  const isLastPage = currentPage === totalPages - 1;
  const isFirstPage = currentPage === 0;

  return (
    <div className="tutorial-modal-overlay" onClick={closeTutorial}>
      <div className="tutorial-modal" onClick={e => e.stopPropagation()}>
        {/* Progress bar */}
        <div className="tutorial-progress">
          <div className="tutorial-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Header */}
        <div className="tutorial-header">
          <div className="tutorial-page-indicator">
            {currentPage + 1} / {totalPages}
          </div>
          <button className="tutorial-close-btn" onClick={closeTutorial}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="tutorial-content">
          <div className="tutorial-icon">{currentPageData.icon}</div>
          <h2 className="tutorial-title">{currentPageData.title}</h2>
          <p className="tutorial-description">{currentPageData.description}</p>

          <ul className="tutorial-features">
            {currentPageData.features.map((feature, index) => (
              <li key={index} className="tutorial-feature-item">
                <span className="tutorial-feature-number">{index + 1}</span>
                <span className="tutorial-feature-text">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Page dots */}
        <div className="tutorial-dots">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              className={`tutorial-dot ${index === currentPage ? 'active' : ''}`}
              onClick={() => goToPage(index)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="tutorial-footer">
          <button
            className="btn btn-ghost"
            onClick={prevPage}
            disabled={isFirstPage}
            style={{ visibility: isFirstPage ? 'hidden' : 'visible' }}
          >
            이전
          </button>

          <button className="btn btn-primary" onClick={nextPage}>
            {isLastPage ? '시작하기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TutorialModal;
