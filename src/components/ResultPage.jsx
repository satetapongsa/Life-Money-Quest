import { useEffect, useMemo, useState } from 'react'
import { computeResult, baht, bahtShort } from '../lib/calc'
import { TIERS, COMPARISONS } from '../data/tiers'
import { FREQS, SCHOOL_DAYS } from '../data/stages'
import { shareUrl } from '../lib/share'

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

export default function ResultPage({ player, shared, onRestart }) {
  const r = useMemo(() => computeResult(player), [player])
  const shown = useCountUp(r.total)
  const [toast, setToast] = useState('')
  const title = tierTitle(r.tier, player.gender)
  const max = Math.max(...r.rows.map((x) => x.total), 1)
  const times = r.ratio.toLocaleString('th-TH', { maximumFractionDigits: 2 })

  const summary = `${player.name} อายุ ${player.age} ปี มีเงินไหลผ่านชีวิตมาแล้วประมาณ ${baht(r.total)} บาท เฉลี่ยวันละ ${baht(r.perDay)} บาท คิดเป็น ${times} เท่าของคนไทยทั่วไปที่ผ่านช่วงชีวิตเดียวกัน จึงจัดอยู่ในกลุ่ม "${title}" ${r.tier.emoji}`

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const share = async () => {
    const url = shareUrl(player)
    const text = `${player.name} มีเงินไหลผ่านชีวิตมาแล้ว ${baht(r.total)} บาท! ได้ระดับ "${title}" ${r.tier.emoji}\nมาลองเล่นดูว่าของคุณเท่าไหร่ 👉`
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

  const inviteUrl = window.location.href.split('#')[0]

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
        <div className="actions wrap">
          <button className="btn big" onClick={share}>แชร์ผลลัพธ์ 🔗</button>
          <button className="btn yellow" onClick={() => copy(shareUrl(player), 'คัดลอกลิงก์ผลลัพธ์แล้ว!')}>คัดลอกลิงก์ผลลัพธ์</button>
          <button className="btn ghost" onClick={() => copy(inviteUrl, 'คัดลอกลิงก์ชวนเพื่อนแล้ว!')}>ชวนเพื่อนมาเล่น</button>
          <button className="btn ghost" onClick={onRestart}>🔄 เล่นใหม่</button>
        </div>
        <p className="note">ลิงก์ผลลัพธ์จะพาเพื่อนมาดูตัวละครและผลของคุณได้ทันที</p>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
