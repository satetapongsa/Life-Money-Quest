// GET /api/player?id=XXXXXXXXXX  → ผลของผู้เล่นหนึ่งคน (สำหรับลิงก์แชร์)
// POST /api/player                → บันทึกผลใหม่ คืน { id }
import { db, json, fail, serverError, ipHash, newId, isId, publicRow, newOwnerToken, tokenHash } from './_lib/db.js'
import { fromRecord } from '../src/lib/record.js'
import { computeResult } from '../src/lib/calc.js'
import { nameProblem } from '../src/lib/moderation.js'
import { unrealisticStages } from '../src/lib/fairness.js'
import { APP_VERSION } from '../src/data/versions.js'

const MAX_BODY = 8_000
const RATE_LIMIT = 10 // ครั้ง ต่อ 10 นาที ต่อ IP

export async function GET(request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!isId(id)) return fail(400, 'invalid id')
  try {
    const rows = await db()`select * from players where id = ${id}`
    if (!rows.length) return fail(404, 'not found')
    if (rows[0].hidden) return fail(410, 'hidden')
    return json(publicRow(rows[0]), 200, { 'cache-control': 'public, s-maxage=300, stale-while-revalidate=600' })
  } catch (err) {
    return serverError('GET /api/player', err)
  }
}

export async function POST(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) return fail(415, 'expected json')
  const text = await request.text()
  if (text.length > MAX_BODY) return fail(413, 'too large')

  let body
  try {
    body = JSON.parse(text)
  } catch {
    return fail(400, 'invalid json')
  }
  const player = fromRecord(body?.record)
  if (!player) return fail(400, 'invalid record')
  if (nameProblem(player.name)) return fail(400, 'name not allowed', 'name_not_allowed')
  const isPublic = body?.isPublic !== false

  // คำนวณยอด/ระดับใหม่ที่เซิร์ฟเวอร์ ไม่เชื่อตัวเลขจากเครื่องผู้เล่น
  const r = computeResult(player)
  const flagged = unrealisticStages(r.rows.map((x) => x.stage), player.entries).length > 0
  const sql = db()
  const hash = ipHash(request)
  try {
    const [{ n }] = await sql`select count(*)::int as n from players where ip_hash = ${hash} and created_at > now() - interval '10 minutes'`
    if (n >= RATE_LIMIT) return fail(429, 'too many requests, try again later')

    const id = newId()
    const token = newOwnerToken()
    await sql`
      insert into players (id, name, age, gender, look, entries, total, ratio, tier, is_public, flagged, ip_hash, owner_hash, app_version)
      values (${id}, ${player.name}, ${player.age}, ${player.gender}, ${JSON.stringify(player.look)}::jsonb,
              ${JSON.stringify(player.entries)}::jsonb, ${Math.round(r.total)}, ${r.ratio}, ${r.tierIndex},
              ${isPublic}, ${flagged}, ${hash}, ${tokenHash(token)}, ${APP_VERSION})`
    return json({ id, token, tier: r.tierIndex, total: Math.round(r.total), flagged }, 201)
  } catch (err) {
    return serverError('POST /api/player', err)
  }
}
