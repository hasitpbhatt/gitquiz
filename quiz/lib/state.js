// @ts-check

const BASE_URL = "https://raw.githubusercontent.com/hasitpbhatt/gitquiz/main/courses/";
const CATALOG_URL = "https://raw.githubusercontent.com/hasitpbhatt/gitquiz/main/courses/courses_list.txt";
const META_URL = "https://raw.githubusercontent.com/hasitpbhatt/gitquiz/main/courses/courses-meta.json";

let quizData = [];
let currentIdx = 0;
let currentUrl = "";
let userName = localStorage.getItem('quizUserName') || "Explorer";
let score = 0;
let streak = 0;
let secondsElapsed = 0;
let timerInterval = null;
let fullCatalog = [];
let activeTypeFilter = 'all';
let MISTRAL_PROXY_URL = 'https://quiz-ai-proxy.hasit-p-bhatt.workers.dev/';
let correctCount = 0;
let lastSelectedAnswer = '';
let lastAnswerCorrect = false;
let aiConversation = { messages: [], turn: 0 };
let currentAiPersona = '';
let previewUrl = '';
let previewData = null;
let previewQuestionIdx = 0;
let coursesMeta = {};

// Mode state
let currentMode = 'mc'; // 'mc' | 'flashcard' | 'truefalse' | 'fillblank'
let sessionQuestionCount = 0;

const CONCEPT_MASTERY_KEY = 'quizConceptMastery';

function getCourseKey() {
    if (!currentUrl) return '';
    const parts = currentUrl.split('/');
    const filename = parts.pop().replace('.json', '');
    const courseId = parts.pop() || '';
    return `${courseId}_${filename}`;
}

function getConceptMasteryData() {
    try {
        return JSON.parse(localStorage.getItem(CONCEPT_MASTERY_KEY)) || {};
    } catch {
        return {};
    }
}

function markConceptCorrect(courseKey, idx) {
    const mastery = getConceptMasteryData();
    const key = `${courseKey}_${idx}`;
    if (!mastery[key]) mastery[key] = { correctMC: 0, flashcardMissed: false };
    mastery[key].correctMC = (mastery[key].correctMC || 0) + 1;
    mastery[key].flashcardMissed = false;
    localStorage.setItem(CONCEPT_MASTERY_KEY, JSON.stringify(mastery));
}

function markFlashcardMissed(courseKey, idx) {
    const mastery = getConceptMasteryData();
    const key = `${courseKey}_${idx}`;
    if (!mastery[key]) mastery[key] = { correctMC: 0, flashcardMissed: false };
    mastery[key].flashcardMissed = true;
    localStorage.setItem(CONCEPT_MASTERY_KEY, JSON.stringify(mastery));
}

function getConceptMastery(courseKey, idx) {
    const mastery = getConceptMasteryData();
    return mastery[`${courseKey}_${idx}`] || { correctMC: 0, flashcardMissed: false };
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
}

function updateDailyStreak() {
    const today = getTodayStr();
    let data;
    try {
        data = JSON.parse(localStorage.getItem('quizDailyStreak')) || {};
    } catch {
        data = {};
    }
    if (data.lastDate === today) {
        return data.count || 0;
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const count = data.lastDate === yesterdayStr ? (data.count || 0) + 1 : 1;
    localStorage.setItem('quizDailyStreak', JSON.stringify({ lastDate: today, count }));
    return count;
}

function getDailyStreak() {
    try {
        const data = JSON.parse(localStorage.getItem('quizDailyStreak')) || {};
        return data.count || 0;
    } catch {
        return 0;
    }
}

const CHAPTER_PROGRESS_KEY = 'quizChapterProgress';
const HIDE_COMPLETED_KEY = 'quizHideCompleted';

function getChapterProgress() {
    try {
        return JSON.parse(localStorage.getItem(CHAPTER_PROGRESS_KEY)) || {};
    } catch {
        return {};
    }
}

function markChapterComplete(courseId, chapterNum) {
    const progress = getChapterProgress();
    if (!progress[courseId]) {
        progress[courseId] = [];
    }
    if (!progress[courseId].includes(chapterNum)) {
        progress[courseId].push(chapterNum);
        localStorage.setItem(CHAPTER_PROGRESS_KEY, JSON.stringify(progress));
    }
}

function isCourseComplete(courseId) {
    const meta = coursesMeta[courseId];
    if (!meta || !meta.chapters) return false;
    const progress = getChapterProgress();
    const completed = progress[courseId] || [];
    return completed.length >= meta.chapters;
}

function getFirstIncompleteChapter(courseId) {
    const meta = coursesMeta[courseId];
    if (!meta || !meta.chapters) return 1;
    const progress = getChapterProgress();
    const completed = new Set(progress[courseId] || []);
    for (let i = 1; i <= meta.chapters; i++) {
        if (!completed.has(i)) return i;
    }
    return null;
}

const SEEN_COURSES_KEY = 'quizSeenCourses';

function getSeenCourses() {
    try {
        return JSON.parse(localStorage.getItem(SEEN_COURSES_KEY)) || [];
    } catch {
        return [];
    }
}

function markCourseSeen(courseId) {
    const seen = getSeenCourses();
    if (!seen.includes(courseId)) {
        seen.push(courseId);
        localStorage.setItem(SEEN_COURSES_KEY, JSON.stringify(seen));
    }
}

function isCourseNew(courseId) {
    return !getSeenCourses().includes(courseId);
}

function applyTheme(isDark) {
    const html = document.documentElement;
    if (isDark) {
        html.classList.add('dark');
        html.setAttribute('data-theme', 'dark');
    } else {
        html.classList.remove('dark');
        html.setAttribute('data-theme', 'light');
    }
}

function initTheme() {
    const saved = localStorage.getItem('quizTheme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (saved !== 'light' && prefersDark);
    applyTheme(isDark);
    updateThemeIcon(isDark ? 'dark' : 'light');
}

function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const newTheme = current ? (current === 'dark' ? 'light' : 'dark') : (prefersDark ? 'light' : 'dark');
    const isDark = newTheme === 'dark';
    applyTheme(isDark);
    localStorage.setItem('quizTheme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}
