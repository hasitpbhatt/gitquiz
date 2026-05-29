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
  }
  
  const dropdown = document.getElementById('course-dropdown');
  if (dropdown.value) {
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
    const target = document.getElementById('achievement-card-template');
    if (!currentUrl) {
        showNotify("Screenshot Error", "No quiz data to generate card.");
        return;
    }
    
    // Prompt for name if not already set (and not default "Explorer")
    if (userName === "Explorer" || !userName || userName.trim() === "") {
        const namePrompt = prompt("Please enter your name for the achievement certificate:", userName === "Explorer" ? "" : userName);
        if (namePrompt === null) {
            // User cancelled
            return;
        }
        const trimmedName = namePrompt.trim();
        if (trimmedName) {
            userName = trimmedName.substring(0, 100); // Limit length
            localStorage.setItem('quizUserName', userName); // Save for next time
        } else {
            // If user provides empty name, keep current userName (which might be "Explorer")
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

    if (typeof html2canvas !== 'function') {
        console.error('html2canvas library is not loaded');
        showNotify("Screenshot Error", "html2canvas library failed to load.");
        return;
    }
    html2canvas(target).then(canvas => {
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