// การ์ดพรีวิวลิงก์ (1200×630) เป็น SVG — ถูก bundle เป็น api/_gen/og-card.js ด้วย `npm run build:og`
// ไฟล์นี้ใช้คอมโพเนนต์ตัวละคร/ฉากชุดเดียวกับหน้าเว็บ
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Avatar, { avatarGeometry } from '../src/components/Avatar'
import Scene from '../src/components/Scene'

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// ใส่ตำแหน่ง/ขนาดให้ <svg> ที่ render ออกมา เพื่อซ้อนเป็น svg ลูก
const place = (markup, x, y, w, h) => markup.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `)

export function renderCardSvg({ name, age, gender, look, total, tierTitle, tierColor, sceneId, ageLook, site }) {
  const scene = renderToStaticMarkup(createElement(Scene, { id: sceneId }))
  const avatar = renderToStaticMarkup(
    createElement(Avatar, { gender, look: ageLook, presetIndex: look.presetIndex, expression: look.expression, pose: 'idle', variant: look.variant, name }),
  )
  // ป้ายชื่อเหนือหัวตัวละคร
  const ax = 70, ay = 110, aw = 400, ah = 509
  const tagY = ay + ((avatarGeometry(ageLook).headTop - 30) / 280) * ah
  const tagW = Math.min(360, 40 + [...name].length * 22)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="og-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#b8a4ff"/><stop offset="0.55" stop-color="#ffb8dc"/><stop offset="1" stop-color="#ffe3a8"/>
    </linearGradient>
    <clipPath id="og-panel"><rect x="30" y="30" width="520" height="570" rx="32"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="url(#og-bg)"/>
  <g clip-path="url(#og-panel)">
    ${place(scene, 30, 30, 520, 570)}
    ${place(avatar, ax, ay, aw, ah)}
  </g>
  <rect x="30" y="30" width="520" height="570" rx="32" fill="none" stroke="#2a1f3d" stroke-width="6"/>
  <rect x="${290 - tagW / 2}" y="${tagY - 50}" width="${tagW}" height="46" rx="12" fill="#2a1f3d" fill-opacity="0.9"/>
  <text x="290" y="${tagY - 18}" text-anchor="middle" font-family="Mitr" font-weight="600" font-size="26" fill="#fff">${esc(name)}</text>

  <g font-family="Mitr" fill="#2a1f3d">
    <text x="600" y="110" font-size="30" font-weight="600">LIFE MONEY QUEST</text>
    <text x="600" y="190" font-size="34">${esc(name)} · อายุ ${age} ปี</text>
    <text x="600" y="240" font-size="30" fill="#6b5f80">เงินที่ไหลผ่านชีวิตทั้งหมด</text>
    <text x="600" y="345" font-size="${total.length > 13 ? 72 : 88}" font-weight="600" fill="#5b2fe0">฿${esc(total)}</text>
    <rect x="600" y="390" width="560" height="96" rx="22" fill="#fffdf7" stroke="#2a1f3d" stroke-width="5"/>
    <rect x="622" y="410" width="18" height="56" rx="6" fill="${tierColor}"/>
    <text x="660" y="452" font-size="${[...tierTitle].length > 22 ? 28 : 34}" font-weight="600">${esc(tierTitle)}</text>
    <text x="600" y="560" font-size="28" fill="#5b2fe0">มาลองเล่นของคุณที่ ${esc(site)}</text>
  </g>
</svg>`
}
