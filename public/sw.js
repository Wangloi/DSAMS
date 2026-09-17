const CACHE_NAME = 'dsams-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/images/DSA.png',
    '/images/OSA_Logo2.png',
    '/images/DSA.ico',
    '/images/DSA.jpg',
    '/images/SRCB.png',
    '/images/SRCB1.png',
];

// Install: Cache essential static shell assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[PWA SW] Pre-caching non-critical asset failed:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate: Clean up older cache versions
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Network-First for dynamic pages & API; Cache-First for static assets
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Ignore non-GET requests or WebSocket connections
    if (request.method !== 'GET' || url.protocol.startsWith('ws')) {
        return;
    }

    // Static assets (images, fonts, vite assets) -> Cache-first with Network fallback
    if (
        url.pathname.startsWith('/images/') ||
        url.pathname.startsWith('/build/assets/') ||
        url.hostname.includes('fonts.bunny.net')
    ) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return networkResponse;
                }).catch(() => caches.match('/images/DSA.png'));
            })
        );
        return;
    }

    // Page navigation / Inertia dynamic requests -> Network-first with Cache fallback
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                return networkResponse;
            })
            .catch(() => {
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Fallback to offline message or home
                    if (request.mode === 'navigate') {
                        return caches.match('/student/dashboard');
                    }
                    return new Response('Offline: Connection lost', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({ 'Content-Type': 'text/plain' }),
                    });
                });
            })
    );
});
