import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ใช้ security headers ชุดเดียวกับ vercel.json ตอน `npm run preview` เพื่อทดสอบก่อนดีพลอย
const vercel = JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'))
const siteHeaders = Object.fromEntries(
  vercel.headers.find((h) => h.source === '/(.*)').headers.map((h) => [h.key, h.value]),
)

export default defineConfig({
  plugins: [react()],
  preview: { headers: siteHeaders },
})
