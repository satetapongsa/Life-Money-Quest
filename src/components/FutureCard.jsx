import { useMemo, useState } from 'react'
import { projectFuture } from '../lib/savings'
import { computeResult, baht, bahtShort } from '../lib/calc'
import { lookForAge } from '../data/stages'

const TARGETS = [60, 70, 80]
const RAISES = [0, 3, 5]

// ทำนายอนาคต: ถ้ารายได้แบบนี้ต่อไปจนถึงอายุที่เลือก + ดูตัวละครตอนแก่
export default function FutureCard({ player, onPreviewLook }) {
  const targets = TARGETS.filter((t) => t > player.age)
  const [target, setTarget] = useState(targets[0])
  const [raise, setRaise] = useState(3)
  const [previewing, setPreviewing] = useState(false)
  const now = useMemo(() => computeResult(player).total, [player])
  const f = useMemo(() => (target ? projectFuture(player, target, raise) : null), [player, target, raise])
  if (!f) return null

  const togglePreview = () => {
    onPreviewLook?.(previewing ? null : lookForAge(target))
    setPreviewing(!previewing)
  }
  const pickTarget = (t) => {
    setTarget(t)
    if (previewing) onPreviewLook?.(lookForAge(t))
  }

  return (
    <div className="card future">
      <h3 className="sec">🔮 ทำนายอนาคต</h3>
      <div className="future-controls">
        <span>จนถึงอายุ</span>
        {targets.map((t) => (
          <button key={t} className={`pill ${t === target ? 'on' : ''}`} onClick={() => pickTarget(t)}>{t} ปี</button>
        ))}
        {!f.usesTypical && (
          <>
            <span>รายได้ขึ้นปีละ</span>
            {RAISES.map((r) => (
              <button key={r} className={`pill ${r === raise ? 'on' : ''}`} onClick={() => setRaise(r)}>{r}%</button>
            ))}
          </>
        )}
      </div>
      <div className="future-nums">
        <div><small>อีก {f.years} ปีข้างหน้า</small><b>+฿{bahtShort(f.futureFlow)}</b></div>
        <div><small>รวมทั้งชีวิตถึงอายุ {target}</small><b className="big">฿{bahtShort(now + f.futureFlow)}</b></div>
        {f.futureSaved > 0 && <div><small>จะเก็บเพิ่มได้</small><b>฿{bahtShort(f.futureSaved)}</b></div>}
      </div>
      <p className="note">
        {f.usesTypical
          ? 'ช่วงที่ยังไม่ถึงใช้ตัวเลขทั่วไปของคนไทยไปก่อน'
          : `คิดจากรายได้ช่วงล่าสุด (${baht(now ? f.futureFlow / f.years : 0)} บาท/ปีโดยเฉลี่ย) และหลังเกษียณเหลือราว 40%`}
      </p>
      <button className="btn small" onClick={togglePreview}>
        {previewing ? '↩️ กลับเป็นตอนนี้' : `👀 ดูตัวเองตอนอายุ ${target}`}
      </button>
    </div>
  )
}
