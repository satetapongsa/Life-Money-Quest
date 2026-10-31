import { useMemo } from 'react'
import { TIER_ITEMS } from '../data/items'
import { TIERS } from '../data/tiers'
import { historyTiers } from '../lib/share'

// ไอเทมที่ได้จากระดับฐานะรอบนี้ + คอลเลกชันที่สะสมจากการเล่นในเครื่องนี้
export default function ItemsCard({ tier, equipped, onToggle }) {
  const item = TIER_ITEMS[tier]
  const owned = useMemo(() => new Set([...historyTiers(), tier]), [tier])
  return (
    <div className="card items-card">
      <h3 className="sec">🎁 ได้ไอเทมใหม่!</h3>
      <div className="item-get">
        <span className="item-icon">{item.emoji}</span>
        <div>
          <b>{item.name}</b>
          <small>ไอเทมประจำระดับ “{TIERS[tier].title}”</small>
        </div>
        <label className="check">
          <input type="checkbox" checked={equipped} onChange={(e) => onToggle(e.target.checked)} />
          <span>สวมใส่</span>
        </label>
      </div>
      <p className="note">คอลเลกชันของฉัน {owned.size}/{TIER_ITEMS.length} — เล่นแล้วได้ระดับอื่นเพื่อสะสมให้ครบ</p>
      <div className="item-grid">
        {TIER_ITEMS.map((it, i) => (
          <div key={it.id} className={`item-slot ${owned.has(i) ? 'owned' : ''} ${i === tier ? 'current' : ''}`} title={owned.has(i) ? it.name : `ล็อกอยู่ — ได้จากระดับ “${TIERS[i].title}”`}>
            <span>{owned.has(i) ? it.emoji : '🔒'}</span>
            <small>{owned.has(i) ? it.name : '???'}</small>
          </div>
        ))}
      </div>
    </div>
  )
}
