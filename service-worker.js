const CACHE_NAME = 'red-rebels-calendar-v5';
const urlsToCache = [
  './index.html',
  './assets/components/calendar.html',
  './assets/components/stats.html',
  './assets/styles/styles.css',
  './assets/scripts/script.js',
  './assets/scripts/components.js',
  './assets/scripts/data.js',
  './assets/scripts/events-data.js',
  './assets/scripts/stats.js',
  './assets/scripts/filters.js',
  './assets/scripts/labels.js',
  './assets/scripts/loader.js',
  './assets/languages/en.js',
  './assets/languages/gr.js',
  './assets/images/clear_logo.png',
  './assets/images/main.jpeg',
  './assets/images/mobile.jpeg',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Cache files individually to avoid failing if one file fails
        return Promise.allSettled(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn('Failed to cache:', url, err);
            });
          })
        );
      })
      .catch(err => {
        console.error('Cache installation failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});
