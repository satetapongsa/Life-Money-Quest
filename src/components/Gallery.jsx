import Avatar from './Avatar'
import { PRESETS, EXPRESSIONS, POSES } from '../data/avatars'
import { TIER_ITEMS } from '../data/items'

const LOOKS = ['baby', 'kinder', 'primary', 'middle', 'high', 'uni', 'work', 'senior']

// หน้าดูตัวละครทั้งหมด เปิดด้วย #gallery (ไว้ตรวจงานออกแบบ) — #gallery-items ดูไอเทมประจำระดับ
export default function Gallery() {
  if (window.location.hash === '#gallery-items') {
    return (
      <div className="gallery">
        {TIER_ITEMS.map((it, i) => (
          <div key={it.id} className="gallery-row">
            <b>{it.emoji} {it.name}</b>
            {LOOKS.map((look, j) => {
              const g = j % 2 ? 'f' : 'm'
              return <Avatar key={look} gender={g} look={look} presetIndex={(i * 3 + j) % 30} expression="smile" pose="idle" item={it.id} />
            })}
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="gallery">
      {['m', 'f'].map((g) =>
        PRESETS[g].map((p, i) => (
          <div key={p.id} className="gallery-row">
            <b>{p.label}</b>
            {LOOKS.map((look, j) => (
              <Avatar
                key={look}
                gender={g}
                look={look}
                presetIndex={i}
                expression={EXPRESSIONS[(i + j) % EXPRESSIONS.length].id}
                pose={POSES[(i + j) % POSES.length].id}
                variant={i + j}
              />
            ))}
          </div>
        )),
      )}
    </div>
  )
}
