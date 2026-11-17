/**
 * LabPro - Service Worker (Offline Cache Engine & PWA)
 * Enables 100% offline access to all HTML pages, CSS, JS & vendor files.
 * Automatically downloads and caches the entire application shell on first visit.
 */

const CACHE_NAME = 'labpro-offline-v2';

// List of all core application shell files required for 100% offline operation
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './new-patient.html',
  './patients-reports.html',
  './referral-doctors.html',
  './test-catalog.html',
  './staff.html',
  './settings.html',
  './print-report.html',
  './assets/css/style.css',
  './assets/css/print.css',
  './assets/js/db.js',
  './assets/js/auth.js',
  './assets/js/patient-billing.js',
  './assets/js/doctors.js',
  './assets/js/tests-catalog.js',
  './assets/js/report-entry.js',
  './assets/js/report-print.js',
  './assets/js/backup.js',
  './assets/js/app.js',
  './assets/vendor/html2pdf.bundle.min.js',
  './manifest.json',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

// 1. Install Event: Pre-cache all pages and assets resiliently
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[LabPro SW] Pre-caching all app files for 100% offline use...');
      const cachePromises = PRECACHE_ASSETS.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'no-cache' });
          if (response && response.status === 200) {
            await cache.put(url, response);
          }
        } catch (err) {
          console.warn('[LabPro SW] Failed to pre-cache:', url, err);
        }
      });
      await Promise.all(cachePromises);
      console.log('[LabPro SW] Pre-caching complete! App is ready for offline operation.');
    })
  );
});

// 2. Activate Event: Clean up outdated caches and take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[LabPro SW] Removing obsolete cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      console.log('[LabPro SW] Claiming clients for instant offline capability.');
      return self.clients.claim();
    })
  );
});

// 3. Fetch Event: Cache First with Network Fallback & Background Update
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Only handle HTTP and HTTPS requests
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    (async () => {
      // Step A: Check exact match or query-ignored match in cache
      const cachedResponse = await caches.match(event.request, { ignoreSearch: true });
      if (cachedResponse) {
        // If online, perform background revalidation to keep cache fresh
        if (navigator.onLine) {
          fetch(event.request)
            .then((networkResp) => {
              if (networkResp && networkResp.status === 200 && networkResp.type === 'basic') {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResp));
              }
            })
            .catch(() => {});
        }
        return cachedResponse;
      }

      // Step B: Not in cache, try fetching from network
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      } catch (networkError) {
        // Step C: Network failed (User is Offline)
        // If it's a page navigation request, match the HTML file from cache
        if (event.request.mode === 'navigate') {
          const pathname = url.pathname;
          const fileName = pathname.substring(pathname.lastIndexOf('/') + 1) || 'index.html';
          
          // Try matching relative page name
          const pageMatch = await caches.match('./' + fileName, { ignoreSearch: true });
          if (pageMatch) return pageMatch;

          // Try matching exact pathname
          const pathMatch = await caches.match(url.pathname, { ignoreSearch: true });
          if (pathMatch) return pathMatch;

          // Fallback to home dashboard
          const indexFallback = (await caches.match('./index.html')) || (await caches.match('./'));
          if (indexFallback) return indexFallback;
        }

        // Rethrow error if neither cache nor network can serve
        throw networkError;
      }
    })()
  );
});
