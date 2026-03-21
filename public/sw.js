const VERSION = Math.floor(Date.now() / (30 * 24 * 60 * 60 * 1000)) // 30 kunlik versiya
const CACHE_NAME = `rayhon-static-${VERSION}`
const STATIC_PATTERNS = [/\.js$/, /\.css$/, /\.woff2?$/, /\.png$/, /\.jpe?g$/, /\.svg$/, /\.gif$/, /\.webp$/, /\.ico$/, /\.json$/]

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith('rayhon-static-') && key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  const sameOrigin = url.origin === self.location.origin

  // API yoki tashqi so'rovlarga tegmaymiz
  if (!sameOrigin || url.pathname.startsWith('/api')) return

  // Navigatsiya uchun offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')))
    return
  }

  const isStatic = STATIC_PATTERNS.some((pattern) => pattern.test(url.pathname))
  if (!isStatic) return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      if (cached) return cached
      try {
        const response = await fetch(request)
        if (response && response.ok) {
          cache.put(request, response.clone())
        }
        return response
      } catch (error) {
        return cached || fetch(request)
      }
    })
  )
})
