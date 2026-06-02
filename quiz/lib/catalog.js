// @ts-check

function getTypeIcon(name) {
    if (/^book-/i.test(name)) {
        return '<svg class="list-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';
    }
    if (/^podcast-/i.test(name)) {
        return '<svg class="list-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
    }
    if (/^(coursera|course)-/i.test(name)) {
        return '<svg class="list-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 0 1 .665 6.479A11.952 11.952 0 0 0 12 20.055a11.952 11.952 0 0 0-6.824-2.998 12.078 12.078 0 0 1 .665-6.479L12 14z"/><path d="M12 22v-8"/></svg>';
    }
    return '';
}

function selectCourseItem(value) {
    const dropdown = document.getElementById('course-dropdown');
    dropdown.dataset.selectedValue = value;
    dropdown.querySelectorAll('.list-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.value === value);
    });
}

async function loadCatalog() {
    const dropdown = document.getElementById('course-dropdown');
    try {
        const [catalogRes, metaRes] = await Promise.all([
            fetch(CATALOG_URL),
            fetch(META_URL)
        ]);
        const text = await catalogRes.text();
        fullCatalog = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (metaRes.ok) {
            coursesMeta = await metaRes.json();
        }
        renderCatalogOptions(fullCatalog);
    } catch (err) {
        dropdown.innerHTML = '<div class="list-empty">Error connecting to catalog vault.</div>';
    }
}

function renderCatalogOptions(items) {
    const dropdown = document.getElementById('course-dropdown');
    dropdown.innerHTML = '';
    if (items.length === 0) {
        dropdown.innerHTML = '<div class="list-empty">No matches found.</div>';
        return;
    }
    const sorted = [...items].sort((a, b) => {
        const aNew = isCourseNew(a) ? 0 : 1;
        const bNew = isCourseNew(b) ? 0 : 1;
        return aNew - bNew;
    });
    sorted.forEach(name => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.dataset.value = name;
        item.setAttribute('role', 'option');
        const cleanName = name.replace(/^(book|podcast|coursera|course)-/i, '');
        const displayName = cleanName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        let html = getTypeIcon(name);
        html += '<span class="list-item-text">' + displayName + '</span>';
        if (isCourseNew(name)) {
            html += '<span class="new-badge">NEW</span>';
        }
        item.innerHTML = html;
        item.title = displayName;
        item.addEventListener('click', () => selectCourseItem(name));
        dropdown.appendChild(item);
    });
    if (items.length > 0) selectCourseItem(sorted[0]);
}

function setTypeFilter(type) {
    activeTypeFilter = type;
    document.querySelectorAll('.type-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    filterCatalog();
}

function filterCatalog() {
    const query = document.getElementById('catalog-search').value.toLowerCase();
    const filtered = fullCatalog.filter(name => {
        const matchesType = activeTypeFilter === 'all' || name.startsWith(activeTypeFilter + '-');
        const matchesSearch = name.toLowerCase().replace(/-/g, ' ').includes(query);
        return matchesType && matchesSearch;
    });
    renderCatalogOptions(filtered);
}

function getOrCreateUrlSection() {
    let section = document.getElementById('url-section');
    if (section) return section;
    section = document.createElement('div');
    section.id = 'url-section';
    section.className = 'hidden space-y-2 -mt-3';
    section.innerHTML = `
        <input type="text" id="quiz-url" placeholder="https://.../module.json"
            class="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent outline-none focus:border-blue-500">
        <div class="p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
            <span class="text-[10px] font-700 text-slate-400 uppercase">Tip:</span>
            <code id="example-link" onclick="fillExample()" class="text-[11px] text-blue-500 cursor-pointer hover:underline">https://raw.githubusercontent.com/hasitpbhatt/gitquiz/refs/heads/main/courses/book-atomic-habits/001.json</code>
        </div>`;
    document.getElementById('begin-btn-wrapper').before(section);
    return section;
}

function fillExample() {
    const section = getOrCreateUrlSection();
    document.getElementById('quiz-url').value = document.getElementById('example-link').innerText;
    if (section.classList.contains('hidden')) toggleUrlInput();
}

function toggleUrlInput() {
    const section = getOrCreateUrlSection();
    const btn = document.getElementById('url-toggle-btn');
    section.classList.toggle('hidden');
    btn.innerText = section.classList.contains('hidden') ? '\uD83D\uDD17 Custom Quiz' : '\u2715 Custom Quiz';
}
