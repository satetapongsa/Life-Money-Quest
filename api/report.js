// POST /api/report { id }  → รายงานผลที่ไม่เหมาะสม (นับ 1 ครั้งต่อ IP) ครบ 3 รายงานจะซ่อนอัตโนมัติ
import { db, json, fail, serverError, ipHash, isId } from './_lib/db.js'

const HIDE_AT = 3
const RATE_LIMIT = 20 // รายงาน ต่อชั่วโมง ต่อ IP

export async function POST(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) return fail(415, 'expected json')
  const text = await request.text()
  if (text.length > 200) return fail(413, 'too large')
  let id
  try {
    id = JSON.parse(text)?.id
  } catch {
    return fail(400, 'invalid json')
  }
  if (!isId(id)) return fail(400, 'invalid id')

  const sql = db()
  const hash = ipHash(request)
  try {
    const [{ n }] = await sql`select count(*)::int as n from reports where ip_hash = ${hash} and created_at > now() - interval '1 hour'`
    if (n >= RATE_LIMIT) return fail(429, 'too many requests, try again later')
    const found = await sql`select 1 from players where id = ${id}`
    if (!found.length) return fail(404, 'not found')

    await sql`insert into reports (player_id, ip_hash) values (${id}, ${hash}) on conflict do nothing`
    const [{ total }] = await sql`select count(*)::int as total from reports where player_id = ${id}`
    if (total >= HIDE_AT) await sql`update players set hidden = true where id = ${id}`
    return json({ ok: true })
  } catch (err) {
    return serverError('POST /api/report', err)
  }
}
