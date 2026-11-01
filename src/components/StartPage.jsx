import { useEffect, useState } from 'react'
import { PRESETS, randomLook } from '../data/avatars'
import { MIN_AGE, MAX_AGE } from '../data/stages'
import { cleanName, isPin, MAX_NAME } from '../lib/names'
import { checkName, claimName } from '../lib/api'

const CLAIM_ERRORS = {
  wrong_pin: 'PIN ไม่ถูกต้อง ลองใหม่อีกครั้ง',
  locked: 'ใส่ PIN ผิดหลายครั้งเกินไป รอ 15 นาทีแล้วลองใหม่',
  taken: 'มีคนเพิ่งจองชื่อนี้ไป ใส่ PIN ของชื่อนี้ หรือเปลี่ยนชื่อ',
  bad_pin_format: 'PIN ต้องเป็นตัวเลข 6 หลัก',
}

export default function StartPage({ player, setPlayer, onStart }) {
  const ageNum = Number(player.age)
  const name = cleanName(player.name)
  const ageOk = Number.isInteger(ageNum) && ageNum >= MIN_AGE && ageNum <= MAX_AGE

  // สถานะชื่อ: null = กำลังเช็ก, 'create' = ชื่อใหม่ (ตั้ง PIN), 'login' = มีเจ้าของแล้ว (ใส่ PIN), 'offline' = เช็กไม่ได้
  const [mode, setMode] = useState(null)
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setMode(null)
    setError('')
    if (!name) return
    let alive = true
    const t = setTimeout(() => {
      checkName(name)
        .then((r) => alive && setMode(r.needsPin))
        .catch(() => alive && setMode('offline'))
    }, 350)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [name])

  const pinReady = mode === 'login' ? isPin(pin) : mode === 'create' ? isPin(pin) && pin === pin2 : mode === 'offline'
  const valid = !!name && ageOk && pinReady && !busy

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
  const randomPin = () => {
    const p = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
    setPin(p)
    setPin2(p)
    setShowPin(true)
  }

  const start = async () => {
    setError('')
    if (mode === 'offline') {
      setPlayer({ ...player, name, claim: null })
      return onStart()
    }
    setBusy(true)
    try {
      const { claim } = await claimName(name, pin, mode)
      setPlayer({ ...player, name, claim })
      onStart()
    } catch (err) {
      if (err.code === 'taken') setMode('login')
      setError(CLAIM_ERRORS[err.code] || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง')
    } finally {
      setBusy(false)
    }
  }

  const digits = (v) => v.replace(/\D/g, '').slice(0, 6)

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
          maxLength={MAX_NAME}
          placeholder="ตั้งชื่ออะไรก็ได้"
          autoComplete="nickname"
          onChange={(e) => setPlayer({ ...player, name: e.target.value })}
        />
        <small className="note">1 ชื่อ = 1 ผู้เล่น · เล่นซ้ำด้วยชื่อเดิมจะอัปเดตผล และลีดเดอร์บอร์ดเก็บยอดสูงสุดของคุณ</small>
      </label>

      {name && (
        <div className={`pin-box ${mode || 'checking'}`}>
          {mode === null && <p className="note">⏳ กำลังเช็กชื่อ...</p>}
          {mode === 'create' && (
            <>
              <p className="pin-title">🆕 ชื่อนี้ว่าง! ตั้ง <b>PIN 6 หลัก</b> ไว้เป็นรหัสของชื่อ “{name}”</p>
              <p className="note">ครั้งหน้าใช้ชื่อเดิม + PIN นี้เพื่อเล่นต่อในชื่อของคุณ — จดไว้ให้ดีนะ คนอื่นจะใช้ชื่อนี้ไม่ได้</p>
            </>
          )}
          {mode === 'login' && <p className="pin-title">🔐 ชื่อ “{name}” มีเจ้าของแล้ว — ใส่ <b>PIN 6 หลัก</b> ของชื่อนี้เพื่อเล่นต่อ</p>}
          {mode === 'offline' && <p className="note">⚠️ เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ เล่นได้ แต่ผลจะไม่ถูกบันทึกขึ้นลีดเดอร์บอร์ด</p>}
          {(mode === 'create' || mode === 'login') && (
            <div className="pin-row">
              <input
                className="pin-input"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                placeholder="••••••"
                aria-label="PIN 6 หลัก"
                value={pin}
                onChange={(e) => setPin(digits(e.target.value))}
              />
              {mode === 'create' && (
                <input
                  className="pin-input"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="new-password"
                  placeholder="ยืนยัน"
                  aria-label="ยืนยัน PIN"
                  value={pin2}
                  onChange={(e) => setPin2(digits(e.target.value))}
                />
              )}
              <button className="icon-btn" type="button" onClick={() => setShowPin((v) => !v)} aria-label={showPin ? 'ซ่อน PIN' : 'แสดง PIN'}>
                {showPin ? '🙈' : '👁️'}
              </button>
              {mode === 'create' && (
                <button className="btn small ghost" type="button" onClick={randomPin}>🎲 สุ่ม PIN</button>
              )}
            </div>
          )}
          {mode === 'create' && isPin(pin) && pin2.length === 6 && pin !== pin2 && <p className="warn">PIN สองช่องไม่ตรงกัน</p>}
          {error && <p className="warn" role="alert">{error}</p>}
        </div>
      )}

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
      {player.age !== '' && !ageOk && <p className="warn">อายุต้องอยู่ระหว่าง {MIN_AGE}–{MAX_AGE} ปี</p>}

      <button className="btn yellow reroll" onClick={reroll}>
        🎲 สุ่มตัวละครใหม่
      </button>
      <p className="note">ตัวละครจะถูกล็อกเมื่อเริ่มเกม แล้วจะค่อยๆ โตขึ้นตามช่วงวัยที่คุณกรอก</p>

      <label className="check">
        <input type="checkbox" checked={player.isPublic !== false} onChange={(e) => setPlayer({ ...player, isPublic: e.target.checked })} />
        <span>🏆 แสดงชื่อและผลของฉันในลีดเดอร์บอร์ด <small>(ไม่ติ๊ก = เห็นได้เฉพาะคนที่มีลิงก์)</small></span>
      </label>

      <div className="actions">
        <button className="btn big" disabled={!valid} onClick={start}>
          {busy ? 'กำลังตรวจ PIN...' : 'เริ่มการผจญภัย ▶'}
        </button>
      </div>
    </div>
  )
}
