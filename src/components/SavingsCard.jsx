import { useMemo } from 'react'
import { savingsSummary, SAVE_RATES } from '../lib/savings'
import { baht, bahtShort } from '../lib/calc'

// แยกเงินที่ใช้ไปกับเงินที่เก็บได้ และถ้าเก็บไว้แบบต่างๆ ตอนนี้จะมีเท่าไหร่
export default function SavingsCard({ player, shared }) {
  const s = useMemo(() => savingsSummary(player), [player])
  if (!s.answered) {
    if (shared) return null
    return (
      <div className="card">
        <h3 className="sec">🐷 ใช้ไปเท่าไหร่ เก็บได้เท่าไหร่?</h3>
        <p className="note">รอบนี้ยังไม่ได้บอกว่าแต่ละช่วงเก็บออมได้กี่ % — เล่นรอบหน้าลองเลือก % ในแต่ละช่วงดู จะได้เห็นว่าถ้าเก็บตั้งแต่เด็ก ตอนนี้จะมีเงินเท่าไหร่</p>
      </div>
    )
  }
  const pct = Math.round(s.pct)
  return (
    <div className="card savings">
      <h3 className="sec">🐷 ใช้ไปเท่าไหร่ เก็บได้เท่าไหร่?</h3>
      <div className="split-bar" role="img" aria-label={`ใช้ไป ${100 - pct}% เก็บได้ ${pct}%`}>
        <span className="spent" style={{ width: `${100 - pct}%` }} />
        <span className="saved" style={{ width: `${pct}%` }} />
      </div>
      <div className="split-legend">
        <span><i className="dot spent" /> ใช้ไป <b>{baht(s.spent)}</b> ฿</span>
        <span><i className="dot saved" /> เก็บได้ <b>{baht(s.saved)}</b> ฿ ({pct}%)</span>
      </div>
      {s.saved > 0 && (
        <>
          <p className="note">ถ้าเงินที่เก็บได้ทั้งหมดถูกเก็บไว้ตั้งแต่ตอนนั้น วันนี้จะมี…</p>
          <div className="grow-grid">
            {SAVE_RATES.map((r) => (
              <div key={r.id}>
                <small>{r.label}{r.rate ? ` (${r.rate}%/ปี)` : ''}</small>
                <b>฿{bahtShort(s.grown[r.id])}</b>
              </div>
            ))}
          </div>
          <p className="note">ตัวเลขผลตอบแทนเป็นค่าประมาณเพื่อเปรียบเทียบเท่านั้น ไม่ใช่คำแนะนำการลงทุน</p>
        </>
      )}
    </div>
  )
}
