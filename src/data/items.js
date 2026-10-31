// ไอเทมประจำระดับฐานะ (index = ระดับ 0–9) — ได้ไอเทมของระดับที่เล่นได้ และเก็บสะสมจากการเล่นหลายรอบ
export const TIER_ITEMS = [
  { id: 'ngob', emoji: '👒', name: 'งอบชาวนา' },
  { id: 'phakhaoma', emoji: '🎗️', name: 'ผ้าขาวม้าคาดหัว' },
  { id: 'helmet', emoji: '⛑️', name: 'หมวกกันน็อกวินมอไซค์' },
  { id: 'scarf', emoji: '🧣', name: 'ผ้าพันคอมนุษย์เงินเดือน' },
  { id: 'goldchain', emoji: '📿', name: 'สร้อยทองเส้นโต' },
  { id: 'sunhat', emoji: '🏖️', name: 'หมวกเที่ยวทะเล' },
  { id: 'pearls', emoji: '🦪', name: 'สร้อยไข่มุก' },
  { id: 'captain', emoji: '⚓', name: 'หมวกกัปตันเรือยอชต์' },
  { id: 'cape', emoji: '🦸', name: 'ผ้าคลุมไฮโซ' },
  { id: 'crown', emoji: '👑', name: 'มงกุฎเจ้าสัว' },
]

export const itemForTier = (tier) => TIER_ITEMS[tier]?.id ?? null

// ไอเทมที่สวมบนหัว (ดันป้ายชื่อขึ้นไม่ให้ทับ)
export const HAT_ITEMS = ['ngob', 'helmet', 'sunhat', 'captain', 'crown']
