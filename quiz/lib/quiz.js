// @ts-check

let prefetchedNextModulePromise = null;

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

// ---------- Mode determination ----------

function getModeLabel(mode) {
    const labels = {
        'mc': '📝 MC',
        'flashcard': '🃏 Recall',
        'truefalse': '✅ T/F',
        'fillblank': '___ Fill'
    };
    return labels[mode] || '📝 MC';
}

function levenshteinDistance(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

function fuzzyMatch(input, target) {
    const a = input.trim().toLowerCase();
    const b = target.trim().toLowerCase();
    if (a === b) return true;
    return levenshteinDistance(a, b) <= 2;
}

function determineMode(q, idx) {
    sessionQuestionCount++;
    if (sessionQuestionCount <= 3) return 'mc';

    const courseKey = getCourseKey();
    const mastery = getConceptMastery(courseKey, idx);
    const hasMasteredMC = mastery.correctMC >= 1;

    if (mastery.flashcardMissed) return 'mc';

    const diff = (q.difficulty || 'medium').toLowerCase();
    const rand = Math.random();

    // Mastered concepts: mostly spaced-repetition modes
    if (hasMasteredMC) {
        if (rand < 0.50) return 'flashcard';
        if (rand < 0.75) return 'fillblank';
        if (rand < 0.90) return 'truefalse';
        return 'mc';
    }

    // Not mastered — mix in variety to keep it engaging
    if (diff === 'easy') {
        if (rand < 0.35) return 'truefalse';
        if (rand < 0.55) return 'flashcard';
        return 'mc';
    }

    if (diff === 'hard') {
        if (rand < 0.40) return 'fillblank';
        if (rand < 0.60) return 'flashcard';
        return 'mc';
    }

    // Medium (unmastered): balanced spread
    if (rand < 0.25) return 'flashcard';
    if (rand < 0.45) return 'truefalse';
    if (rand < 0.60) return 'fillblank';
    return 'mc';
}

// ---------- Shared completion helpers ----------

function showExplanationAfterAnswer(q, isCorrect, selectedAnswer) {
    if (isCorrect) {
        correctCount++;
        const streakBonus = streak > 2 ? 20 : 0;
        score += (streakBonus);
        const scoreEl = document.getElementById('score-val');
        scoreEl.innerText = score.toLocaleString();
        scoreEl.classList.remove('score-pop');
        void scoreEl.offsetWidth;
        scoreEl.classList.add('score-pop');
    } else {
        streak = 0;
    }
    document.getElementById('streak-val').innerText = streak;

    lastSelectedAnswer = selectedAnswer || '';
    lastAnswerCorrect = isCorrect;

    const expText = q.explanation || "Correct! Moving to next section.";
    const expEl = document.getElementById('explanation');
    expEl.innerHTML = `<h4 class="font-800 text-xs uppercase tracking-widest mb-2">Expert Feedback</h4><p class="text-sm font-500">${escapeHtml(expText)}</p>`;
    expEl.classList.remove('hidden');
    document.getElementById('topic-title').classList.remove('hidden');
    document.getElementById('content-box').classList.remove('hidden');
    setTimeout(() => expEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    document.getElementById('next-btn-wrapper').classList.add('visible');
    document.getElementById('next-btn').classList.remove('hidden');

    if (MISTRAL_PROXY_URL) {
        const aiSec = document.getElementById('ai-section');
        if (aiSec) aiSec.classList.remove('hidden');
    }
}

function disableAllInteractive() {
    document.querySelectorAll('.option-btn, .tf-btn').forEach(b => { b.disabled = true; });
    const fillSubmit = document.getElementById('fillblank-submit');
    if (fillSubmit) { fillSubmit.disabled = true; }
    const fillInput = document.getElementById('fillblank-input');
    if (fillInput) { fillInput.disabled = true; }
}

// ---------- Mode renderers ----------

function renderMC(q) {
    const bin = document.getElementById('options-bin');
    bin.classList.remove('hidden');
    bin.innerHTML = '';

    const randomizedOptions = shuffleArray(q.options);
    const correctAnswer = q.answer.trim();

    randomizedOptions.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn w-full p-5 text-left border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-600 bg-white dark:bg-slate-800 shadow-sm flex items-center gap-3';
        btn.innerHTML = `<span class="flex-1">${escapeHtml(opt)}</span><span class="key-hint">${idx + 1}</span>`;
        btn.dataset.option = opt;
        btn.onclick = () => {
            disableAllInteractive();
            const btns = document.querySelectorAll('.option-btn');

            if (opt.trim() === correctAnswer) {
                btn.classList.add('correct');
                streak++;
                const courseKey = getCourseKey();
                markConceptCorrect(courseKey, currentIdx);
            } else {
                btn.classList.add('wrong');
                streak = 0;
                btns.forEach(b => {
                    if (b.dataset.option && b.dataset.option.trim() === correctAnswer) b.classList.add('correct');
                });
            }

            showExplanationAfterAnswer(q, streak > 0 || opt.trim() === correctAnswer, opt);
        };
        bin.appendChild(btn);
    });
}

function renderFlashcard(q) {
    document.getElementById('flashcard-ui').classList.remove('hidden');
    document.getElementById('flashcard-question-text').textContent = q.question || "Concept " + (currentIdx + 1);
    document.getElementById('flashcard-content-text').textContent = q.content || "";
    document.getElementById('flashcard-answer-text').textContent = "Answer: " + q.answer;
    document.getElementById('flashcard-front').classList.remove('hidden');
    document.getElementById('flashcard-back').classList.add('hidden');
    document.getElementById('flashcard-got-it').disabled = false;
    document.getElementById('flashcard-missed').disabled = false;
}

function renderTrueFalse(q) {
    const bin = document.getElementById('options-bin');
    bin.classList.remove('hidden');
    bin.innerHTML = '';

    const correctAnswer = q.answer.trim();
    const wrongAnswers = q.options.filter(o => o.trim() !== correctAnswer);
    const wrongPick = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];

    // Show the scenario as context, then present a conclusion to evaluate
    document.getElementById('description-text').textContent = q.description || q.content || "";

    const isTrueStatement = Math.random() < 0.5;
    const conclusion = isTrueStatement ? correctAnswer : wrongPick;

    const info = document.createElement('div');
    info.className = 'p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 text-sm font-600 text-amber-800 dark:text-amber-300 mb-3';
    info.textContent = 'Conclusion: ' + conclusion;
    bin.appendChild(info);

    ['True', 'False'].forEach((label) => {
        const btn = document.createElement('button');
        btn.className = 'tf-btn w-full p-5 text-left border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-600 bg-white dark:bg-slate-800 shadow-sm flex items-center gap-3';
        btn.textContent = label;
        btn.dataset.value = label.toLowerCase();
        btn.onclick = () => {
            disableAllInteractive();
            const userIsTrue = label.toLowerCase() === 'true';
            const isCorrect = userIsTrue === isTrueStatement;

            if (isCorrect) {
                btn.classList.add('correct');
                streak++;
            } else {
                btn.classList.add('wrong');
                streak = 0;
                document.querySelectorAll('.tf-btn').forEach(b => {
                    if (b.dataset.value === (isTrueStatement ? 'true' : 'false')) b.classList.add('correct');
                });
            }

            showExplanationAfterAnswer(q, isCorrect, label);
        };
        bin.appendChild(btn);
    });
}

function renderFillBlank(q) {
    document.getElementById('fillblank-ui').classList.remove('hidden');

    const answer = q.answer.trim();
    let clozeText = q.description || q.content || "";
    if (clozeText.includes(answer)) {
        clozeText = clozeText.replace(answer, '______');
    } else {
        clozeText = `What is the term? ${clozeText}`;
    }
    document.getElementById('description-text').textContent = clozeText;

    const input = document.getElementById('fillblank-input');
    input.value = '';
    input.className = 'w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all';
    input.disabled = false;
    document.getElementById('fillblank-submit').disabled = false;
    input.focus();
}

// ---------- Global handlers for new modes ----------

function flipFlashcard() {
    document.getElementById('flashcard-front').classList.add('hidden');
    document.getElementById('flashcard-back').classList.remove('hidden');
}

function flashcardSelfAssess(gotIt) {
    const q = quizData[currentIdx];
    if (!q) return;
    disableAllInteractive();

    if (gotIt) {
        streak++;
        const courseKey = getCourseKey();
        markConceptCorrect(courseKey, currentIdx);
    } else {
        streak = 0;
        const courseKey = getCourseKey();
        markFlashcardMissed(courseKey, currentIdx);
    }

    showExplanationAfterAnswer(q, gotIt, gotIt ? 'Got it' : 'Missed it');
}

function submitFillBlank() {
    const q = quizData[currentIdx];
    if (!q) return;
    const input = document.getElementById('fillblank-input');
    const userAnswer = input.value;
    if (!userAnswer.trim()) {
        showNotify("Answer Required", "Please type your answer before submitting.");
        return;
    }

    disableAllInteractive();
    const isCorrect = fuzzyMatch(userAnswer, q.answer);

    if (isCorrect) {
        input.classList.add('correct');
        streak++;
        const courseKey = getCourseKey();
        markConceptCorrect(courseKey, currentIdx);
    } else {
        input.classList.add('wrong');
        streak = 0;
    }

    showExplanationAfterAnswer(q, isCorrect, userAnswer);
}

// ---------- Main render dispatch ----------

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

    // Determine mode
    currentMode = determineMode(q, currentIdx);

    // Mode badge
    const modeBadge = document.getElementById('mode-badge');
    modeBadge.textContent = getModeLabel(currentMode);
    modeBadge.classList.remove('hidden');

    // Difficulty badge
    const difficultyBadge = document.getElementById('difficulty-badge');
    if (q.difficulty) {
        const colors = { easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', hard: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' };
        difficultyBadge.textContent = q.difficulty;
        difficultyBadge.className = 'inline text-[10px] font-800 uppercase tracking-wider px-2 py-0.5 rounded-full ml-2 ' + (colors[q.difficulty] || colors.medium);
        difficultyBadge.classList.remove('hidden');
    } else {
        difficultyBadge.classList.add('hidden');
    }

    // Progress
    const progPct = ((currentIdx + 1) / quizData.length) * 100;
    const fill = document.getElementById('progress-fill');
    fill.style.width = progPct + '%';
    const startHue = 217, endHue = 142;
    const hue = startHue - ((startHue - endHue) * ((currentIdx + 1) / quizData.length));
    fill.style.background = `linear-gradient(90deg, #3b82f6, hsl(${hue}, 80%, 45%))`;
    document.getElementById('question-counter').innerText = `${currentIdx + 1} / ${quizData.length}`;

    // Reset common elements
    const topicTitle = document.getElementById('topic-title');
    topicTitle.textContent = q.question || "Step " + (currentIdx + 1);
    topicTitle.classList.add('hidden');

    const cb = document.getElementById('content-box');
    cb.textContent = q.content || "";
    cb.classList.add('hidden');

    document.getElementById('description-text').textContent = q.description || "";

    // Hide all mode containers
    document.getElementById('options-bin').classList.add('hidden');
    document.getElementById('options-bin').innerHTML = '';
    document.getElementById('flashcard-ui').classList.add('hidden');
    document.getElementById('fillblank-ui').classList.add('hidden');

    // Reset post-answer elements
    document.getElementById('explanation').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('next-btn-wrapper').classList.remove('visible');
    const aiSection = document.getElementById('ai-section');
    if (aiSection) aiSection.classList.add('hidden');
    const aiResponse = document.getElementById('ai-response');
    if (aiResponse) aiResponse.classList.add('hidden');
    resetAiChat();

    // Prefetch next module
    if (currentIdx === quizData.length - 1 && currentUrl) {
        const nextUrl = currentUrl.replace(/(\d+)(?=\.json)/, (m) =>
            (parseInt(m) + 1).toString().padStart(m.length, '0')
        );
        prefetchedNextModulePromise = fetch(nextUrl, { method: 'HEAD' })
            .then(res => res.ok ? nextUrl : null)
            .catch(() => null);
    }

    // Dispatch to mode renderer
    switch (currentMode) {
        case 'flashcard': renderFlashcard(q); break;
        case 'truefalse': renderTrueFalse(q); break;
        case 'fillblank': renderFillBlank(q); break;
        default: renderMC(q); break;
    }
}

// ---------- Navigation ----------

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
        correctCount = 0;
        currentIdx = 0;
        sessionQuestionCount = 0;
        prefetchedNextModulePromise = null;
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
    const totalQ = quizData.length;
    document.getElementById('final-score-val').innerText = score.toLocaleString();
    document.getElementById('final-timer-val').innerText = finalTime;
    document.getElementById('final-correct-val').innerText = `${correctCount}/${totalQ}`;
    const avgSecs = totalQ > 0 ? Math.round(secondsElapsed / totalQ) : 0;
    document.getElementById('final-avg-val').innerText = `${avgSecs}s`;
    document.getElementById('completion-subtitle').innerText = `You strengthened your understanding of ${correctCount} concept${correctCount !== 1 ? 's' : ''}.`;

    document.getElementById('quiz-flow').classList.add('hidden');
    document.getElementById('completion-screen').classList.remove('hidden');
    const compEl = document.getElementById('completion-screen');
    compEl.classList.remove('screen-enter');
    void compEl.offsetWidth;
    compEl.classList.add('screen-enter');
    const box = document.getElementById('transition-actions');

    const nextUrl = prefetchedNextModulePromise ? await prefetchedNextModulePromise : null;
    if (nextUrl) {
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
