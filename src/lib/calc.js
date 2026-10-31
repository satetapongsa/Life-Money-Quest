import { stagesForAge, stageTotal, typicalEntry, yearlyAmount } from '../data/stages.js'
import { inflationFactor } from '../data/inflation.js'
import { tierFor, tierIndex, badgesFor, TIERS } from '../data/tiers.js'

const SCHOOL_IDS = ['kinder', 'primary', 'middle', 'high']

// สรุปผลทั้งหมดจากข้อมูลผู้เล่น
export function computeResult(player) {
  const stages = stagesForAge(player.age)
  const rows = stages.map((s) => {
    const entry = player.entries[s.id]
    const total = stageTotal(s, entry)
    const typical = stageTotal(s, typicalEntry(s))
    return { stage: s, entry, total, typical }
  })
  const total = rows.reduce((a, r) => a + r.total, 0)
  const typical = rows.reduce((a, r) => a + r.typical, 0)
  const ratio = typical ? total / typical : 0

  const sum = (list, key) => list.reduce((a, r) => a + r[key], 0)
  const childRows = rows.filter((r) => SCHOOL_IDS.includes(r.stage.id))
  const adultRows = rows.filter((r) => !SCHOOL_IDS.includes(r.stage.id))
  const childRatio = sum(childRows, 'typical') ? sum(childRows, 'total') / sum(childRows, 'typical') : 1
  const adultRatio = sum(adultRows, 'typical') ? sum(adultRows, 'total') / sum(adultRows, 'typical') : 1
  const peak = rows.reduce((best, r) => (!best || r.total > best.total ? r : best), null)

  const tier = tierFor(ratio)
  const daysLived = player.age * 365
  return {
    rows,
    total,
    typical,
    ratio,
    tier,
    tierIndex: tierIndex(ratio),
    tierCount: TIERS.length,
    perDay: daysLived ? total / daysLived : 0,
    badges: badgesFor({
      childRatio,
      adultRatio,
      peakStage: peak && peak.total > 0 ? peak.stage : null,
      total,
      age: player.age,
      hasAdult: adultRows.length > 0,
      uniMode: player.entries.uni?.mode,
    }),
  }
}

// ยอดรวมแบบปรับเงินเฟ้อ: เงินที่ได้ตอนอายุ x (ปี ค.ศ. = ปีเกิด + x) แปลงเป็นค่าเงินของปี nowYear
export function inflationAdjusted(player, nowYear = new Date().getFullYear()) {
  const birthYear = nowYear - player.age
  const rows = stagesForAge(player.age).map((s) => {
    const perYear = yearlyAmount(s, player.entries[s.id])
    let total = 0
    for (let a = s.from; a < s.from + s.years; a++) total += perYear * inflationFactor(birthYear + a, nowYear)
    return { stage: s, total }
  })
  return { nowYear, birthYear, rows, total: rows.reduce((a, r) => a + r.total, 0) }
}

export const baht = (n) => Math.round(n).toLocaleString('th-TH')

export function bahtShort(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('th-TH', { maximumFractionDigits: 2 })} ล้าน`
  if (n >= 1000) return `${(n / 1000).toLocaleString('th-TH', { maximumFractionDigits: 1 })} พัน`
  return baht(n)
}
