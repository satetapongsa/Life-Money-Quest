// ตรวจตัวเลขที่สูงเกินจริง — ผลที่เกินจะยังแชร์ได้ แต่ไม่ขึ้นลีดเดอร์บอร์ด (ใช้ทั้งเว็บและ API)
import { yearlyAmount } from '../data/stages.js'

// เพดานที่ยังสมจริง: ช่วงเรียน = บาท/วัน, ช่วงอื่น = บาท/เดือน (เทียบจากความถี่ที่เลือก)
export const REALISTIC_MAX = {
  kinder: 1_000,
  primary: 2_000,
  middle: 3_000,
  high: 5_000,
  uni: 300_000,
  work1: 3_000_000,
  work2: 5_000_000,
  work3: 8_000_000,
  work4: 8_000_000,
  retire: 5_000_000,
}

// ค่าที่เทียบกับเพดาน (ต่อวันหรือต่อเดือน)
export function comparableAmount(stage, entry) {
  if (!entry) return 0
  return stage.kind === 'school' ? Number(entry.amount) || 0 : yearlyAmount(stage, entry) / 12
}

export function isUnrealistic(stage, entry) {
  return comparableAmount(stage, entry) > (REALISTIC_MAX[stage.id] ?? Infinity)
}

// คืนรายชื่อช่วงชีวิตที่ตัวเลขสูงเกินจริง
export function unrealisticStages(stages, entries) {
  return stages.filter((s) => isUnrealistic(s, entries[s.id])).map((s) => s.id)
}

export const limitText = (stage) =>
  `${REALISTIC_MAX[stage.id].toLocaleString('th-TH')} บาท/${stage.kind === 'school' ? 'วัน' : 'เดือน'}`
