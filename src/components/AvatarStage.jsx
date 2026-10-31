import { useEffect, useRef, useState } from 'react'
import Avatar, { avatarGeometry } from './Avatar'
import Scene, { SCENE_INFO } from './Scene'
import { CELEBRATIONS, FIDGETS } from '../data/avatars'
import { pick } from '../lib/color'
import { sfx } from '../lib/sound'

export const LOOK_LABEL = {
  baby: 'วัยทารก 👶',
  kinder: 'วัยอนุบาล 🧸',
  primary: 'วัยประถม 🎒',
  middle: 'วัย ม.ต้น 📚',
  high: 'วัย ม.ปลาย 🏫',
  uni: 'วัยมหาลัย 🎓',
  work: 'วัยทำงาน 💼',
  senior: 'วัยเกษียณ 🌅',
}

const MORPH_MS = 1100 // ช่วงแปลงร่าง
const SWAP_MS = 520 // เปลี่ยนร่างตอนแสงสว่างที่สุด
const CELEBRATE_MS = 2200

// ฉากด้านขวา: พื้นหลัง + ตัวละคร + ป้ายชื่อ + เอฟเฟกต์แปลงร่าง
export default function AvatarStage({ player, look, scene, levelUpKey, caption, idPrefix = 'stage-avatar' }) {
  const [shownLook, setShownLook] = useState(look)
  const [phase, setPhase] = useState('idle') // idle | morph | celebrate
  const [action, setAction] = useState(null)
  const timers = useRef([])
  const morphing = useRef(false)

  const later = (ms, fn) => timers.current.push(setTimeout(fn, ms))
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // เลเวลอัป: แปลงร่าง → ท่าดีใจ → กลับมายืนปกติ
  useEffect(() => {
    if (!levelUpKey) return
    timers.current.forEach(clearTimeout)
    timers.current = []
    morphing.current = true
    setPhase('morph')
    sfx.morph()
    later(SWAP_MS, sfx.levelUp)
    setAction('stretch')
    later(MORPH_MS, () => {
      morphing.current = false
      setPhase('celebrate')
      sfx.fanfare()
      setAction(pick(CELEBRATIONS))
    })
    later(MORPH_MS + CELEBRATE_MS, () => {
      setPhase('idle')
      setAction(null)
    })
  }, [levelUpKey])

  // ลุคใหม่: ถ้ากำลังแปลงร่างให้รอจังหวะแสงจ้าก่อนค่อยเปลี่ยน (effect นี้ต้องอยู่หลัง effect เลเวลอัป)
  useEffect(() => {
    if (look === shownLook) return
    if (morphing.current) {
      const t = setTimeout(() => setShownLook(look), SWAP_MS)
      return () => clearTimeout(t)
    }
    setShownLook(look)
  }, [look, shownLook])

  // ตัวละครขยับเล่นเองเป็นระยะ
  useEffect(() => {
    if (phase !== 'idle') return
    let t2
    const t = setTimeout(() => {
      setAction(pick(FIDGETS))
      t2 = setTimeout(() => setAction(null), 1600)
    }, 3500 + Math.random() * 4000)
    return () => {
      clearTimeout(t)
      clearTimeout(t2)
    }
  }, [phase, action])

  const poke = () => {
    if (phase !== 'idle') return
    sfx.boop()
    setAction(pick(CELEBRATIONS))
    later(1500, () => setAction(null))
  }

  const { headTop } = avatarGeometry(shownLook)
  const tagTop = ((headTop - 40) / 280) * 100
  const info = SCENE_INFO[scene] ?? SCENE_INFO.home

  return (
    <div className={`stage phase-${phase}`} style={{ '--g1': info.ground[0], '--g2': info.ground[1] }}>
      <Scene id={scene} />
      <div className="sky">
        <span className="cloud c1" />
        <span className="cloud c2" />
      </div>
      <div className="stage-look">{LOOK_LABEL[shownLook]}</div>
      <div className="stage-place">📍 {info.label}</div>

      {phase === 'morph' && (
        <div className="morph" aria-hidden="true">
          <div className="pillar" />
          <span className="ring r1" />
          <span className="ring r2" />
          <span className="ring r3" />
          <div className="orbit">
            {Array.from({ length: 8 }).map((_, i) => <span key={i} style={{ '--i': i }} />)}
          </div>
        </div>
      )}

      <div className={`avatar-wrap ${phase === 'morph' ? 'morphing' : ''}`} onClick={poke} title="จิ้มตัวละครดูสิ!">
        {player.name && (
          <div className="nametag" style={{ top: `${tagTop}%` }}>
            {player.name}
          </div>
        )}
        <Avatar
          gender={player.gender}
          look={shownLook}
          presetIndex={player.look.presetIndex}
          expression={player.look.expression}
          pose={player.look.pose}
          variant={player.look.variant}
          name={player.name}
          action={action}
          className={idPrefix}
        />
      </div>
      <div className="platform">
        <span />
      </div>

      {phase !== 'idle' && (
        <div className="burst" aria-hidden="true">
          <div className="levelup">LEVEL UP!</div>
          {phase === 'celebrate' &&
            Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="spark" style={{ '--a': `${(i / 16) * 360}deg`, '--d': `${70 + (i % 3) * 25}px` }} />
            ))}
        </div>
      )}
      {caption && <div className="stage-caption">{caption}</div>}
    </div>
  )
}
