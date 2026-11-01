// PIN 6 หลัก (เก็บแบบ scrypt) และ "บัตรผ่าน" ชั่วคราวหลังยืนยัน PIN สำหรับบันทึกผลในชื่อนั้น
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const SCRYPT = { N: 16384, r: 8, p: 1 }
const CLAIM_MS = 6 * 60 * 60 * 1000

export function hashPin(pin) {
  const salt = randomBytes(16)
  const hash = scryptSync(pin, salt, 32, SCRYPT)
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`
}

export function verifyPin(pin, stored) {
  const [kind, salt, hash] = String(stored || '').split('$')
  if (kind !== 'scrypt' || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64url')
  const actual = scryptSync(String(pin), Buffer.from(salt, 'base64url'), expected.length, SCRYPT)
  return timingSafeEqual(actual, expected)
}

// กุญแจลงลายเซ็นบัตรผ่าน: ใช้ค่าลับของเซิร์ฟเวอร์ ถ้าไม่ได้ตั้งไว้จะปฏิเสธทั้งหมด
const secret = () => (process.env.IP_HASH_SALT || '').trim()
const sign = (payload) => createHmac('sha256', `claim:${secret()}`).update(payload).digest('base64url')

export function issueClaim(key) {
  const exp = Date.now() + CLAIM_MS
  const payload = `${exp}.${Buffer.from(key).toString('base64url')}`
  return `${payload}.${sign(payload)}`
}

// คืน name_key ถ้าบัตรผ่านถูกต้องและยังไม่หมดอายุ
export function readClaim(token) {
  if (!secret() || typeof token !== 'string') return null
  const [exp, key, sig] = token.split('.')
  if (!exp || !key || !sig || Number(exp) < Date.now()) return null
  const a = Buffer.from(sig)
  const b = Buffer.from(sign(`${exp}.${key}`))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  return Buffer.from(key, 'base64url').toString()
}
