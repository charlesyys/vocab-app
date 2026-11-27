const CACHE_NAME = 'vocab-flashcard-pwa-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './sw.js'
];

// 安裝 Service Worker 並快取核心檔案
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 啟動時清除舊版本快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 網路優先，離線時自動讀取快取（確保有網路時拿到最新版，飛航模式也能秒開）
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // 外部即時翻譯 API 不快取，直接走網路
  if (event.request.url.includes('mymemory.translated.net')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});
