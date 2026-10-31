import { toRecord, fromRecord } from './record.js'

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

// เก็บประวัติในเครื่อง
const KEY = 'lmq-history'
export function saveHistory(player, id) {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    list.unshift({ ...toRecord(player), id })
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)))
  } catch {
    /* ignore */
  }
}
