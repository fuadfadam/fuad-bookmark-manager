const CACHE_NAME = 'fuad-bookmark-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './Fuad.png',
    './manifest.json'
];

// Install Service Worker and cache assets
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

// Serve cached content when offline
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(response => response || fetch(e.request))
    );
});