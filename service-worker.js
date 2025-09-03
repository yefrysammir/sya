const CACHE_NAME = "recuerdos-cache-v1";

// Lista inicial de recursos estáticos que siempre se precachean
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/styles.css",
  "/script.js",
  "/recuerdos.json",
  // añade aquí íconos, logos, etc.
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Estrategia de fetch
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // Archivos multimedia: cache-first
  if (url.pathname.match(/\.(?:png|jpg|jpeg|gif|webp|svg|mp4|webm|ogg|mov)$/i)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Otros (html, css, js, json): network-first
  if (url.pathname.match(/\.(?:html|css|js|json)$/i)) {
    event.respondWith(networkFirst(req));
    return;
  }
});

// Estrategias
async function cacheFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  if (cached) return cached;
  const fresh = await fetch(req);
  cache.put(req, fresh.clone());
  return fresh;
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await cache.match(req);
    return cached || Response.error();
  }
}