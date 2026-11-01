// GET /api/player?id=XXXXXXXXXX  → ผลของผู้เล่นหนึ่งคน (สำหรับลิงก์แชร์)
// POST /api/player { record, isPublic, claim } → บันทึกผล (ชื่อเดิมเขียนทับ + เก็บยอดสูงสุด)
import { db, json, fail, serverError, ipHash, newId, isId, publicRow, newOwnerToken, tokenHash } from './_lib/db.js'
import { fromRecord } from '../src/lib/record.js'
import { computeResult } from '../src/lib/calc.js'
import { nameKey } from '../src/lib/names.js'
import { readClaim } from './_lib/pin.js'
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
  // ต้องยืนยัน PIN ของชื่อนี้มาแล้ว (บัตรผ่านจาก /api/claim) — 1 ชื่อ = 1 ผู้เล่น
  const key = readClaim(body?.claim)
  if (!key) return fail(401, 'PIN confirmation required', 'claim_required')
  if (key !== nameKey(player.name)) return fail(403, 'claim does not match this name', 'claim_mismatch')
  const isPublic = body?.isPublic !== false

  // คำนวณยอด/ระดับใหม่ที่เซิร์ฟเวอร์ ไม่เชื่อตัวเลขจากเครื่องผู้เล่น
  const r = computeResult(player)
  const total = Math.round(r.total)
  const flagged = unrealisticStages(r.rows.map((x) => x.stage), player.entries).length > 0
  const sql = db()
  const hash = ipHash(request)
  try {
    const [{ n }] = await sql`select count(*)::int as n from save_log where ip_hash = ${hash} and created_at > now() - interval '10 minutes'`
    if (n >= RATE_LIMIT) return fail(429, 'too many requests, try again later')
    await sql`insert into save_log (ip_hash) values (${hash})`

    // ชื่อเดิมเขียนทับผลรอบล่าสุด (id เดิม ลิงก์เดิมยังใช้ได้) และเก็บยอดสูงสุดที่ไม่เกินจริงไว้ขึ้นลีดเดอร์บอร์ด
    const token = newOwnerToken()
    const better = !flagged
    const [row] = await sql`
      insert into players (id, name, name_key, age, gender, look, entries, total, ratio, tier, is_public, flagged, ip_hash, owner_hash, app_version,
                           plays, best_total, best_tier, best_at, updated_at)
      values (${newId()}, ${player.name}, ${key}, ${player.age}, ${player.gender}, ${JSON.stringify(player.look)}::jsonb,
              ${JSON.stringify(player.entries)}::jsonb, ${total}, ${r.ratio}, ${r.tierIndex}, ${isPublic}, ${flagged}, ${hash},
              ${tokenHash(token)}, ${APP_VERSION}, 1,
              ${better ? total : null}, ${better ? r.tierIndex : null}, ${better ? new Date() : null}, now())
      on conflict (name_key) do update set
        name = excluded.name, age = excluded.age, gender = excluded.gender, look = excluded.look, entries = excluded.entries,
        total = excluded.total, ratio = excluded.ratio, tier = excluded.tier, is_public = excluded.is_public, flagged = excluded.flagged,
        ip_hash = excluded.ip_hash, owner_hash = excluded.owner_hash, app_version = excluded.app_version,
        plays = players.plays + 1, updated_at = now(),
        best_total = case when ${better} and (players.best_total is null or excluded.total > players.best_total) then excluded.total else players.best_total end,
        best_tier  = case when ${better} and (players.best_total is null or excluded.total > players.best_total) then excluded.tier  else players.best_tier end,
        best_at    = case when ${better} and (players.best_total is null or excluded.total > players.best_total) then now()           else players.best_at end
      returning id, plays, best_total, best_tier, (xmax = 0) as created`
    const bestTotal = row.best_total === null ? null : Number(row.best_total)
    return json(
      { id: row.id, token, tier: r.tierIndex, total, flagged, plays: row.plays, bestTotal, bestTier: row.best_tier, newBest: better && bestTotal === total, created: row.created },
      row.created ? 201 : 200,
    )
  } catch (err) {
    return serverError('POST /api/player', err)
  }
}
