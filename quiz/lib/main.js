// @ts-check

;(async () => {
  initTheme();
  await loadCatalog();
  const streakCount = getDailyStreak();
  if (streakCount > 0) {
    const badge = document.getElementById('daily-streak-badge');
    if (badge) {
      document.getElementById('daily-streak-count').textContent = streakCount;
      badge.classList.remove('hidden');
      badge.classList.remove('streak-enter');
      void badge.offsetWidth;
      badge.classList.add('streak-enter');
    }
  }
  const params = new URLSearchParams(window.location.search);
  const courseParam = params.get('course');
  const qParam = params.get('q');
  const chParam = params.get('c');
  if (courseParam && fullCatalog.includes(courseParam)) {
    markCourseSeen(courseParam);
    selectCourseItem(courseParam);
    let ch = '001';
    if (chParam) {
      const chNum = parseInt(chParam, 10);
      if (!isNaN(chNum) && chNum >= 1) ch = String(chNum).padStart(3, '0');
    }
    const moduleUrl = `${BASE_URL}${courseParam}/${ch}.json`;
    if (qParam) {
      await showPreviewScreen(moduleUrl, parseInt(qParam, 10) - 1);
    } else {
      await initializeQuiz(moduleUrl);
    }
  }
})();

document.getElementById('share-btn')?.addEventListener('click', shareHandler);
document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, select, textarea')) return;
  if (document.getElementById('error-overlay')?.classList.contains('hidden') === false) return;

  const quizHidden = document.getElementById('quiz-container')?.classList.contains('hidden');
  const previewHidden = document.getElementById('preview-container')?.classList.contains('hidden');

  if (!quizHidden) {
    const opts = document.querySelectorAll('#options-bin .option-btn');
    const idx = parseInt(e.key, 10) - 1;
    if (idx >= 0 && idx < opts.length && !opts[idx].disabled) {
      opts[idx].click();
      return;
    }

    // True/False keyboard shortcuts (T for True, F for False)
    if (currentMode === 'truefalse') {
      const tfBtns = document.querySelectorAll('.tf-btn');
      if (e.key.toLowerCase() === 't' && tfBtns[0] && !tfBtns[0].disabled) {
        tfBtns[0].click();
        return;
      }
      if (e.key.toLowerCase() === 'f' && tfBtns[1] && !tfBtns[1].disabled) {
        tfBtns[1].click();
        return;
      }
    }

    // Fill-blank: Enter submits
    if (currentMode === 'fillblank' && e.key === 'Enter') {
      const fillBtn = document.getElementById('fillblank-submit');
      if (fillBtn && !fillBtn.disabled) {
        fillBtn.click();
        return;
      }
    }

    // Flashcard: 1 = Got it, 2 = Missed it
    if (currentMode === 'flashcard' && !document.getElementById('flashcard-ui').classList.contains('hidden')) {
      if (e.key === '1') { document.getElementById('flashcard-got-it')?.click(); return; }
      if (e.key === '2') { document.getElementById('flashcard-missed')?.click(); return; }
    }

    if (e.key === 'Enter') {
      const nextBtn = document.getElementById('next-btn');
      if (nextBtn && !nextBtn.classList.contains('hidden')) {
        nextBtn.click();
      }
    }
  }

  if (!previewHidden && e.key === 'Enter') {
    document.querySelector('button[onclick="startFromPreview()"]')?.click();
  }
});
