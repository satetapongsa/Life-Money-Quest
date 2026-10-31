import { describe, it, expect, vi, beforeEach } from 'vitest'

// ฐานข้อมูลปลอม: บันทึกทุก query และตอบตามคิวที่ตั้งไว้
const db = { queries: [], replies: [] }
vi.mock('@neondatabase/serverless', () => ({
  neon: () => (strings, ...values) => {
    db.queries.push({ text: strings.join('?').replace(/\s+/g, ' ').trim(), values })
    return Promise.resolve(db.replies.length ? db.replies.shift() : [])
  },
}))

process.env.DATABASE_URL = 'postgresql://user:pass@example.test/db'
const player = await import('../api/player.js')
const leaderboard = await import('../api/leaderboard.js')
const report = await import('../api/report.js')
const manage = await import('../api/manage.js')
const stats = await import('../api/stats.js')
const { tokenHash } = await import('../api/_lib/db.js')

const post = (handler, body, headers = {}) =>
  handler.POST(new Request('http://x/api', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }))
const get = (handler, qs) => handler.GET(new Request(`http://x/api${qs}`))
const record = (n, e = {}) => ({ record: { v: 1, n, a: 30, g: 'm', l: {}, e } })

beforeEach(() => {
  db.queries = []
  db.replies = []
})

describe('POST /api/player', () => {
  it('บันทึกและคำนวณยอดที่เซิร์ฟเวอร์', async () => {
    db.replies = [[{ n: 0 }], []]
    const res = await post(player, record('ทดสอบ', { work1: { amount: '40000', freq: 'month' } }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toMatchObject({ total: 3_840_000, flagged: false })
    expect(body.id).toMatch(/^[A-Za-z0-9]{10}$/)
    const insert = db.queries.find((q) => q.text.startsWith('insert into players'))
    expect(insert.values).toContain('ทดสอบ')
    // ฐานข้อมูลเก็บแค่แฮชของกุญแจ ไม่เก็บกุญแจจริง
    expect(insert.values).toContain(tokenHash(body.token))
    expect(insert.values).not.toContain(body.token)
  })
  it('ตัวเลขเกินจริงถูก flag', async () => {
    db.replies = [[{ n: 0 }], []]
    const body = await (await post(player, record('ทดสอบ', { work1: { amount: '90000000', freq: 'month' } }))).json()
    expect(body.flagged).toBe(true)
  })
  it('ปฏิเสธชื่อหยาบก่อนแตะฐานข้อมูล', async () => {
    const res = await post(player, record('ไอสัส'))
    expect(res.status).toBe(400)
    expect((await res.json()).code).toBe('name_not_allowed')
    expect(db.queries).toHaveLength(0)
  })
  it('จำกัดความถี่ต่อ IP', async () => {
    db.replies = [[{ n: 10 }]]
    expect((await post(player, record('ทดสอบ'))).status).toBe(429)
  })
  it('ปฏิเสธ content-type ผิด, JSON เสีย, ข้อมูลใหญ่เกิน', async () => {
    const bad = await player.POST(new Request('http://x', { method: 'POST', body: 'x' }))
    expect(bad.status).toBe(415)
    expect((await post(player, '{not json')).status).toBe(400)
    expect((await post(player, 'x'.repeat(9000))).status).toBe(413)
  })
})

describe('GET /api/player', () => {
  it('id ผิดรูปแบบ → 400', async () => {
    expect((await get(player, '?id=1;drop')).status).toBe(400)
  })
  it('ผลที่ถูกซ่อน → 410 และไม่ส่ง ip_hash ออกไป', async () => {
    db.replies = [[{ id: 'AAAAAAAAAA', hidden: true }]]
    expect((await get(player, '?id=AAAAAAAAAA')).status).toBe(410)
    db.replies = [[{ id: 'AAAAAAAAAA', name: 'a', total: '100', tier: 1, hidden: false, ip_hash: 'secret' }]]
    const body = await (await get(player, '?id=AAAAAAAAAA')).json()
    expect(body.total).toBe(100)
    expect(body.ip_hash).toBeUndefined()
  })
})

describe('GET /api/leaderboard', () => {
  it('ไม่รวมผลที่ flagged/hidden/ไม่สาธารณะ', async () => {
    db.replies = [[], []]
    await get(leaderboard, '?tier=3')
    expect(db.queries[0].text).toContain('is_public and not flagged and not hidden')
  })
  it('tier/ช่วงอายุผิด → 400', async () => {
    expect((await get(leaderboard, '?tier=99')).status).toBe(400)
    expect((await get(leaderboard, '?band=x')).status).toBe(400)
  })
  it('กรองตามช่วงอายุ', async () => {
    db.replies = [[], []]
    await get(leaderboard, '?band=30s')
    expect(db.queries[0].values).toEqual(expect.arrayContaining([30, 39]))
  })
})

describe('POST /api/report', () => {
  it('ครบ 3 รายงานแล้วซ่อน', async () => {
    db.replies = [[{ n: 0 }], [{ 1: 1 }], [], [{ total: 3 }], []]
    const res = await post(report, { id: 'AAAAAAAAAA' })
    expect(res.status).toBe(200)
    expect(db.queries.at(-1).text).toContain('update players set hidden = true')
  })
  it('id ผิด → 400', async () => {
    expect((await post(report, { id: 'x' })).status).toBe(400)
  })
})

describe('POST /api/manage', () => {
  const token = 'a'.repeat(32)
  it('กุญแจถูก → ซ่อน/ลบได้', async () => {
    db.replies = [[{ owner_hash: tokenHash(token) }], []]
    expect((await post(manage, { id: 'AAAAAAAAAA', token, action: 'hide' })).status).toBe(200)
    expect(db.queries.at(-1).text).toContain('update players set is_public')
    db.replies = [[{ owner_hash: tokenHash(token) }], []]
    expect((await post(manage, { id: 'AAAAAAAAAA', token, action: 'delete' })).status).toBe(200)
    expect(db.queries.at(-1).text).toContain('delete from players')
  })
  it('กุญแจผิดหรือไม่มีผลนี้ → 403 เหมือนกัน', async () => {
    db.replies = [[{ owner_hash: tokenHash(token) }]]
    expect((await post(manage, { id: 'AAAAAAAAAA', token: 'b'.repeat(32), action: 'hide' })).status).toBe(403)
    db.replies = [[]]
    expect((await post(manage, { id: 'AAAAAAAAAA', token, action: 'hide' })).status).toBe(403)
  })
  it('action แปลก → 400', async () => {
    expect((await post(manage, { id: 'AAAAAAAAAA', token, action: 'drop' })).status).toBe(400)
  })
})

describe('GET /api/stats', () => {
  it('คืนเฉพาะตัวเลขรวม', async () => {
    db.replies = [[{ players: 5, avg_age: 28, median_total: 1234567.4 }], [{ day: '2026-11-01', n: 5 }], [{ tier: 4, n: 3 }]]
    const body = await (await stats.GET()).json()
    expect(body).toEqual({ players: 5, avgAge: 28, medianTotal: 1234567, daily: [{ day: '2026-11-01', n: 5 }], tiers: [0, 0, 0, 0, 3, 0, 0, 0, 0, 0] })
  })
})
