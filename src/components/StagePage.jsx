import { FREQS, SCHOOL_DAYS, yearlyAmount } from '../data/stages'
import { baht } from '../lib/calc'

const MAX_AMOUNT = 100_000_000 // ต้องตรงกับขีดจำกัดใน lib/share.js

export default function StagePage({ stage, index, count, entry, setEntry, done, onDone, onNext, onBack, isLast }) {
  const e = entry ?? (stage.kind === 'school' ? { amount: '', days: 'school' } : { amount: '', freq: stage.typicalFreq || 'month', mode: 'study' })
  const update = (patch) => setEntry({ ...e, ...patch })
  const filled = e.amount !== '' && Number(e.amount) >= 0
  const perYear = yearlyAmount(stage, e)
  const question = stage.altMode && e.mode === 'work' ? stage.altMode.question : stage.question
  const unit = stage.kind === 'school' ? 'บาท/วัน' : FREQS[e.freq].unit

  return (
    <div className="card pop-in" key={stage.id}>
      <div className="badge-row">
        <span className="chip">LEVEL {index + 1}/{count}</span>
        <span className="chip ghost">{stage.range}</span>
        <span className="chip ghost">{stage.years} ปี</span>
      </div>
      <h2 className="stage-title">
        <span className="stage-emoji">{stage.emoji}</span> {stage.title}
      </h2>

      {stage.altMode && (
        <div className="seg wide">
          <button className={e.mode !== 'work' ? 'on' : ''} onClick={() => update({ mode: 'study' })}>🎓 เรียนมหาลัย</button>
          <button className={e.mode === 'work' ? 'on' : ''} onClick={() => update({ mode: 'work' })}>🛠️ {stage.altMode.label}</button>
        </div>
      )}

      <p className="question">{question}</p>
      <p className="note">{stage.hint}</p>

      {stage.kind === 'school' ? (
        <div className="seg wide">
          {Object.entries(SCHOOL_DAYS).map(([k, v]) => (
            <button key={k} className={e.days === k ? 'on' : ''} onClick={() => update({ days: k })}>
              {v.label} <small>({v.note})</small>
            </button>
          ))}
        </div>
      ) : (
        <div className="seg wide">
          {Object.entries(FREQS).map(([k, v]) => (
            <button key={k} className={e.freq === k ? 'on' : ''} onClick={() => update({ freq: k })}>
              {v.label}
            </button>
          ))}
        </div>
      )}

      <div className="money-input">
        <span className="coin">฿</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={e.amount}
          placeholder="0"
          onChange={(ev) => update({ amount: Number(ev.target.value) > MAX_AMOUNT ? String(MAX_AMOUNT) : ev.target.value })}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' && filled) (done ? onNext() : onDone())
          }}
          autoFocus
        />
        <span className="unit">{unit}</span>
      </div>
      <div className="chips">
        {stage.presets.map((p) => (
          <button key={p} className="pill" onClick={() => update({ amount: String(p) })}>
            {baht(p)}
          </button>
        ))}
      </div>

      <div className={`calc-line ${filled ? '' : 'dim'}`}>
        {filled ? (
          <>
            ปีละ <b>{baht(perYear)}</b> บาท × {stage.years} ปี = <b className="big-num">{baht(perYear * stage.years)}</b> บาท
          </>
        ) : (
          'กรอกจำนวนเงินเพื่อดูยอดของช่วงนี้'
        )}
      </div>

      <div className="actions">
        <button className="btn ghost" onClick={onBack}>◀ ย้อนกลับ</button>
        {!done ? (
          <button className="btn big green" disabled={!filled} onClick={onDone}>
            เสร็จสิ้น ✓
          </button>
        ) : (
          <button className="btn big" onClick={onNext}>
            {isLast ? 'คำนวณ 🧮' : 'ไปหน้าถัดไป ▶'}
          </button>
        )}
      </div>
      {done && <p className="note center">✨ ตัวละครโตขึ้นแล้ว! แก้ตัวเลขได้ตลอดก่อนไปต่อ</p>}
    </div>
  )
}
