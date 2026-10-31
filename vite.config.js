import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// ใช้ security headers ชุดเดียวกับ vercel.json ตอน `npm run preview` เพื่อทดสอบก่อนดีพลอย
const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'))
const siteHeaders = Object.fromEntries(
  vercel.headers.find((h) => h.source === '/(.*)').headers.map((h) => [h.key, h.value]),
)

// ตอน dev/preview: รันไฟล์ใน api/ แบบเดียวกับ Vercel Functions (export GET/POST รับ Request คืน Response)
function apiDevServer() {
  // preview ใช้ import() ของ Node ตรงๆ เหมือนบน Vercel (ไม่ผ่าน bundler)
  const nodeLoad = (name) => import(pathToFileURL(resolve('api', `${name}.js`)).href)
  const middleware = (load) => async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost')
    const m = url.pathname.match(/^\/api\/([a-z-]+)$/)
    if (!m) return next()
    try {
      const mod = await load(m[1])
      const handler = mod[req.method]
      if (!handler) {
        res.statusCode = 405
        return res.end()
      }
      const chunks = []
      for await (const c of req) chunks.push(c)
      const body = ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks)
      const response = await handler(new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers: req.headers, body }))
      res.statusCode = response.status
      response.headers.forEach((v, k) => res.setHeader(k, v))
      res.end(Buffer.from(await response.arrayBuffer()))
    } catch (err) {
      console.error(err)
      res.statusCode = 500
      res.end('dev api error')
    }
  }
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(middleware((name) => server.ssrLoadModule(`/api/${name}.js`)))
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware(nodeLoad))
    },
  }
}

export default defineConfig(({ mode }) => {
  // ค่าลับ (DATABASE_URL ฯลฯ) ให้เฉพาะโค้ดฝั่งเซิร์ฟเวอร์ — Vite ส่งเข้าเว็บเฉพาะตัวแปรที่ขึ้นต้นด้วย VITE_
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return {
    plugins: [react(), apiDevServer()],
    preview: { headers: siteHeaders },
  }
})
