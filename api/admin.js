// POST /api/admin  { action, ... }  — หน้าผู้ดูแล
//   login  { password }                     → { token, exp }  (ใช้ได้ 8 ชม.)
//   list   { filter, q }  + Bearer token    → ผลล่าสุด/ถูกรายงาน/เกินจริง/ถูกซ่อน
//   hide | unhide | delete  { id } + Bearer token
// ปิดใช้งานถ้าไม่ได้ตั้ง ADMIN_PASSWORD
import { createHmac, timingSafeEqual } from 'node:crypto'
import { db, json, fail, serverError, ipHash, isId } from './_lib/db.js'

const SESSION_MS = 8 * 60 * 60 * 1000
const MAX_FAILS = 5 // ต่อ 15 นาที ต่อ IP
const FILTERS = ['recent', 'reported', 'flagged', 'hidden']

const password = () => (process.env.ADMIN_PASSWORD || '').trim()
// เปลี่ยนรหัสผ่านแล้ว session เดิมใช้ไม่ได้ทันที
const sign = (exp) => createHmac('sha256', `admin:${password()}:${process.env.IP_HASH_SALT || ''}`).update(String(exp)).digest('base64url')

function safeEqual(a, b) {
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

function validSession(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const [exp, sig] = token.split('.')
  return !!exp && !!sig && Number(exp) > Date.now() && safeEqual(sig, sign(exp))
}

export async function POST(request) {
  if (!password()) return fail(503, 'admin disabled')
  if (!(request.headers.get('content-type') || '').includes('application/json')) return fail(415, 'expected json')
  const text = await request.text()
  if (text.length > 1000) return fail(413, 'too large')
  let body
  try {
    body = JSON.parse(text) ?? {}
  } catch {
    return fail(400, 'invalid json')
  }
  const sql = db()
  try {
    if (body.action === 'login') {
      const hash = ipHash(request)
      const [{ n }] = await sql`select count(*)::int as n from admin_logins where ip_hash = ${hash} and not ok and created_at > now() - interval '15 minutes'`
      if (n >= MAX_FAILS) return fail(429, 'too many attempts, try again later')
      const ok = typeof body.password === 'string' && safeEqual(body.password, password())
      await sql`insert into admin_logins (ip_hash, ok) values (${hash}, ${ok})`
      if (!ok) return fail(401, 'wrong password')
      const exp = Date.now() + SESSION_MS
      return json({ token: `${exp}.${sign(exp)}`, exp })
    }

    if (!validSession(request)) return fail(401, 'login required')

    if (body.action === 'list') {
      const filter = FILTERS.includes(body.filter) ? body.filter : 'recent'
      const q = typeof body.q === 'string' ? body.q.trim().slice(0, 30) : ''
      const rows = await sql`
        select p.id, p.name, p.age, p.total, p.tier, p.is_public, p.flagged, p.hidden, p.created_at,
               (select count(*)::int from reports r where r.player_id = p.id) as reports
        from players p
        where (${filter} <> 'reported' or exists (select 1 from reports r where r.player_id = p.id))
          and (${filter} <> 'flagged' or p.flagged)
          and (${filter} <> 'hidden' or p.hidden)
          and (${q} = '' or p.name ilike '%' || ${q} || '%' or p.id = ${q})
        order by case when ${filter} = 'reported' then (select count(*) from reports r where r.player_id = p.id) else 0 end desc,
                 p.created_at desc
        limit 50`
      const [{ total, reported, hidden }] = await sql`
        select count(*)::int as total,
               (select count(distinct player_id)::int from reports) as reported,
               count(*) filter (where hidden)::int as hidden
        from players`
      return json({ rows: rows.map((r) => ({ ...r, total: Number(r.total) })), counts: { total, reported, hidden } })
    }

    if (['hide', 'unhide', 'delete'].includes(body.action)) {
      if (!isId(body.id)) return fail(400, 'invalid id')
      let res
      if (body.action === 'delete') res = await sql`delete from players where id = ${body.id} returning id`
      else {
        res = await sql`update players set hidden = ${body.action === 'hide'} where id = ${body.id} returning id`
        if (body.action === 'unhide') await sql`delete from reports where player_id = ${body.id}`
      }
      return res.length ? json({ ok: true }) : fail(404, 'not found')
    }

    return fail(400, 'unknown action')
  } catch (err) {
    return serverError('POST /api/admin', err)
  }
}
