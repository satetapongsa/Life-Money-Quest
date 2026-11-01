// POST /api/manage { id, token, action }  → เจ้าของผลซ่อน/แสดงในลีดเดอร์บอร์ด หรือลบผลของตัวเอง
// action: 'hide' | 'show' | 'delete'
import { db, json, fail, serverError, isId, tokenMatches } from './_lib/db.js'

const ACTIONS = ['hide', 'show', 'delete']

export async function POST(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) return fail(415, 'expected json')
  const text = await request.text()
  if (text.length > 500) return fail(413, 'too large')
  let body
  try {
    body = JSON.parse(text)
  } catch {
    return fail(400, 'invalid json')
  }
  const { id, token, action } = body ?? {}
  if (!isId(id) || !ACTIONS.includes(action)) return fail(400, 'invalid request')

  const sql = db()
  try {
    const rows = await sql`select owner_hash from players where id = ${id}`
    // ไม่บอกว่าไม่มี id นี้หรือกุญแจผิด เพื่อไม่ให้เดา id ได้
    if (!rows.length || !tokenMatches(token, rows[0].owner_hash)) return fail(403, 'forbidden')

    // ลบผล = ลบชื่อและ PIN ด้วย (ชื่อนี้ว่างให้ตั้งใหม่ได้)
    if (action === 'delete') {
      const [gone] = await sql`delete from players where id = ${id} returning name_key`
      if (gone) await sql`delete from accounts where name_key = ${gone.name_key}`
    }
    else await sql`update players set is_public = ${action === 'show'} where id = ${id}`
    return json({ ok: true, action })
  } catch (err) {
    return serverError('POST /api/manage', err)
  }
}
