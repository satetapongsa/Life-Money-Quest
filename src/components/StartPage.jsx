import { PRESETS, randomLook, EXPRESSIONS, POSES } from '../data/avatars'
import { MIN_AGE, MAX_AGE } from '../data/stages'

export default function StartPage({ player, setPlayer, onStart }) {
  const ageNum = Number(player.age)
  const valid = player.name.trim() && Number.isInteger(ageNum) && ageNum >= MIN_AGE && ageNum <= MAX_AGE
  const list = PRESETS[player.gender]
  const preset = list[player.look.presetIndex]
  const expr = EXPRESSIONS.find((e) => e.id === player.look.expression)
  const pose = POSES.find((p) => p.id === player.look.pose)

  const setGender = (g) => {
    if (g === player.gender) return
    setPlayer({ ...player, gender: g, look: randomLook(g) })
  }
  const step = (dir) => {
    const i = (player.look.presetIndex + dir + list.length) % list.length
    setPlayer({ ...player, look: randomLook(player.gender, i) })
  }

  return (
    <div className="card pop-in">
      <div className="badge-row">
        <span className="chip">LEVEL 0</span>
        <span className="chip ghost">สร้างตัวละคร</span>
      </div>
      <h1 className="title">
        เงินไหลผ่าน<span className="hl">ชีวิต</span>คุณ<br />มาแล้วกี่บาท? 💸
      </h1>
      <p className="lead">
        ย้อนเวลาตั้งแต่อนุบาลจนถึงวันนี้ กรอกเงินที่เคยได้ในแต่ละช่วงวัย แล้วดูว่าตลอดชีวิตมีเงินผ่านมือคุณไปเท่าไหร่
        พร้อมดูว่าคุณเป็นคนแบบไหน!
      </p>

      <label className="field">
        <span>ชื่อผู้เล่น</span>
        <input
          value={player.name}
          maxLength={16}
          placeholder="เช่น ต้นข้าว"
          onChange={(e) => setPlayer({ ...player, name: e.target.value })}
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>อายุ (ปี)</span>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_AGE}
            max={MAX_AGE}
            value={player.age}
            placeholder="เช่น 25"
            onChange={(e) => setPlayer({ ...player, age: e.target.value })}
          />
        </label>
        <div className="field">
          <span>เพศ</span>
          <div className="seg">
            <button className={player.gender === 'm' ? 'on' : ''} onClick={() => setGender('m')}>👦 ชาย</button>
            <button className={player.gender === 'f' ? 'on' : ''} onClick={() => setGender('f')}>👧 หญิง</button>
          </div>
        </div>
      </div>
      {player.age !== '' && !valid && player.name.trim() && (
        <p className="warn">อายุต้องอยู่ระหว่าง {MIN_AGE}–{MAX_AGE} ปี</p>
      )}

      <div className="picker">
        <button className="icon-btn" onClick={() => step(-1)} aria-label="ตัวก่อนหน้า">◀</button>
        <div className="picker-info">
          <strong>{preset.label}</strong>
          <small>
            แบบที่ {player.look.presetIndex + 1}/{list.length} · {expr?.label} · {pose?.label}
          </small>
        </div>
        <button className="icon-btn" onClick={() => step(1)} aria-label="ตัวถัดไป">▶</button>
        <button className="btn small yellow" onClick={() => setPlayer({ ...player, look: randomLook(player.gender) })}>
          🎲 สุ่มใหม่
        </button>
      </div>
      <p className="note">ตัวละครจะถูกล็อกเมื่อเริ่มเกม แล้วจะค่อยๆ โตขึ้นตามช่วงวัยที่คุณกรอก</p>

      <div className="actions">
        <button className="btn big" disabled={!valid} onClick={onStart}>
          เริ่มการผจญภัย ▶
        </button>
      </div>
    </div>
  )
}
