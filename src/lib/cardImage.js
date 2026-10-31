import { createElement } from 'react'
import Avatar, { avatarGeometry } from '../components/Avatar'
import Scene from '../components/Scene'
import { baht } from './calc'
import { APP_VERSION } from '../data/versions'

const W = 1080
const H = 1350
const INK = '#2a1f3d'

function loadSvg(markup, w, h) {
  const svg = markup.replace('<svg ', `<svg width="${w}" height="${h}" `)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

// ย่อฟอนต์จนข้อความพอดีความกว้าง
function fitText(ctx, text, x, y, maxW, size, weight = 600, family = 'Mitr') {
  let s = size
  do {
    ctx.font = `${weight} ${s}px ${family}, sans-serif`
    s -= 2
  } while (ctx.measureText(text).width > maxW && s > 16)
  ctx.fillText(text, x, y)
}

// วาดการ์ดสรุปผลเป็นรูป PNG (1080×1350) คืนค่า Blob
export async function makeResultCard({ player, result, tierTitle, sceneId, look }) {
  const { renderToStaticMarkup } = await import('react-dom/server')
  await Promise.all([document.fonts.load('600 100px Mitr'), document.fonts.load('400 36px Kanit'), document.fonts.load('500 36px Kanit')])

  const [sceneImg, avatarImg] = await Promise.all([
    loadSvg(renderToStaticMarkup(createElement(Scene, { id: sceneId })), 840, 1120),
    loadSvg(
      renderToStaticMarkup(
        createElement(Avatar, { gender: player.gender, look, presetIndex: player.look.presetIndex, expression: player.look.expression, pose: player.look.pose, variant: player.look.variant, name: player.name }),
      ),
      440,
      560,
    ),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // พื้นหลัง
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#b8a4ff')
  bg.addColorStop(0.55, '#ffb8dc')
  bg.addColorStop(1, '#ffe3a8')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.font = '600 40px Mitr, sans-serif'
  ctx.fillText('💸 LIFE MONEY QUEST', W / 2, 78)

  // ฉาก + ตัวละคร
  const px = 60, py = 110, pw = 960, ph = 640
  ctx.save()
  roundRect(ctx, px, py, pw, ph, 36)
  ctx.clip()
  const sw = pw
  const sh = (sceneImg.height / sceneImg.width) * sw
  ctx.drawImage(sceneImg, px, py + ph - sh, sw, sh)
  const aw = 440, ah = 560
  const ax = W / 2 - aw / 2 - 6, ay = py + ph - ah - 6
  ctx.drawImage(avatarImg, ax, ay, aw, ah)
  ctx.restore()
  ctx.lineWidth = 6
  ctx.strokeStyle = INK
  roundRect(ctx, px, py, pw, ph, 36)
  ctx.stroke()

  // ป้ายชื่อบนหัว
  const headY = ay + ((avatarGeometry(look).headTop - 30) / 280) * ah
  ctx.font = '500 38px Mitr, sans-serif'
  const tw = ctx.measureText(player.name).width + 44
  ctx.fillStyle = 'rgba(42,31,61,.9)'
  roundRect(ctx, W / 2 - tw / 2, headY - 58, tw, 56, 14)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillText(player.name, W / 2, headY - 18)

  // ตัวเลข
  ctx.fillStyle = INK
  ctx.font = '400 36px Kanit, sans-serif'
  ctx.fillText(`เงินที่ไหลผ่านชีวิตของ ${player.name} · อายุ ${player.age} ปี`, W / 2, 822)
  ctx.fillStyle = '#5b2fe0'
  fitText(ctx, `฿${baht(result.total)}`, W / 2, 940, 940, 120)

  // ระดับฐานะ
  const by = 980
  ctx.fillStyle = '#fffdf7'
  roundRect(ctx, 60, by, 960, 150, 28)
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = INK
  ctx.stroke()
  ctx.fillStyle = result.tier.color
  roundRect(ctx, 84, by + 22, 106, 106, 22)
  ctx.fill()
  ctx.stroke()
  ctx.font = '64px sans-serif'
  ctx.fillStyle = INK
  ctx.fillText(result.tier.emoji, 137, by + 98)
  ctx.textAlign = 'left'
  fitText(ctx, tierTitle, 214, by + 70, 780, 48)
  ctx.font = '400 30px Kanit, sans-serif'
  ctx.fillStyle = '#6b5f80'
  const times = result.ratio.toLocaleString('th-TH', { maximumFractionDigits: 2 })
  ctx.fillText(`${times} เท่าของคนทั่วไป · เฉลี่ยวันละ ${baht(result.perDay)} บาท`, 214, by + 116)

  // ฉายา
  ctx.textAlign = 'center'
  const badges = result.badges.slice(0, 3).map((b) => `${b.emoji} ${b.title}`).join('   ')
  ctx.fillStyle = INK
  if (badges) fitText(ctx, badges, W / 2, 1200, 960, 32, 400, 'Kanit')

  ctx.font = '500 30px Mitr, sans-serif'
  ctx.fillStyle = '#5b2fe0'
  ctx.fillText('มาลองเล่นของคุณที่ lifemoneyquest.vercel.app', W / 2, 1272)
  ctx.font = '400 22px Kanit, sans-serif'
  ctx.fillStyle = '#6b5f80'
  ctx.fillText(`v${APP_VERSION}`, W / 2, 1310)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
