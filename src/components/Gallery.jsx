import Avatar from './Avatar'
import { PRESETS, EXPRESSIONS, POSES } from '../data/avatars'

const LOOKS = ['baby', 'kinder', 'primary', 'middle', 'high', 'uni', 'work', 'senior']

// หน้าดูตัวละครทั้งหมด เปิดด้วย #gallery (ไว้ตรวจงานออกแบบ)
export default function Gallery() {
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
