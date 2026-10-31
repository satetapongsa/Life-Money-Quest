import { useEffect, useState } from 'react'

const LINES = ['กำลังนับเหรียญทีละเหรียญ...', 'ย้อนดูกระปุกออมสินวัยเด็ก...', 'รวมค่าขนม ค่าข้าว เงินเดือน...', 'จัดอันดับฐานะ...']

export default function CalculatingPage({ onFinish }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const tick = setInterval(() => setI((x) => Math.min(x + 1, LINES.length - 1)), 550)
    const done = setTimeout(onFinish, 2300)
    return () => {
      clearInterval(tick)
      clearTimeout(done)
    }
  }, [onFinish])

  return (
    <div className="card calc-card pop-in">
      <div className="coin-spin">฿</div>
      <h2 className="stage-title">กำลังประมวลผล</h2>
      <p className="lead">{LINES[i]}</p>
      <div className="bar">
        <span style={{ width: `${((i + 1) / LINES.length) * 100}%` }} />
      </div>
    </div>
  )
}
