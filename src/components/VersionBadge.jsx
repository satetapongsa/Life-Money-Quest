import { useEffect, useState } from 'react'
import { VERSIONS, APP_VERSION } from '../data/versions'

// ป้ายเวอร์ชันมุมขวาบน กดแล้วเปิดประวัติการพัฒนา
export default function VersionBadge() {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState(APP_VERSION)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const v = VERSIONS.find((x) => x.version === picked) ?? VERSIONS[0]

  return (
    <>
      <button className="version-badge" onClick={() => setOpen(true)} title="ดูประวัติเวอร์ชัน">
        v{APP_VERSION}
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal card pop-in" role="dialog" aria-modal="true" aria-label="ประวัติเวอร์ชัน" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="sec">📦 ประวัติเวอร์ชัน</h2>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="ปิด">✕</button>
            </div>
            <div className="version-tabs">
              {VERSIONS.map((x) => (
                <button key={x.version} className={`pill ${x.version === picked ? 'on' : ''}`} onClick={() => setPicked(x.version)}>
                  v{x.version}
                  {x.version === APP_VERSION && <small> · ล่าสุด</small>}
                </button>
              ))}
            </div>
            <div className="version-body">
              <p className="note">{v.date}</p>
              <h3 className="tier-title">{v.title}</h3>
              <ul>
                {v.changes.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
