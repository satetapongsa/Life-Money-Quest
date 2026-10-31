// โค้ดฝั่งเซิร์ฟเวอร์เท่านั้น (ไฟล์ใน api/_lib ไม่ถูกเปิดเป็น endpoint บน Vercel)
import { neon } from '@neondatabase/serverless'
import { createHash, randomBytes } from 'node:crypto'

let client
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured')
  client ??= neon(process.env.DATABASE_URL)
  return client
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  })
}

export const fail = (status, error) => json({ error }, status)

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
    createdAt: r.created_at,
  }
}
