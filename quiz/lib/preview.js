// @ts-check

async function showPreviewScreen(url, previewIndex = 0) {
    if (url.includes("github.com") && !url.includes("raw.githubusercontent.com")) {
        url = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/").replace("/tree/", "/");
    }
    if (!url.toLowerCase().endsWith('.json')) {
        url = url.endsWith('/') ? url + '001.json' : url + '/001.json';
    }
    previewUrl = url;
    previewData = null;

    document.getElementById('setup-container').classList.add('hidden');
    document.getElementById('preview-container').classList.remove('hidden');
    const previewEl = document.getElementById('preview-container');
    previewEl.classList.remove('screen-enter');
    void previewEl.offsetWidth;
    previewEl.classList.add('screen-enter');

    const parts = url.split('/');
    const filename = parts.pop().replace('.json', '');
    const parentFolder = parts.pop() || '';
    let courseName = parentFolder
        .replace(/^(book|podcast|coursera|course)-/i, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

    document.getElementById('preview-badge').innerText = courseName || 'Module';
    document.getElementById('preview-badge').title = courseName || 'Module';
    document.getElementById('preview-title').innerText = courseName ? `${courseName} • ${filename}` : filename;
    document.getElementById('preview-title').title = courseName ? `${courseName} • ${filename}` : filename;
    document.getElementById('preview-meta').innerText = 'Loading...';
    document.getElementById('preview-topic-title').classList.add('hidden');
    document.getElementById('preview-topic-title').innerText = '';
    document.getElementById('preview-content-box').classList.add('hidden');
    document.getElementById('preview-content-box').innerText = '';
    document.getElementById('preview-description-text').innerText = '';
    document.getElementById('preview-options-bin').innerHTML = '';

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const raw = await res.json();
        const data = Array.isArray(raw) ? raw : [raw];
        if (data.length === 0) throw new Error('Empty module data.');
        previewData = data;

        document.getElementById('preview-meta').innerText = `${data.length} question${data.length > 1 ? 's' : ''}`;

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
