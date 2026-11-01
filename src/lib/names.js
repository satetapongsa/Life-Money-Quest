// ชื่อผู้เล่น: ตั้งได้อิสระ (v2.5) — ชื่อเดียวกัน = ผู้เล่นคนเดียวกัน (ใช้ทั้งเว็บและ API)
export const MAX_NAME = 20

// อักขระควบคุมและอักขระล่องหน (zero-width, bidi override ฯลฯ) เป็นช่วง code point
const INVISIBLE = [[0x00, 0x1f], [0x7f, 0x9f], [0x200b, 0x200f], [0x2028, 0x202e], [0x2060, 0x206f], [0xfeff, 0xfeff]]
const isInvisible = (ch) => {
  const c = ch.codePointAt(0)
  return INVISIBLE.some(([a, b]) => c >= a && c <= b)
}

// ชื่อที่แสดง: ตัดอักขระล่องหน/ช่องว่างซ้ำ แต่คงตัวอักษรตามที่พิมพ์
export function cleanName(name) {
  if (typeof name !== 'string') return ''
  // ช่องว่าง/ขึ้นบรรทัดใหม่ → เว้นวรรคเดียว จากนั้นลบอักขระล่องหนทิ้ง
  const visible = [...name.replace(/\s+/g, ' ')].filter((ch) => !isInvisible(ch)).join('')
  return [...visible.trim()].slice(0, MAX_NAME).join('')
}

// กุญแจเทียบชื่อ: ไม่สนตัวพิมพ์เล็ก/ใหญ่ ช่องว่าง และรูปแบบอักขระที่หน้าตาเหมือนกัน
export const nameKey = (name) => cleanName(name).normalize('NFKC').toLowerCase()

export const isPin = (pin) => typeof pin === 'string' && /^\d{6}$/.test(pin)
