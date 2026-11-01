import { useEffect, useRef, useState } from 'react'
import { VERSIONS, APP_VERSION } from '../data/versions'
import { isIos, isStandalone } from '../lib/install'

// ป้ายเวอร์ชันมุมขวาบน กดแล้วเปิดประวัติการพัฒนา
export default function VersionBadge() {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState(APP_VERSION)
  const opener = useRef(null)
  const closeBtn = useRef(null)

  useEffect(() => {
    if (!open) return
    closeBtn.current?.focus()
    const back = opener.current
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      back?.focus()
    }
  }, [open])

  const v = VERSIONS.find((x) => x.version === picked) ?? VERSIONS[0]

  return (
    <>
      <button ref={opener} className="version-badge" onClick={() => setOpen(true)} title="ดูประวัติเวอร์ชัน" aria-label={`เวอร์ชัน ${APP_VERSION} ดูประวัติการพัฒนา`}>
        v{APP_VERSION}
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal card pop-in" role="dialog" aria-modal="true" aria-label="ประวัติเวอร์ชัน" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="sec">📦 ประวัติเวอร์ชัน</h2>
              <button ref={closeBtn} className="icon-btn" onClick={() => setOpen(false)} aria-label="ปิด">✕</button>
            </div>
            <div className="version-tabs">
              {VERSIONS.map((x) => (
                <button key={x.version} className={`pill ${x.version === picked ? 'on' : ''}`} onClick={() => setPicked(x.version)}>
                  v{x.version}
                  {x.version === APP_VERSION && <small> · ล่าสุด</small>}
                </button>
              ))}
            </div>
            {!isStandalone() && (
              <div className="install-hint">
                <b>📲 ติดตั้งเป็นแอปบนมือถือ</b>
                <p>
                  {isIos()
                    ? 'iPhone/iPad: เปิดใน Safari → กดปุ่มแชร์ ⬆️ → "เพิ่มไปยังหน้าจอโฮม"'
                    : 'Android: กดปุ่ม 📲 ติดตั้งแอป ที่แถบด้านบน หรือเมนู ⋮ ของเบราว์เซอร์ → "ติดตั้งแอป"'}
                </p>
              </div>
            )}
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
