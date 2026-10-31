import { useCallback, useEffect, useState } from 'react'
import { Layout, Hud } from './Shell'
import AvatarStage from './AvatarStage'
import { TIERS } from '../data/tiers'
import { baht } from '../lib/calc'

// หน้าผู้ดูแล /admin — ล็อกอินด้วยรหัสผ่าน (ตั้งใน Vercel: ADMIN_PASSWORD) เก็บ session ไว้แค่ในแท็บนี้
const KEY = 'lmq-admin'
const FILTERS = [
  { id: 'reported', label: '🚩 ถูกรายงาน' },
  { id: 'recent', label: '🕒 ล่าสุด' },
  { id: 'flagged', label: '⚠️ ตัวเลขเกินจริง' },
  { id: 'hidden', label: '🙈 ถูกซ่อน' },
]

function readSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) || 'null')
    return s && s.exp > Date.now() ? s : null
  } catch {
    return null
  }
}

async function call(body, token) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status })
  return data
}

export default function AdminPage() {
  const [session, setSession] = useState(readSession)
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const [filter, setFilter] = useState('reported')
  const [q, setQ] = useState('')
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState('')

  const logout = useCallback((text = '') => {
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
    setSession(null)
    setData(null)
    setMsg(text)
  }, [])

  const load = useCallback(async () => {
    if (!session) return
    try {
      setData(await call({ action: 'list', filter, q }, session.token))
    } catch (err) {
      if (err.status === 401) logout('หมดเวลาเข้าสู่ระบบ กรุณาล็อกอินใหม่')
      else setMsg('โหลดข้อมูลไม่สำเร็จ')
    }
  }, [session, filter, q, logout])

  useEffect(() => {
    load()
  }, [load])

  const login = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      const s = await call({ action: 'login', password: pw })
      try {
        sessionStorage.setItem(KEY, JSON.stringify(s))
      } catch {
        /* ignore */
      }
      setPw('')
      setSession(s)
    } catch (err) {
      setMsg(err.status === 429 ? 'ลองผิดหลายครั้งเกินไป รอ 15 นาทีแล้วลองใหม่' : err.status === 503 ? 'ยังไม่ได้เปิดใช้หน้าผู้ดูแล (ตั้ง ADMIN_PASSWORD ใน Vercel)' : 'รหัสผ่านไม่ถูกต้อง')
    }
  }

  const act = async (action, row) => {
    if (action === 'delete' && !window.confirm(`ลบผลของ "${row.name}" ถาวร?`)) return
    setBusy(row.id)
    try {
      await call({ action, id: row.id }, session.token)
      await load()
    } catch (err) {
      if (err.status === 401) logout('หมดเวลาเข้าสู่ระบบ กรุณาล็อกอินใหม่')
      else setMsg('ทำรายการไม่สำเร็จ')
    } finally {
      setBusy('')
    }
  }

  const left = !session ? (
    <form className="card pop-in admin-login" onSubmit={login}>
      <h1 className="title">🛡️ ผู้ดูแล</h1>
      <p className="lead">ล็อกอินเพื่อดูผลที่ถูกรายงาน และซ่อน/ลบผลที่ไม่เหมาะสม</p>
      <label className="field">
        <span>รหัสผ่าน</span>
        <input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
      </label>
      {msg && <p className="warn">{msg}</p>}
      <button className="btn big" type="submit" disabled={!pw}>เข้าสู่ระบบ</button>
    </form>
  ) : (
    <div className="card pop-in">
      <div className="admin-head">
        <h1 className="stage-title">🛡️ ผู้ดูแล</h1>
        <button className="btn small ghost" onClick={() => logout()}>ออกจากระบบ</button>
      </div>
      {data && (
        <div className="stat-tiles admin-tiles">
          <div><b>{data.counts.total}</b><small>ผลทั้งหมด</small></div>
          <div><b>{data.counts.reported}</b><small>ถูกรายงาน</small></div>
          <div><b>{data.counts.hidden}</b><small>ถูกซ่อน</small></div>
        </div>
      )}
      <div className="band-chips">
        {FILTERS.map((f) => (
          <button key={f.id} className={`pill ${filter === f.id ? 'on' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
        ))}
      </div>
      <input className="admin-search" placeholder="ค้นหาชื่อ หรือ id" value={q} onChange={(e) => setQ(e.target.value)} />
      {msg && <p className="warn">{msg}</p>}
      {!data && <p className="note">กำลังโหลด...</p>}
      {data && !data.rows.length && <p className="note center">ไม่มีรายการ</p>}
      <div className="admin-list">
        {data?.rows.map((r) => (
          <div key={r.id} className={`admin-row ${r.hidden ? 'is-hidden' : ''}`}>
            <div className="admin-info">
              <b>{r.name}</b>
              <small>
                {r.age} ปี · {TIERS[r.tier].emoji} {baht(r.total)} ฿ · {new Date(r.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
              </small>
              <span className="admin-tags">
                {r.reports > 0 && <i className="tag red">🚩 {r.reports}</i>}
                {r.flagged && <i className="tag orange">เกินจริง</i>}
                {r.hidden && <i className="tag gray">ซ่อนอยู่</i>}
                {!r.is_public && <i className="tag gray">ไม่สาธารณะ</i>}
              </span>
            </div>
            <div className="admin-actions">
              <a className="btn small ghost" href={`/r/${r.id}`} target="_blank" rel="noopener noreferrer">ดู</a>
              {r.hidden ? (
                <button className="btn small" disabled={busy === r.id} onClick={() => act('unhide', r)}>เลิกซ่อน</button>
              ) : (
                <button className="btn small yellow" disabled={busy === r.id} onClick={() => act('hide', r)}>ซ่อน</button>
              )}
              <button className="btn small ghost danger" disabled={busy === r.id} onClick={() => act('delete', r)}>ลบ</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Layout
      hud={<Hud label="ผู้ดูแลระบบ" page="admin" />}
      left={left}
      right={<AvatarStage player={{ name: 'ผู้ดูแล', gender: 'm', look: { presetIndex: 23, expression: 'cool', pose: 'hips', variant: 0 } }} look="work" scene="office" item="captain" caption="🛡️ ดูแลความเรียบร้อย" />}
    />
  )
}
