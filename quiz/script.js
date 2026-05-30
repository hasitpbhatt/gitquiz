// @ts-check

const BASE_URL = "https://raw.githubusercontent.com/hasitpbhatt/gitquiz/main/courses/";
const CATALOG_URL = "https://raw.githubusercontent.com/hasitpbhatt/gitquiz/main/courses/courses_list.txt";

let quizData = [];
let currentIdx = 0;
let currentUrl = "";
let activeMode = "code";
let userName = localStorage.getItem('quizUserName') || "Explorer";
let score = 0;
let streak = 0;
let secondsElapsed = 0;
let timerInterval = null;
let questionStartTime = 0;
let fullCatalog = [];

;(async () => {
  await loadCatalog();
  const courseParam = new URLSearchParams(window.location.search).get('course');
  if (courseParam && fullCatalog.includes(courseParam)) {
    const dropdown = document.getElementById('course-dropdown');
    dropdown.value = courseParam;
    handleStart();
  }
})();

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function fillExample() {
    document.getElementById('quiz-url').value = document.getElementById('example-link').innerText;
}

async function loadCatalog() {
    const dropdown = document.getElementById('course-dropdown');
    try {
        const response = await fetch(CATALOG_URL);
        const text = await response.text();
        fullCatalog = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        renderCatalogOptions(fullCatalog);
    } catch (err) {
        dropdown.innerHTML = '<option value="" disabled>Error connecting to catalog vault.</option>';
    }
}

function renderCatalogOptions(items) {
    const dropdown = document.getElementById('course-dropdown');
    dropdown.innerHTML = '';
    if (items.length === 0) {
        dropdown.innerHTML = '<option value="" disabled>No matches found.</option>';
        return;
    }
    items.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.className = "p-3 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800";
        opt.innerText = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        dropdown.appendChild(opt);
    });
    if (items.length > 0) dropdown.selectedIndex = 0;
}

function filterCatalog() {
    const query = document.getElementById('catalog-search').value.toLowerCase();
    const filtered = fullCatalog.filter(name => 
        name.toLowerCase().replace(/-/g, ' ').includes(query)
    );
    renderCatalogOptions(filtered);
}

function switchMode(mode) {
    activeMode = mode;
    const tabCode = document.getElementById('tab-code');
    const tabUrl = document.getElementById('tab-url');
    
    tabCode.className = mode === 'code' ? 'flex-1 py-2 px-4 rounded-lg font-600 transition-all bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'flex-1 py-2 px-4 rounded-lg font-600 transition-all text-slate-500';
    tabUrl.className = mode === 'url' ? 'flex-1 py-2 px-4 rounded-lg font-600 transition-all bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'flex-1 py-2 px-4 rounded-lg font-600 transition-all text-slate-500';
    
    document.getElementById('mode-code').classList.toggle('hidden', mode !== 'code');
    document.getElementById('mode-url').classList.toggle('hidden', mode !== 'url');
}

function startTimer() {
    secondsElapsed = 0;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        secondsElapsed++;
        const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
        const secs = (secondsElapsed % 60).toString().padStart(2, '0');
        document.getElementById('timer-val').innerText = `${mins}:${secs}`;
    }, 1000);
}

function handleStart() {
    let finalUrl = "";
    if (activeMode === 'code') {
        const val = document.getElementById('course-dropdown').value;
        if (!val) {
            showNotify("Selection Required", "Please choose a module from the list.");
            return;
        }
        finalUrl = `${BASE_URL}${val}/001.json`;
    } else {
        finalUrl = document.getElementById('quiz-url').value.trim();
    }
    if (finalUrl) initializeQuiz(finalUrl);
}

async function initializeQuiz(url) {
    if (url.includes("github.com") && !url.includes("raw.githubusercontent.com")) {
        url = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/").replace("/tree/", "/");
    }
    if (!url.toLowerCase().endsWith('.json')) {
        url = url.endsWith('/') ? url + '001.json' : url + '/001.json';
    }
    currentUrl = url;

    document.getElementById('setup-container').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    document.getElementById('quiz-flow').classList.remove('hidden');
    document.getElementById('completion-screen').classList.add('hidden');
    document.getElementById('error-overlay').classList.add('hidden');

    try {
        const res = await fetch(currentUrl);
        if (!res.ok) throw new Error(`Status ${res.status}: Failed to load file.`);
        const raw = await res.json();
        quizData = Array.isArray(raw) ? raw : [raw];
        if (quizData.length === 0) throw new Error('Empty module data.');
        quizData.forEach((q, i) => {
            if (!q || typeof q !== 'object') throw new Error(`Invalid entry at index ${i}.`);
        });
        
        score = 0;
        streak = 0;
        currentIdx = 0;
        document.getElementById('score-val').innerText = '0';
        document.getElementById('streak-val').innerText = '0';
        document.getElementById('progress-fill').style.width = '0%';
        
        startTimer();
        const filename = url.split('/').pop().replace('.json', '');
        document.getElementById('module-label').innerText = filename;
        renderQuestion();
    } catch (err) {
        clearInterval(timerInterval);
        document.getElementById('error-message').innerText = err.message;
        document.getElementById('error-overlay').classList.remove('hidden');
        document.getElementById('quiz-flow').classList.add('hidden');
    }
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function renderQuestion() {
    if (!quizData || currentIdx >= quizData.length) {
        checkNaturalEnd();
        return;
    }
    const q = quizData[currentIdx];
    if (!q) {
        checkNaturalEnd();
        return;
    }
    questionStartTime = Date.now();
    
    const prog = ((currentIdx) / quizData.length) * 100;
    document.getElementById('progress-fill').style.width = prog + '%';

    const topicTitle = document.getElementById('topic-title');
    topicTitle.textContent = q.question || "Step " + (currentIdx + 1);
    
    const cb = document.getElementById('content-box');
    cb.textContent = q.content || "";
    cb.classList.toggle('hidden', !q.content);
    
    document.getElementById('description-text').textContent = q.description || "";
    
    const bin = document.getElementById('options-bin');
    bin.innerHTML = '';
    document.getElementById('explanation').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');

    if (q.options) {
        const randomizedOptions = shuffleArray(q.options);
        const correctAnswer = q.answer.trim();

        randomizedOptions.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn w-full p-5 text-left border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-600 bg-white dark:bg-slate-800 shadow-sm';
            btn.innerText = opt;
            btn.onclick = () => {
                const btns = document.querySelectorAll('.option-btn');
                btns.forEach(b => b.disabled = true);
                
                const timeSpent = (Date.now() - questionStartTime) / 1000;
                
                if (opt.trim() === correctAnswer) {
                    btn.classList.add('correct');
                    streak++;
                    const speedBonus = Math.max(0, Math.round(50 - (timeSpent * 5)));
                    const streakBonus = streak > 2 ? 20 : 0;
                    score += (100 + speedBonus + streakBonus);
                    
                    document.getElementById('score-val').innerText = score.toLocaleString();
                    document.getElementById('streak-val').innerText = streak;
                } else {
                    btn.classList.add('wrong');
                    streak = 0;
                    document.getElementById('streak-val').innerText = streak;
                    btns.forEach(b => { 
                        if (b.innerText.trim() === correctAnswer) b.classList.add('correct'); 
                    });
                }
                
                const expText = q.explanation || "Correct! Moving to next section.";
                document.getElementById('explanation').innerHTML = `<h4 class="font-800 text-xs uppercase tracking-widest mb-2">Expert Feedback</h4><p class="text-sm font-500">${escapeHtml(expText)}</p>`;
                document.getElementById('explanation').classList.remove('hidden');
                document.getElementById('next-btn').classList.remove('hidden');
            };
            bin.appendChild(btn);
        });
    }
}

function handleNextClick() {
    currentIdx++;
    if (currentIdx < quizData.length) {
        renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        document.getElementById('progress-fill').style.width = '100%';
        checkNaturalEnd(); 
    }
}

async function directSkipModule() {
    if (!currentUrl) return;
    const nextUrl = currentUrl.replace(/(\d+)(?=\.json)/, (m) => 
        (parseInt(m) + 1).toString().padStart(m.length, '0')
    );
    try {
        const res = await fetch(nextUrl);
        if (res.ok) initializeQuiz(nextUrl);
        else checkNaturalEnd();
    } catch (e) {
        checkNaturalEnd();
    }
}

async function checkNaturalEnd() {
    clearInterval(timerInterval);
    const finalTime = document.getElementById('timer-val').innerText;
    document.getElementById('final-score-val').innerText = score.toLocaleString();
    document.getElementById('final-timer-val').innerText = finalTime;

    const nextUrl = currentUrl ? currentUrl.replace(/(\d+)(?=\.json)/, (m) => 
        (parseInt(m) + 1).toString().padStart(m.length, '0')
    ) : '';
    
    document.getElementById('quiz-flow').classList.add('hidden');
    document.getElementById('completion-screen').classList.remove('hidden');
    const box = document.getElementById('transition-actions');
    box.innerHTML = '<p class="text-xs text-slate-400 font-600 italic">Scanning for following modules...</p>';

    try {
        const res = await fetch(nextUrl);
        if (res.ok) {
            box.innerHTML = `<button onclick="initializeQuiz('${nextUrl}')" class="w-full p-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-800 shadow-xl">Start Next Module →</button>`;
        } else {
            box.innerHTML = `<p class="font-800 text-emerald-500">Mastery Complete: No further modules detected in this track.</p>`;
            document.getElementById('completion-title').innerText = "Course Track Completed!";
        }
    } catch (e) {
        box.innerHTML = `<p class="text-slate-500">End of sequence.</p>`;
    }
}

function downloadScreenshot() {
    if (!currentUrl) {
        showNotify("Screenshot Error", "No quiz data to generate card.");
        return;
    }
    if (userName === "Explorer" || !userName || userName.trim() === "") {
        const namePrompt = prompt("Please enter your name for the achievement certificate:", userName === "Explorer" ? "" : userName);
        if (namePrompt === null) return;
        const trimmedName = namePrompt.trim();
        if (trimmedName) {
            userName = trimmedName.substring(0, 100);
            localStorage.setItem('quizUserName', userName);
        } else {
            showNotify("Name Required", "Please enter a valid name for the certificate.");
            return;
        }
    }
    const parts = currentUrl.split('/');
    const modFile = parts.pop();
    const courseFolderName = parts.pop();
    const moduleNum = modFile.replace('.json', '');
    const courseFormatted = courseFolderName.toUpperCase().replace(/-/g, ' ');
    document.getElementById('ach-cert-name').innerText = userName;
    document.getElementById('ach-course-name').innerText = courseFormatted;
    document.getElementById('ach-module-num').innerText = "Module " + moduleNum;
    document.getElementById('ach-score').innerText = score.toLocaleString();
    document.getElementById('ach-time').innerText = document.getElementById('timer-val').innerText;
    const now = new Date();
    document.getElementById('ach-date').innerText = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    const target = document.getElementById('achievement-card-template');
    if (typeof html2canvas !== 'function') {
        console.error('html2canvas library is not loaded');
        showNotify("Screenshot Error", "html2canvas library failed to load.");
        return;
    }
    html2canvas(target, {
        useCORS: true,
        backgroundColor: '#0f172a'
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Achievement_${courseFolderName}_M${moduleNum}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    }).catch(err => {
        console.error('Screenshot generation failed:', err);
        showNotify("Screenshot Error", "Could not generate achievement card.");
    });
}

// Internal UI Notification (Replaces alerts)
function showNotify(title, msg) {
    const div = document.createElement('div');
    div.className = "fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card p-4 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4";
    div.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">!</div>
            <div>
                <h4 class="font-800 text-sm">${title}</h4>
                <p class="text-xs text-slate-500">${msg}</p>
            </div>
        </div>
    `;
    document.body.appendChild(div);
    setTimeout(() => {
        div.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
        setTimeout(() => div.remove(), 500);
    }, 3000);
}

function showNotifyWithAction(title, msg, actionLabel, actionFn) {
    const div = document.createElement('div');
    div.className = "fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card p-4 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4";
    div.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">!</div>
            <div class="flex-1">
                <h4 class="font-800 text-sm">${title}</h4>
                <p class="text-xs text-slate-500">${msg}</p>
            </div>
            <button class="notify-action px-3 py-1.5 bg-blue-600 text-white text-xs font-700 rounded-lg whitespace-nowrap">${actionLabel}</button>
        </div>
    `;
    document.body.appendChild(div);
    div.querySelector('.notify-action').addEventListener('click', () => {
        actionFn();
        div.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
        setTimeout(() => div.remove(), 500);
    });
    setTimeout(() => {
        div.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
        setTimeout(() => div.remove(), 500);
    }, 6000);
}

// Share Quiz Functionality
function getShareUrl() {
    const base = window.location.origin + window.location.pathname;
    if (!currentUrl) return base;
    const parts = currentUrl.split('/');
    const courseFolderName = parts[parts.length - 2];
    return base + '?course=' + encodeURIComponent(courseFolderName);
}

function shareHandler() {
    const isCompletion = !document.getElementById('completion-screen').classList.contains('hidden');
    if (isCompletion) {
        shareCertificate();
        return;
    }
    const isQuizActive = !document.getElementById('quiz-container').classList.contains('hidden')
        && !document.getElementById('quiz-flow').classList.contains('hidden');
    if (isQuizActive && quizData.length > 0 && currentIdx < quizData.length) {
        shareQuestion();
        return;
    }
    shareSetup();
}

function shareSetup() {
    const shareUrl = getShareUrl();
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full mx-4 text-center">
            <div class="text-4xl mb-3">🎯</div>
            <h3 class="text-lg font-bold mb-1">Share Quiz Portal</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Share this quiz link or download a promo image</p>
            <div class="space-y-3">
                <button onclick="copyAndClose(this)" class="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-700 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy Link
                </button>
                <button onclick="downloadPromoImage(this)" class="w-full p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-700 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download Image
                </button>
                <button onclick="closeModal(this)" class="w-full p-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function copyAndClose(btn) {
    const shareUrl = getShareUrl();
    navigator.clipboard.writeText(shareUrl).then(() => {
        showNotify('Link Copied', 'Quiz link copied to clipboard!');
    }).catch(() => {
        showNotify('Copy Failed', 'Could not copy link');
    });
    closeModal(btn);
}

function downloadPromoImage(btn) {
    closeModal(btn);
    const shareUrl = getShareUrl();
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;z-index:-1;width:800px;padding:60px;background:linear-gradient(135deg,#0f172a,#1e293b);color:white;border-radius:40px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:600px;';
    container.innerHTML = `
        <div style="font-size:80px;margin-bottom:16px;">🎯</div>
        <div style="font-size:36px;font-weight:800;margin-bottom:8px;">Quiz Portal Pro</div>
        <div style="font-size:16px;opacity:0.6;max-width:400px;margin-bottom:40px;">Master your knowledge with interactive modules.</div>
        <div style="font-size:13px;font-family:monospace;padding:14px 24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:#60a5fa;max-width:100%;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(shareUrl)}</div>
        <div style="margin-top:auto;font-size:14px;opacity:0.4;">hasit.in/quiz</div>
    `;
    document.body.appendChild(container);
    if (typeof html2canvas !== 'function') {
        showNotify('Error', 'Image generation library failed.');
        container.remove();
        return;
    }
    html2canvas(container, { useCORS: true, backgroundColor: '#0f172a', scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'QuizPortal_Promo.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        container.remove();
        showNotifyWithAction('Image Saved', 'Downloaded. Copy link to share?', 'Copy Link', function() { copyLink(); });
    }).catch(() => {
        container.remove();
        showNotify('Error', 'Could not generate image.');
    });
}

function copyLink() {
    const shareUrl = getShareUrl();
    navigator.clipboard.writeText(shareUrl).then(() => {
        showNotify('Link Copied', 'Quiz link copied to clipboard!');
    }).catch(() => {
        showNotify('Copy Failed', 'Could not copy link to clipboard');
    });
}

function closeModal(button) {
    button.closest('.fixed').remove();
}

function captureAndShareImage(element, filename) {
    if (typeof html2canvas !== 'function') {
        showNotify('Share Error', 'Image generation library failed to load.');
        return;
    }
    html2canvas(element, {
        useCORS: true,
        backgroundColor: '#0f172a',
        scale: 2
    }).then(canvas => {
        canvas.toBlob(async (blob) => {
            const file = new File([blob], filename, { type: 'image/png' });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Quiz Portal Pro',
                        text: getShareUrl()
                    });
                    element.remove();
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') { element.remove(); return; }
                }
            }
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
            element.remove();
            showNotifyWithAction('Image Saved', 'Downloaded. Copy link to share?', 'Copy Link', function() { copyLink(); });
        });
    }).catch(() => {
        container.remove();
        showNotify('Error', 'Could not generate image.');
    });
}

function shareQuestion() {
    if (!quizData || currentIdx >= quizData.length) {
        showNotify('Share Error', 'No question to share.');
        return;
    }
    const q = quizData[currentIdx];
    if (!q) return;
    const modLabel = document.getElementById('module-label')?.textContent || 'MODULE';
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;z-index:-1;width:800px;padding:50px 60px;background:linear-gradient(135deg,#0f172a,#1e293b);color:white;border-radius:40px;text-align:left;display:flex;flex-direction:column;min-height:600px;';
    container.innerHTML = `
        <div style="text-align:center;"><span class="qc-badge">📝</span></div>
        <div style="text-align:center;" class="qc-module">${escapeHtml(modLabel)}</div>
        ${q.question ? `<div class="qc-title">${escapeHtml(q.question)}</div>` : ''}
        ${q.description ? `<div class="qc-description">${escapeHtml(q.description)}</div>` : ''}
        <div class="qc-options"></div>
        <div style="text-align:center;margin-top:auto;" class="qc-footer">Quiz Portal Pro</div>
    `;
    const optsDiv = container.querySelector('.qc-options');
    if (q.options) {
        q.options.forEach((opt, i) => {
            const d = document.createElement('div');
            d.className = 'qc-option';
            d.innerHTML = `<span class="qc-opt-letter">${letters[i] || (i + 1)}.</span><span>${escapeHtml(opt)}</span>`;
            optsDiv.appendChild(d);
        });
    }
    document.body.appendChild(container);
    const idxStr = (currentIdx + 1).toString().padStart(3, '0');
    captureAndShareImage(container, `Question_${idxStr}.png`);
}

function shareCertificate() {
    if (!currentUrl) {
        showNotify('Share Error', 'No quiz data to share.');
        return;
    }
    if (userName === "Explorer" || !userName || userName.trim() === "") {
        const namePrompt = prompt("Please enter your name for the achievement certificate:", userName === "Explorer" ? "" : userName);
        if (namePrompt === null) return;
        const trimmedName = namePrompt.trim();
        if (trimmedName) {
            userName = trimmedName.substring(0, 100);
            localStorage.setItem('quizUserName', userName);
        } else {
            showNotify('Name Required', 'Please enter a valid name for the certificate.');
            return;
        }
    }
    const parts = currentUrl.split('/');
    const modFile = parts.pop();
    const courseFolderName = parts.pop();
    const moduleNum = modFile.replace('.json', '');
    const courseFormatted = courseFolderName.toUpperCase().replace(/-/g, ' ');
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;z-index:-1;width:800px;padding:60px;background:linear-gradient(135deg,#0f172a,#1e293b);color:white;border-radius:40px;text-align:center;';
    container.innerHTML = `
        <div class="ach-badge">🛡️</div>
        <div class="ach-title">Course Mastery Achieved</div>
        <div style="font-family:'Great Vibes',cursive;font-size:82px;color:#3b82f6;margin:10px 0;display:block;">${escapeHtml(userName)}</div>
        <div style="font-size:16px;opacity:0.6;margin:10px 0;">has successfully completed</div>
        <h2 class="ach-course-name">${escapeHtml(courseFormatted)}</h2>
        <div class="ach-module-info">Module ${escapeHtml(moduleNum)}</div>
        <div class="ach-stats-grid">
            <div class="ach-stat-box">
                <span class="ach-stat-val">${score.toLocaleString()}</span>
                <span class="ach-stat-lab">Total Points</span>
            </div>
            <div class="ach-stat-box">
                <span class="ach-stat-val">${escapeHtml(document.getElementById('timer-val').innerText)}</span>
                <span class="ach-stat-lab">Completion Time</span>
            </div>
            <div class="ach-stat-box">
                <span class="ach-stat-val">${escapeHtml(dateStr)}</span>
                <span class="ach-stat-lab">Date Verified</span>
            </div>
        </div>
        <div class="ach-footer">Verified by Pro Quiz Portal • hasit.in</div>
    `;
    document.body.appendChild(container);
    captureAndShareImage(container, `Achievement_${courseFolderName}_M${moduleNum}.png`);
}



// Add share button event listener
document.getElementById('share-btn')?.addEventListener('click', shareHandler);