// เครื่องมือผู้ดูแล (อ่าน DATABASE_URL จาก .env.local):
//   npm run mod -- list            ผลล่าสุด 30 รายการ + จำนวนรายงาน
//   npm run mod -- reported        เฉพาะผลที่ถูกรายงาน
//   npm run mod -- hide <id>       ซ่อนผล (ไม่ขึ้นลีดเดอร์บอร์ด และเปิดลิงก์ไม่ได้)
//   npm run mod -- unhide <id>     ยกเลิกการซ่อน และล้างรายงาน
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const [cmd, id] = process.argv.slice(2)
const isId = (v) => /^[A-Za-z0-9]{10}$/.test(v || '')

const rows = (where) => sql.query(
  `select p.id, p.name, p.age, p.total, p.tier, p.flagged, p.hidden, p.is_public, p.created_at,
          (select count(*)::int from reports r where r.player_id = p.id) as reports
   from players p ${where} order by p.created_at desc limit 30`,
)

if (cmd === 'list' || cmd === 'reported') {
  const list = await rows(cmd === 'reported' ? 'where exists (select 1 from reports r where r.player_id = p.id)' : '')
  console.table(list.map((r) => ({ id: r.id, name: r.name, age: r.age, total: Number(r.total).toLocaleString('th-TH'), tier: r.tier, public: r.is_public, flagged: r.flagged, hidden: r.hidden, reports: r.reports })))
} else if ((cmd === 'hide' || cmd === 'unhide') && isId(id)) {
  const hide = cmd === 'hide'
  const res = await sql`update players set hidden = ${hide} where id = ${id} returning id, name`
  if (!hide) await sql`delete from reports where player_id = ${id}`
  console.log(res.length ? `${cmd} ${res[0].id} (${res[0].name})` : 'not found')
} else {
  console.log('usage: npm run mod -- list | reported | hide <id> | unhide <id>')
  process.exitCode = 1
}
