// ตรวจชื่อผู้เล่น: คำหยาบ (ไทย/อังกฤษ) และโฆษณา/ลิงก์ — ใช้ทั้งในเว็บและ API (ต้องรันบน Node ได้)

// ทำให้คำที่เลี่ยงตัวกรองกลับเป็นรูปปกติ: ตัวเล็ก, ตัดช่องว่าง/สัญลักษณ์, เลขแทนตัวอักษร, ตัวซ้ำ
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', $: 's', '@': 'a', '!': 'i' }
function normalize(name) {
  return name
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[​-‍﻿]/g, '')
    .replace(/[013457$@!]/g, (c) => LEET[c])
    .replace(/[^a-z฀-๿]/g, '')
    .replace(/(.)\1+/g, '$1')
}
// ตัดวรรณยุกต์/การันต์ เพื่อจับ "เหี่ย", "สั๊ด" ฯลฯ
const stripThaiMarks = (s) => s.replace(/[็-๎]/g, '')

const THAI_BAD = ['ควย', 'เหีย', 'สัส', 'สัด', 'เย็ด', 'เยด', 'แตด', 'เงียน', 'ส้นตีน', 'สันตีน', 'ระยำ', 'ชาติหมา', 'อีดอก', 'ดอกทอง', 'กะหรี', 'กระหรี', 'ไอควาย', 'อีควาย', 'พ่อมึงตาย', 'แม่มึงตาย', 'จัญไร', 'อีเหี้ย']
const ENGLISH_BAD = ['fuck', 'fuk', 'shit', 'bitch', 'cunt', 'pussy', 'asshole', 'nigg', 'fag', 'whore', 'slut', 'porn', 'motherfuck', 'bastard']
const SPAM = ['http', 'www', 'lineid', 'casino', 'baccarat', 'ufabet', 'slot', 'สล็อต', 'บาคาร่า', 'คาสิโน', 'เว็บพนัน', 'แทงบอล', 'หวยออนไลน์', 'เครดิตฟรี']

const THAI_BAD_N = THAI_BAD.map((w) => stripThaiMarks(normalize(w)))
const ENGLISH_BAD_N = ENGLISH_BAD.map(normalize)
const SPAM_N = SPAM.map((w) => stripThaiMarks(normalize(w)))

// คืน null ถ้าใช้ได้ หรือเหตุผลถ้าใช้ไม่ได้: 'profanity' | 'spam'
export function nameProblem(name) {
  if (typeof name !== 'string') return null
  const raw = name.toLowerCase()
  // ลิงก์/โดเมน/@ไอดี/เบอร์โทร ดูจากชื่อดิบก่อนตัดสัญลักษณ์
  if (/[a-z0-9-]+\.(com|net|org|co|me|io|xyz|th|ly)\b/.test(raw) || /@\w{3,}/.test(raw) || /\d[\d\s-]{8,}\d/.test(raw)) return 'spam'
  const n = normalize(name)
  const nt = stripThaiMarks(n)
  if (SPAM_N.some((w) => nt.includes(w))) return 'spam'
  if (ENGLISH_BAD_N.some((w) => n.includes(w))) return 'profanity'
  if (THAI_BAD_N.some((w) => nt.includes(w))) return 'profanity'
  if (/หี(?!บ)/.test(nt)) return 'profanity' // ยกเว้น "หีบ"
  return null
}

export const NAME_PROBLEM_TEXT = {
  profanity: 'ชื่อนี้มีคำไม่สุภาพ ลองเปลี่ยนชื่อใหม่นะ',
  spam: 'ชื่อห้ามมีลิงก์ ไอดี เบอร์โทร หรือโฆษณา',
}
