// @ts-check

const BASE_URL = "https://raw.githubusercontent.com/hasitpbhatt/gitquiz/main/courses/";
const CATALOG_URL = "https://raw.githubusercontent.com/hasitpbhatt/gitquiz/main/courses/courses_list.txt";

let quizData = [];
let currentIdx = 0;
let currentUrl = "";
let userName = localStorage.getItem('quizUserName') || "Explorer";
let score = 0;
let streak = 0;
let secondsElapsed = 0;
let timerInterval = null;
let questionStartTime = 0;
let fullCatalog = [];
let activeTypeFilter = 'all';
let MISTRAL_PROXY_URL = 'https://quiz-ai-proxy.hasit-p-bhatt.workers.dev/';
let lastSelectedAnswer = '';
let lastAnswerCorrect = false;
let previewUrl = '';
let previewData = null;

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
