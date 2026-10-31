// GET /api/leaderboard?tier=0..9&band=all|u20|20s|30s|40s|50p
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
    const [rows, counts] = await Promise.all([
      sql`select id, name, age, gender, look, total, tier, created_at from players
          where is_public and not flagged and not hidden
            and age between ${band.min} and ${band.max}
            and (${tier}::int is null or tier = ${tier}::int)
          order by total desc, created_at asc limit ${LIMIT}`,
      sql`select tier, count(*)::int as n from players
          where is_public and not flagged and not hidden and age between ${band.min} and ${band.max}
          group by tier`,
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
