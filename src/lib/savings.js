// เงินออม และการทำนายอนาคต (ใช้ทั้งเว็บและ API — import ต้องมี .js)
import { ALL_STAGES, stagesForAge, yearlyAmount, typicalEntry } from '../data/stages.js'

export const SAVE_CHOICES = [0, 5, 10, 20, 30, 50]

// ถ้าเก็บเงินที่ออมไว้แบบต่างๆ (% ต่อปี)
export const SAVE_RATES = [
  { id: 'keep', label: 'เก็บใส่กระปุก', rate: 0 },
  { id: 'bank', label: 'ฝากออมทรัพย์', rate: 1.5 },
  { id: 'invest', label: 'ลงทุนระยะยาว', rate: 6 },
]

const savePct = (entry) => (Number.isFinite(Number(entry?.save)) ? Number(entry.save) : 0)

// สรุปเงินที่ใช้ไปกับเงินที่เก็บได้ และมูลค่าเงินออมวันนี้ถ้าเก็บไว้แบบต่างๆ
export function savingsSummary(player, nowYear = new Date().getFullYear()) {
  const birthYear = nowYear - player.age
  let total = 0
  let saved = 0
  const grown = Object.fromEntries(SAVE_RATES.map((r) => [r.id, 0]))
  for (const s of stagesForAge(player.age)) {
    const entry = player.entries[s.id]
    const perYear = yearlyAmount(s, entry)
    const pct = savePct(entry) / 100
    for (let a = s.from; a < s.from + s.years; a++) {
      total += perYear
      saved += perYear * pct
      // เงินที่เก็บระหว่างปี ได้ผลตอบแทนเฉลี่ยครึ่งปีแรกของปีนั้น
      const yearsGrowing = Math.max(0, nowYear - (birthYear + a) - 0.5)
      for (const r of SAVE_RATES) grown[r.id] += perYear * pct * Math.pow(1 + r.rate / 100, yearsGrowing)
    }
  }
  return {
    total,
    saved,
    spent: total - saved,
    pct: total ? (saved / total) * 100 : 0,
    answered: Object.values(player.entries).some((e) => e?.save !== undefined),
    grown,
  }
}

// ทำนายอนาคต: ใช้รายได้ช่วงล่าสุดต่อไปจนถึง targetAge โดยขึ้นปีละ raise%
// ช่วงที่ยังไม่ถึงวัยทำงานใช้ค่าทั่วไป, วัยเกษียณใช้ 40% ของรายได้ปีสุดท้าย
export function projectFuture(player, targetAge, raise = 3) {
  const age = Number(player.age)
  if (targetAge <= age) return null
  const past = stagesForAge(age)
  const last = past[past.length - 1]
  const lastEntry = player.entries[last?.id]
  const baseYearly = lastEntry ? yearlyAmount(last, lastEntry) : 0
  const lastIsWork = last && !['kinder', 'primary', 'middle', 'high'].includes(last.id)
  const pct = savePct(lastEntry) / 100

  let futureFlow = 0
  let futureSaved = 0
  let yearly = baseYearly
  const stagesAhead = []
  for (let a = age; a < targetAge; a++) {
    const stage = ALL_STAGES.find((s) => a >= s.from && a < s.to)
    if (!stage) continue
    let amount
    if (stage.id === 'retire') amount = (age >= 60 ? baseYearly : yearly * 0.4)
    else if (lastIsWork && a >= last.from) amount = yearly = yearly * (a === age ? 1 : 1 + raise / 100)
    else amount = yearlyAmount(stage, typicalEntry(stage))
    futureFlow += amount
    futureSaved += amount * pct
    if (!stagesAhead.includes(stage.id)) stagesAhead.push(stage.id)
  }
  return { targetAge, years: targetAge - age, futureFlow, futureSaved, stagesAhead, usesTypical: !lastIsWork }
}
