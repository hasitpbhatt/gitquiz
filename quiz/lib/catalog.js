// @ts-check

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
        const cleanName = name.replace(/^(book|podcast|coursera|course)-/i, '');
        let displayName = cleanName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (activeTypeFilter === 'all') {
            let prefix = '📖';
            if (name.startsWith('book-')) prefix = '📘';
            else if (name.startsWith('podcast-')) prefix = '🎙';
            else if (name.startsWith('coursera-')) prefix = '📚';
            displayName = `${prefix} ${displayName}`;
        }
        opt.innerHTML = displayName;
        opt.title = displayName;
        dropdown.appendChild(opt);
    });
    if (items.length > 0) dropdown.selectedIndex = 0;
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
