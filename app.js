/**
 * FUAD BOOKMARK MANAGER
 * Core Application Logic (Refactored for Clean Code Standards)
 */

const initialBookmarks = [];

// --- STATE MANAGEMENT ---
let bookmarks = JSON.parse(localStorage.getItem('fuad_db')) || initialBookmarks;
let favorites = JSON.parse(localStorage.getItem('fuad_favs')) || [];
let customCategories = JSON.parse(localStorage.getItem('fuad_custom_cats')) || [];
let categoryOrder = JSON.parse(localStorage.getItem('fuad_cat_order')) || [];
let currentCategory = 'All';
let searchQuery = '';
let isGridView = true;

// Drag & Drop State
let draggedCat = null;

// Variable to track the specific bookmark being edited
let editingBookmarkUrl = null;

// DOM Elements
const els = {
    catList: document.getElementById('category-list'),
    grid: document.getElementById('bookmarks-grid'),
    search: document.getElementById('search'),
    catTitle: document.getElementById('current-category-title'),
    datalist: document.getElementById('cat-datalist'),
    editBmDatalist: document.getElementById('edit-bm-datalist'),
    statTotal: document.getElementById('stat-total'),
    statFavs: document.getElementById('stat-favs'),
    statCats: document.getElementById('stat-cats'),

    addModal: document.getElementById('add-modal'),
    addForm: document.getElementById('add-form'),
    addCatInput: document.getElementById('bm-cat'),

    editBmModal: document.getElementById('edit-bm-modal'),
    editBmForm: document.getElementById('edit-bm-form'),
    editBmCatInput: document.getElementById('edit-bm-cat'),

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
    localStorage.setItem('fuad_cat_order', JSON.stringify(categoryOrder));
    renderApp();
}

function renderEmoji(text) {
    return text.replace(/🇮🇷/g, '<img src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f1ee-1f1f7.png" class="emoji-icon" alt="IR">');
}

// Ensure 'All' and 'Favorites' are ALWAYS at the top, rest is ordered manually or alphabetically
function getCategories() {
    const dynamicCats = bookmarks.map(b => b.cat);
    const allCats = new Set([...dynamicCats, ...customCategories]);

    // Explicitly remove system categories from the Set so they don't get sorted
    allCats.delete('All');
    allCats.delete('📌 Favorites');

    let sortedCats = Array.from(allCats);

    // Sort based on user's drag & drop order
    sortedCats.sort((a, b) => {
        let idxA = categoryOrder.indexOf(a);
        let idxB = categoryOrder.indexOf(b);
        if(idxA === -1) idxA = 99999;
        if(idxB === -1) idxB = 99999;
        if(idxA === 99999 && idxB === 99999) return a.localeCompare(b);
        return idxA - idxB;
    });

    return ['All', '📌 Favorites', ...sortedCats];
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

function openEditBookmarkModal(b) {
    editingBookmarkUrl = b.url;
    document.getElementById('edit-bm-title').value = b.title;
    document.getElementById('edit-bm-url').value = b.url;
    els.editBmCatInput.value = b.cat;
    els.editBmModal.classList.add('active');
}

// --- DRAG & DROP LOGIC ---
function handleDragStart(e) {
    draggedCat = this.getAttribute('data-cat');
    e.dataTransfer.effectAllowed = 'move';
    this.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.stopPropagation();
    this.classList.remove('drag-over');
    const targetCat = this.getAttribute('data-cat');

    if (draggedCat !== targetCat) {
        let cats = getCategories().filter(c => c !== 'All' && c !== '📌 Favorites');
        const draggedIdx = cats.indexOf(draggedCat);
        const targetIdx = cats.indexOf(targetCat);

        cats.splice(draggedIdx, 1);
        cats.splice(targetIdx, 0, draggedCat);

        categoryOrder = cats;
        saveState();
    }
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
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
        btn.setAttribute('data-cat', cat);
        btn.innerHTML = `<span>${renderEmoji(cat)}</span> <span class="category-count">${count}</span>`;

        // Add Drag and Drop to non-system folders
        if (cat !== 'All' && cat !== '📌 Favorites') {
            btn.draggable = true;
            btn.addEventListener('dragstart', handleDragStart);
            btn.addEventListener('dragover', handleDragOver);
            btn.addEventListener('dragenter', handleDragEnter);
            btn.addEventListener('dragleave', handleDragLeave);
            btn.addEventListener('drop', handleDrop);
            btn.addEventListener('dragend', handleDragEnd);
        }

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
                <button class="action-btn edit-bm-btn" title="Edit">
                    <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
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

        card.querySelector('.edit-bm-btn').addEventListener('click', (e) => {
            e.preventDefault();
            openEditBookmarkModal(b);
        });

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
    els.editBmDatalist.innerHTML = '';

    getCategories().filter(c => c !== 'All' && c !== '📌 Favorites').forEach(c => {
        const option1 = document.createElement('option');
        option1.value = c;
        els.datalist.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = c;
        els.editBmDatalist.appendChild(option2);
    });
}

// --- SMART DATALIST UX (Fixes Chrome Datalist Issue) ---
let oldAddCatVal = '';
els.addCatInput.addEventListener('focus', function() {
    oldAddCatVal = this.value;
    this.value = '';
});
els.addCatInput.addEventListener('blur', function() {
    if(this.value.trim() === '') this.value = oldAddCatVal;
});

let oldEditCatVal = '';
els.editBmCatInput.addEventListener('focus', function() {
    oldEditCatVal = this.value;
    this.value = '';
});
els.editBmCatInput.addEventListener('blur', function() {
    if(this.value.trim() === '') this.value = oldEditCatVal;
});


// --- FORM EVENT LISTENERS ---

// Add Bookmark
els.addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('bm-title').value.trim();
    let url = document.getElementById('bm-url').value.trim();
    const cat = els.addCatInput.value.trim();

    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    if (bookmarks.some(b => b.url === url)) {
        alert("This URL is already in your library.");
        return;
    }

    if (!customCategories.includes(cat)) customCategories.push(cat);
    if (!categoryOrder.includes(cat)) categoryOrder.push(cat);

    bookmarks.push({ title, url, cat });
    saveState();
    els.addModal.classList.remove('active');
    els.addForm.reset();
});

// Edit Bookmark
els.editBmForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newTitle = document.getElementById('edit-bm-title').value.trim();
    let newUrl = document.getElementById('edit-bm-url').value.trim();
    const newCat = els.editBmCatInput.value.trim();

    if (!/^https?:\/\//i.test(newUrl)) newUrl = 'https://' + newUrl;

    if (newUrl !== editingBookmarkUrl && bookmarks.some(b => b.url === newUrl)) {
        alert("This URL is already in your library.");
        return;
    }

    if (!customCategories.includes(newCat)) customCategories.push(newCat);
    if (!categoryOrder.includes(newCat)) categoryOrder.push(newCat);

    // Update in bookmarks array
    const index = bookmarks.findIndex(b => b.url === editingBookmarkUrl);
    if (index !== -1) {
        bookmarks[index].title = newTitle;
        bookmarks[index].url = newUrl;
        bookmarks[index].cat = newCat;
    }

    // Update in favorites array if URL changed
    if (newUrl !== editingBookmarkUrl) {
        const favIndex = favorites.indexOf(editingBookmarkUrl);
        if (favIndex !== -1) {
            favorites[favIndex] = newUrl;
        }
    }

    saveState();
    els.editBmModal.classList.remove('active');
});

// Edit Category Name
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

        if (categoryOrder.includes(currentCategory)) {
            categoryOrder[categoryOrder.indexOf(currentCategory)] = newName;
        } else {
            categoryOrder.push(newName);
        }

        currentCategory = newName;
        saveState();
    }
    els.editModal.classList.remove('active');
});

// Create Folder
els.addCatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newFolderName = document.getElementById('new-folder-name').value.trim();
    if (newFolderName && !getCategories().includes(newFolderName)) {
        customCategories.push(newFolderName);
        categoryOrder.push(newFolderName);
        saveState();
    }
    els.addCatModal.classList.remove('active');
    els.addCatForm.reset();
});

// Delete Category
els.deleteCatBtn.addEventListener('click', () => {
    const confirmDelete = confirm(`Are you sure you want to delete the folder "${currentCategory}"?\n\nWARNING: This will also delete ALL bookmarks inside it!`);
    if (confirmDelete) {
        bookmarks = bookmarks.filter(b => b.cat !== currentCategory);
        customCategories = customCategories.filter(c => c !== currentCategory);
        categoryOrder = categoryOrder.filter(c => c !== currentCategory);
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

                    if(folderName && !customCategories.includes(folderName)) {
                        customCategories.push(folderName);
                        categoryOrder.push(folderName);
                    }
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

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const toggleBtn = document.getElementById('toggle-sidebar');
    if (window.innerWidth <= 768 && els.sidebar.classList.contains('open')) {
        // If the click is NOT inside the sidebar AND NOT on the toggle button
        if (!els.sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
            els.sidebar.classList.remove('open');
        }
    }
});

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

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registered!'))
            .catch(err => console.error('Service Worker registration failed:', err));
    });
}