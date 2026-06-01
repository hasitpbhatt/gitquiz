// @ts-check

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

function fillExample() {
    document.getElementById('quiz-url').value = document.getElementById('example-link').innerText;
    const section = document.getElementById('url-section');
    if (section.classList.contains('hidden')) toggleUrlInput();
}

function toggleUrlInput() {
    const section = document.getElementById('url-section');
    const btn = document.getElementById('url-toggle-btn');
    section.classList.toggle('hidden');
    btn.innerText = section.classList.contains('hidden') ? '\uD83D\uDD17 Custom URL' : '\u2715 Custom URL';
}
