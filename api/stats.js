// GET /api/stats → สถิติรวม (เฉพาะตัวเลขรวม ไม่มีข้อมูลรายคน)
import { db, json, serverError } from './_lib/db.js'

export async function GET() {
  try {
    const sql = db()
    const [[summary], daily, tiers] = await Promise.all([
      sql`select count(*)::int as players,
                 coalesce(round(avg(age))::int, 0) as avg_age,
                 coalesce(percentile_cont(0.5) within group (order by total), 0)::float8 as median_total
          from players where not hidden`,
      // นับตามวันในเวลาไทย ย้อนหลัง 14 วัน
      sql`select to_char(date_trunc('day', created_at at time zone 'Asia/Bangkok'), 'YYYY-MM-DD') as day, count(*)::int as n
          from players where not hidden and created_at > now() - interval '14 days'
          group by 1 order by 1`,
      sql`select tier, count(*)::int as n from players where not hidden and not flagged group by tier`,
    ])
    const byTier = Array(10).fill(0)
    for (const t of tiers) byTier[t.tier] = t.n
    return json(
      { players: summary.players, avgAge: summary.avg_age, medianTotal: Math.round(summary.median_total), daily, tiers: byTier },
      200,
      { 'cache-control': 'public, s-maxage=300, stale-while-revalidate=600' },
    )
  } catch (err) {
    return serverError('GET /api/stats', err)
  }
}
