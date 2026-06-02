// @ts-check

async function showCoursePreview(courseId) {
    const meta = coursesMeta[courseId];
    const chapterCount = meta ? meta.chapters : 0;
    const url = `${BASE_URL}${courseId}/001.json`;
    await showPreviewScreen(url, 0, chapterCount);
}

async function showPreviewScreen(url, previewIndex = 0, chapterCount = 0) {
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
    document.getElementById('preview-badge').title = displayName;
    document.getElementById('preview-title').innerText = courseName ? `${displayName} • ${filename}` : filename;
    document.getElementById('preview-title').title = courseName ? `${displayName} • ${filename}` : filename;
    document.getElementById('preview-meta').innerText = 'Loading...';
    document.getElementById('preview-topic-title').classList.add('hidden');
    document.getElementById('preview-topic-title').innerText = '';
    document.getElementById('preview-content-box').classList.add('hidden');
    document.getElementById('preview-content-box').innerText = '';
    document.getElementById('preview-description-text').innerText = '';
    document.getElementById('preview-options-bin').innerHTML = '';
    document.getElementById('preview-chapter-grid').innerHTML = '';

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw : [raw];
        if (data.length === 0) throw new Error('Empty module data.');
        previewData = data;

        const totalChapters = chapterCount > 0 ? chapterCount : 1;
        document.getElementById('preview-meta').innerText = `${data.length} question${data.length > 1 ? 's' : ''} in current module • ${totalChapters} chapter${totalChapters > 1 ? 's' : ''} total`;

        const targetQ = data[previewIndex] || data[0];
        document.getElementById('preview-description-text').innerText = targetQ.description || targetQ.question || 'No question available';

        const bin = document.getElementById('preview-options-bin');
        bin.innerHTML = '';
        if (targetQ.options) {
            const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
            targetQ.options.forEach((opt, idx) => {
                const div = document.createElement('div');
                div.className = 'preview-option w-full p-5 text-left border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-600 bg-white dark:bg-slate-800 shadow-sm flex items-center gap-3';
                div.innerHTML = `<span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-800 text-slate-500 shrink-0">${letters[idx] || (idx + 1)}</span><span class="flex-1">${escapeHtml(opt)}</span>`;
                bin.appendChild(div);
            });
        }

        // Render chapter grid for course curriculum
        const grid = document.getElementById('preview-chapter-grid');
        grid.classList.toggle('hidden', chapterCount <= 1);
        if (chapterCount > 1) {
            const currentChapter = parseInt(filename, 10);
            for (let i = 1; i <= chapterCount; i++) {
                const ch = String(i).padStart(3, '0');
                const btn = document.createElement('button');
                btn.className = `chapter-btn ${i === currentChapter ? 'chapter-btn-active' : ''}`;
                btn.textContent = i;
                btn.title = `Chapter ${i}`;
                btn.dataset.chapter = ch;
                btn.onclick = () => {
                    const chUrl = `${BASE_URL}${parentFolder}/${ch}.json`;
                    document.getElementById('preview-container').classList.add('hidden');
                    initializeQuiz(chUrl);
                };
                grid.appendChild(btn);
            }
        }
    } catch (err) {
        previewData = null;
        document.getElementById('preview-meta').innerText = 'Failed to load';
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
