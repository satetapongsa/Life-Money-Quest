import VersionBadge from './VersionBadge'
import { useMuted, setMuted, sfx } from '../lib/sound'
import { useCanInstall, promptInstall } from '../lib/install'
import { useTheme, toggleTheme } from '../lib/theme'
import { baht } from '../lib/calc'
import { navigate } from '../lib/router'

export function Layout({ hud, left, right }) {
  return (
    <div className="app">
      <a className="skip" href="#main">ข้ามไปยังเนื้อหา</a>
      {hud}
      <main className="main" id="main" tabIndex={-1}>
        <section className="left">{left}</section>
        <aside className="right">{right}</aside>
      </main>
      <footer className="foot">
        Life Money Quest · ตัวเลขเป็นการประมาณเพื่อความสนุก ·{' '}
        <a href="/" onClick={(e) => (e.preventDefault(), navigate('/'))}>lifemoneyquest.vercel.app</a>
      </footer>
    </div>
  )
}

export function Hud({ label, stages = [], idx = 0, done = {}, coins, page = 'home' }) {
  return (
    <header className="hud">
      <a className="logo" href="/" onClick={(e) => (e.preventDefault(), navigate('/'))}>
        <span className="logo-coin">฿</span>
        <div>
          <b>Life Money Quest</b>
          <small>{label}</small>
        </div>
      </a>
      {stages.length > 0 && (
        <ol className="map" aria-label="ความคืบหน้าแต่ละช่วงวัย">
          {stages.map((s, i) => (
            <li key={s.id} className={`${done[s.id] ? 'done' : ''} ${i === idx ? 'cur' : ''}`} title={s.title} aria-label={`${s.title}${done[s.id] ? ' (เสร็จแล้ว)' : ''}`} aria-current={i === idx ? 'step' : undefined}>
              {s.emoji}
            </li>
          ))}
        </ol>
      )}
      <div className="hud-right">
        {coins !== undefined && (
          <div className="coins" title="ยอดสะสมตอนนี้">
            🪙 <b>{baht(coins)}</b>
          </div>
        )}
        {page !== 'leaderboard' && (
          <button className="btn small yellow" onClick={() => navigate('/leaderboard')} aria-label="อันดับ">🏆 <span className="hide-xs">อันดับ</span></button>
        )}
        <InstallButton />
        <ThemeButton />
        <MuteButton />
        <VersionBadge />
      </div>
    </header>
  )
}

function MuteButton() {
  const muted = useMuted()
  const toggle = () => {
    setMuted(!muted)
    if (muted) sfx.click() // เพิ่งเปิดเสียง
  }
  return (
    <button className="icon-btn mute" onClick={toggle} aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'} title={muted ? 'เปิดเสียง' : 'ปิดเสียง'}>
      {muted ? '🔇' : '🔊'}
    </button>
  )
}

// ปุ่มติดตั้งแอป — โผล่เฉพาะเมื่อเบราว์เซอร์อนุญาต (Android/Chrome/Edge)
function InstallButton() {
  const canInstall = useCanInstall()
  if (!canInstall) return null
  return (
    <button className="btn small install" onClick={promptInstall} aria-label="ติดตั้งเป็นแอป">
      📲 <span className="hide-xs">ติดตั้งแอป</span>
    </button>
  )
}

function ThemeButton() {
  const dark = useTheme() === 'dark'
  return (
    <button className="icon-btn mute" onClick={toggleTheme} aria-label={dark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดกลางคืน'} title={dark ? 'โหมดสว่าง' : 'โหมดกลางคืน'}>
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
