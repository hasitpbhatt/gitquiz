// @ts-check

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

function getShareUrl() {
    const base = window.location.origin + window.location.pathname;
    const url = currentUrl || previewUrl;
    if (!url) return base;
    const parts = url.split('/');
    const modFile = parts.pop();
    const courseFolderName = parts.pop();
    const chapterNum = modFile.replace('.json', '');

    let questionIdx = 1;
    const isQuizActive = !document.getElementById('quiz-container').classList.contains('hidden')
        && !document.getElementById('quiz-flow').classList.contains('hidden');
    if (isQuizActive && quizData.length > 0 && currentIdx < quizData.length) {
        questionIdx = currentIdx + 1;
    } else if (!document.getElementById('preview-container').classList.contains('hidden') && previewData) {
        questionIdx = previewQuestionIdx + 1;
    }

    return base + '?course=' + encodeURIComponent(courseFolderName) + '&c=' + chapterNum + '&q=' + questionIdx;
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
            <div class="text-4xl mb-3">🧠</div>
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
        <div style="font-size:80px;margin-bottom:16px;">🧠</div>
        <div style="font-size:36px;font-weight:800;margin-bottom:8px;">MindVault</div>
        <div style="font-size:16px;opacity:0.6;max-width:400px;margin-bottom:40px;">Master. Recall. Succeed.</div>
        <div style="font-size:13px;font-family:monospace;padding:14px 24px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:#60a5fa;max-width:100%;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(shareUrl)}</div>
        <div style="margin-top:auto;font-size:14px;opacity:0.4;">MindVault · quiz.hasit.in</div>
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
                        title: 'LearnLeap',
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
    const mode = currentMode || 'mc';
    const modeLabels = { 'mc': 'Multiple Choice', 'flashcard': 'Recall (Flashcard)', 'truefalse': 'True / False', 'fillblank': 'Fill in the Blank' };
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;z-index:-1;width:800px;padding:50px 60px;background:linear-gradient(135deg,#0f172a,#1e293b);color:white;border-radius:40px;text-align:left;display:flex;flex-direction:column;min-height:600px;';
    container.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:4px;">
            <span class="qc-badge" style="display:inline-block;font-size:28px;">🧠</span>
            <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:4px 10px;background:rgba(99,102,241,0.15);border-radius:6px;color:#818cf8;">${modeLabels[mode] || 'Multiple Choice'}</span>
        </div>
        <div style="text-align:center;" class="qc-module">${escapeHtml(modLabel)}</div>
        ${q.question ? `<div class="qc-title">${escapeHtml(q.question)}</div>` : ''}
        ${q.description ? `<div class="qc-description">${escapeHtml(q.description)}</div>` : ''}
        <div class="qc-options"></div>
        <div style="text-align:center;margin-top:auto;" class="qc-footer">MindVault</div>
    `;
    const optsDiv = container.querySelector('.qc-options');
    if (q.options && mode !== 'flashcard') {
        q.options.forEach((opt, i) => {
            const d = document.createElement('div');
            d.className = 'qc-option';
            d.innerHTML = `<span class="qc-opt-letter">${letters[i] || (i + 1)}.</span><span>${escapeHtml(opt)}</span>`;
            optsDiv.appendChild(d);
        });
    } else if (mode === 'flashcard') {
        const d = document.createElement('div');
        d.className = 'qc-option';
        d.style.cssText = 'font-style:italic;opacity:0.6;font-size:14px;';
        d.textContent = 'Self-assess your recall of this concept.';
        optsDiv.appendChild(d);
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
        <div class="ach-footer">Verified by MindVault · quiz.hasit.in</div>
    `;
    document.body.appendChild(container);
    captureAndShareImage(container, `Achievement_${courseFolderName}_M${moduleNum}.png`);
}
