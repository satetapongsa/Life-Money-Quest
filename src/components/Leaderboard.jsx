import { useEffect, useState } from 'react'
import { Layout, Hud } from './Shell'
import AvatarStage from './AvatarStage'
import Avatar from './Avatar'
import { TIER_SCENE } from './Scene'
import { TIERS } from '../data/tiers'
import { lookForAge } from '../data/stages'
import { fetchLeaderboard } from '../lib/api'
import { baht, bahtShort } from '../lib/calc'
import { navigate } from '../lib/router'


export default function Leaderboard() {
  const [tier, setTier] = useState(null) // null = อันดับรวม
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setData(null)
    setError('')
    fetchLeaderboard(tier)
      .then((d) => alive && setData(d))
      .catch(() => alive && setError('โหลดอันดับไม่สำเร็จ ลองใหม่อีกครั้งนะ'))
    return () => {
      alive = false
    }
  }, [tier])

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
      <h3 className="sec">{tier === null ? '🌏 อันดับรวมทุกระดับ' : `${TIERS[tier].emoji} ${TIERS[tier].title}`}</h3>

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
