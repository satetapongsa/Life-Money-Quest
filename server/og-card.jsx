// การ์ดพรีวิวลิงก์ (1200×630) เป็น SVG — ถูก bundle เป็น api/_gen/og-card.js ด้วย `npm run build:og`
// ไฟล์นี้ใช้คอมโพเนนต์ตัวละคร/ฉากชุดเดียวกับหน้าเว็บ
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Avatar, { avatarGeometry } from '../src/components/Avatar'
import Scene from '../src/components/Scene'

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// ใส่ตำแหน่ง/ขนาดให้ <svg> ที่ render ออกมา เพื่อซ้อนเป็น svg ลูก
const place = (markup, x, y, w, h) => markup.replace('<svg ', `<svg x="${x}" y="${y}" width="${w}" height="${h}" `)

export function renderCardSvg({ name, age, gender, look, total, tierTitle, tierColor, sceneId, ageLook, site, item = null }) {
  const scene = renderToStaticMarkup(createElement(Scene, { id: sceneId }))
  const avatar = renderToStaticMarkup(
    createElement(Avatar, { gender, look: ageLook, presetIndex: look.presetIndex, expression: look.expression, pose: 'idle', variant: look.variant, name, item }),
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
    <text x="600" y="560" font-size="24" fill="#5b2fe0">มาลองเล่นของคุณที่ ${esc(site)}</text>
  </g>
</svg>`
}

// ปกเว็บ (หน้าแรก) 1200×630 — ตัวละครตัวเดียวกันโตขึ้นทีละวัย ยืนบนกองเหรียญที่สูงขึ้นเรื่อยๆ
export function renderCoverSvg({ site }) {
  const growth = [
    { look: 'kinder', w: 100, stack: 2 },
    { look: 'primary', w: 112, stack: 4 },
    { look: 'uni', w: 124, stack: 6 },
    { look: 'work', w: 138, stack: 9, item: 'crown' },
  ]
  const groundY = 548
  const coinH = 14
  let x = 664
  const people = growth
    .map((g, i) => {
      const h = (g.w * 280) / 220
      const stackW = 74
      const cx = x + g.w / 2
      const top = groundY - g.stack * coinH
      const coins = Array.from({ length: g.stack }, (_, k) => {
        const y = groundY - (k + 1) * coinH
        return `<rect x="${cx - stackW / 2}" y="${y}" width="${stackW}" height="${coinH - 2}" rx="6" fill="${k % 2 ? '#ffd43b' : '#fcc419'}" stroke="#a4801f" stroke-width="2"/>`
      }).join('')
      const avatar = renderToStaticMarkup(
        createElement(Avatar, { gender: 'm', look: g.look, presetIndex: 0, expression: i === growth.length - 1 ? 'grin' : 'smile', pose: 'idle', variant: 1, item: g.item }),
      )
      // เท้าตัวละครอยู่ที่ y=262 ของ viewBox 280
      const svg = place(avatar, x, top - h * (262 / 280), g.w, h)
      x += g.w + 6
      return coins + svg
    })
    .join('\n')

  const pill = (px, label, w) =>
    `<rect x="${px}" y="388" width="${w}" height="44" rx="22" fill="#ffffff" stroke="#2a1f3d" stroke-width="3"/>
     <text x="${px + w / 2}" y="418" text-anchor="middle" font-family="Mitr" font-size="21" fill="#2a1f3d">${label}</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="cv-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#b8a4ff"/><stop offset="0.55" stop-color="#ffb8dc"/><stop offset="1" stop-color="#ffe3a8"/>
    </linearGradient>
    <linearGradient id="cv-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#74c0fc"/><stop offset="1" stop-color="#d0ebff"/>
    </linearGradient>
    <pattern id="cv-dots" width="38" height="38" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="2.2" fill="#ffffff" fill-opacity="0.45"/></pattern>
    <clipPath id="cv-panel"><rect x="650" y="40" width="510" height="550" rx="34"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="url(#cv-bg)"/>
  <rect width="1200" height="630" fill="url(#cv-dots)"/>

  <g font-family="Mitr" fill="#2a1f3d">
    <rect x="60" y="56" width="236" height="44" rx="22" fill="#7c4dff" stroke="#2a1f3d" stroke-width="3"/>
    <text x="178" y="86" text-anchor="middle" font-size="20" font-weight="600" fill="#ffffff">LIFE MONEY QUEST</text>
    <text x="60" y="186" font-size="66" font-weight="600">เงินไหลผ่าน<tspan fill="#7c4dff">ชีวิต</tspan>คุณ</text>
    <text x="60" y="266" font-size="66" font-weight="600">มาแล้วกี่บาท?</text>
    <text x="62" y="322" font-size="25" fill="#4a3d63">กรอกค่าขนมตั้งแต่อนุบาลจนถึงเงินเดือน</text>
    <text x="62" y="358" font-size="25" fill="#4a3d63">แล้วดูว่าคุณอยู่ระดับฐานะไหนใน 10 ระดับ</text>
  </g>
  ${pill(60, 'ตัวละครโตตามวัย', 196)}
  ${pill(268, '10 ระดับฐานะ', 160)}
  ${pill(440, 'ลีดเดอร์บอร์ด', 158)}

  <rect x="60" y="${458 + 6}" width="340" height="76" rx="22" fill="#2a1f3d"/>
  <rect x="60" y="458" width="340" height="76" rx="22" fill="#ffd43b" stroke="#2a1f3d" stroke-width="4"/>
  <text x="230" y="506" text-anchor="middle" font-family="Mitr" font-size="30" font-weight="600" fill="#2a1f3d">เล่นฟรี ไม่ต้องสมัคร</text>
  <text x="62" y="584" font-family="Mitr" font-size="26" font-weight="600" fill="#5b2fe0">${esc(site)}</text>

  <rect x="650" y="${40 + 8}" width="510" height="550" rx="34" fill="#2a1f3d"/>
  <g clip-path="url(#cv-panel)">
    <rect x="650" y="40" width="510" height="550" fill="url(#cv-sky)"/>
    <rect x="690" y="92" width="96" height="26" rx="8" fill="#ffffff" fill-opacity="0.9"/>
    <rect x="712" y="78" width="54" height="22" rx="8" fill="#ffffff" fill-opacity="0.9"/>
    <rect x="1010" y="130" width="110" height="26" rx="8" fill="#ffffff" fill-opacity="0.9"/>
    <rect x="1040" y="114" width="56" height="22" rx="8" fill="#ffffff" fill-opacity="0.9"/>
    <rect x="1086" y="64" width="46" height="46" rx="8" fill="#ffd43b"/>
    ${[[730, 210, 22], [860, 160, 18], [960, 240, 26], [1100, 200, 20], [820, 300, 16]]
      .map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffd43b" stroke="#2a1f3d" stroke-width="3"/>
    <text x="${cx}" y="${cy + r * 0.36}" text-anchor="middle" font-family="Mitr" font-weight="600" font-size="${r}" fill="#2a1f3d">฿</text>`)
      .join('\n    ')}
    <polygon points="650,520 760,470 880,510 1000,462 1160,512 1160,590 650,590" fill="#8ce99a"/>
    <rect x="650" y="${groundY}" width="510" height="${590 - groundY}" fill="#69db7c"/>
    <rect x="650" y="${groundY}" width="510" height="8" fill="#51cf66"/>
    ${people}
  </g>
  <rect x="650" y="40" width="510" height="550" rx="34" fill="none" stroke="#2a1f3d" stroke-width="6"/>
</svg>`
}
