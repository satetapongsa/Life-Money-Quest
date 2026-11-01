// POST /api/manage  → เจ้าของจัดการผลของตัวเอง: ซ่อน/แสดงในลีดเดอร์บอร์ด หรือลบทิ้ง
//   { id, action, token }  กุญแจที่ได้ตอนบันทึก (อยู่ในเครื่องที่เล่น)
//   { id, action, pin }    PIN 6 หลักของชื่อนั้น (ใช้ได้จากทุกเครื่อง เช่น กดลบจากการ์ดในลีดเดอร์บอร์ด)
// action: 'hide' | 'show' | 'delete'  — ลบ = ลบผล ชื่อ PIN และประวัติการเดา PIN ของชื่อนั้นทั้งหมด
import { db, json, fail, serverError, isId, tokenMatches, ipHash } from './_lib/db.js'
import { verifyPin, pinLocked, logPinAttempt } from './_lib/pin.js'
import { isPin } from '../src/lib/names.js'

const ACTIONS = ['hide', 'show', 'delete']

export async function POST(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) return fail(415, 'expected json')
  const text = await request.text()
  if (text.length > 500) return fail(413, 'too large')
  let body
  try {
    body = JSON.parse(text)
  } catch {
    return fail(400, 'invalid json')
  }
  const { id, token, pin, action } = body ?? {}
  if (!isId(id) || !ACTIONS.includes(action)) return fail(400, 'invalid request')
  if (pin !== undefined && !isPin(pin)) return fail(400, 'PIN must be 6 digits', 'bad_pin_format')

  const sql = db()
  try {
    const rows = await sql`
      select p.owner_hash, p.name_key, a.pin_hash
      from players p left join accounts a on a.name_key = p.name_key
      where p.id = ${id}`

    if (pin !== undefined) {
      if (!rows.length) return fail(404, 'not found')
      const { name_key: key, pin_hash: pinHash } = rows[0]
      if (!pinHash) return fail(409, 'this name has no PIN yet', 'no_pin')
      const ip = ipHash(request)
      if (await pinLocked(sql, key, ip)) return fail(429, 'too many attempts, try again in 15 minutes', 'locked')
      const ok = verifyPin(pin, pinHash)
      await logPinAttempt(sql, key, ip, ok)
      if (!ok) return fail(401, 'wrong PIN', 'wrong_pin')
    } else if (!rows.length || !tokenMatches(token, rows[0].owner_hash)) {
      // ไม่บอกว่าไม่มี id นี้หรือกุญแจผิด เพื่อไม่ให้เดา id ได้
      return fail(403, 'forbidden')
    }

    if (action === 'delete') {
      const key = rows[0].name_key
      await sql`delete from players where id = ${id}` // รายงานถูกลบตาม (on delete cascade)
      await sql`delete from accounts where name_key = ${key}`
      await sql`delete from pin_attempts where name_key = ${key}`
    } else {
      await sql`update players set is_public = ${action === 'show'} where id = ${id}`
    }
    return json({ ok: true, action })
  } catch (err) {
    return serverError('POST /api/manage', err)
  }
}
