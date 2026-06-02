// @ts-check

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

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

async function handleStart() {
    let finalUrl = "";
    const urlInput = document.getElementById('quiz-url');
    const urlVal = urlInput ? urlInput.value.trim() : '';
    if (urlVal) {
        finalUrl = urlVal;
    } else {
        const val = document.getElementById('course-dropdown').dataset.selectedValue || '';
        if (!val) {
            showNotify("Selection Required", "Please choose a module from the list.");
            return;
        }
        if (val.startsWith('book-') || val.startsWith('podcast-') || val.startsWith('coursera-') || val.startsWith('course-')) {
            markCourseSeen(val);
            showCoursePreview(val);
            return;
        }
        finalUrl = `${BASE_URL}${val}/001.json`;
    }
    if (finalUrl) await initializeQuiz(finalUrl);
}

async function initializeQuiz(url, prefetchedData) {
    updateDailyStreak();
    if (url.includes("github.com") && !url.includes("raw.githubusercontent.com")) {
        url = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/").replace("/tree/", "/");
    }
    if (!url.toLowerCase().endsWith('.json')) {
        url = url.endsWith('/') ? url + '001.json' : url + '/001.json';
    }
    currentUrl = url;
    if (url.startsWith(BASE_URL)) {
        const parts = url.split('/');
        parts.pop();
        const parentFolder = parts.pop() || '';
        if (parentFolder) markCourseSeen(parentFolder);
    }

    document.getElementById('setup-container').classList.add('hidden');
    document.getElementById('preview-container').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    document.getElementById('quiz-flow').classList.add('hidden');
    document.getElementById('completion-screen').classList.add('hidden');
    document.getElementById('error-overlay').classList.add('hidden');
    document.getElementById('loading-overlay').classList.remove('hidden');
    const quizFlow = document.getElementById('quiz-flow');
    quizFlow.classList.remove('screen-enter');
    void quizFlow.offsetWidth;
    quizFlow.classList.add('screen-enter');

    try {
        let raw;
        if (prefetchedData) {
            raw = prefetchedData;
        } else {
            const res = await fetch(currentUrl);
            if (!res.ok) throw new Error(`Status ${res.status}: Failed to load file.`);
            raw = await res.json();
        }
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
        document.getElementById('question-counter').innerText = `1 / ${quizData.length}`;
        
        startTimer();
        const urlParts = url.split('/');
        const filename = urlParts.pop().replace('.json', '');
        const parentFolder = urlParts.pop() || '';
        let courseName = parentFolder
            .replace(/^(book|podcast|coursera|course)-/i, '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
        document.getElementById('module-label').innerText = courseName
            ? `${courseName} • ${filename}`
            : filename;
        document.getElementById('module-label').title = courseName
            ? `${courseName} • ${filename}`
            : filename;
        document.getElementById('loading-overlay').classList.add('hidden');
        document.getElementById('quiz-flow').classList.remove('hidden');
        renderQuestion();
    } catch (err) {
        clearInterval(timerInterval);
        document.getElementById('loading-overlay').classList.add('hidden');
        document.getElementById('error-message').innerText = err.message;
        document.getElementById('error-overlay').classList.remove('hidden');
        document.getElementById('quiz-flow').classList.add('hidden');
    }
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
    
    const difficultyBadge = document.getElementById('difficulty-badge');
    if (q.difficulty) {
        const colors = { easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', hard: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' };
        difficultyBadge.textContent = q.difficulty;
        difficultyBadge.className = 'inline text-[10px] font-800 uppercase tracking-wider px-2 py-0.5 rounded-full ml-2 ' + (colors[q.difficulty] || colors.medium);
        difficultyBadge.classList.remove('hidden');
    } else {
        difficultyBadge.classList.add('hidden');
    }

    const progPct = ((currentIdx + 1) / quizData.length) * 100;
    const fill = document.getElementById('progress-fill');
    fill.style.width = progPct + '%';
    const startHue = 217, endHue = 142;
    const hue = startHue - ((startHue - endHue) * ((currentIdx + 1) / quizData.length));
    fill.style.background = `linear-gradient(90deg, #3b82f6, hsl(${hue}, 80%, 45%))`;
    document.getElementById('question-counter').innerText = `${currentIdx + 1} / ${quizData.length}`;

    const topicTitle = document.getElementById('topic-title');
    topicTitle.textContent = q.question || "Step " + (currentIdx + 1);
    topicTitle.classList.add('hidden');
    
    const cb = document.getElementById('content-box');
    cb.textContent = q.content || "";
    cb.classList.add('hidden');
    
    document.getElementById('description-text').textContent = q.description || "";
    
    const bin = document.getElementById('options-bin');
    bin.innerHTML = '';
    document.getElementById('explanation').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('next-btn-wrapper').classList.remove('visible');
    const aiSection = document.getElementById('ai-section');
    if (aiSection) aiSection.classList.add('hidden');
    const aiResponse = document.getElementById('ai-response');
    if (aiResponse) aiResponse.classList.add('hidden');

    if (q.options) {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const randomizedOptions = shuffleArray(q.options);
        const correctAnswer = q.answer.trim();

        randomizedOptions.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn w-full p-5 text-left border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-600 bg-white dark:bg-slate-800 shadow-sm flex items-center gap-3';
            btn.innerHTML = `<span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-800 text-slate-500 shrink-0">${letters[idx] || (idx + 1)}</span><span class="flex-1">${escapeHtml(opt)}</span><span class="key-hint">${idx + 1}</span>`;
            btn.dataset.option = opt;
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
                    
                    const scoreEl = document.getElementById('score-val');
                    scoreEl.innerText = score.toLocaleString();
                    scoreEl.classList.remove('score-pop');
                    void scoreEl.offsetWidth;
                    scoreEl.classList.add('score-pop');
                    document.getElementById('streak-val').innerText = streak;
                } else {
                    btn.classList.add('wrong');
                    streak = 0;
                    document.getElementById('streak-val').innerText = streak;
                    btns.forEach(b => { 
                        if (b.dataset.option === correctAnswer) b.classList.add('correct'); 
                    });
                }
                
                const expText = q.explanation || "Correct! Moving to next section.";
                const expEl = document.getElementById('explanation');
                expEl.innerHTML = `<h4 class="font-800 text-xs uppercase tracking-widest mb-2">Expert Feedback</h4><p class="text-sm font-500">${escapeHtml(expText)}</p>`;
                expEl.classList.remove('hidden');
                setTimeout(() => expEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
                document.getElementById('next-btn-wrapper').classList.add('visible');
                document.getElementById('next-btn').classList.remove('hidden');
                topicTitle.classList.remove('hidden');
                if (cb.textContent.trim()) cb.classList.remove('hidden');
                
                lastSelectedAnswer = opt;
                lastAnswerCorrect = opt.trim() === correctAnswer;
                
                if (MISTRAL_PROXY_URL) {
                    const aiSec = document.getElementById('ai-section');
                    if (aiSec) aiSec.classList.remove('hidden');
                }
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
    if (!confirm('Skip this module? Your current progress will be lost.')) return;
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
    updateDailyStreak();

    // Mark chapter as complete
    let courseDone = false;
    if (currentUrl) {
        const parts = currentUrl.split('/');
        const filename = parts.pop().replace('.json', '');
        const courseId = parts.pop() || '';
        const chNum = parseInt(filename, 10);
        if (courseId && !isNaN(chNum)) {
            markChapterComplete(courseId, chNum);
            courseDone = isCourseComplete(courseId);
        }
    }

    const finalTime = document.getElementById('timer-val').innerText;
    document.getElementById('final-score-val').innerText = score.toLocaleString();
    document.getElementById('final-timer-val').innerText = finalTime;

    const nextUrl = currentUrl ? currentUrl.replace(/(\d+)(?=\.json)/, (m) => 
        (parseInt(m) + 1).toString().padStart(m.length, '0')
    ) : '';
    
    document.getElementById('quiz-flow').classList.add('hidden');
    document.getElementById('completion-screen').classList.remove('hidden');
    const compEl = document.getElementById('completion-screen');
    compEl.classList.remove('screen-enter');
    void compEl.offsetWidth;
    compEl.classList.add('screen-enter');
    const box = document.getElementById('transition-actions');
    box.innerHTML = '<div class="flex items-center justify-center gap-2 text-xs text-slate-400 font-600 italic"><div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>Scanning for following modules...</div>';

    try {
        const res = await fetch(nextUrl);
        if (res.ok) {
            box.innerHTML = '';
            const btn = document.createElement('button');
            btn.className = 'w-full p-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-800 shadow-xl';
            btn.textContent = 'Start Next Module →';
            btn.addEventListener('click', () => initializeQuiz(nextUrl));
            box.appendChild(btn);
        } else {
            box.innerHTML = `<p class="font-800 text-emerald-500">Mastery Complete: No further modules detected in this track.</p>`;
            document.getElementById('completion-title').innerText = courseDone
                ? "🏆 Course Complete!"
                : "Course Track Completed!";
        }
    } catch (e) {
        box.innerHTML = `<p class="text-slate-500">End of sequence.</p>`;
    }
}

// Pause timer when tab hidden, resume when visible (without resetting seconds)
let _timerVisibilityBound = false;
if (!_timerVisibilityBound) {
    _timerVisibilityBound = true;
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(timerInterval);
        } else if (!document.getElementById('quiz-container').classList.contains('hidden')) {
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                secondsElapsed++;
                const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
                const secs = (secondsElapsed % 60).toString().padStart(2, '0');
                document.getElementById('timer-val').innerText = `${mins}:${secs}`;
            }, 1000);
        }
    });
}
