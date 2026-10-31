import { describe, it, expect } from 'vitest'
import { computeResult, inflationAdjusted } from '../src/lib/calc.js'
import { fromRecord, toRecord, MAX_AMOUNT } from '../src/lib/record.js'
import { nameProblem } from '../src/lib/moderation.js'
import { unrealisticStages, isUnrealistic } from '../src/lib/fairness.js'
import { stagesForAge, yearlyAmount, ALL_STAGES } from '../src/data/stages.js'
import { inflationFactor } from '../src/data/inflation.js'
import { TIERS } from '../src/data/tiers.js'
import { PRESETS } from '../src/data/avatars.js'

const player = (age, entries = {}) => ({ name: 'ทดสอบ', age, gender: 'm', look: { presetIndex: 0 }, entries })

describe('ช่วงชีวิตตามอายุ', () => {
  it('อายุ 33 ผ่าน 7 ช่วง และนับปีถูกต้อง', () => {
    const s = stagesForAge(33)
    expect(s.map((x) => x.id)).toEqual(['kinder', 'primary', 'middle', 'high', 'uni', 'work1', 'work2'])
    expect(s.find((x) => x.id === 'work2').years).toBe(3)
  })
  it('อายุ 4 มีแค่อนุบาล 1 ปี', () => {
    expect(stagesForAge(4)).toMatchObject([{ id: 'kinder', years: 1 }])
  })
  it('รายวัน/สัปดาห์/เดือน คิดเป็นรายปีถูกต้อง', () => {
    const uni = ALL_STAGES.find((x) => x.id === 'uni')
    expect(yearlyAmount(uni, { amount: '100', freq: 'day' })).toBe(36500)
    expect(yearlyAmount(uni, { amount: '100', freq: 'week' })).toBe(5200)
    expect(yearlyAmount(uni, { amount: '100', freq: 'month' })).toBe(1200)
    const kinder = ALL_STAGES.find((x) => x.id === 'kinder')
    expect(yearlyAmount(kinder, { amount: '20', days: 'school' })).toBe(4000)
    expect(yearlyAmount(kinder, { amount: '20', days: 'all' })).toBe(7300)
  })
})

describe('computeResult', () => {
  it('ยอดรวมตรงกับตัวอย่างที่เคยทดสอบในเบราว์เซอร์ (อายุ 33)', () => {
    const r = computeResult(player(33, {
      kinder: { amount: '20', days: 'school' }, primary: { amount: '40', days: 'school' },
      middle: { amount: '70', days: 'school' }, high: { amount: '100', days: 'school' },
      uni: { amount: '8000', freq: 'month' }, work1: { amount: '25000', freq: 'month' }, work2: { amount: '35000', freq: 'month' },
    }))
    expect(r.total).toBe(4_206_000)
    expect(r.tier.title).toBe('ชนชั้นกลางมีกินมีใช้')
  })
  it('ไม่กรอกอะไรเลย = 0 บาท ระดับต่ำสุด', () => {
    const r = computeResult(player(25))
    expect(r.total).toBe(0)
    expect(r.tierIndex).toBe(0)
  })
  it('มีระดับฐานะครบ 10 ขั้น เรียงจากน้อยไปมาก', () => {
    expect(TIERS).toHaveLength(10)
    for (let i = 1; i < TIERS.length; i++) expect(TIERS[i].min).toBeGreaterThan(TIERS[i - 1].min)
  })
})

describe('เงินเฟ้อ', () => {
  it('ปีเดียวกัน = 1 เท่า, ปีก่อนหน้ามีค่ามากขึ้น', () => {
    expect(inflationFactor(2020, 2020)).toBe(1)
    expect(inflationFactor(2000, 2025)).toBeGreaterThan(1.4)
    expect(inflationFactor(2000, 2025)).toBeLessThan(1.8)
  })
  it('ยอดปรับเงินเฟ้อไม่น้อยกว่ายอดจริงเมื่อเงินเฟ้อเป็นบวก', () => {
    const p = player(30, { kinder: { amount: '20', days: 'school' }, work1: { amount: '20000', freq: 'month' } })
    const adj = inflationAdjusted(p, 2026)
    expect(adj.birthYear).toBe(1996)
    expect(adj.total).toBeGreaterThan(computeResult(p).total)
  })
})

describe('ตรวจข้อมูลจากลิงก์/request (fromRecord)', () => {
  it('ข้อมูลปกติผ่าน และ toRecord → fromRecord ได้ค่าเดิม', () => {
    const p = { ...player(30, { kinder: { amount: '20', days: 'school' } }), look: { presetIndex: 3, expression: 'wow', pose: 'wave', variant: 7 } }
    const back = fromRecord(toRecord(p))
    expect(back).toMatchObject({ name: 'ทดสอบ', age: 30, gender: 'm', look: p.look, entries: { kinder: { amount: '20', days: 'school' } } })
  })
  it('ปฏิเสธอายุผิด ชื่อว่าง และเวอร์ชันผิด', () => {
    expect(fromRecord({ v: 1, n: 'a', a: 999, g: 'm' })).toBeNull()
    expect(fromRecord({ v: 1, n: '  ', a: 20, g: 'm' })).toBeNull()
    expect(fromRecord({ v: 2, n: 'a', a: 20 })).toBeNull()
    expect(fromRecord(null)).toBeNull()
  })
  it('ตัดชื่อเหลือ 16 ตัว, ตัวเลือกแปลกใช้ค่าปกติ, เงินเกินเพดานถูกทิ้ง', () => {
    const p = fromRecord({ v: 1, n: 'x'.repeat(40), a: 30, g: 'zz', l: { presetIndex: 999, pose: 'evil' }, e: { kinder: { amount: 20, days: 'hack' }, uni: { amount: MAX_AMOUNT + 1 }, ['__proto__']: { amount: 1 } } })
    expect(p.name).toHaveLength(16)
    expect(p.gender).toBe('m')
    expect(p.look.presetIndex).toBe(0)
    expect(p.look.pose).toBe('idle')
    expect(p.entries).toEqual({ kinder: { amount: '20', days: 'school' } })
    expect({}.amount).toBeUndefined()
  })
  it('รับตัวละครได้ครบเพศละ 30 แบบ', () => {
    expect(PRESETS.m).toHaveLength(30)
    expect(PRESETS.f).toHaveLength(30)
    expect(fromRecord({ v: 1, n: 'a', a: 20, g: 'f', l: { presetIndex: 29 }, e: {} }).look.presetIndex).toBe(29)
  })
})

describe('กรองชื่อ', () => {
  it.each(['ควย', 'ค ว ย', 'เหี้ย', 'เหี่ยมาก', 'สั๊ดดดด', 'F.U.C.K', 'sh1t', 'หีมาก', 'www.slot99.com', 'แอดไลน์ @abcd123', '0812345678', 'ufabet88', 'บาคาร่า'])('บล็อก "%s"', (n) => {
    expect(nameProblem(n)).not.toBeNull()
  })
  it.each(['ต้นข้าว', 'มายด์', 'Dickson', 'Essex', 'Peacock', 'หีบเพลง', 'กู', 'มึง', 'Grape', 'John Smith', 'ปลื้ม 2005', 'สัตว์โลก'])('อนุญาต "%s"', (n) => {
    expect(nameProblem(n)).toBeNull()
  })
})

describe('ตัวเลขเกินจริง', () => {
  const st = stagesForAge(45)
  const kinder = st.find((s) => s.id === 'kinder')
  it('ค่าปกติไม่โดนติดป้าย', () => {
    expect(unrealisticStages(st, { kinder: { amount: '50', days: 'school' }, work1: { amount: '50000', freq: 'month' } })).toEqual([])
  })
  it('เกินเพดานโดนติดป้าย (รวมการแปลงรายวันเป็นรายเดือน)', () => {
    expect(isUnrealistic(kinder, { amount: '1001', days: 'school' })).toBe(true)
    expect(unrealisticStages(st, { uni: { amount: '20000', freq: 'day' } })).toEqual(['uni'])
  })
})
