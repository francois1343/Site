// Version et liste exactes injectées par tools/build.mjs.
const VERSION = '__BUILD_VERSION__';
const CACHE = 'lamouna-public-' + VERSION;
const FILES = __PRECACHE_FILES__;
const base = self.registration.scope;
const allowed = new Set(FILES.map(file => new URL(file, base).href));
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // addAll échoue atomiquement : ne pas activer une version partielle.
    await cache.addAll(FILES.map(file => new Request(new URL(file, base), { cache: 'reload' })));
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'APPLY_UPDATE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Les autres onglets gardent leurs ressources jusqu'à leur propre rechargement.
    // Deux versions publiques maximum ; aucun stockage client n'est effacé.
    const keys = (await caches.keys()).filter(key => key.startsWith('lamouna-public-') && key !== CACHE);
    await Promise.all(keys.slice(0, -1).map(key => caches.delete(key)));
    // Pas de clients.claim : première installation sans fausse notification de MAJ.
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== new URL(base).origin || url.search) return;
  const index = new URL('index.html', base).href;
  if (request.mode === 'navigate' && (url.href === base || url.href === index)) {
    event.respondWith((async () => (await caches.open(CACHE)).match(index).then(hit => hit || fetch(request)))());
    return;
  }
  if (!allowed.has(url.href)) return; // API, build.json, comptes et tiers : réseau uniquement.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (url.href === new URL('menu.json', base).href) {
      const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(request, { signal: controller.signal });
        if (!response.ok || response.redirected) throw Error('Carte indisponible');
        const content = await response.clone().json();
        if (!Array.isArray(content.items) || !Array.isArray(content.categories)) throw Error('Carte invalide');
        await cache.put(request, response.clone());
        return response;
      } catch {
        const hit = await cache.match(request);
        if (!hit) return Response.error();
        const headers = new Headers(hit.headers); headers.set('X-LaMouna-Offline', '1');
        return new Response(await hit.arrayBuffer(), { status: 200, headers });
      } finally { clearTimeout(timeout); }
    }
    return (await cache.match(request)) || fetch(request);
  })());
});
