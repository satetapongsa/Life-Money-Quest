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
process.env.IP_HASH_SALT = 'test-salt'
const player = await import('../api/player.js')
const leaderboard = await import('../api/leaderboard.js')
const report = await import('../api/report.js')
const manage = await import('../api/manage.js')
const stats = await import('../api/stats.js')
const { tokenHash } = await import('../api/_lib/db.js')
const { issueClaim, hashPin } = await import('../api/_lib/pin.js')
const nameApi = await import('../api/name.js')
const claimApi = await import('../api/claim.js')

const post = (handler, body, headers = {}) =>
  handler.POST(new Request('http://x/api', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) }))
const get = (handler, qs) => handler.GET(new Request(`http://x/api${qs}`))
// บันทึกผลต้องมีบัตรผ่าน PIN ของชื่อนั้น
const record = (n, e = {}, claim = issueClaim(n.trim().toLowerCase())) => ({ record: { v: 1, n, a: 30, g: 'm', l: {}, e }, claim })
// คิวคำตอบของการบันทึก: นับความถี่, บันทึก log, upsert
const saveReplies = (row = {}) => [[{ n: 0 }], [], [{ id: 'AAAAAAAAAA', plays: 1, best_total: '3840000', best_tier: 5, created: true, ...row }]]

beforeEach(() => {
  db.queries = []
  db.replies = []
})

describe('POST /api/player', () => {
  it('บันทึก (upsert ตามชื่อ) และคำนวณยอดที่เซิร์ฟเวอร์', async () => {
    db.replies = saveReplies()
    const res = await post(player, record('ทดสอบ', { work1: { amount: '40000', freq: 'month' } }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toMatchObject({ id: 'AAAAAAAAAA', total: 3_840_000, flagged: false, plays: 1, bestTotal: 3_840_000, newBest: true })
    const upsert = db.queries.find((q) => q.text.startsWith('insert into players'))
    expect(upsert.text).toContain('on conflict (name_key) do update')
    expect(upsert.values).toEqual(expect.arrayContaining(['ทดสอบ', 'ทดสอบ'.toLowerCase()]))
    // ฐานข้อมูลเก็บแค่แฮชของกุญแจ ไม่เก็บกุญแจจริง
    expect(upsert.values).toContain(tokenHash(body.token))
    expect(upsert.values).not.toContain(body.token)
  })
  it('เล่นซ้ำชื่อเดิม: อัปเดต (200) และบอกยอดสูงสุดเดิมถ้ารอบนี้น้อยกว่า', async () => {
    db.replies = saveReplies({ plays: 3, best_total: '9000000', best_tier: 7, created: false })
    const body = await (await post(player, record('ทดสอบ', { work1: { amount: '40000', freq: 'month' } }))).json()
    expect(body).toMatchObject({ plays: 3, bestTotal: 9_000_000, newBest: false, created: false })
  })
  it('ตัวเลขเกินจริงถูก flag และไม่ถูกนับเป็นยอดสูงสุด', async () => {
    db.replies = saveReplies({ best_total: null, best_tier: null })
    // ค่าขนมอนุบาลวันละ 5,000 บาท (ไม่เกินเพดาน 10,000 แต่เกินจริง)
    const body = await (await post(player, record('ทดสอบ', { kinder: { amount: '5000', days: 'school' } }))).json()
    expect(body).toMatchObject({ flagged: true, newBest: false })
  })
  it('ไม่มีบัตรผ่าน PIN → 401, บัตรของชื่ออื่น → 403 (ก่อนแตะฐานข้อมูล)', async () => {
    const none = await post(player, { record: record('ทดสอบ').record })
    expect(none.status).toBe(401)
    expect((await none.json()).code).toBe('claim_required')
    const other = await post(player, record('ทดสอบ', {}, issueClaim('คนอื่น')))
    expect(other.status).toBe(403)
    expect(await post(player, record('ทดสอบ', {}, 'forged.token.value')).then((r) => r.status)).toBe(401)
    expect(db.queries).toHaveLength(0)
  })
  it('ตั้งชื่ออะไรก็ได้ (ไม่มีตัวกรองคำ)', async () => {
    db.replies = saveReplies()
    expect((await post(player, record('ชื่อแปลกๆ!!'))).status).toBe(201)
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

describe('GET /api/name + POST /api/claim (PIN)', () => {
  const claim = (body, ip = '5.5.5.5') => post(claimApi, body, { 'x-real-ip': ip })
  it('เช็กชื่อ: ว่าง → create, มี PIN แล้ว → login', async () => {
    db.replies = [[]]
    expect(await (await get(nameApi, '?name=' + encodeURIComponent('มายด์'))).json()).toMatchObject({ needsPin: 'create', taken: false })
    db.replies = [[{ has_pin: true }]]
    expect(await (await get(nameApi, '?name=Mind')).json()).toMatchObject({ needsPin: 'login', taken: true })
  })
  it('จองชื่อใหม่ + ตั้ง PIN → ได้บัตรผ่าน; ชื่อมีเจ้าของแล้ว → 409', async () => {
    db.replies = [[{ byName: 0, byIp: 0 }], [{ name_key: 'มายด์' }]]
    const ok = await claim({ name: 'มายด์', pin: '123456', mode: 'create' })
    expect(ok.status).toBe(200)
    expect((await ok.json()).claim).toMatch(/^\d+\.[\w-]+\.[\w-]+$/)
    const insert = db.queries.at(-1)
    expect(insert.text).toContain('where accounts.pin_hash is null')
    expect(insert.values.join(' ')).not.toContain('123456') // เก็บเฉพาะค่าแฮช
    db.replies = [[{ byName: 0, byIp: 0 }], []]
    expect((await claim({ name: 'มายด์', pin: '123456', mode: 'create' })).status).toBe(409)
  })
  it('ใส่ PIN ถูก → ได้บัตรผ่าน, ผิด → 401 และถูกบันทึกไว้นับการเดา', async () => {
    const stored = hashPin('654321')
    db.replies = [[{ byName: 0, byIp: 0 }], [{ pin_hash: stored }], []]
    expect((await claim({ name: 'Mind', pin: '654321', mode: 'login' })).status).toBe(200)
    db.replies = [[{ byName: 0, byIp: 0 }], [{ pin_hash: stored }], []]
    const bad = await claim({ name: 'Mind', pin: '000000', mode: 'login' })
    expect(bad.status).toBe(401)
    expect(db.queries.at(-1).text).toContain('insert into pin_attempts')
    expect(db.queries.at(-1).values).toContain(false)
  })
  it('ผิดเกิน 5 ครั้งต่อชื่อ หรือ 20 ครั้งต่อ IP → ล็อก 429', async () => {
    db.replies = [[{ byName: 5, byIp: 5 }]]
    expect((await claim({ name: 'Mind', pin: '654321', mode: 'login' })).status).toBe(429)
    db.replies = [[{ byName: 0, byIp: 20 }]]
    expect((await claim({ name: 'อีกชื่อ', pin: '654321', mode: 'login' })).status).toBe(429)
  })
  it('PIN ไม่ใช่ตัวเลข 6 หลัก → 400', async () => {
    for (const pin of ['12345', 'abcdef', 123456]) expect((await claim({ name: 'Mind', pin, mode: 'login' })).status).toBe(400)
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
  it('จัดอันดับด้วยยอดสูงสุด และไม่รวมผลที่ซ่อน/ไม่สาธารณะ/ไม่มียอดสูงสุด', async () => {
    db.replies = [[], []]
    await get(leaderboard, '?tier=3')
    expect(db.queries[0].text).toContain('is_public and not hidden and best_total is not null')
    expect(db.queries[0].text).toContain('order by best_total desc')
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
    db.replies = [[{ owner_hash: tokenHash(token), name_key: 'มายด์' }], [], [], []]
    expect((await post(manage, { id: 'AAAAAAAAAA', token, action: 'delete' })).status).toBe(200)
    // ลบผล + ชื่อ + ประวัติ PIN
    expect(db.queries.slice(-3).map((q) => q.text.split(' ').slice(0, 3).join(' '))).toEqual(['delete from players', 'delete from accounts', 'delete from pin_attempts'])
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

describe('POST /api/admin', async () => {
  process.env.ADMIN_PASSWORD = 'test-admin-password'
  const admin = await import('../api/admin.js')
  const login = async (password) => post(admin, { action: 'login', password }, { 'x-real-ip': '1.2.3.4' })
  it('รหัสถูก → ได้ token, รหัสผิด → 401', async () => {
    db.replies = [[{ n: 0 }], []]
    const ok = await login('test-admin-password')
    expect(ok.status).toBe(200)
    expect((await ok.json()).token).toMatch(/^\d+\.[\w-]+$/)
    db.replies = [[{ n: 0 }], []]
    expect((await login('nope')).status).toBe(401)
  })
  it('ผิดเกิน 5 ครั้ง → 429 แม้รหัสถูก', async () => {
    db.replies = [[{ n: 5 }]]
    expect((await login('test-admin-password')).status).toBe(429)
  })
  it('ไม่มี token หรือ token ปลอม → 401', async () => {
    expect((await post(admin, { action: 'list' })).status).toBe(401)
    expect((await post(admin, { action: 'list' }, { authorization: `Bearer ${Date.now() + 9e6}.forged` })).status).toBe(401)
  })
  it('token หมดอายุใช้ไม่ได้ และเปลี่ยนรหัสแล้ว token เดิมใช้ไม่ได้', async () => {
    db.replies = [[{ n: 0 }], []]
    const { token } = await (await login('test-admin-password')).json()
    db.replies = [[], [{ total: 0, reported: 0, hidden: 0 }]]
    expect((await post(admin, { action: 'list' }, { authorization: `Bearer ${token}` })).status).toBe(200)
    process.env.ADMIN_PASSWORD = 'changed'
    expect((await post(admin, { action: 'list' }, { authorization: `Bearer ${token}` })).status).toBe(401)
    process.env.ADMIN_PASSWORD = 'test-admin-password'
  })
  it('ปิดใช้งานเมื่อไม่ได้ตั้งรหัส', async () => {
    process.env.ADMIN_PASSWORD = ''
    expect((await login('x')).status).toBe(503)
    process.env.ADMIN_PASSWORD = 'test-admin-password'
  })
})

describe('POST /api/manage ด้วย PIN (v2.6)', async () => {
  const { hashPin } = await import('../api/_lib/pin.js')
  const stored = hashPin('246810')
  const del = (pin, ip = '6.6.6.6') => post(manage, { id: 'AAAAAAAAAA', pin, action: 'delete' }, { 'x-real-ip': ip })
  it('PIN ถูก → ลบผล ชื่อ และประวัติการเดา PIN ทั้งหมด', async () => {
    db.replies = [[{ owner_hash: null, name_key: 'มายด์', pin_hash: stored }], [{ byName: 0, byIp: 0 }], [], [], [], []]
    expect((await del('246810')).status).toBe(200)
    const texts = db.queries.map((q) => q.text)
    expect(texts).toEqual(expect.arrayContaining([
      expect.stringContaining('delete from players'),
      expect.stringContaining('delete from accounts'),
      expect.stringContaining('delete from pin_attempts'),
    ]))
  })
  it('PIN ผิด → 401 ไม่ลบ และถูกนับการเดา', async () => {
    db.replies = [[{ owner_hash: null, name_key: 'มายด์', pin_hash: stored }], [{ byName: 0, byIp: 0 }], []]
    expect((await del('000000')).status).toBe(401)
    expect(db.queries.some((q) => q.text.startsWith('delete'))).toBe(false)
    expect(db.queries.at(-1).text).toContain('insert into pin_attempts')
  })
  it('ถูกล็อก → 429, ชื่อยังไม่มี PIN → 409, PIN ผิดรูปแบบ → 400', async () => {
    db.replies = [[{ owner_hash: null, name_key: 'มายด์', pin_hash: stored }], [{ byName: 5, byIp: 0 }]]
    expect((await del('246810')).status).toBe(429)
    db.replies = [[{ owner_hash: null, name_key: 'เก่า', pin_hash: null }]]
    expect((await del('246810')).status).toBe(409)
    expect((await del('12ab56')).status).toBe(400)
  })
})
