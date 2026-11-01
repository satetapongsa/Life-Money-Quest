import { useEffect, useMemo, useState } from 'react'
import { computeResult, inflationAdjusted, baht, bahtShort } from '../lib/calc'
import { inflationFactor } from '../data/inflation'
import { TIERS, COMPARISONS } from '../data/tiers'
import { FREQS, SCHOOL_DAYS, lookForAge } from '../data/stages'
import { shareUrl, saveHistory, SITE_URL, ownerTokenFor, forgetHistory, socialLinks, latestOwnResult, setCompareFriend, getCompareFriend } from '../lib/share'
import CompareCard from './CompareCard'
import SavingsCard from './SavingsCard'
import FutureCard from './FutureCard'
import ItemsCard from './ItemsCard'
import { savePlayer, reportPlayer, managePlayer } from '../lib/api'
import { unrealisticStages } from '../lib/fairness'
import { navigate } from '../lib/router'
import { sfx } from '../lib/sound'
import { track } from '@vercel/analytics'
import { TIER_SCENE } from './Scene'
import { itemForTier } from '../data/items'

// กันบันทึกซ้ำตอน React StrictMode เรียก effect สองรอบ
const saving = new WeakMap()

function useCountUp(target, ms = 1400, sound = false) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf
    const t0 = performance.now()
    let ticks = 0
    const loop = (t) => {
      const k = Math.min(1, (t - t0) / ms)
      setV(target * (1 - Math.pow(1 - k, 3)))
      if (sound && k < 1 && k * 10 >= ticks + 1) {
        sfx.coin()
        ticks++
      }
      if (k < 1) raf = requestAnimationFrame(loop)
      else if (sound) sfx.fanfare()
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [target, ms, sound])
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

export default function ResultPage({ player, shared, savedId, onSaved, onRestart, onPreviewLook, itemEquipped, onEquip }) {
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
  const shown = useCountUp(r.total, 1400, !shared)
  const [toast, setToast] = useState('')
  // เจ้าของผล (มีกุญแจในเครื่อง) จัดการผลของตัวเองได้
  const ownerToken = ownerTokenFor(savedId)
  const [isPublicNow, setIsPublicNow] = useState(player.isPublic !== false)
  const [manageBusy, setManageBusy] = useState(false)
  const manage = async (action) => {
    if (action === 'delete' && !window.confirm('ลบผลนี้ถาวร? ลิงก์ที่แชร์ไปจะเปิดไม่ได้อีก และย้อนกลับไม่ได้')) return
    setManageBusy(true)
    try {
      await managePlayer(savedId, ownerToken, action)
      if (action === 'delete') {
        forgetHistory(savedId)
        flash('ลบผลแล้ว')
        setTimeout(onRestart, 900)
      } else {
        setIsPublicNow(action === 'show')
        flash(action === 'show' ? 'แสดงในลีดเดอร์บอร์ดแล้ว' : 'ซ่อนจากลีดเดอร์บอร์ดแล้ว')
      }
    } catch {
      flash('ทำรายการไม่สำเร็จ ลองใหม่อีกครั้งนะ')
    } finally {
      setManageBusy(false)
    }
  }
  const [saveState, setSaveState] = useState(savedId ? 'saved' : shared ? 'none' : 'saving')
  const [saveInfo, setSaveInfo] = useState(null) // { plays, bestTotal, newBest } จากเซิร์ฟเวอร์
  const [imgBusy, setImgBusy] = useState(false)

  // บันทึกผลลงฐานข้อมูลครั้งเดียว (ถ้าไม่สำเร็จ ลิงก์แชร์จะใช้แบบเก็บข้อมูลในลิงก์แทน)
  useEffect(() => {
    if (shared || savedId) return
    if (!player.claim) {
      setSaveState('failed')
      return
    }
    let alive = true
    // บันทึกประวัติในเครื่องครั้งเดียวต่อการบันทึก (effect อาจรันซ้ำ)
    if (!saving.has(player)) {
      saving.set(
        player,
        savePlayer(player, player.isPublic !== false).then(
          (res) => (saveHistory(player, res.id, res.token), res),
          (err) => {
            saveHistory(player)
            throw err
          },
        ),
      )
    }
    saving
      .get(player)
      .then((res) => {
        track('game_complete', { tier: r.tierIndex, age: Math.floor(player.age / 10) * 10 })
        onSaved?.(res.id)
        if (alive) {
          setSaveInfo(res)
          setSaveState('saved')
        }
      })
      .catch(() => alive && setSaveState('failed'))
    return () => {
      alive = false
    }
  }, [player, shared, savedId, onSaved])
  const title = tierTitle(r.tier, player.gender)
  const max = Math.max(...r.rows.map((x) => x.total), 1)
  const adj = useMemo(() => inflationAdjusted(player), [player])
  const firstSchool = r.rows.find((x) => x.stage.kind === 'school' && Number(x.entry?.amount) > 0)
  const firstYear = firstSchool ? adj.birthYear + firstSchool.stage.from : null
  const times = r.ratio.toLocaleString('th-TH', { maximumFractionDigits: 2 })

  const summary = `${player.name} อายุ ${player.age} ปี มีเงินไหลผ่านชีวิตมาแล้วประมาณ ${baht(r.total)} บาท เฉลี่ยวันละ ${baht(r.perDay)} บาท คิดเป็น ${times} เท่าของคนไทยทั่วไปที่ผ่านช่วงชีวิตเดียวกัน จึงจัดอยู่ในกลุ่ม "${title}" ${r.tier.emoji}`

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const link = shareUrl(player, savedId)
  const social = socialLinks(link, `${player.name} มีเงินไหลผ่านชีวิตมาแล้ว ${baht(r.total)} บาท! มาลองเล่นดูว่าของคุณเท่าไหร่`)
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
    const blob = await makeResultCard({ player, result: r, tierTitle: title, sceneId: TIER_SCENE[r.tierIndex], look: lookForAge(player.age), item: itemEquipped === false ? null : itemForTier(r.tierIndex) })
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

  // เทียบกับเพื่อน: ดูการ์ดเพื่อนแล้วเทียบกับผลล่าสุดของฉัน หรือเล่นจบแล้วเทียบกับเพื่อนที่ฝากไว้
  const viewingFriend = shared && !ownerToken
  const [mine] = useState(() => (viewingFriend ? latestOwnResult() : null))
  const [compareOpen, setCompareOpen] = useState(false)
  const [waitingFriend] = useState(() => (shared ? null : getCompareFriend()))
  const playToCompare = () => {
    setCompareFriend(player)
    onRestart()
  }

  return (
    <div className="result pop-in">
      {shared && !ownerToken && (
        <div className="shared-banner">
          <span>👀 คุณกำลังดูผลของ <b>{player.name}</b> — อยากรู้ของตัวเองไหม?</span>
          <div className="banner-actions">
            {mine && mine.id !== savedId ? (
              <button className="btn small" onClick={() => setCompareOpen((v) => !v)}>{compareOpen ? 'ปิดการเทียบ' : '⚖️ เทียบกับของฉัน'}</button>
            ) : (
              <button className="btn small" onClick={playToCompare}>⚖️ เล่นแล้วเทียบกัน</button>
            )}
            <button className="btn small yellow" onClick={onRestart}>เล่นของฉันบ้าง!</button>
          </div>
        </div>
      )}
      {compareOpen && mine && <CompareCard me={mine.player} friend={player} />}

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
        {adj.total > r.total * 1.005 && (
          <div className="inflation">
            <b>📈 ถ้าคิดเป็นค่าเงินปี {adj.nowYear}</b>
            <span className="inf-total">฿{baht(adj.total)}</span>
            <small>
              มากกว่าตัวเลขจริง {Math.round((adj.total / r.total - 1) * 100)}% เพราะเงินสมัยก่อนซื้อของได้มากกว่า
              {firstSchool && ` — เช่น ค่าขนม ${baht(firstSchool.entry.amount)} บาทตอนปี ${firstYear} เท่ากับราว ${baht(firstSchool.entry.amount * inflationFactor(firstYear, adj.nowYear))} บาทในวันนี้`}
            </small>
          </div>
        )}
        <div className="explain">
          <b>💡 ตัวเลขนี้หมายถึงอะไร?</b>
          <p>
            นี่คือ <b>“เงินที่ไหลผ่านเข้ามาในชีวิต”</b> ทั้งหมด ไม่ได้แปลว่าคุณใช้หมดเกลี้ยงนะ บางส่วนอาจถูกเก็บออม ลงทุน หรือให้คนอื่นไป
            แต่ทั้งหมดนี้คือเงินที่เคยผ่านมือคุณมาแล้วจริงๆ
          </p>
        </div>
      </div>

      {waitingFriend && <CompareCard me={player} friend={waitingFriend} />}

      {!shared && onEquip && <ItemsCard tier={r.tierIndex} equipped={itemEquipped} onToggle={onEquip} />}
      <SavingsCard player={player} shared={shared} />
      {!shared && <FutureCard player={player} onPreviewLook={onPreviewLook} />}

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
          <p className={`save-status ${saveState}`} role="status" aria-live="polite">
            {saveState === 'saving' && '⏳ กำลังบันทึกผล...'}
            {saveState === 'saved' &&
              (flagged
                ? '✅ บันทึกแล้ว · แต่ตัวเลขบางช่วงสูงเกินจริง จึงไม่ขึ้นลีดเดอร์บอร์ด (ยังแชร์ลิงก์ได้ปกติ)'
                : isPublicNow
                  ? '✅ บันทึกแล้ว · ชื่อคุณขึ้นลีดเดอร์บอร์ดแล้ว'
                  : '✅ บันทึกแล้ว · ไม่แสดงในลีดเดอร์บอร์ด')}
            {saveState === 'failed' && (player.claim ? '⚠️ บันทึกออนไลน์ไม่สำเร็จ ยังแชร์ได้ด้วยลิงก์สำรอง' : '⚠️ เล่นแบบไม่ได้ยืนยัน PIN ผลนี้จึงไม่ถูกบันทึก (แชร์ได้ด้วยลิงก์สำรอง)')}
          </p>
        )}
        {saveInfo && saveInfo.plays > 1 && (
          <p className={`best-line ${saveInfo.newBest ? 'new' : ''}`}>
            {saveInfo.newBest
              ? `🏆 ทำลายสถิติใหม่! ยอดสูงสุดของ ${player.name} ตอนนี้ ${baht(saveInfo.bestTotal)} บาท (เล่นครั้งที่ ${saveInfo.plays})`
              : saveInfo.bestTotal != null
                ? `📌 อัปเดตผลแล้ว (เล่นครั้งที่ ${saveInfo.plays}) · ลีดเดอร์บอร์ดยังใช้ยอดสูงสุดของคุณ ${baht(saveInfo.bestTotal)} บาท`
                : `📌 อัปเดตผลแล้ว (เล่นครั้งที่ ${saveInfo.plays})`}
          </p>
        )}
        <div className="link-box">
          <input readOnly value={link} aria-label="ลิงก์ผลลัพธ์" onFocus={(e) => e.target.select()} />
          <button className="btn small yellow" onClick={() => copy(link, 'คัดลอกลิงก์ผลลัพธ์แล้ว!')} disabled={saveState === 'saving'}>คัดลอก</button>
        </div>
        <div className="social">
          <span>แชร์ไปที่</span>
          <a className="soc line" href={social.line} target="_blank" rel="noopener noreferrer">LINE</a>
          <a className="soc fb" href={social.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
          <a className="soc x" href={social.x} target="_blank" rel="noopener noreferrer">X</a>
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
        {ownerToken && (
          <div className="manage">
            <b>⚙️ จัดการผลของฉัน</b>
            {!flagged && (
              <label className="check">
                <input type="checkbox" checked={isPublicNow} disabled={manageBusy} onChange={(e) => manage(e.target.checked ? 'show' : 'hide')} />
                <span>แสดงในลีดเดอร์บอร์ด</span>
              </label>
            )}
            <button className="btn small ghost danger" onClick={() => manage('delete')} disabled={manageBusy}>🗑️ ลบผลนี้ถาวร</button>
          </div>
        )}
        {shared && savedId && !ownerToken && (
          <button className="link-btn" onClick={report} disabled={reported}>
            {reported ? '🚩 แจ้งแล้ว ขอบคุณนะ' : '🚩 รายงานชื่อหรือผลที่ไม่เหมาะสม'}
          </button>
        )}
      </div>

      <div className="sr-live" role="status" aria-live="polite">{toast}</div>
      {toast && <div className="toast" aria-hidden="true">{toast}</div>}
    </div>
  )
}
