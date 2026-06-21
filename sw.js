/* iso-current PWA service worker
   方針: ファイル名に依存しないランタイムキャッシュ。
   初回オンライン時にfetchしたものをキャッシュし、以降はオフラインでもキャッシュから配信する。 */
const CACHE = 'iso-current-v1';

self.addEventListener('install', function (e) {
  // すぐ有効化
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      // 古い世代のキャッシュを掃除
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var network = fetch(e.request).then(function (resp) {
        // 取得できたらキャッシュを更新（オンライン時）
        try {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        } catch (err) {}
        return resp;
      }).catch(function () {
        // オフラインでネット失敗 → キャッシュを返す
        return cached;
      });
      // キャッシュがあれば即返し、無ければネット（初回）
      return cached || network;
    })
  );
});
