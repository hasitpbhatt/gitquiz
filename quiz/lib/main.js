// @ts-check

;(async () => {
  await loadCatalog();
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
