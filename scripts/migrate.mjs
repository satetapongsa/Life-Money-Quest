// สร้าง/อัปเดตตารางในฐานข้อมูล: npm run db:migrate  (อ่าน DATABASE_URL จาก .env.local)
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set (put it in .env.local)')
  process.exit(1)
}
const sql = neon(url)

await sql`
  create table if not exists players (
    id          text primary key check (id ~ '^[A-Za-z0-9]{10}$'),
    name        text not null check (char_length(name) between 1 and 16),
    age         smallint not null check (age between 4 and 100),
    gender      char(1) not null check (gender in ('m', 'f')),
    look        jsonb not null,
    entries     jsonb not null,
    total       numeric(18, 0) not null check (total >= 0),
    ratio       real not null,
    tier        smallint not null check (tier between 0 and 9),
    is_public   boolean not null default true,
    ip_hash     text,
    app_version text,
    created_at  timestamptz not null default now()
  )`
await sql`create index if not exists players_rate on players (ip_hash, created_at)`

// v2.1: ตัวเลขเกินจริง (flagged), ซ่อนโดยผู้ดูแล/การรายงาน (hidden)
await sql`alter table players add column if not exists flagged boolean not null default false`
await sql`alter table players add column if not exists hidden boolean not null default false`
await sql`drop index if exists players_board`
await sql`create index if not exists players_board2 on players (tier, total desc) where is_public and not flagged and not hidden`
await sql`
  create table if not exists reports (
    player_id  text not null references players(id) on delete cascade,
    ip_hash    text not null,
    created_at timestamptz not null default now(),
    primary key (player_id, ip_hash)
  )`
await sql`create index if not exists reports_rate on reports (ip_hash, created_at)`

// v2.2: กุญแจเจ้าของผล (เก็บแค่ค่าแฮช) สำหรับซ่อน/แสดง/ลบผลของตัวเอง
await sql`alter table players add column if not exists owner_hash text`
await sql`create index if not exists players_age on players (age) where is_public and not flagged and not hidden`

// v2.3: บันทึกการล็อกอินผู้ดูแล (กันเดารหัสผ่าน)
await sql`
  create table if not exists admin_logins (
    ip_hash    text not null,
    ok         boolean not null,
    created_at timestamptz not null default now()
  )`
await sql`create index if not exists admin_logins_rate on admin_logins (ip_hash, created_at)`

// v2.5: 1 ชื่อ = 1 ผู้เล่น (ล็อกด้วย PIN 6 หลัก) และเก็บยอดสูงสุดไว้ขึ้นลีดเดอร์บอร์ด
await sql`
  create table if not exists accounts (
    name_key   text primary key,
    name       text not null,
    pin_hash   text,                       -- scrypt; null = ยังไม่ตั้ง PIN (ใครมาก่อนตั้งได้)
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`
await sql`
  create table if not exists pin_attempts (
    name_key   text not null,
    ip_hash    text not null,
    ok         boolean not null,
    created_at timestamptz not null default now()
  )`
await sql`create index if not exists pin_attempts_name on pin_attempts (name_key, created_at)`
await sql`create index if not exists pin_attempts_ip on pin_attempts (ip_hash, created_at)`

// บันทึกการกดบันทึกผล (จำกัดความถี่ต่อ IP — แถวผู้เล่นถูกเขียนทับจึงนับจากตารางนี้แทน)
await sql`create table if not exists save_log (ip_hash text not null, created_at timestamptz not null default now())`
await sql`create index if not exists save_log_rate on save_log (ip_hash, created_at)`

await sql`alter table players add column if not exists name_key text`
await sql`alter table players add column if not exists plays integer not null default 1`
await sql`alter table players add column if not exists best_total numeric(18, 0)`
await sql`alter table players add column if not exists best_tier smallint`
await sql`alter table players add column if not exists best_at timestamptz`
await sql`alter table players add column if not exists updated_at timestamptz not null default now()`
// ชื่อยาวได้ถึง 20 ตัวอักษร
await sql`alter table players drop constraint if exists players_name_check`
await sql`alter table players drop constraint if exists players_name_len`
await sql`alter table players add constraint players_name_len check (char_length(name) between 1 and 20)`

// เติม name_key ให้แถวเดิม แล้วรวมชื่อซ้ำ: เก็บ id เก่าสุด (ลิงก์เดิมยังใช้ได้) ใส่ข้อมูลรอบล่าสุด + ยอดสูงสุด
const { nameKey } = await import('../src/lib/names.js')
const rows = await sql`select id, name, total, tier, flagged, created_at from players where name_key is null or best_total is null order by created_at`
const groups = new Map()
for (const r of await sql`select id, name, total, tier, flagged, created_at, name_key from players order by created_at`) {
  const key = r.name_key || nameKey(r.name)
  if (!groups.has(key)) groups.set(key, [])
  groups.get(key).push(r)
}
let merged = 0
if (rows.length) {
  for (const [key, list] of groups) {
    const keep = list[0]
    const latest = list[list.length - 1]
    const best = list.filter((r) => !r.flagged).reduce((b, r) => (!b || Number(r.total) > Number(b.total) ? r : b), null)
    if (latest.id !== keep.id) {
      await sql`
        update players p set name = l.name, age = l.age, gender = l.gender, look = l.look, entries = l.entries, total = l.total,
          ratio = l.ratio, tier = l.tier, is_public = l.is_public, flagged = l.flagged, owner_hash = l.owner_hash, app_version = l.app_version
        from players l where p.id = ${keep.id} and l.id = ${latest.id}`
    }
    const others = list.slice(1).map((r) => r.id)
    if (others.length) {
      await sql`update reports set player_id = ${keep.id} where player_id = any(${others}) and not exists (select 1 from reports x where x.player_id = ${keep.id} and x.ip_hash = reports.ip_hash)`
      await sql`delete from players where id = any(${others})`
      merged += others.length
    }
    await sql`
      update players set name_key = ${key}, plays = ${list.length},
        best_total = ${best ? Number(best.total) : null}, best_tier = ${best ? best.tier : null}, best_at = ${best ? best.created_at : null},
        updated_at = ${latest.created_at}
      where id = ${keep.id}`
    await sql`insert into accounts (name_key, name) values (${key}, ${latest.name}) on conflict (name_key) do nothing`
  }
}
await sql`alter table players alter column name_key set not null`
await sql`create unique index if not exists players_name_key on players (name_key)`
await sql`drop index if exists players_board2`
await sql`create index if not exists players_board3 on players (best_tier, best_total desc) where is_public and not hidden and best_total is not null`
if (merged) console.log(`merged ${merged} duplicate-name rows`)

const [{ version }] = await sql`select version()`
const [{ count }] = await sql`select count(*)::int as count from players`
console.log(`OK · ${version.split(' on ')[0]} · players: ${count}`)
