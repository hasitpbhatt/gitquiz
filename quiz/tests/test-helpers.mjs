export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function filterCatalogItems(catalog, typeFilter, searchQuery) {
  const query = String(searchQuery).toLowerCase();
  return catalog.filter(name => {
    const matchesType = typeFilter === 'all' || name.startsWith(typeFilter + '-');
    const matchesSearch = name.toLowerCase().replace(/-/g, ' ').includes(query);
    return matchesType && matchesSearch;
  });
}

export function formatCourseName(name, showEmoji) {
  const cleanName = name.replace(/^(book|podcast|coursera|course)-/i, '');
  const displayName = cleanName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return displayName;
}

export function buildCatalogOptions(items, typeFilter) {
  if (items.length === 0) return [];
  return items.map(name => {
    const cleanName = name.replace(/^(book|podcast|coursera|course)-/i, '');
    const displayName = cleanName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    let html = displayName;
    return { value: name, text: displayName, html };
  });
}

export function getShareUrl(currentUrl, baseUrl, questionIdx = 1) {
  if (!currentUrl) return baseUrl;
  const parts = currentUrl.split('/');
  const modFile = parts.pop();
  const courseFolderName = parts.pop();
  const chapterNum = modFile.replace('.json', '');
  return baseUrl + '?course=' + encodeURIComponent(courseFolderName) + '&c=' + chapterNum + '&q=' + questionIdx;
}

export function calculateScore(currentScore, streak, _timeSpent) {
  const basePoints = 100;
  const streakBonus = streak > 2 ? 20 : 0;
  return currentScore + basePoints + streakBonus;
}

export function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function calculateNewStreak(lastDate, lastCount, todayStr) {
  if (!lastDate) return 1;
  if (lastDate === todayStr) return lastCount;
  const d = new Date(Number(todayStr.slice(0, 4)), Number(todayStr.slice(5, 7)) - 1, Number(todayStr.slice(8, 10)));
  d.setDate(d.getDate() - 1);
  const yesterdayStr = d.toISOString().slice(0, 10);
  return lastDate === yesterdayStr ? (lastCount || 0) + 1 : 1;
}

// ---------- 50/50 Lifeline helpers ----------

export function getLifelineStateHelper(courseKey, lifelineData = {}) {
  return lifelineData[courseKey] || {};
}

export function markLifelineUsedHelper(courseKey, lifelineData = {}) {
  const data = { ...lifelineData };
  data[courseKey] = { fifty: true };
  return data;
}

export function clearLifelinesHelper() {
  return {};
}

// ---------- Confidence helpers ----------

export function storeConfidenceHelper(courseKey, idx, level, masteryData = {}) {
  const key = `${courseKey}_${idx}`;
  const data = { ...masteryData };
  if (!data[key]) data[key] = { correctMC: 0, flashcardMissed: false };
  data[key].confidence = level;
  return data;
}

export function getConfidenceHelper(courseKey, idx, masteryData = {}) {
  const key = `${courseKey}_${idx}`;
  return masteryData[key]?.confidence || null;
}
