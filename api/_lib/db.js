// โค้ดฝั่งเซิร์ฟเวอร์เท่านั้น (ไฟล์ใน api/_lib ไม่ถูกเปิดเป็น endpoint บน Vercel)
import { neon } from '@neondatabase/serverless'
import { createHash, randomBytes } from 'node:crypto'

// กันพลาดตอนวางค่าใน Vercel: ช่องว่าง, เครื่องหมายคำพูด, หรือวาง "DATABASE_URL=..." มาทั้งบรรทัด
const databaseUrl = () =>
  (process.env.DATABASE_URL || '').trim().replace(/^DATABASE_URL=/, '').replace(/^(['"])(.*)\1$/, '$2').trim()

let client
export function db() {
  const url = databaseUrl()
  if (!url) throw new Error('DATABASE_URL is not configured')
  client ??= neon(url)
  return client
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  })
}

export const fail = (status, error, code) => json(code ? { error, code } : { error }, status)

// ระบุประเภทปัญหาฐานข้อมูลแบบไม่เปิดเผยค่าลับ เพื่อให้ตรวจการตั้งค่าบน Vercel ได้
export function dbErrorCode(err) {
  const msg = String(err?.message || '')
  const url = databaseUrl()
  if (!url) return 'db_not_configured'
  if (!/^postgres(ql)?:\/\//.test(url)) return 'db_url_invalid'
  if (/password authentication failed|authentication/i.test(msg)) return 'db_auth_failed'
  if (/relation .* does not exist/i.test(msg)) return 'db_not_migrated'
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|timeout/i.test(msg)) return 'db_unreachable'
  return 'db_error'
}

export const serverError = (where, err) => {
  console.error(where, err)
  return fail(500, 'server error', dbErrorCode(err))
}

// เก็บแค่ค่าแฮชของ IP เพื่อจำกัดความถี่ ไม่เก็บ IP จริง
export function ipHash(request) {
  const ip = request.headers.get('x-real-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
  return createHash('sha256').update(`${process.env.IP_HASH_SALT || ''}:${ip}`).digest('base64url').slice(0, 32)
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
export function newId() {
  return Array.from(randomBytes(10), (b) => ALPHABET[b % 62]).join('')
}

export const isId = (v) => typeof v === 'string' && /^[A-Za-z0-9]{10}$/.test(v)

// แปลงแถวจากฐานข้อมูลเป็นข้อมูลสาธารณะ (ไม่มี ip_hash)
export function publicRow(r) {
  return {
    id: r.id,
    name: r.name,
    age: r.age,
    gender: r.gender,
    look: r.look,
    entries: r.entries,
    total: Number(r.total),
    tier: r.tier,
    flagged: !!r.flagged,
    createdAt: r.created_at,
  }
}
