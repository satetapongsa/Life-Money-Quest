// GET /api/leaderboard?tier=0..9&band=all|u20|20s|30s|40s|50p  (อันดับจากยอดสูงสุดของแต่ละชื่อ)
//   → อันดับในระดับฐานะ/ช่วงอายุนั้น (ไม่ใส่ tier = ทุกระดับ) + จำนวนคนในแต่ละระดับของช่วงอายุนั้น
import { db, json, fail, serverError, publicRow } from './_lib/db.js'
import { ageBand } from '../src/data/ageBands.js'

const LIMIT = 50

export async function GET(request) {
  const params = new URL(request.url).searchParams
  const raw = params.get('tier')
  const tier = raw === null || raw === '' ? null : Number(raw)
  if (tier !== null && !(Number.isInteger(tier) && tier >= 0 && tier <= 9)) return fail(400, 'invalid tier')
  const band = ageBand(params.get('band') || 'all')
  if (!band) return fail(400, 'invalid band')
  try {
    const sql = db()
    // 1 ชื่อ = 1 แถว จัดอันดับด้วยยอดสูงสุดของแต่ละคน (ยอดที่เกินจริงไม่ถูกนับเป็นสถิติ)
    const [rows, counts] = await Promise.all([
      sql`select id, name, age, gender, look, best_total as total, best_tier as tier, plays, created_at from players
          where is_public and not hidden and best_total is not null
            and age between ${band.min} and ${band.max}
            and (${tier}::int is null or best_tier = ${tier}::int)
          order by best_total desc, best_at asc limit ${LIMIT}`,
      sql`select best_tier as tier, count(*)::int as n from players
          where is_public and not hidden and best_total is not null and age between ${band.min} and ${band.max}
          group by best_tier`,
    ])
    const byTier = Array(10).fill(0)
    for (const c of counts) byTier[c.tier] = c.n
    return json(
      { tier, band: band.id, players: rows.map(publicRow), counts: byTier },
      200,
      { 'cache-control': 'public, s-maxage=20, stale-while-revalidate=60' },
    )
  } catch (err) {
    return serverError('GET /api/leaderboard', err)
  }
}
