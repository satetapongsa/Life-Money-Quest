// รูปแบบข้อมูลผู้เล่นที่ใช้ร่วมกันระหว่างเว็บและ API (ไฟล์นี้ต้องรันบน Node ได้ — ใส่ .js ทุก import)
import { ALL_STAGES, FREQS, SCHOOL_DAYS, MIN_AGE, MAX_AGE, capFor } from '../data/stages.js'
import { PRESETS, EXPRESSIONS, POSES } from '../data/avatars.js'
import { cleanName } from './names.js'

export function toRecord(player) {
  return {
    v: 1,
    n: player.name,
    a: Number(player.age),
    g: player.gender,
    l: player.look,
    e: player.entries,
    t: Date.now(),
  }
}

const oneOf = (v, list, fallback) => (list.includes(v) ? v : fallback)
const intIn = (v, min, max, fallback) => (Number.isInteger(v) && v >= min && v <= max ? v : fallback)

// ข้อมูลจากลิงก์/จาก request เป็นข้อมูลที่ใครก็แก้ได้ — ตรวจและกรองทุกช่องก่อนใช้ คืน null ถ้าใช้ไม่ได้
export function fromRecord(r) {
  if (!r || typeof r !== 'object' || r.v !== 1) return null
  const name = cleanName(r.n)
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
    if (!Number.isFinite(amount) || amount < 0) continue
    const entry = s.kind === 'school'
      ? { days: oneOf(e.days, Object.keys(SCHOOL_DAYS), 'school') }
      : { freq: oneOf(e.freq, Object.keys(FREQS), 'month'), mode: oneOf(e.mode, ['study', 'work'], 'study') }
    entries[s.id] = { amount: String(Math.min(amount, capFor(s, entry))), ...entry }
    // % ที่เก็บออมได้ในช่วงนั้น (v2.3) — ไม่มีหรือผิดรูปแบบ = ไม่ได้ระบุ
    const save = Number(e.save)
    if (e.save !== undefined && e.save !== '' && Number.isFinite(save) && save >= 0 && save <= 100) entries[s.id].save = Math.round(save)
  }
  return { name, age, gender, look, entries, createdAt: Number.isFinite(r.t) ? r.t : 0 }
}
