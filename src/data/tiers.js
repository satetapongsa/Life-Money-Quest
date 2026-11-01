// ระดับฐานะ: เทียบยอดรวมกับ "คนไทยทั่วไป" ที่ผ่านช่วงชีวิตเดียวกัน (ratio = ของเรา / ค่าทั่วไป)
export const TIERS = [
  { min: 0, emoji: '🌱', title: 'นักสู้สายประหยัดขั้นเทพ', color: '#52c41a', desc: 'เงินผ่านมือไม่มาก แต่เอาตัวรอดมาได้ถึงวันนี้ เก่งกว่าที่ตัวเองคิดเยอะ ทุกบาทถูกใช้อย่างคุ้มค่าสุดๆ' },
  { min: 0.35, emoji: '🍚', title: 'สายมัธยัสถ์ ใช้ชีวิตเรียบง่าย', color: '#73d13d', desc: 'รู้จักพอ ใช้เท่าที่มี ไม่ฟุ่มเฟือย เป็นคนที่เพื่อนยกให้เป็นที่ปรึกษาเรื่องประหยัด' },
  { min: 0.6, emoji: '🛵', title: 'คนธรรมดาที่แข็งแกร่ง', color: '#36cfc9', desc: 'ชีวิตไม่หวือหวา แต่มั่นคงด้วยลำแข้งตัวเอง ค่อยๆ ไต่ขึ้นไปทีละขั้น' },
  { min: 0.85, emoji: '🍜', title: 'มนุษย์ค่าเฉลี่ยประเทศไทย', color: '#40a9ff', desc: 'เงินไหลผ่านชีวิตพอๆ กับคนไทยส่วนใหญ่ ก๋วยเตี๋ยวได้ ชานมก็มี เที่ยวบ้างตามโอกาส' },
  { min: 1.2, emoji: '☕', title: 'ชนชั้นกลางมีกินมีใช้', color: '#597ef7', desc: 'มีเงินเหลือพอให้รางวัลตัวเอง กาแฟแก้วละร้อยไม่ต้องคิดนาน' },
  { min: 1.7, emoji: '✈️', title: 'สายชิลล์ ชีวิตมีสีสัน', color: '#9254de', desc: 'ทริปต่างประเทศปีละครั้งเป็นเรื่องปกติ ของดีของแบรนด์ก็พอจับต้องได้' },
  { min: 2.5, emoji: '🎀', title: 'คุณหนู/คุณชายประจำบ้าน', color: '#f759ab', desc: 'เติบโตมาพร้อมความสบาย เงินขนมเยอะกว่าเพื่อนในห้องแบบชัดเจน' },
  { min: 4, emoji: '💎', title: 'เศรษฐีน้อยดาวรุ่ง', color: '#ff7a45', desc: 'กระแสเงินในชีวิตแรงกว่าคนทั่วไปหลายเท่า กำลังเดินบนเส้นทางเศรษฐี' },
  { min: 7, emoji: '🏰', title: 'ไฮโซตัวจริง', color: '#faad14', desc: 'เงินหลักล้านไหลผ่านเหมือนน้ำในคลอง ชีวิตระดับที่หลายคนได้แต่ดูในซีรีส์' },
  { min: 15, emoji: '👑', title: 'ลูกเจ้าสัว / มหาเศรษฐีระดับตำนาน', color: '#d4b106', desc: 'ตัวเลขนี้คนทั้งหมู่บ้านทำงานรวมกันยังเหนื่อย ระดับตำนานที่เกมนี้ต้องจารึกไว้' },
]

export function tierFor(ratio) {
  let t = TIERS[0]
  for (const tier of TIERS) if (ratio >= tier.min) t = tier
  return t
}

export function tierIndex(ratio) {
  return TIERS.indexOf(tierFor(ratio))
}

// ป้ายพิเศษตามรูปแบบชีวิต
export function badgesFor({ childRatio, adultRatio, peakStage, total, age, hasAdult, uniMode }) {
  const out = []
  if (hasAdult && childRatio < 0.8 && adultRatio > 1.6) out.push({ emoji: '🚀', title: 'สร้างตัวด้วยลำแข้ง', desc: 'วัยเด็กไม่ได้มีมาก แต่โตมาแล้วปังเกินคาด' })
  if (childRatio > 2) out.push({ emoji: '🍼', title: 'เกิดมาบนกองขนม', desc: 'เงินขนมวัยเรียนเยอะกว่าเพื่อนหลายเท่า' })
  if (hasAdult && childRatio > 1.6 && adultRatio < 0.9) out.push({ emoji: '🎢', title: 'ชีวิตรถไฟเหาะ', desc: 'เด็กๆ สบาย โตมาเจอโลกความจริง' })
  if (childRatio < 0.5) out.push({ emoji: '🥪', title: 'เด็กห่อข้าวไปโรงเรียน', desc: 'ค่าขนมน้อยแต่ใจใหญ่มาก' })
  if (hasAdult && adultRatio > 3) out.push({ emoji: '💼', title: 'เครื่องจักรผลิตเงิน', desc: 'รายได้วัยทำงานทะลุเพดานคนทั่วไป' })
  if (uniMode === 'work') out.push({ emoji: '🛠️', title: 'ทำงานตั้งแต่ยังเยาว์', desc: 'ลงสนามจริงตั้งแต่อายุ 18' })
  if (age >= 60) out.push({ emoji: '🧓', title: 'ผู้เฒ่าเจนจัดการเงิน', desc: 'ผ่านโลกมาเยอะ เงินผ่านมือมาก็เยอะ' })
  if (age < 18) out.push({ emoji: '🐣', title: 'ผู้เล่นรุ่นจิ๋ว', desc: 'เส้นทางยังอีกยาวไกล' })
  if (total >= 10_000_000) out.push({ emoji: '🔟', title: 'สโมสรสิบล้าน', desc: 'เงินไหลผ่านชีวิตทะลุ 10 ล้านบาทแล้ว' })
  else if (total >= 1_000_000) out.push({ emoji: '🥇', title: 'สโมสรเงินล้าน', desc: 'เงินไหลผ่านชีวิตทะลุ 1 ล้านบาทแล้ว' })
  if (peakStage) out.push({ emoji: peakStage.emoji, title: `ช่วงพีค: ${peakStage.title}`, desc: 'ช่วงชีวิตที่เงินไหลผ่านมากที่สุด' })
  return out
}

// เทียบเป็นของที่จับต้องได้
export const COMPARISONS = [
  { emoji: '🍜', label: 'ก๋วยเตี๋ยว', unit: 'ชาม', price: 50 },
  { emoji: '🧋', label: 'ชานมไข่มุก', unit: 'แก้ว', price: 55 },
  { emoji: '📱', label: 'iPhone รุ่นใหม่', unit: 'เครื่อง', price: 45_900 },
  { emoji: '🗾', label: 'ทริปญี่ปุ่น', unit: 'ทริป', price: 45_000 },
  { emoji: '🚗', label: 'รถเก๋งป้ายแดง', unit: 'คัน', price: 700_000 },
  { emoji: '🏢', label: 'คอนโดกลางเมือง', unit: 'ห้อง', price: 3_500_000 },
  { emoji: '🍗', label: 'ข้าวมันไก่', unit: 'จาน', price: 60 },
  { emoji: '🎤', label: 'บัตรคอนเสิร์ต', unit: 'ใบ', price: 3_500 },
  { emoji: '🎮', label: 'เครื่องเกมคอนโซล', unit: 'เครื่อง', price: 18_000 },
  { emoji: '🪙', label: 'ทองคำหนัก 1 บาท', unit: 'บาททอง', price: 60_000 },
  { emoji: '🎓', label: 'ค่าเทอมมหาลัยรัฐ 4 ปี', unit: 'ใบปริญญา', price: 160_000 },
  { emoji: '🏡', label: 'บ้านเดี่ยวชานเมือง', unit: 'หลัง', price: 5_000_000 },
]
