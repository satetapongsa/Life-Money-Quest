import { ALL_STAGES, FREQS, SCHOOL_DAYS, MIN_AGE, MAX_AGE } from '../data/stages'
import { PRESETS, EXPRESSIONS, POSES } from '../data/avatars'

const MAX_AMOUNT = 100_000_000
const MAX_NAME = 16
const MAX_CODE = 4000

// แพ็กข้อมูลผู้เล่นลงในลิงก์ (ยังไม่มีฐานข้อมูล) — โครงสร้างเดียวกันนี้ใช้ส่งขึ้น leaderboard ได้ภายหลัง
export function toRecord(player) {
  return {
    v: 1,
    n: player.name,
    a: player.age,
    g: player.gender,
    l: player.look,
    e: player.entries,
    t: Date.now(),
  }
}

const oneOf = (v, list, fallback) => (list.includes(v) ? v : fallback)
const intIn = (v, min, max, fallback) => (Number.isInteger(v) && v >= min && v <= max ? v : fallback)

// ข้อมูลจากลิงก์เป็นข้อมูลที่ใครก็แก้ได้ — ตรวจและกรองทุกช่องก่อนใช้ คืน null ถ้าใช้ไม่ได้
export function fromRecord(r) {
  if (!r || typeof r !== 'object' || r.v !== 1) return null
  const name = typeof r.n === 'string' ? r.n.trim().slice(0, MAX_NAME) : ''
  const age = intIn(r.a, MIN_AGE, MAX_AGE, null)
  if (!name || age === null) return null
  const gender = oneOf(r.g, ['m', 'f'], 'm')
  const l = r.l && typeof r.l === 'object' ? r.l : {}
  const look = {
    presetIndex: intIn(l.presetIndex, 0, PRESETS[gender].length - 1, 0),
    expression: oneOf(l.expression, EXPRESSIONS.map((e) => e.id), EXPRESSIONS[0].id),
    pose: oneOf(l.pose, POSES.map((p) => p.id), POSES[0].id),
    variant: intIn(l.variant, 0, 999, 0),
  }
  const entries = {}
  const src = r.e && typeof r.e === 'object' ? r.e : {}
  for (const s of ALL_STAGES) {
    const e = Object.hasOwn(src, s.id) ? src[s.id] : null
    if (!e || typeof e !== 'object') continue
    const amount = Number(e.amount)
    if (!Number.isFinite(amount) || amount < 0 || amount > MAX_AMOUNT) continue
    entries[s.id] = s.kind === 'school'
      ? { amount: String(amount), days: oneOf(e.days, Object.keys(SCHOOL_DAYS), 'school') }
      : { amount: String(amount), freq: oneOf(e.freq, Object.keys(FREQS), 'month'), mode: oneOf(e.mode, ['study', 'work'], 'study') }
  }
  return { name, age, gender, look, entries, createdAt: Number.isFinite(r.t) ? r.t : 0 }
}

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

export function shareUrl(player) {
  const base = window.location.href.split('#')[0]
  return `${base}#p=${encodePlayer(player)}`
}

export function readSharedFromHash() {
  const m = window.location.hash.match(/p=([\w-]+)/)
  return m ? decodePlayer(m[1]) : null
}

// เก็บประวัติในเครื่อง (เตรียมไว้สำหรับหน้า leaderboard)
const KEY = 'lmq-history'
export function saveHistory(player) {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    list.unshift(toRecord(player))
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)))
  } catch {
    /* ignore */
  }
}
