import { useState } from 'react'
import { managePlayerWithPin } from '../lib/api'
import { forgetHistory } from '../lib/share'
import { isPin } from '../lib/names'

const ERRORS = {
  wrong_pin: 'PIN ไม่ถูกต้อง',
  locked: 'ใส่ PIN ผิดหลายครั้งเกินไป รอ 15 นาทีแล้วลองใหม่',
  no_pin: 'ชื่อนี้ยังไม่ได้ตั้ง PIN — เล่นด้วยชื่อนี้อีกครั้งเพื่อตั้ง PIN ก่อน แล้วค่อยลบ',
}

// ลบข้อมูลของตัวเองจากการ์ด (เช่น เปิดจากลีดเดอร์บอร์ด): ใส่ PIN → กดลบ → ยืนยัน → ลบออกจากฐานข้อมูลทั้งหมด
export default function DeleteWithPin({ id, name, onDeleted }) {
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const remove = async () => {
    setBusy(true)
    setError('')
    try {
      await managePlayerWithPin(id, pin, 'delete')
      forgetHistory(id)
      setDone(true)
      setTimeout(onDeleted, 1800)
    } catch (err) {
      setConfirming(false)
      setError(ERRORS[err.code] || 'ลบไม่สำเร็จ ลองใหม่อีกครั้ง')
    } finally {
      setBusy(false)
    }
  }

  if (done) return <p className="delete-done" role="status">✅ ลบข้อมูลของ “{name}” ออกจากระบบแล้ว ชื่อนี้ว่างให้ตั้งใหม่ได้</p>
  if (!open) {
    return (
      <button className="link-btn" onClick={() => setOpen(true)}>
        🗑️ นี่คือการ์ดของฉัน — ลบข้อมูลออกจากลีดเดอร์บอร์ด
      </button>
    )
  }
  return (
    <div className="delete-box">
      <b>🗑️ ลบข้อมูลของ “{name}”</b>
      <p className="note">ใส่ PIN 6 หลักที่ตั้งไว้ตอนเล่น ระบบจะลบผล ชื่อ และ PIN ออกทั้งหมด ลิงก์การ์ดนี้จะเปิดไม่ได้อีก</p>
      {!confirming ? (
        <div className="pin-row">
          <input
            className="pin-input"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="••••••"
            aria-label="PIN 6 หลัก"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <button className="btn small danger-solid" disabled={!isPin(pin)} onClick={() => setConfirming(true)}>ลบข้อมูล</button>
          <button className="btn small ghost" onClick={() => (setOpen(false), setPin(''), setError(''))}>ยกเลิก</button>
        </div>
      ) : (
        <div className="confirm-box" role="alertdialog" aria-label="ยืนยันการลบ">
          <p>⚠️ ยืนยันลบข้อมูลของ “{name}” ถาวร? ย้อนกลับไม่ได้</p>
          <div className="pin-row">
            <button className="btn small danger-solid" disabled={busy} onClick={remove}>{busy ? 'กำลังลบ...' : 'ยืนยันลบ'}</button>
            <button className="btn small ghost" disabled={busy} onClick={() => setConfirming(false)}>ไม่ลบแล้ว</button>
          </div>
        </div>
      )}
      {error && <p className="warn" role="alert">{error}</p>}
    </div>
  )
}
