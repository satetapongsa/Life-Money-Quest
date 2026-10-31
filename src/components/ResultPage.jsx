import { useEffect, useMemo, useState } from 'react'
import { computeResult, baht, bahtShort } from '../lib/calc'
import { TIERS, COMPARISONS } from '../data/tiers'
import { FREQS, SCHOOL_DAYS, lookForAge } from '../data/stages'
import { shareUrl, saveHistory, SITE_URL } from '../lib/share'
import { savePlayer, reportPlayer } from '../lib/api'
import { unrealisticStages } from '../lib/fairness'
import { navigate } from '../lib/router'
import { TIER_SCENE } from './Scene'

// กันบันทึกซ้ำตอน React StrictMode เรียก effect สองรอบ
const saving = new WeakMap()

function useCountUp(target, ms = 1400) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf
    const t0 = performance.now()
    const loop = (t) => {
      const k = Math.min(1, (t - t0) / ms)
      setV(target * (1 - Math.pow(1 - k, 3)))
      if (k < 1) raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

function tierTitle(tier, gender) {
  return tier.title.replace('คุณหนู/คุณชาย', gender === 'f' ? 'คุณหนู' : 'คุณชาย').replace('ลูกเจ้าสัว', gender === 'f' ? 'ทายาทเจ้าสัว' : 'ลูกเจ้าสัว')
}

function entryText(stage, entry) {
  if (!entry) return '-'
  if (stage.kind === 'school') return `${baht(entry.amount)} บาท/วัน · ${SCHOOL_DAYS[entry.days].label}`
  return `${baht(entry.amount)} ${FREQS[entry.freq].unit}${entry.mode === 'work' ? ' · ทำงาน' : ''}`
}

export default function ResultPage({ player, shared, savedId, onSaved, onRestart }) {
  const r = useMemo(() => computeResult(player), [player])
  const flagged = useMemo(() => unrealisticStages(r.rows.map((x) => x.stage), player.entries).length > 0, [r, player])
  const [reported, setReported] = useState(false)
  const report = async () => {
    if (!window.confirm(`รายงานผลของ "${player.name}" ว่าไม่เหมาะสม?\nถ้ามีคนรายงานครบ 3 คน ผลนี้จะถูกซ่อน`)) return
    try {
      await reportPlayer(savedId)
      setReported(true)
    } catch {
      flash('ส่งรายงานไม่สำเร็จ ลองใหม่อีกครั้งนะ')
    }
  }
  const shown = useCountUp(r.total)
  const [toast, setToast] = useState('')
  const [saveState, setSaveState] = useState(savedId ? 'saved' : shared ? 'none' : 'saving')
  const [imgBusy, setImgBusy] = useState(false)

  // บันทึกผลลงฐานข้อมูลครั้งเดียว (ถ้าไม่สำเร็จ ลิงก์แชร์จะใช้แบบเก็บข้อมูลในลิงก์แทน)
  useEffect(() => {
    if (shared || savedId) return
    let alive = true
    if (!saving.has(player)) saving.set(player, savePlayer(player, player.isPublic !== false))
    saving
      .get(player)
      .then(({ id }) => {
        saveHistory(player, id)
        onSaved?.(id)
        if (alive) setSaveState('saved')
      })
      .catch(() => {
        saveHistory(player)
        if (alive) setSaveState('failed')
      })
    return () => {
      alive = false
    }
  }, [player, shared, savedId, onSaved])
  const title = tierTitle(r.tier, player.gender)
  const max = Math.max(...r.rows.map((x) => x.total), 1)
  const times = r.ratio.toLocaleString('th-TH', { maximumFractionDigits: 2 })

  const summary = `${player.name} อายุ ${player.age} ปี มีเงินไหลผ่านชีวิตมาแล้วประมาณ ${baht(r.total)} บาท เฉลี่ยวันละ ${baht(r.perDay)} บาท คิดเป็น ${times} เท่าของคนไทยทั่วไปที่ผ่านช่วงชีวิตเดียวกัน จึงจัดอยู่ในกลุ่ม "${title}" ${r.tier.emoji}`

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const link = shareUrl(player, savedId)
  const text = `${player.name} มีเงินไหลผ่านชีวิตมาแล้ว ${baht(r.total)} บาท! ได้ระดับ "${title}" ${r.tier.emoji}\nมาลองเล่นดูว่าของคุณเท่าไหร่ 👉`

  const share = async () => {
    const url = link
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Life Money Quest', text, url })
        return
      } catch {
        /* ผู้ใช้กดยกเลิก หรือแชร์ไม่ได้ ให้คัดลอกแทน */
      }
    }
    copy(`${text} ${url}`, 'คัดลอกข้อความ + ลิงก์แล้ว ไปวางแชร์ได้เลย!')
  }

  const copy = async (text, msg) => {
    try {
      await navigator.clipboard.writeText(text)
      flash(msg)
    } catch {
      window.prompt('คัดลอกลิงก์นี้', text)
    }
  }

  const inviteUrl = window.location.origin.startsWith('http://localhost') ? window.location.origin : SITE_URL

  // สร้างรูปการ์ดสรุปผล แล้วแชร์รูป (มือถือ) หรือดาวน์โหลด
  const cardFile = async () => {
    const { makeResultCard } = await import('../lib/cardImage')
    const blob = await makeResultCard({ player, result: r, tierTitle: title, sceneId: TIER_SCENE[r.tierIndex], look: lookForAge(player.age) })
    return new File([blob], `life-money-quest-${player.name}.png`, { type: 'image/png' })
  }
  const withImage = async (fn) => {
    if (imgBusy) return
    setImgBusy(true)
    try {
      await fn(await cardFile())
    } catch (err) {
      if (err?.name !== 'AbortError') flash('สร้างรูปไม่สำเร็จ ลองใหม่อีกครั้งนะ')
    } finally {
      setImgBusy(false)
    }
  }
  const download = () =>
    withImage(async (file) => {
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      flash('ดาวน์โหลดรูปแล้ว!')
    })
  const shareImage = () => withImage((file) => navigator.share({ files: [file], text: `${text} ${link}` }))
  const canShareFiles = typeof navigator.canShare === 'function' && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] })

  return (
    <div className="result pop-in">
      {shared && (
        <div className="shared-banner">
          <span>👀 คุณกำลังดูผลของ <b>{player.name}</b> — อยากรู้ของตัวเองไหม?</span>
          <button className="btn small yellow" onClick={onRestart}>เล่นของฉันบ้าง!</button>
        </div>
      )}

      <div className="card hero">
        <div className="badge-row">
          <span className="chip">GAME CLEAR 🏁</span>
          <span className="chip ghost">{player.name} · {player.age} ปี</span>
          {flagged && <span className="chip warn-chip" title="มีตัวเลขบางช่วงสูงเกินจริง">⚠️ ตัวเลขเกินจริง</span>}
        </div>
        <p className="hero-label">เงินที่ไหลผ่านชีวิต{shared ? `ของ ${player.name}` : 'คุณ'}ทั้งหมด</p>
        <div className="total">
          <span>฿</span>
          {baht(shown)}
        </div>
        <p className="hero-sub">≈ {bahtShort(r.total)} บาท · เฉลี่ยวันละ {baht(r.perDay)} บาท ตลอด {player.age} ปี</p>
        <div className="explain">
          <b>💡 ตัวเลขนี้หมายถึงอะไร?</b>
          <p>
            นี่คือ <b>“เงินที่ไหลผ่านเข้ามาในชีวิต”</b> ทั้งหมด ไม่ได้แปลว่าคุณใช้หมดเกลี้ยงนะ บางส่วนอาจถูกเก็บออม ลงทุน หรือให้คนอื่นไป
            แต่ทั้งหมดนี้คือเงินที่เคยผ่านมือคุณมาแล้วจริงๆ
          </p>
        </div>
      </div>

      <div className="card tier-card" style={{ '--tier': r.tier.color }}>
        <div className="tier-emoji">{r.tier.emoji}</div>
        <div>
          <p className="hero-label">ระดับฐานะของ {player.name}</p>
          <h2 className="tier-title">{title}</h2>
          <p>{r.tier.desc}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="sec">📜 บันทึกตัวละคร</h3>
        <p className="story">{summary}</p>
        <div className="ladder">
          {TIERS.map((t, i) => (
            <div key={t.title} className={`rung ${i === r.tierIndex ? 'me' : ''}`} style={{ '--tier': t.color }} title={tierTitle(t, player.gender)}>
              <span>{t.emoji}</span>
              {i === r.tierIndex && <em>{player.name}</em>}
            </div>
          ))}
        </div>
        <p className="note center">บันไดฐานะ 10 ระดับ · เทียบกับยอดของคนทั่วไปในช่วงอายุเดียวกัน ({baht(r.typical)} บาท)</p>
      </div>

      {r.badges.length > 0 && (
        <div className="card">
          <h3 className="sec">🏅 ฉายาที่ได้รับ</h3>
          <div className="badges">
            {r.badges.map((b) => (
              <div key={b.title} className="badge">
                <span>{b.emoji}</span>
                <div>
                  <b>{b.title}</b>
                  <small>{b.desc}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="sec">📊 แยกตามช่วงชีวิต</h3>
        <div className="rows">
          {r.rows.map((row) => (
            <div key={row.stage.id} className="row">
              <div className="row-head">
                <span>
                  {row.stage.emoji} {row.entry?.mode === 'work' ? 'ทำงาน (18–22)' : row.stage.title} <small>{row.stage.years} ปี · {entryText(row.stage, row.entry)}</small>
                </span>
                <b>{baht(row.total)} ฿</b>
              </div>
              <div className="bar">
                <span style={{ width: `${(row.total / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="sec">🛒 เงินก้อนนี้ซื้ออะไรได้บ้าง?</h3>
        <div className="compare">
          {COMPARISONS.map((c) => {
            const n = r.total / c.price
            return (
              <div key={c.label} className={`cmp ${n < 1 ? 'dim' : ''}`}>
                <span>{c.emoji}</span>
                <b>{n >= 1 ? baht(Math.floor(n)) : n.toFixed(2)}</b>
                <small>{c.unit} · {c.label}</small>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card share-card">
        <h3 className="sec">📣 แชร์ให้เพื่อนเล่นต่อ</h3>
        {!shared && (
          <p className={`save-status ${saveState}`}>
            {saveState === 'saving' && '⏳ กำลังบันทึกผล...'}
            {saveState === 'saved' &&
              (flagged
                ? '✅ บันทึกแล้ว · แต่ตัวเลขบางช่วงสูงเกินจริง จึงไม่ขึ้นลีดเดอร์บอร์ด (ยังแชร์ลิงก์ได้ปกติ)'
                : player.isPublic !== false
                  ? '✅ บันทึกแล้ว · ชื่อคุณขึ้นลีดเดอร์บอร์ดแล้ว'
                  : '✅ บันทึกแล้ว · ไม่แสดงในลีดเดอร์บอร์ด')}
            {saveState === 'failed' && '⚠️ บันทึกออนไลน์ไม่สำเร็จ ยังแชร์ได้ด้วยลิงก์สำรอง'}
          </p>
        )}
        <div className="link-box">
          <input readOnly value={link} aria-label="ลิงก์ผลลัพธ์" onFocus={(e) => e.target.select()} />
          <button className="btn small yellow" onClick={() => copy(link, 'คัดลอกลิงก์ผลลัพธ์แล้ว!')} disabled={saveState === 'saving'}>คัดลอก</button>
        </div>
        <div className="actions wrap">
          <button className="btn big" onClick={share} disabled={saveState === 'saving'}>แชร์ผลลัพธ์ 🔗</button>
          <button className="btn green" onClick={download} disabled={imgBusy}>{imgBusy ? 'กำลังสร้างรูป...' : '🖼️ ดาวน์โหลดรูป'}</button>
          {canShareFiles && <button className="btn yellow" onClick={shareImage} disabled={imgBusy}>📲 แชร์รูป</button>}
          <button className="btn ghost" onClick={() => copy(inviteUrl, 'คัดลอกลิงก์ชวนเพื่อนแล้ว!')}>ชวนเพื่อนมาเล่น</button>
          <button className="btn ghost" onClick={() => navigate('/leaderboard')}>🏆 ดูลีดเดอร์บอร์ด</button>
          <button className="btn ghost" onClick={onRestart}>🔄 เล่นใหม่</button>
        </div>
        <p className="note">ลิงก์จะเปิดหน้าการ์ดตัวละครและผลสรุปนี้ให้เพื่อนดูได้ทันที</p>
        {shared && savedId && (
          <button className="link-btn" onClick={report} disabled={reported}>
            {reported ? '🚩 แจ้งแล้ว ขอบคุณนะ' : '🚩 รายงานชื่อหรือผลที่ไม่เหมาะสม'}
          </button>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
