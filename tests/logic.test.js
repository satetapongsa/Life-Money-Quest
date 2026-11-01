import { describe, it, expect } from 'vitest'
import { computeResult, inflationAdjusted } from '../src/lib/calc.js'
import { fromRecord, toRecord, MAX_AMOUNT } from '../src/lib/record.js'
import { cleanName, nameKey, isPin } from '../src/lib/names.js'
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
  it('ตัดชื่อเหลือ 20 ตัว, ตัวเลือกแปลกใช้ค่าปกติ, เงินเกินเพดานถูกทิ้ง', () => {
    const p = fromRecord({ v: 1, n: 'x'.repeat(40), a: 30, g: 'zz', l: { presetIndex: 999, pose: 'evil' }, e: { kinder: { amount: 20, days: 'hack' }, uni: { amount: MAX_AMOUNT + 1 }, ['__proto__']: { amount: 1 } } })
    expect(p.name).toHaveLength(20)
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

describe('ชื่ออิสระ + PIN (v2.5)', () => {
  it('ตั้งชื่ออะไรก็ได้ (ไม่กรองคำ) แต่ตัดอักขระล่องหน/ช่องว่างเกิน และยาวไม่เกิน 20', () => {
    expect(cleanName('  ชื่อ   อะไรก็ได้ ')).toBe('ชื่อ อะไรก็ได้')
    expect(cleanName('ab' + String.fromCharCode(0x200b) + 'c' + String.fromCharCode(0x202e))).toBe('abc')
    expect([...cleanName('ก'.repeat(40))]).toHaveLength(20)
    expect(cleanName('www.example.com')).toBe('www.example.com')
  })
  it('ชื่อซ้ำ = คนเดียวกัน ไม่สนตัวพิมพ์/ช่องว่าง', () => {
    expect(nameKey(' Mind ')).toBe(nameKey('MIND'))
    expect(nameKey('มายด์')).not.toBe(nameKey('มาย'))
  })
  it('PIN ต้องเป็นตัวเลข 6 หลัก', () => {
    expect(isPin('012345')).toBe(true)
    for (const bad of ['12345', '1234567', '12345a', 123456, '']) expect(isPin(bad)).toBe(false)
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

describe('เงินออม (v2.3)', async () => {
  const { savingsSummary, projectFuture } = await import('../src/lib/savings.js')
  const p = player(30, { kinder: { amount: '20', days: 'school', save: 10 }, work1: { amount: '20000', freq: 'month', save: 20 } })
  it('แยกใช้ไป/เก็บได้ถูกต้อง', () => {
    const s = savingsSummary(p, 2026)
    expect(s.total).toBe(12_000 + 1_920_000)
    expect(s.saved).toBeCloseTo(1_200 + 384_000)
    expect(s.spent + s.saved).toBeCloseTo(s.total)
    expect(s.answered).toBe(true)
  })
  it('ลงทุนโตมากกว่าฝากธนาคาร มากกว่าเก็บกระปุก', () => {
    const g = savingsSummary(p, 2026).grown
    expect(g.keep).toBeCloseTo(385_200)
    expect(g.bank).toBeGreaterThan(g.keep)
    expect(g.invest).toBeGreaterThan(g.bank)
  })
  it('ไม่ได้ตอบเรื่องออม = answered false', () => {
    expect(savingsSummary(player(30, { kinder: { amount: '20', days: 'school' } })).answered).toBe(false)
  })
  it('fromRecord รับ save 0–100 และทิ้งค่าผิด', () => {
    const r = fromRecord({ v: 1, n: 'a', a: 30, g: 'm', l: {}, e: { kinder: { amount: '20', save: 150 }, work1: { amount: '1', save: '25' } } })
    expect(r.entries.kinder.save).toBeUndefined()
    expect(r.entries.work1.save).toBe(25)
  })
  it('ทำนายอนาคตถึงอายุ 60 ด้วยรายได้ล่าสุด + ขึ้นเงินเดือน', () => {
    const flat = projectFuture(p, 60, 0)
    expect(flat.years).toBe(30)
    // 30–59: 30 ปี × 240,000 (อายุ 60 ขึ้นไปไม่นับเพราะเป้าหมายคือ 60)
    expect(flat.futureFlow).toBe(30 * 240_000)
    expect(projectFuture(p, 60, 3).futureFlow).toBeGreaterThan(flat.futureFlow)
    expect(projectFuture(p, 30, 3)).toBeNull()
  })
})

describe('ไอเทมประจำระดับ (v2.3)', async () => {
  const { TIER_ITEMS, itemForTier } = await import('../src/data/items.js')
  it('มีไอเทมครบ 10 ระดับ ไม่ซ้ำกัน', () => {
    expect(TIER_ITEMS).toHaveLength(10)
    expect(new Set(TIER_ITEMS.map((i) => i.id)).size).toBe(10)
    expect(itemForTier(9)).toBe('crown')
    expect(itemForTier(99)).toBeNull()
  })
})

describe('เนื้อหาเพิ่ม (v2.4)', async () => {
  const { STAGE_FACTS } = await import('../src/data/facts.js')
  const { EXPRESSIONS, POSES } = await import('../src/data/avatars.js')
  const { COMPARISONS } = await import('../src/data/tiers.js')
  const fs = await import('node:fs')
  const { APP_VERSION } = await import('../src/data/versions.js')
  it('มี "รู้หรือไม่" ครบทุกช่วงวัย', () => {
    for (const s of ALL_STAGES) expect(STAGE_FACTS[s.id]?.length).toBeGreaterThan(0)
  })
  it('สีหน้า/ท่าทางใหม่ผ่านการตรวจจากลิงก์', () => {
    expect(EXPRESSIONS.map((e) => e.id)).toContain('excited')
    const p = fromRecord({ v: 1, n: 'a', a: 20, g: 'm', l: { expression: 'flirt', pose: 'peace' }, e: {} })
    expect(p.look).toMatchObject({ expression: 'flirt', pose: 'peace' })
    expect(POSES.map((x) => x.id)).toContain('shrug')
  })
  it('ฉายาใหม่: ค่าขนมไม่มีวันหยุด + ค่าขนมแช่แข็ง + นักออมตั้งแต่อนุบาล', () => {
    const r = computeResult(player(16, {
      kinder: { amount: '20', days: 'all', save: 20 }, primary: { amount: '20', days: 'all' }, middle: { amount: '20', days: 'all' }, high: { amount: '20', days: 'all' },
    }))
    const titles = r.badges.map((b) => b.title)
    expect(titles).toEqual(expect.arrayContaining(['ค่าขนมไม่มีวันหยุด', 'ค่าขนมแช่แข็ง', 'นักออมตั้งแต่อนุบาล']))
  })
  it('ของที่ซื้อได้ไม่มีชื่อซ้ำ', () => {
    expect(new Set(COMPARISONS.map((c) => c.label)).size).toBe(COMPARISONS.length)
  })
  it('แคชของ service worker ตรงกับเวอร์ชันแอป (ต้องเปลี่ยนทุกครั้งที่ออกเวอร์ชัน)', () => {
    expect(fs.readFileSync('public/sw.js', 'utf8')).toContain(`'lmq-v${APP_VERSION}'`)
  })
})
