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

const [{ version }] = await sql`select version()`
const [{ count }] = await sql`select count(*)::int as count from players`
console.log(`OK · ${version.split(' on ')[0]} · players: ${count}`)
