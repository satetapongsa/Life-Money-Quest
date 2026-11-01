import { useMemo } from 'react'
import Avatar from './Avatar'
import { computeResult, baht, bahtShort } from '../lib/calc'
import { lookForAge } from '../data/stages'
import { itemForTier } from '../data/items'

// การ์ดเทียบผลของฉันกับผู้เล่นอีกคนแบบคู่กัน
export default function CompareCard({ me, friend }) {
  const a = useMemo(() => computeResult(me), [me])
  const b = useMemo(() => computeResult(friend), [friend])
  const ids = a.rows.map((r) => r.stage.id).filter((id) => b.rows.some((r) => r.stage.id === id))
  const max = Math.max(1, ...ids.flatMap((id) => [a.rows.find((r) => r.stage.id === id).total, b.rows.find((r) => r.stage.id === id).total]))

  const [hi, lo, hiR, loR] = a.total >= b.total ? [me, friend, a, b] : [friend, me, b, a]
  const diff = hiR.total - loR.total
  const times = loR.total ? (hiR.total / loR.total).toLocaleString('th-TH', { maximumFractionDigits: 1 }) : null
  const verdict = diff === 0
    ? 'เสมอกันเป๊ะ! เงินไหลผ่านชีวิตเท่ากันพอดี'
    : `${hi.name} มีเงินไหลผ่านชีวิตมากกว่า ${lo.name} อยู่ ${baht(diff)} บาท${times ? ` (${times} เท่า)` : ''}`

  const side = (p, r, label) => (
    <div className="cmp-side">
      <small className="cmp-label">{label}</small>
      <div className="cmp-avatar">
        <Avatar gender={p.gender} look={lookForAge(p.age)} presetIndex={p.look.presetIndex} expression={p.look.expression} pose={p.look.pose} variant={p.look.variant} name={p.name} item={itemForTier(r.tierIndex)} className="static" />
      </div>
      <b className="cmp-name">{p.name}</b>
      <small>{p.age} ปี</small>
      <span className="cmp-total">฿{bahtShort(r.total)}</span>
      <small>{r.tier.emoji} {r.tier.title}</small>
      <small>เฉลี่ยวันละ {baht(r.perDay)} บาท</small>
    </div>
  )

  return (
    <div className="card compare-card pop-in">
      <h3 className="sec">⚖️ เทียบกันชัดๆ</h3>
      <div className="cmp-vs">
        {side(me, a, 'ฉัน')}
        <span className="vs">VS</span>
        {side(friend, b, friend.name)}
      </div>
      <p className="verdict">🏆 {verdict}</p>
      {ids.length > 0 && (
        <div className="cmp-rows">
          {ids.map((id) => {
            const ra = a.rows.find((r) => r.stage.id === id)
            const rb = b.rows.find((r) => r.stage.id === id)
            return (
              <div key={id} className="cmp-row">
                <span className="cmp-bar left"><span style={{ width: `${(ra.total / max) * 100}%` }} /></span>
                <span className="cmp-stage" title={ra.stage.title}>{ra.stage.emoji}</span>
                <span className="cmp-bar right"><span style={{ width: `${(rb.total / max) * 100}%` }} /></span>
              </div>
            )
          })}
          <p className="note center">แท่งซ้าย = ฉัน · แท่งขวา = {friend.name} (เทียบเฉพาะช่วงวัยที่ผ่านมาทั้งคู่)</p>
        </div>
      )}
    </div>
  )
}
