// POST /api/claim { name, pin, mode: 'create' | 'login' }
//   create: จองชื่อใหม่พร้อมตั้ง PIN · login: ยืนยัน PIN ของชื่อเดิม
//   → { claim } บัตรผ่าน 6 ชม. ใช้บันทึกผลในชื่อนี้
// กันเดา PIN: ผิด 5 ครั้ง/15 นาที ต่อชื่อ หรือ 20 ครั้ง/15 นาที ต่อ IP → ล็อก
import { db, json, fail, serverError, ipHash } from './_lib/db.js'
import { hashPin, verifyPin, issueClaim } from './_lib/pin.js'
import { cleanName, nameKey, isPin } from '../src/lib/names.js'

const MAX_FAILS_NAME = 5
const MAX_FAILS_IP = 20

export async function POST(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) return fail(415, 'expected json')
  const text = await request.text()
  if (text.length > 500) return fail(413, 'too large')
  let body
  try {
    body = JSON.parse(text) ?? {}
  } catch {
    return fail(400, 'invalid json')
  }
  const name = cleanName(body.name)
  if (!name) return fail(400, 'invalid name')
  if (!isPin(body.pin)) return fail(400, 'PIN must be 6 digits', 'bad_pin_format')
  if (!['create', 'login'].includes(body.mode)) return fail(400, 'invalid mode')
  if (!(process.env.IP_HASH_SALT || '').trim()) return fail(503, 'server not configured')

  const key = nameKey(name)
  const ip = ipHash(request)
  const sql = db()
  try {
    const [{ byName, byIp }] = await sql`
      select count(*) filter (where name_key = ${key})::int as "byName",
             count(*) filter (where ip_hash = ${ip})::int as "byIp"
      from pin_attempts where not ok and created_at > now() - interval '15 minutes' and (name_key = ${key} or ip_hash = ${ip})`
    if (byName >= MAX_FAILS_NAME || byIp >= MAX_FAILS_IP) return fail(429, 'too many attempts, try again in 15 minutes', 'locked')

    if (body.mode === 'create') {
      // จองได้เฉพาะชื่อที่ยังไม่มี PIN (กันแย่งชื่อพร้อมกันด้วยเงื่อนไขใน SQL)
      const rows = await sql`
        insert into accounts (name_key, name, pin_hash) values (${key}, ${name}, ${hashPin(body.pin)})
        on conflict (name_key) do update set pin_hash = excluded.pin_hash, name = excluded.name, updated_at = now()
          where accounts.pin_hash is null
        returning name_key`
      if (!rows.length) return fail(409, 'name already taken', 'taken')
      return json({ claim: issueClaim(key), name, created: true })
    }

    const rows = await sql`select pin_hash from accounts where name_key = ${key}`
    if (!rows.length || !rows[0].pin_hash) return fail(404, 'name not found', 'not_found')
    const ok = verifyPin(body.pin, rows[0].pin_hash)
    await sql`insert into pin_attempts (name_key, ip_hash, ok) values (${key}, ${ip}, ${ok})`
    if (!ok) return fail(401, 'wrong PIN', 'wrong_pin')
    return json({ claim: issueClaim(key), name, created: false })
  } catch (err) {
    return serverError('POST /api/claim', err)
  }
}
