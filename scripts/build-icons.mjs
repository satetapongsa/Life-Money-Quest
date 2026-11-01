// สร้างไอคอนแอป (PWA / หน้าจอหลัก / favicon) จาก SVG: npm run build:icons — ผลลัพธ์อยู่ใน public/icons (commit ไว้)
import { mkdirSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

const FONT = ['api/_fonts/Mitr_600SemiBold.ttf']

// เหรียญ ฿ บนพื้นม่วง-ชมพู (maskable = เว้นขอบปลอดภัย 20% สำหรับไอคอนทรงต่างๆ ของ Android)
function iconSvg({ maskable = false } = {}) {
  const r = maskable ? 150 : 200
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9775fa"/><stop offset="1" stop-color="#ff6fae"/></linearGradient>
    <radialGradient id="coin" cx="0.38" cy="0.32" r="0.75"><stop offset="0" stop-color="#fff3a6"/><stop offset="0.45" stop-color="#ffd43b"/><stop offset="1" stop-color="#e0a800"/></radialGradient>
  </defs>
  <rect width="512" height="512" rx="${maskable ? 0 : 112}" fill="url(#bg)"/>
  <circle cx="256" cy="${256 + r * 0.06}" r="${r}" fill="#2a1f3d"/>
  <circle cx="256" cy="256" r="${r}" fill="url(#coin)" stroke="#2a1f3d" stroke-width="${r * 0.09}"/>
  <text x="256" y="${256 + r * 0.36}" text-anchor="middle" font-family="Mitr" font-weight="600" font-size="${r * 1.15}" fill="#2a1f3d">฿</text>
</svg>`
}

function png(svg, size) {
  return new Resvg(svg, { fitTo: { mode: 'width', value: size }, font: { fontFiles: FONT, loadSystemFonts: false, defaultFontFamily: 'Mitr' } }).render().asPng()
}

mkdirSync('public/icons', { recursive: true })
const plain = iconSvg()
const maskable = iconSvg({ maskable: true })
writeFileSync('public/icons/icon-192.png', png(plain, 192))
writeFileSync('public/icons/icon-512.png', png(plain, 512))
writeFileSync('public/icons/maskable-512.png', png(maskable, 512))
writeFileSync('public/icons/apple-touch-icon.png', png(maskable, 180))
writeFileSync('public/icons/favicon-32.png', png(plain, 32))
console.log('icons written to public/icons')
