import VersionBadge from './VersionBadge'
import { baht } from '../lib/calc'
import { navigate } from '../lib/router'

export function Layout({ hud, left, right }) {
  return (
    <div className="app">
      {hud}
      <main className="main">
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
        <ol className="map" aria-label="ความคืบหน้า">
          {stages.map((s, i) => (
            <li key={s.id} className={`${done[s.id] ? 'done' : ''} ${i === idx ? 'cur' : ''}`} title={s.title}>
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
          <button className="btn small yellow" onClick={() => navigate('/leaderboard')}>🏆 อันดับ</button>
        )}
        <VersionBadge />
      </div>
    </header>
  )
}
