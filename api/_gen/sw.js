// Service worker: เปิดเร็วขึ้นและเปิดได้แม้เน็ตหลุด — ไม่แคช /api (ข้อมูลต้องสดเสมอ) และไม่ยุ่งกับโดเมนอื่น
const CACHE = 'lmq-v2.5.0'
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  // ไฟล์ใน /assets มีชื่อแฮช ไม่เปลี่ยน → ใช้จากแคชก่อน
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()))
        return res
      })),
    )
    return
  }

  // หน้าเว็บ: เอาจากเน็ตก่อน (ได้เวอร์ชันล่าสุด/พรีวิวลิงก์) ถ้าเน็ตหลุดใช้หน้าที่แคชไว้
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && url.pathname === '/') caches.open(CACHE).then((c) => c.put('/', res.clone()))
          return res
        })
        .catch(() => caches.match('/')),
    )
  }
})
