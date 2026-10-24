/* 離線快取：先用快取秒開，背景抓新版，下次打開就是新的。版號在 js/version.js，改了網頁本體（html／css／js）就加版號。
   遊戲資料與旁白音檔不在清單裡，第一次讀到就存進快取（桌遊常在收訊差的地方玩，主持頁打開過一次就能離線念）。 */
importScripts('js/version.js');
const VERSION = 'kbg-' + APP_VERSION;
const FILES = [
  './', 'index.html', 'style.css', 'manifest.webmanifest', 'js/version.js', 'js/app.js', 'js/modes/undercover.js', 'js/modes/bang.js', 'js/modes/sgs.js', 'js/modes/carcassonne.js', 'js/modes/catan.js', 'js/modes/puertorico.js', 'js/modes/dixit.js', 'js/modes/mogul.js', 'js/modes/nimmt.js',
  'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', e => {
  // cache: 'reload' 繞過瀏覽器的 HTTP 快取（GitHub Pages 每個檔案快取 10 分鐘），避免新 index.html 配到舊 js
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // 只換網頁本體的快取；遊戲資料與音檔（kbg-data）跨版本保留
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== 'kbg-data').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || e.request.headers.has('range')) return;
  const box = u.pathname.includes('/games/') ? 'kbg-data' : VERSION;
  e.respondWith(caches.open(box).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.status === 200) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
