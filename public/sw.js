const CACHE_VERSION = 'v1'
const STATIC_CACHE  = `fitprompt-static-${CACHE_VERSION}`
const OFFLINE_URL   = '/offline.html'

// Pre-cache the offline fallback on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.add(OFFLINE_URL)),
  )
  self.skipWaiting()
})

// Delete stale caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept non-GET or API requests
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return

  // Cache-first for Next.js static chunks (immutable hashed filenames)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(request)
        if (hit) return hit
        const res = await fetch(request)
        if (res.ok) cache.put(request, res.clone())
        return res
      }),
    )
    return
  }

  // Network-first for page navigations; serve offline fallback on failure
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(OFFLINE_URL)
        return cached ?? new Response(
          '<!DOCTYPE html><html lang="es"><body style="background:#101010;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;flex-direction:column;gap:16px"><h1>Sin conexión</h1><button onclick="location.reload()" style="background:#FF471A;color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">Reintentar</button></body></html>',
          { status: 503, headers: { 'Content-Type': 'text/html;charset=utf-8' } },
        )
      }),
    )
  }
})
