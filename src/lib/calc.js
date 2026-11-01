import { stagesForAge, stageTotal, typicalEntry, yearlyAmount } from '../data/stages.js'
import { inflationFactor } from '../data/inflation.js'
import { savingsSummary } from './savings.js'
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
  const savings = savingsSummary(player)
  const badges = badgesFor({
    childRatio,
    adultRatio,
    peakStage: peak && peak.total > 0 ? peak.stage : null,
    total,
    age: player.age,
    hasAdult: adultRows.length > 0,
    uniMode: player.entries.uni?.mode,
  })
  const e = player.entries
  const schoolDaily = ['kinder', 'primary', 'middle', 'high'].map((id) => e[id]).filter(Boolean)
  if (Number(e.kinder?.save) >= 20) badges.push({ emoji: '🐣', title: 'นักออมตั้งแต่อนุบาล', desc: 'เริ่มเก็บเงินตั้งแต่ยังตัวเล็ก' })
  if (schoolDaily.length >= 3 && schoolDaily.every((x) => x.days === 'all')) badges.push({ emoji: '🍭', title: 'ค่าขนมไม่มีวันหยุด', desc: 'ได้ค่าขนมทุกวัน แม้วันเสาร์อาทิตย์' })
  if (schoolDaily.length >= 3 && schoolDaily.every((x) => x.amount === schoolDaily[0].amount)) badges.push({ emoji: '🧊', title: 'ค่าขนมแช่แข็ง', desc: 'ค่าขนมเท่าเดิมตั้งแต่อนุบาลยันมัธยม' })
  const perYear = (id) => (rows.find((r) => r.stage.id === id)?.total ?? 0) / Math.max(1, rows.find((r) => r.stage.id === id)?.stage.years ?? 1)
  if (perYear('work1') > 0 && perYear('work2') >= perYear('work1') * 2) badges.push({ emoji: '📈', title: 'รายได้พุ่งทะยาน', desc: 'รายได้วัย 30 มากกว่าช่วงเริ่มงานเท่าตัว' })
  if (player.age < 30 && total >= 10_000_000) badges.push({ emoji: '⚡', title: 'อายุน้อยสิบล้าน', desc: 'เงินผ่านมือทะลุ 10 ล้านก่อนอายุ 30' })
  if (e.retire && perYear('retire') >= 600_000) badges.push({ emoji: '🏝️', title: 'เกษียณสุขสบาย', desc: 'รายได้หลังเกษียณเกินเดือนละ 5 หมื่น' })
  if (savings.answered && savings.pct >= 50) badges.unshift({ emoji: '🏦', title: 'เซียนการออม', desc: 'เก็บได้ครึ่งหนึ่งของเงินที่ผ่านมือ' })
  else if (savings.answered && savings.pct >= 25) badges.unshift({ emoji: '🐷', title: 'นักออมตัวยง', desc: 'เก็บออมได้เกินหนึ่งในสี่' })
  return {
    rows,
    total,
    typical,
    ratio,
    tier,
    tierIndex: tierIndex(ratio),
    tierCount: TIERS.length,
    perDay: daysLived ? total / daysLived : 0,
    badges,
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
