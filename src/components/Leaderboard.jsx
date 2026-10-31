import { useEffect, useState } from 'react'
import { Layout, Hud } from './Shell'
import AvatarStage from './AvatarStage'
import Avatar from './Avatar'
import { TIER_SCENE } from './Scene'
import { TIERS } from '../data/tiers'
import { lookForAge } from '../data/stages'
import { fetchLeaderboard, fetchStats } from '../lib/api'
import { AGE_BANDS } from '../data/ageBands'
import { baht, bahtShort } from '../lib/calc'
import { navigate } from '../lib/router'

export default function Leaderboard() {
  const [tier, setTier] = useState(null) // null = อันดับรวม
  const [band, setBand] = useState('all')
  const [stats, setStats] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setData(null)
    setError('')
    fetchLeaderboard(tier, band)
      .then((d) => alive && setData(d))
      .catch(() => alive && setError('โหลดอันดับไม่สำเร็จ ลองใหม่อีกครั้งนะ'))
    return () => {
      alive = false
    }
  }, [tier, band])

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {})
  }, [])

  const players = data?.players ?? []
  const champ = players[0]
  const counts = data?.counts ?? Array(10).fill(0)
  const total = counts.reduce((a, b) => a + b, 0)
  const sceneTier = tier ?? champ?.tier ?? 3

  const left = (
    <div className="card pop-in">
      <div className="badge-row">
        <span className="chip">🏆 LEADERBOARD</span>
        <span className="chip ghost">{total.toLocaleString('th-TH')} ผู้เล่น</span>
      </div>
      <h1 className="title">ทำเนียบ<span className="hl">ฐานะ</span></h1>
      <p className="lead">เลือกระดับฐานะเพื่อดูว่าใครมีเงินไหลผ่านชีวิตมากที่สุดในกลุ่มนั้น กดที่ชื่อเพื่อดูการ์ดของแต่ละคน</p>

      <div className="band-chips" role="group" aria-label="ช่วงอายุ">
        {AGE_BANDS.map((b) => (
          <button key={b.id} className={`pill ${band === b.id ? 'on' : ''}`} onClick={() => setBand(b.id)}>
            {b.id === 'all' ? '👥 ' : ''}{b.label}{b.id === 'all' ? '' : ' ปี'}
          </button>
        ))}
      </div>

      <div className="tier-tabs" role="tablist">
        <button role="tab" aria-selected={tier === null} className={`tier-tab ${tier === null ? 'on' : ''}`} onClick={() => setTier(null)}>
          <span>🌏</span>
          <small>รวม</small>
        </button>
        {TIERS.map((t, i) => (
          <button key={t.title} role="tab" aria-selected={tier === i} className={`tier-tab ${tier === i ? 'on' : ''}`} style={{ '--tier': t.color }} onClick={() => setTier(i)} title={t.title}>
            <span>{t.emoji}</span>
            <small>{counts[i]}</small>
          </button>
        ))}
      </div>
      <h3 className="sec">
        {tier === null ? '🌏 อันดับรวมทุกระดับ' : `${TIERS[tier].emoji} ${TIERS[tier].title}`}
        {band !== 'all' && <small className="band-tag"> · อายุ {AGE_BANDS.find((b) => b.id === band).label} ปี</small>}
      </h3>

      {error && <p className="warn">{error}</p>}
      {!data && !error && <p className="note">กำลังโหลด...</p>}
      {data && !players.length && (
        <div className="empty">
          <p>ยังไม่มีใครอยู่ในระดับนี้เลย เป็นคนแรกสิ!</p>
          <button className="btn" onClick={() => navigate('/')}>เริ่มเล่น ▶</button>
        </div>
      )}
      <ol className="board">
        {players.map((p, i) => (
          <li key={p.id}>
            <button className="board-row" onClick={() => navigate(`/r/${p.id}`)}>
              <span className={`rank r${i + 1}`}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
              <span className="mini">
                <Avatar gender={p.gender} look={lookForAge(p.age)} presetIndex={p.look.presetIndex} expression={p.look.expression} pose="idle" variant={p.look.variant} name={p.name} className="static" />
              </span>
              <span className="who">
                <b>{p.name}</b>
                <small>{p.age} ปี · {TIERS[p.tier].emoji} {TIERS[p.tier].title.split(' ')[0]}</small>
              </span>
              <span className="amt">
                <b>{bahtShort(p.total)}</b>
                <small>{baht(p.total)} ฿</small>
              </span>
            </button>
          </li>
        ))}
      </ol>
      {stats && <StatsPanel stats={stats} />}
    </div>
  )

  const right = champ ? (
    <AvatarStage
      player={{ name: champ.name, gender: champ.gender, look: champ.look }}
      look={lookForAge(champ.age)}
      scene={TIER_SCENE[sceneTier]}
      caption={`👑 อันดับ 1 · ${bahtShort(champ.total)} บาท`}
    />
  ) : (
    <AvatarStage player={{ name: '', gender: 'm', look: { presetIndex: 0, expression: 'wow', pose: 'cheer', variant: 0 } }} look="uni" scene={TIER_SCENE[sceneTier]} caption="รอแชมป์คนแรก..." />
  )

  return <Layout hud={<Hud label="ลีดเดอร์บอร์ด" page="leaderboard" />} left={left} right={right} />
}

// สถิติรวมของเกม (ตัวเลขรวมเท่านั้น)
function StatsPanel({ stats }) {
  const maxDay = Math.max(1, ...stats.daily.map((d) => d.n))
  const maxTier = Math.max(1, ...stats.tiers)
  const topTier = stats.tiers.indexOf(Math.max(...stats.tiers))
  return (
    <div className="stats">
      <h3 className="sec">📈 สถิติผู้เล่น</h3>
      <div className="stat-tiles">
        <div><b>{stats.players.toLocaleString('th-TH')}</b><small>คนเล่นแล้ว</small></div>
        <div><b>{stats.avgAge || '-'}</b><small>อายุเฉลี่ย (ปี)</small></div>
        <div><b>{stats.medianTotal ? bahtShort(stats.medianTotal) : '-'}</b><small>ยอดกลาง (บาท)</small></div>
        <div><b>{stats.players ? TIERS[topTier].emoji : '-'}</b><small>ระดับที่คนได้บ่อยสุด</small></div>
      </div>
      {stats.daily.length > 0 && (
        <>
          <p className="note">ผู้เล่นต่อวัน (14 วันล่าสุด)</p>
          <div className="spark-bars">
            {stats.daily.map((d) => (
              <span key={d.day} style={{ height: `${(d.n / maxDay) * 100}%` }} title={`${d.day}: ${d.n} คน`} />
            ))}
          </div>
        </>
      )}
      <p className="note">จำนวนคนในแต่ละระดับฐานะ</p>
      <div className="tier-dist">
        {TIERS.map((t, i) => (
          <div key={t.title} title={`${t.title}: ${stats.tiers[i]} คน`}>
            <span className="bar-v" style={{ height: `${(stats.tiers[i] / maxTier) * 100}%`, background: t.color }} />
            <small>{t.emoji}</small>
          </div>
        ))}
      </div>
    </div>
  )
}
