/**
 * FUAD BOOKMARK MANAGER
 * Core Application Logic
 */

const initialBookmarks = [];

// --- STATE MANAGEMENT ---
let bookmarks = JSON.parse(localStorage.getItem('fuad_db')) || initialBookmarks;
let favorites = JSON.parse(localStorage.getItem('fuad_favs')) || [];
let customCategories = JSON.parse(localStorage.getItem('fuad_custom_cats')) || [];
let currentCategory = 'All';
let searchQuery = '';
let isGridView = true;

// DOM Elements
const els = {
    catList: document.getElementById('category-list'),
    grid: document.getElementById('bookmarks-grid'),
    search: document.getElementById('search'),
    catTitle: document.getElementById('current-category-title'),
    datalist: document.getElementById('cat-datalist'),
    statTotal: document.getElementById('stat-total'),
    statFavs: document.getElementById('stat-favs'),
    statCats: document.getElementById('stat-cats'),
    addModal: document.getElementById('add-modal'),
    addForm: document.getElementById('add-form'),
    editModal: document.getElementById('edit-cat-modal'),
    editForm: document.getElementById('edit-cat-form'),
    addCatModal: document.getElementById('add-cat-modal'),
    addCatForm: document.getElementById('add-cat-form'),
    editCatBtn: document.getElementById('edit-cat-btn'),
    deleteCatBtn: document.getElementById('delete-cat-btn'),
    sidebar: document.getElementById('sidebar')
};

// --- CORE UTILITIES ---
function saveState() {
    localStorage.setItem('fuad_db', JSON.stringify(bookmarks));
    localStorage.setItem('fuad_favs', JSON.stringify(favorites));
    localStorage.setItem('fuad_custom_cats', JSON.stringify(customCategories));
    renderApp();
}

function renderEmoji(text) {
    return text.replace(/🇮🇷/g, '<img src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f1ee-1f1f7.png" class="emoji-icon" alt="IR">');
}

function getCategories() {
    const dynamicCats = bookmarks.map(b => b.cat);
    const allCats = new Set([...dynamicCats, ...customCategories]);
    return ['All', '📌 Favorites', ...Array.from(allCats)].sort();
}

// --- CRUD LOGIC ---
function deleteBookmark(url) {
    if (confirm("Permanently delete this bookmark?")) {
        bookmarks = bookmarks.filter(b => b.url !== url);
        favorites = favorites.filter(f => f !== url);
        saveState();
    }
}

function toggleFavorite(url) {
    if (favorites.includes(url)) {
        favorites = favorites.filter(f => f !== url);
    } else {
        favorites.push(url);
    }
    saveState();
}

// --- RENDER FUNCTIONS ---
function renderApp() {
    renderSidebar();
    renderGrid();
    updateStats();
    updateDatalist();
}

function renderSidebar() {
    const categories = getCategories();
    els.catList.innerHTML = '';

    if (!categories.includes(currentCategory) && currentCategory !== 'All' && currentCategory !== '📌 Favorites') {
        currentCategory = 'All';
    }

    categories.forEach(cat => {
        const count = cat === 'All' ? bookmarks.length
            : cat === '📌 Favorites' ? favorites.length
                : bookmarks.filter(b => b.cat === cat).length;

        const btn = document.createElement('button');
        btn.className = `category-btn ${cat === currentCategory ? 'active' : ''}`;
        btn.innerHTML = `<span>${renderEmoji(cat)}</span> <span class="category-count">${count}</span>`;
        btn.addEventListener('click', () => {
            currentCategory = cat;
            searchQuery = '';
            els.search.value = '';
            if (window.innerWidth <= 768) els.sidebar.classList.remove('open');
            renderApp();
        });
        els.catList.appendChild(btn);
    });
}

function renderGrid() {
    els.grid.innerHTML = '';
    els.catTitle.innerHTML = renderEmoji(currentCategory);

    if (currentCategory !== 'All' && currentCategory !== '📌 Favorites') {
        els.editCatBtn.style.display = 'inline-flex';
        els.deleteCatBtn.style.display = 'inline-flex';
    } else {
        els.editCatBtn.style.display = 'none';
        els.deleteCatBtn.style.display = 'none';
    }

    let filtered = bookmarks;
    if (currentCategory === '📌 Favorites') {
        filtered = bookmarks.filter(b => favorites.includes(b.url));
    } else if (currentCategory !== 'All') {
        filtered = bookmarks.filter(b => b.cat === currentCategory);
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(b => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
        els.grid.innerHTML = `<p class="empty-state-msg">No bookmarks found in this view.</p>`;
        return;
    }

    filtered.sort((a, b) => a.title.localeCompare(b.title));

    filtered.forEach(b => {
        const isFav = favorites.includes(b.url);
        let domain = b.url;
        try { domain = new URL(b.url).hostname; } catch(e){}
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        const card = document.createElement('a');
        card.href = b.url;
        card.target = "_blank";
        card.className = 'card glass';
        card.innerHTML = `
            <div class="card-actions">
                <button class="action-btn fav ${isFav ? 'active' : ''}" title="Favorite">
                    <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </button>
                <button class="action-btn delete" title="Delete">
                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
            <div class="card-header">
                <img src="${faviconUrl}" alt="icon" class="favicon site-icon">
                <div class="favicon fallback-icon" style="display:none;">${domain.charAt(0).toUpperCase()}</div>
                <div class="card-title">${b.title}</div>
            </div>
            <div class="card-url">${domain}</div>
        `;

        const actionsDiv = card.querySelector('.card-actions');
        actionsDiv.addEventListener('click', (e) => e.preventDefault());

        card.querySelector('.fav').addEventListener('click', (e) => {
            e.preventDefault();
            toggleFavorite(b.url);
        });

        card.querySelector('.delete').addEventListener('click', (e) => {
            e.preventDefault();
            deleteBookmark(b.url);
        });

        const imgEl = card.querySelector('.site-icon');
        const fallbackEl = card.querySelector('.fallback-icon');
        imgEl.addEventListener('error', () => {
            imgEl.style.display = 'none';
            fallbackEl.style.display = 'flex';
        });

        els.grid.appendChild(card);
    });
}

function updateStats() {
    els.statTotal.textContent = bookmarks.length;
    els.statFavs.textContent = favorites.length;
    els.statCats.textContent = getCategories().length - 2;
}

function updateDatalist() {
    els.datalist.innerHTML = '';
    getCategories().filter(c => c !== 'All' && c !== '📌 Favorites').forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        els.datalist.appendChild(option);
    });
}

// --- FORM EVENT LISTENERS ---
els.addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('bm-title').value.trim();
    let url = document.getElementById('bm-url').value.trim();
    const cat = document.getElementById('bm-cat').value.trim();

    // Auto-append https:// if no protocol is provided
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    if (bookmarks.some(b => b.url === url)) {
        alert("This URL is already in your library.");
        return;
    }

    if (!customCategories.includes(cat)) customCategories.push(cat);

    bookmarks.push({ title, url, cat });
    saveState();
    els.addModal.classList.remove('active');
    els.addForm.reset();
});

els.editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = document.getElementById('new-cat-name').value.trim();

    if(newName && newName !== currentCategory) {
        bookmarks.forEach(b => { if (b.cat === currentCategory) b.cat = newName; });

        if (customCategories.includes(currentCategory)) {
            customCategories[customCategories.indexOf(currentCategory)] = newName;
        } else {
            customCategories.push(newName);
        }

        currentCategory = newName;
        saveState();
    }
    els.editModal.classList.remove('active');
});

els.addCatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newFolderName = document.getElementById('new-folder-name').value.trim();
    if (newFolderName && !getCategories().includes(newFolderName)) {
        customCategories.push(newFolderName);
        saveState();
    }
    els.addCatModal.classList.remove('active');
    els.addCatForm.reset();
});

els.deleteCatBtn.addEventListener('click', () => {
    const confirmDelete = confirm(`Are you sure you want to delete the folder "${currentCategory}"?\n\nWARNING: This will also delete ALL bookmarks inside it!`);
    if (confirmDelete) {
        bookmarks = bookmarks.filter(b => b.cat !== currentCategory);
        customCategories = customCategories.filter(c => c !== currentCategory);
        currentCategory = 'All';
        saveState();
    }
});

// --- NETSCAPE HTML IMPORT / EXPORT ---
document.getElementById('export-html-btn').addEventListener('click', () => {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks Menu</H1>
<DL><p>\n`;

    const categories = getCategories().filter(c => c !== 'All' && c !== '📌 Favorites');
    categories.forEach(cat => {
        html += `    <DT><H3>${cat}</H3>\n    <DL><p>\n`;
        bookmarks.filter(b => b.cat === cat).forEach(b => {
            html += `        <DT><A HREF="${b.url}">${b.title}</A>\n`;
        });
        html += `    </DL><p>\n`;
    });
    html += `</DL><p>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fuad_bookmarks.html';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('import-html-btn').addEventListener('click', () => document.getElementById('import-file').click());

document.getElementById('import-file').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(e.target.result, 'text/html');
        let newCount = 0;

        function parseNode(node, folderName) {
            if (node.tagName === 'A') {
                const url = node.href;
                const title = node.textContent.trim();
                if (!bookmarks.some(b => b.url === url)) {
                    bookmarks.push({ title, url, cat: folderName || 'Imported' });
                    if(folderName && !customCategories.includes(folderName)) customCategories.push(folderName);
                    newCount++;
                }
            } else if (node.tagName === 'DT') {
                const h3 = node.querySelector('h3');
                if (h3) {
                    const dl = node.querySelector('dl');
                    if (dl) Array.from(dl.children).forEach(child => parseNode(child, h3.textContent.trim()));
                } else {
                    const a = node.querySelector('a');
                    if (a) parseNode(a, folderName);
                }
            } else {
                Array.from(node.children).forEach(child => parseNode(child, folderName));
            }
        }

        const rootDl = doc.querySelector('dl');
        if (rootDl) {
            Array.from(rootDl.children).forEach(child => parseNode(child, 'Imported'));
            saveState();
            alert(`Success! Imported ${newCount} new bookmarks.`);
        } else {
            alert("Invalid HTML format. Ensure it is a standard browser export file.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
});

// --- GLOBAL EVENT LISTENERS ---
els.search.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (currentCategory !== 'All' && currentCategory !== '📌 Favorites' && searchQuery) currentCategory = 'All';
    renderApp();
});

document.getElementById('open-add-modal-btn').addEventListener('click', () => els.addModal.classList.add('active'));
document.getElementById('open-add-cat-btn').addEventListener('click', () => els.addCatModal.classList.add('active'));

els.editCatBtn.addEventListener('click', () => {
    document.getElementById('new-cat-name').value = currentCategory;
    els.editModal.classList.add('active');
});

document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    });
});

document.getElementById('toggle-view').addEventListener('click', () => {
    isGridView = !isGridView;
    els.grid.className = isGridView ? 'bookmark-container' : 'bookmark-container list-view';
});

document.getElementById('toggle-theme').addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('fuad_theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
});

document.getElementById('toggle-sidebar').addEventListener('click', () => els.sidebar.classList.toggle('open'));

// INIT
if (localStorage.getItem('fuad_theme') === 'light') {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
}
renderApp();