// @ts-check

async function showCoursePreview(courseId) {
    const meta = coursesMeta[courseId];
    const chapterCount = meta ? meta.chapters : 0;
    const resumeCh = getFirstIncompleteChapter(courseId);
    const ch = resumeCh !== null ? resumeCh : 1;
    const chPadded = String(ch).padStart(3, '0');
    const url = `${BASE_URL}${courseId}/${chPadded}.json`;
    await showPreviewScreen(url, 0, chapterCount, courseId);
}

async function showPreviewScreen(url, previewIndex = 0, chapterCount = 0, courseId = '') {
    if (url.includes("github.com") && !url.includes("raw.githubusercontent.com")) {
        url = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/").replace("/tree/", "/");
    }
    if (!url.toLowerCase().endsWith('.json')) {
        url = url.endsWith('/') ? url + '001.json' : url + '/001.json';
    }
    previewUrl = url;
    previewData = null;
    previewQuestionIdx = previewIndex;

    document.getElementById('setup-container').classList.add('hidden');
    document.getElementById('preview-container').classList.remove('hidden');
    const previewEl = document.getElementById('preview-container');
    previewEl.classList.remove('screen-enter');
    void previewEl.offsetWidth;
    previewEl.classList.add('screen-enter');

    const parts = url.split('/');
    const filename = parts.pop().replace('.json', '');
    const parentFolder = parts.pop() || '';
    if (!courseId) courseId = parentFolder;
    if (chapterCount === 0 && coursesMeta[parentFolder]) {
        chapterCount = coursesMeta[parentFolder].chapters || 0;
    }
    let courseName = parentFolder
        .replace(/^(book|podcast|coursera|course)-/i, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

    let typeEmoji = '📖';
    if (parentFolder.startsWith('book-')) typeEmoji = '📘';
    else if (parentFolder.startsWith('podcast-')) typeEmoji = '🎙';
    else if (parentFolder.startsWith('coursera-')) typeEmoji = '📚';
    const displayName = typeEmoji + ' ' + (courseName || 'Module');

    document.getElementById('preview-badge').innerText = displayName;
    document.getElementById('preview-badge').title = courseName || 'Module';
    document.getElementById('preview-title').innerText = courseName ? `${displayName} • ${filename}` : filename;
    document.getElementById('preview-title').title = courseName ? `${courseName} • ${filename}` : filename;
    document.getElementById('preview-meta').innerText = 'Loading...';
    document.getElementById('preview-summary').classList.add('hidden');
    document.getElementById('preview-topic-title').classList.add('hidden');
    document.getElementById('preview-topic-title').innerText = '';
    document.getElementById('preview-content-box').classList.add('hidden');
    document.getElementById('preview-content-box').innerText = '';
    document.getElementById('preview-description-text').classList.add('hidden');
    document.getElementById('preview-description-text').innerText = '';
    document.getElementById('preview-options-bin').classList.add('hidden');
    document.getElementById('preview-options-bin').innerHTML = '';
    document.getElementById('preview-chapter-grid').innerHTML = '';

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw : [raw];
        if (data.length === 0) throw new Error('Empty module data.');
        previewData = data;

        const currentChapter = parseInt(filename, 10);
        const totalChapters = chapterCount > 0 ? chapterCount : 1;
        document.getElementById('preview-meta').innerText = `${data.length} question${data.length > 1 ? 's' : ''} in current module • ${totalChapters} chapter${totalChapters > 1 ? 's' : ''} total`;

        showSummaryCard(data, courseId, currentChapter, totalChapters);

        // Render chapter grid for course curriculum
        const grid = document.getElementById('preview-chapter-grid');
        grid.classList.toggle('hidden', chapterCount <= 1);
        if (chapterCount > 1) {
            const progress = getChapterProgress();
            const completed = progress[courseId] || [];
            for (let i = 1; i <= chapterCount; i++) {
                const ch = String(i).padStart(3, '0');
                const btn = document.createElement('button');
                const isCompleted = completed.includes(i);
                const isActive = i === currentChapter;
                btn.className = `chapter-btn${isActive ? ' chapter-btn-active' : ''}${isCompleted ? ' chapter-btn-completed' : ''}`;
                btn.textContent = isCompleted ? '✓' : i;
                btn.title = isCompleted ? `Chapter ${i} ✓` : `Chapter ${i}`;
                btn.dataset.chapter = ch;
                btn.onclick = () => {
                    const chUrl = `${BASE_URL}${parentFolder}/${ch}.json`;
                    document.getElementById('preview-container').classList.add('hidden');
                    initializeQuiz(chUrl);
                };
                grid.appendChild(btn);
            }
        }
        // Resume badge is now rendered inside showSummaryCard's progress section
    } catch (err) {
        previewData = null;
        document.getElementById('preview-summary').classList.add('hidden');
        document.getElementById('preview-meta').innerText = 'Failed to load';
        document.getElementById('preview-description-text').classList.remove('hidden');
        document.getElementById('preview-description-text').innerText = err.message;
        document.getElementById('preview-container').classList.add('hidden');
        document.getElementById('setup-container').classList.remove('hidden');
        showNotify('Load Failed', 'Could not fetch module data for preview.');
    }
}

function startFromPreview() {
    if (previewUrl && previewData) {
        document.getElementById('preview-container').classList.add('hidden');
        initializeQuiz(previewUrl, previewData);
    }
}

function cancelPreview() {
    previewUrl = '';
    previewData = null;
    document.getElementById('preview-container').classList.add('hidden');
    document.getElementById('setup-container').classList.remove('hidden');
}

function showSummaryCard(data, courseId, currentChapter, totalChapters) {
    const meta = coursesMeta[courseId] || null;

    // Difficulty tally → prose
    let easy = 0, medium = 0, hard = 0;
    data.forEach(q => {
        if (q.difficulty === 'easy') easy++;
        else if (q.difficulty === 'medium') medium++;
        else if (q.difficulty === 'hard') hard++;
    });
    const totalDiff = easy + medium + hard;
    const diffEl = document.getElementById('summary-difficulty');
    const diffText = document.getElementById('summary-difficulty-text');
    if (totalDiff > 0) {
        const parts = [];
        if (easy > 0) parts.push(easy + ' easy');
        if (medium > 0) parts.push(medium + ' medium');
        if (hard > 0) parts.push(hard + ' hard');
        diffText.textContent = parts.join(' · ');
        diffEl.classList.remove('hidden');
    } else {
        diffEl.classList.add('hidden');
    }

    // Estimated time (45s per question)
    const minutes = Math.ceil((data.length * 45) / 60);
    document.getElementById('summary-time').textContent = `~${minutes} min`;

    // Progress + Resume (compact, shown only when there's actual progress)
    const progress = getChapterProgress();
    const completed = (progress[courseId] || []).length;
    const progressEl = document.getElementById('summary-progress');
    const progressText = document.getElementById('summary-progress-text');
    const resumeEl = document.getElementById('summary-resume');
    if (completed > 0) {
        progressText.textContent = `${completed}/${totalChapters}`;
        document.getElementById('summary-progress-fill').style.width = totalChapters > 0 ? `${(completed / totalChapters) * 100}%` : '0%';
        progressEl.classList.remove('hidden');
        if (currentChapter > 1) {
            resumeEl.textContent = `↻ Resume from Ch ${currentChapter}`;
            resumeEl.classList.remove('hidden');
        } else {
            resumeEl.classList.add('hidden');
        }
    } else {
        progressEl.classList.add('hidden');
    }

    // Chapter descriptions (optional, hero position)
    const descContainer = document.getElementById('summary-chapter-desc');
    descContainer.innerHTML = '';
    descContainer.classList.add('hidden');
    if (meta && meta.chapterDescriptions) {
        const descs = meta.chapterDescriptions;
        let hasContent = false;
        for (let i = 1; i <= totalChapters; i++) {
            const chKey = String(i).padStart(3, '0');
            const desc = descs[chKey];
            if (desc) {
                hasContent = true;
                const div = document.createElement('div');
                div.className = 'text-xs text-slate-500 dark:text-slate-400 p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg';
                div.innerHTML = `<span class="font-700 text-slate-600 dark:text-slate-300">Ch ${i}:</span> ${escapeHtml(desc)}`;
                descContainer.appendChild(div);
            }
        }
        if (hasContent) descContainer.classList.remove('hidden');
    }

    document.getElementById('preview-summary').classList.remove('hidden');
}
