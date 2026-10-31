import { PRESETS, randomLook } from '../data/avatars'
import { MIN_AGE, MAX_AGE } from '../data/stages'
import { nameProblem, NAME_PROBLEM_TEXT } from '../lib/moderation'

export default function StartPage({ player, setPlayer, onStart }) {
  const ageNum = Number(player.age)
  const badName = nameProblem(player.name)
  const valid = player.name.trim() && !badName && Number.isInteger(ageNum) && ageNum >= MIN_AGE && ageNum <= MAX_AGE
  const setGender = (g) => {
    if (g === player.gender) return
    setPlayer({ ...player, gender: g, look: randomLook(g) })
  }
  // สุ่มจากเพศละ 30 แบบ โดยไม่ซ้ำตัวเดิม
  const reroll = () => {
    const n = PRESETS[player.gender].length
    const i = (player.look.presetIndex + 1 + Math.floor(Math.random() * (n - 1))) % n
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
          aria-invalid={!!badName}
        />
        {badName && <small className="warn">🚫 {NAME_PROBLEM_TEXT[badName]}</small>}
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
      {player.age !== '' && !valid && player.name.trim() && !badName && (
        <p className="warn">อายุต้องอยู่ระหว่าง {MIN_AGE}–{MAX_AGE} ปี</p>
      )}

      <button className="btn yellow reroll" onClick={reroll}>
        🎲 สุ่มตัวละครใหม่
      </button>
      <p className="note">ตัวละครจะถูกล็อกเมื่อเริ่มเกม แล้วจะค่อยๆ โตขึ้นตามช่วงวัยที่คุณกรอก</p>

      <label className="check">
        <input type="checkbox" checked={player.isPublic !== false} onChange={(e) => setPlayer({ ...player, isPublic: e.target.checked })} />
        <span>🏆 แสดงชื่อและผลของฉันในลีดเดอร์บอร์ด <small>(ไม่ติ๊ก = เห็นได้เฉพาะคนที่มีลิงก์)</small></span>
      </label>

      <div className="actions">
        <button className="btn big" disabled={!valid} onClick={onStart}>
          เริ่มการผจญภัย ▶
        </button>
      </div>
    </div>
  )
}
