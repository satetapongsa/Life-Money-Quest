import { useEffect, useState } from 'react'
import Avatar, { avatarGeometry } from './Avatar'

const LOOK_LABEL = {
  baby: 'วัยทารก 👶',
  kinder: 'วัยอนุบาล 🧸',
  primary: 'วัยประถม 🎒',
  middle: 'วัย ม.ต้น 📚',
  high: 'วัย ม.ปลาย 🏫',
  uni: 'วัยมหาลัย 🎓',
  work: 'วัยทำงาน 💼',
  senior: 'วัยเกษียณ 🌅',
}

// ฉากด้านขวา: ตัวละคร + ป้ายชื่อ + เอฟเฟกต์เลเวลอัป
export default function AvatarStage({ player, look, levelUpKey, caption }) {
  const [burst, setBurst] = useState(false)
  const [jump, setJump] = useState(0)

  useEffect(() => {
    if (!levelUpKey) return
    setBurst(true)
    const t = setTimeout(() => setBurst(false), 1600)
    return () => clearTimeout(t)
  }, [levelUpKey])

  const { headTop } = avatarGeometry(look)
  // ป้ายชื่อลอยเหนือหัว (เทียบเป็น % ของ viewBox 280)
  const tagTop = ((headTop - 40) / 280) * 100

  return (
    <div className="stage">
      <div className="sky">
        <span className="cloud c1" />
        <span className="cloud c2" />
        <span className="cloud c3" />
        <span className="float-coin f1">฿</span>
        <span className="float-coin f2">฿</span>
        <span className="float-coin f3">฿</span>
      </div>
      <div className="stage-look">{LOOK_LABEL[look]}</div>
      <div
        className={`avatar-wrap ${burst ? 'grow' : ''} ${jump ? 'jump' : ''}`}
        key={jump}
        onClick={() => setJump((j) => j + 1)}
        title="จิ้มตัวละครดูสิ!"
      >
        {player.name && (
          <div className="nametag" style={{ top: `${tagTop}%` }}>
            {player.name}
          </div>
        )}
        <Avatar
          gender={player.gender}
          look={look}
          presetIndex={player.look.presetIndex}
          expression={player.look.expression}
          pose={player.look.pose}
          variant={player.look.variant}
          name={player.name}
        />
      </div>
      <div className="platform">
        <span />
      </div>
      {burst && (
        <div className="burst" aria-hidden="true">
          <div className="levelup">LEVEL UP!</div>
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="spark" style={{ '--a': `${(i / 14) * 360}deg`, '--d': `${70 + (i % 3) * 25}px` }} />
          ))}
        </div>
      )}
      {caption && <div className="stage-caption">{caption}</div>}
    </div>
  )
}
