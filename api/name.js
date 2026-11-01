// GET /api/name?name=...  → ชื่อนี้ว่างไหม / ต้องใส่ PIN หรือไม่ (ไม่เปิดเผยข้อมูลอื่นของเจ้าของชื่อ)
import { db, json, fail, serverError } from './_lib/db.js'
import { cleanName, nameKey } from '../src/lib/names.js'

export async function GET(request) {
  const name = cleanName(new URL(request.url).searchParams.get('name') || '')
  if (!name) return fail(400, 'invalid name')
  try {
    const rows = await db()`select pin_hash is not null as has_pin from accounts where name_key = ${nameKey(name)}`
    const hasPin = !!rows[0]?.has_pin
    // ชื่อที่มีอยู่แต่ยังไม่ตั้ง PIN (ผู้เล่นจากเวอร์ชันก่อน) ให้คนแรกที่มาตั้ง PIN เป็นเจ้าของ
    return json({ name, taken: hasPin, needsPin: hasPin ? 'login' : 'create' })
  } catch (err) {
    return serverError('GET /api/name', err)
  }
}
