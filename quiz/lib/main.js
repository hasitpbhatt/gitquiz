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
    }
  }
  const params = new URLSearchParams(window.location.search);
  const courseParam = params.get('course');
  const qParam = params.get('q');
  const chParam = params.get('c');
  if (courseParam && fullCatalog.includes(courseParam)) {
    const dropdown = document.getElementById('course-dropdown');
    dropdown.value = courseParam;
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
