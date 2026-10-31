import { toRecord, fromRecord } from './record.js'
import { computeResult } from './calc.js'

const MAX_CODE = 4000
export const SITE_URL = 'https://lifemoneyquest.vercel.app'

// ลิงก์สำรองแบบเก็บข้อมูลไว้หลัง # (ใช้เมื่อบันทึกลงฐานข้อมูลไม่ได้)
export function encodePlayer(player) {
  const json = JSON.stringify(toRecord(player))
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodePlayer(code) {
  try {
    if (code.length > MAX_CODE) return null
    const b64 = code.replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    return fromRecord(JSON.parse(new TextDecoder().decode(bytes)))
  } catch {
    return null
  }
}

// ลิงก์ที่ส่งให้เพื่อน: ถ้ามี id ในฐานข้อมูลใช้ /r/<id> (สั้นและมีพรีวิว) ไม่งั้นใช้ข้อมูลหลัง #
export function shareUrl(player, id) {
  const origin = window.location.origin
  return id ? `${origin}/r/${id}` : `${origin}/#p=${encodePlayer(player)}`
}

export function readSharedFromHash() {
  const m = window.location.hash.match(/p=([\w-]+)/)
  return m ? decodePlayer(m[1]) : null
}

// เก็บประวัติในเครื่อง (รวมกุญแจเจ้าของผล ใช้ซ่อน/ลบผลของตัวเอง)
const KEY = 'lmq-history'
function readHistory() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}
function writeHistory(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)))
  } catch {
    /* ignore */
  }
}
export function saveHistory(player, id, token) {
  writeHistory([{ ...toRecord(player), id, token }, ...readHistory()])
}
export const ownerTokenFor = (id) => (id && readHistory().find((r) => r.id === id)?.token) || null
export function forgetHistory(id) {
  writeHistory(readHistory().filter((r) => r.id !== id))
}
// ระดับฐานะที่เคยเล่นได้ในเครื่องนี้ (ปลดล็อกไอเทมสะสม)
export function historyTiers() {
  const tiers = new Set()
  for (const r of readHistory()) {
    const p = fromRecord(r)
    if (p) tiers.add(computeResult(p).tierIndex)
  }
  return tiers
}

// ผลล่าสุดของฉัน (ใช้เทียบกับเพื่อน)
export function latestOwnResult() {
  const r = readHistory()[0]
  const player = r && fromRecord(r)
  return player ? { player, id: r.id } : null
}

// เพื่อนที่รอเทียบผล (กด "เล่นเพื่อเทียบ" จากการ์ดเพื่อน) — อยู่แค่ในแท็บนี้
const COMPARE_KEY = 'lmq-compare'
export function setCompareFriend(player) {
  try {
    sessionStorage.setItem(COMPARE_KEY, JSON.stringify(toRecord(player)))
  } catch {
    /* ignore */
  }
}
export function getCompareFriend() {
  try {
    return fromRecord(JSON.parse(sessionStorage.getItem(COMPARE_KEY) || 'null'))
  } catch {
    return null
  }
}

// ลิงก์แชร์ตรงไปแต่ละแอป
export const socialLinks = (url, text) => ({
  line: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
})
