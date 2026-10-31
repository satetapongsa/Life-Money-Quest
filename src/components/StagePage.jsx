import { FREQS, SCHOOL_DAYS, yearlyAmount } from '../data/stages'
import { baht } from '../lib/calc'
import { isUnrealistic, limitText } from '../lib/fairness'
import { SAVE_CHOICES } from '../lib/savings'

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

      <div className="save-box">
        <span className="save-q">🐷 ช่วงนี้เก็บออมได้ประมาณกี่ %?</span>
        <div className="chips">
          {SAVE_CHOICES.map((p) => (
            <button key={p} className={`pill ${Number(e.save ?? -1) === p ? 'on' : ''}`} onClick={() => update({ save: p })}>
              {p === 0 ? 'ไม่ได้เก็บ' : `${p}%`}
            </button>
          ))}
          <label className="pct-input">
            <input type="number" inputMode="numeric" min="0" max="100" placeholder="อื่นๆ" value={SAVE_CHOICES.includes(Number(e.save)) || e.save === undefined ? '' : e.save}
              onChange={(ev) => update({ save: ev.target.value === '' ? undefined : Math.min(100, Math.max(0, Number(ev.target.value))) })} />
            %
          </label>
        </div>
        {filled && Number(e.save) > 0 && (
          <small className="note">เก็บได้ราว <b>{baht((perYear * stage.years * e.save) / 100)}</b> บาท ใช้ไป {baht((perYear * stage.years * (100 - e.save)) / 100)} บาท</small>
        )}
      </div>

      {filled && isUnrealistic(stage, e) && (
        <p className="warn-box">
          🤔 สูงเกินจริงไปหน่อยนะ (เกิน {limitText(stage)}) — เล่นต่อได้ แต่ผลนี้จะ<b>ไม่ขึ้นลีดเดอร์บอร์ด</b>
        </p>
      )}
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
