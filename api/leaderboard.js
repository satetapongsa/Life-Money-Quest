// GET /api/leaderboard?tier=0..9  → อันดับในระดับฐานะนั้น (ไม่ใส่ tier = อันดับรวม) + จำนวนคนในแต่ละระดับ
import { db, json, fail, serverError, publicRow } from './_lib/db.js'

const LIMIT = 50

export async function GET(request) {
  const raw = new URL(request.url).searchParams.get('tier')
  const tier = raw === null || raw === '' ? null : Number(raw)
  if (tier !== null && !(Number.isInteger(tier) && tier >= 0 && tier <= 9)) return fail(400, 'invalid tier')
  try {
    const sql = db()
    const [rows, counts] = await Promise.all([
      tier === null
        ? sql`select id, name, age, gender, look, total, tier, created_at from players where is_public order by total desc, created_at asc limit ${LIMIT}`
        : sql`select id, name, age, gender, look, total, tier, created_at from players where is_public and tier = ${tier} order by total desc, created_at asc limit ${LIMIT}`,
      sql`select tier, count(*)::int as n from players where is_public group by tier`,
    ])
    const byTier = Array(10).fill(0)
    for (const c of counts) byTier[c.tier] = c.n
    return json(
      { tier, players: rows.map(publicRow), counts: byTier },
      200,
      { 'cache-control': 'public, s-maxage=20, stale-while-revalidate=60' },
    )
  } catch (err) {
    return serverError('GET /api/leaderboard', err)
  }
}
