/**
 * service-worker.js — کش سبک برای قابلیت نصب (PWA) و بارگذاری سریع‌تر
 * این Service Worker هیچ دادهٔ کاربر یا پاسخ API را کش نمی‌کند؛ فقط پوستهٔ
 * برنامه (خود همین فایل‌های استاتیک) را کش می‌کند تا نصب و اجرا سریع‌تر شود.
 * درخواست‌های API (Cloudflare Worker شما) همیشه مستقیم از شبکه خوانده می‌شوند.
 */
const CACHE_NAME = 'taxapp-shell-v1';
const SHELL_FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(SHELL_FILES); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  const url = new URL(event.request.url);
  // فقط درخواست‌های GET همین دامنه (نه API روی Worker) را از کش پاسخ بده
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request).then(function (res) {
        if (res && res.ok) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, resClone); });
        }
        return res;
      }).catch(function () { return cached; });
    })
  );
});
