// ช่วงชีวิตทั้งหมด: ช่วงอายุ [from, to) นับเป็น "ปีที่ใช้ชีวิตผ่านมา"
// kind: 'school' = กรอกเป็นรายวัน, 'flex' = เลือกได้ว่ารายวัน/สัปดาห์/เดือน
export const ALL_STAGES = [
  {
    id: 'kinder', look: 'kinder', kind: 'school', from: 3, to: 6,
    title: 'อนุบาล', emoji: '🧸', range: 'อายุ 3–6 ปี',
    question: 'ตอนอนุบาล ได้เงินไปโรงเรียนวันละกี่บาท?',
    hint: 'ค่าขนม ค่านม ค่าของเล่นหน้าโรงเรียน นับหมด!',
    typical: 20, presets: [10, 20, 30, 50],
  },
  {
    id: 'primary', look: 'primary', kind: 'school', from: 6, to: 12,
    title: 'ประถม', emoji: '🎒', range: 'อายุ 6–12 ปี',
    question: 'ตอนประถม ได้เงินไปโรงเรียนวันละกี่บาท?',
    hint: 'ป.1 ถึง ป.6 ใส่ค่าเฉลี่ยโดยประมาณได้เลย',
    typical: 40, presets: [20, 40, 60, 100],
  },
  {
    id: 'middle', look: 'middle', kind: 'school', from: 12, to: 15,
    title: 'มัธยมต้น', emoji: '📚', range: 'อายุ 12–15 ปี',
    question: 'ตอน ม.ต้น ได้เงินวันละกี่บาท?',
    hint: 'ค่าข้าว ค่ารถ ค่าเกม ค่าชานม...',
    typical: 70, presets: [40, 70, 100, 150],
  },
  {
    id: 'high', look: 'high', kind: 'school', from: 15, to: 18,
    title: 'มัธยมปลาย', emoji: '🏫', range: 'อายุ 15–18 ปี',
    question: 'ตอน ม.ปลาย ได้เงินวันละกี่บาท?',
    hint: 'รวมค่าเรียนพิเศษที่ได้เป็นเงินสดมาด้วยก็ได้',
    typical: 100, presets: [60, 100, 150, 250],
  },
  {
    id: 'uni', look: 'uni', kind: 'flex', from: 18, to: 22,
    title: 'มหาวิทยาลัย', emoji: '🎓', range: 'อายุ 18–22 ปี (4 ปี)',
    question: 'ช่วงมหาลัย ได้เงินเท่าไหร่?',
    hint: 'ค่าขนมจากบ้าน + งานพาร์ทไทม์ รวมกันเลย',
    typical: 7000, typicalFreq: 'month', presets: [5000, 8000, 12000, 20000],
    altMode: { label: 'ไม่ได้เรียน / ทำงานแล้ว', look: 'work', question: 'ช่วงอายุ 18–22 ทำงานได้เงินเท่าไหร่?' },
  },
  {
    id: 'work1', look: 'work', kind: 'flex', from: 22, to: 30,
    title: 'วัยเริ่มทำงาน', emoji: '💼', range: 'อายุ 22–30 ปี',
    question: 'ช่วงเริ่มทำงาน รายได้ประมาณเท่าไหร่?',
    hint: 'เงินเดือน + โบนัส + งานเสริม เฉลี่ยทั้งช่วง',
    typical: 18000, typicalFreq: 'month', presets: [15000, 25000, 40000, 70000],
  },
  {
    id: 'work2', look: 'work', kind: 'flex', from: 30, to: 40,
    title: 'วัยสร้างตัว', emoji: '🏗️', range: 'อายุ 30–40 ปี',
    question: 'ช่วงอายุ 30 กว่า รายได้ประมาณเท่าไหร่?',
    hint: 'ช่วงไต่เต้า เลื่อนขั้น หรือเปิดกิจการ',
    typical: 30000, typicalFreq: 'month', presets: [20000, 35000, 60000, 120000],
  },
  {
    id: 'work3', look: 'work', kind: 'flex', from: 40, to: 50,
    title: 'วัยมั่นคง', emoji: '🏠', range: 'อายุ 40–50 ปี',
    question: 'ช่วงอายุ 40 กว่า รายได้ประมาณเท่าไหร่?',
    hint: 'รวมรายได้ทุกทางที่เข้ามา',
    typical: 40000, typicalFreq: 'month', presets: [25000, 45000, 80000, 150000],
  },
  {
    id: 'work4', look: 'work', kind: 'flex', from: 50, to: 60,
    title: 'วัยผู้ใหญ่เต็มตัว', emoji: '🌳', range: 'อายุ 50–60 ปี',
    question: 'ช่วงอายุ 50 กว่า รายได้ประมาณเท่าไหร่?',
    hint: 'ช่วงพีคของหลายคน หรือเริ่มชะลอ',
    typical: 45000, typicalFreq: 'month', presets: [25000, 50000, 90000, 200000],
  },
  {
    id: 'retire', look: 'senior', kind: 'flex', from: 60, to: 120,
    title: 'วัยเกษียณ', emoji: '🌅', range: 'อายุ 60 ปีขึ้นไป',
    question: 'หลังเกษียณ มีเงินเข้ามาเท่าไหร่?',
    hint: 'บำนาญ ลูกหลานให้ เงินปันผล ค่าเช่า ฯลฯ',
    typical: 12000, typicalFreq: 'month', presets: [5000, 12000, 25000, 50000],
  },
]

export const FREQS = {
  day: { label: 'รายวัน', unit: 'บาท/วัน', perYear: 365 },
  week: { label: 'รายสัปดาห์', unit: 'บาท/สัปดาห์', perYear: 52 },
  month: { label: 'รายเดือน', unit: 'บาท/เดือน', perYear: 12 },
}

export const SCHOOL_DAYS = {
  school: { label: 'เฉพาะวันไปเรียน', perYear: 200, note: '≈200 วัน/ปี' },
  all: { label: 'ทุกวัน', perYear: 365, note: '365 วัน/ปี' },
}

export const MIN_AGE = 4
export const MAX_AGE = 100

// ลุคตัวละครตามอายุ ใช้ตอนหน้าแรก (พรีวิว "คุณตอนนี้")
export function lookForAge(age) {
  if (age < 3) return 'baby'
  if (age < 6) return 'kinder'
  if (age < 12) return 'primary'
  if (age < 15) return 'middle'
  if (age < 18) return 'high'
  if (age < 22) return 'uni'
  if (age < 60) return 'work'
  return 'senior'
}

// คืนรายการช่วงชีวิตที่ผู้เล่นผ่านมาแล้ว พร้อมจำนวนปีในแต่ละช่วง
export function stagesForAge(age) {
  return ALL_STAGES
    .map((s) => ({ ...s, years: Math.max(0, Math.min(age, s.to) - s.from) }))
    .filter((s) => s.years > 0)
}

export function yearlyAmount(stage, entry) {
  if (!entry) return 0
  const amount = Number(entry.amount) || 0
  if (stage.kind === 'school') return amount * SCHOOL_DAYS[entry.days || 'school'].perYear
  return amount * FREQS[entry.freq || 'month'].perYear
}

export function stageTotal(stage, entry) {
  return yearlyAmount(stage, entry) * stage.years
}

export function typicalEntry(stage) {
  return stage.kind === 'school'
    ? { amount: stage.typical, days: 'school' }
    : { amount: stage.typical, freq: stage.typicalFreq }
}
