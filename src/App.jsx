import { useCallback, useMemo, useState } from 'react'
import AvatarStage from './components/AvatarStage'
import StartPage from './components/StartPage'
import StagePage from './components/StagePage'
import CalculatingPage from './components/CalculatingPage'
import ResultPage from './components/ResultPage'
import Gallery from './components/Gallery'
import { randomLook } from './data/avatars'
import { stagesForAge, lookForAge, stageTotal } from './data/stages'
import { baht } from './lib/calc'
import { readSharedFromHash, saveHistory } from './lib/share'

const freshPlayer = () => {
  const gender = Math.random() < 0.5 ? 'm' : 'f'
  return { name: '', age: '', gender, look: randomLook(gender), entries: {} }
}

const stageLook = (stage, entry) => (stage.altMode && entry?.mode === 'work' ? stage.altMode.look : stage.look)

export default function App() {
  if (import.meta.env.DEV && window.location.hash === '#gallery') return <Gallery />
  return <Game />
}

function Game() {
  const [shared, setShared] = useState(() => readSharedFromHash())
  const [player, setPlayer] = useState(freshPlayer)
  const [screen, setScreen] = useState('start') // start | stage | calc | result
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState({})
  const [levelUp, setLevelUp] = useState(0)

  const age = Number(player.age)
  const stages = useMemo(() => (age ? stagesForAge(age) : []), [age])
  const running = stages.reduce((a, s) => a + (done[s.id] ? stageTotal(s, player.entries[s.id]) : 0), 0)

  const restart = () => {
    window.history.replaceState(null, '', window.location.pathname)
    setShared(null)
    setPlayer(freshPlayer())
    setDone({})
    setIdx(0)
    setScreen('start')
  }

  const finishCalc = useCallback(() => {
    saveHistory(player)
    setScreen('result')
  }, [player])

  // ---- โหมดดูผลของเพื่อน ----
  if (shared) {
    return (
      <Layout
        hud={<Hud label="ผลลัพธ์ของเพื่อน" />}
        left={<ResultPage player={shared} shared onRestart={restart} />}
        right={<AvatarStage player={shared} look={lookForAge(shared.age)} caption={`${shared.name} · ${shared.age} ปี`} />}
      />
    )
  }

  // ---- ลุคตัวละครตามหน้าปัจจุบัน ----
  let look = lookForAge(age || 20)
  let caption = 'นี่คือคุณในตอนนี้!'
  if (screen === 'stage') {
    const s = stages[idx]
    if (done[s.id]) look = stageLook(s, player.entries[s.id])
    else look = idx === 0 ? 'baby' : stageLook(stages[idx - 1], player.entries[stages[idx - 1].id])
    caption = done[s.id] ? 'โตขึ้นแล้ว! 🎉' : idx === 0 ? 'เริ่มต้นจากวัยทารก 👶' : 'กรอกเงินแล้วกดเสร็จสิ้นเพื่อโตขึ้น'
  } else if (screen !== 'start') {
    look = lookForAge(age)
    caption = screen === 'result' ? 'จบการผจญภัย 🏁' : 'กำลังนับเงิน...'
  }

  const setEntry = (id, entry) => setPlayer((p) => ({ ...p, entries: { ...p.entries, [id]: entry } }))

  let left
  if (screen === 'start') {
    left = (
      <StartPage
        player={player}
        setPlayer={setPlayer}
        onStart={() => {
          setPlayer((p) => ({ ...p, name: p.name.trim() }))
          setIdx(0)
          setScreen('stage')
        }}
      />
    )
  } else if (screen === 'stage') {
    const s = stages[idx]
    left = (
      <StagePage
        key={s.id}
        stage={s}
        index={idx}
        count={stages.length}
        entry={player.entries[s.id]}
        setEntry={(e) => {
          setEntry(s.id, e)
          // เปลี่ยนโหมดมหาลัย/ทำงาน หลังกดเสร็จแล้ว ให้ตัวละครเปลี่ยนชุดตาม
          if (done[s.id] && e.mode !== player.entries[s.id]?.mode) setLevelUp((n) => n + 1)
        }}
        done={!!done[s.id]}
        isLast={idx === stages.length - 1}
        onDone={() => {
          if (!player.entries[s.id]) setEntry(s.id, s.kind === 'school' ? { amount: '0', days: 'school' } : { amount: '0', freq: s.typicalFreq, mode: 'study' })
          setDone((d) => ({ ...d, [s.id]: true }))
          setLevelUp((n) => n + 1)
        }}
        onNext={() => (idx === stages.length - 1 ? setScreen('calc') : setIdx(idx + 1))}
        onBack={() => (idx === 0 ? setScreen('start') : setIdx(idx - 1))}
      />
    )
  } else if (screen === 'calc') {
    left = <CalculatingPage onFinish={finishCalc} />
  } else {
    left = <ResultPage player={player} onRestart={restart} />
  }

  const hud =
    screen === 'start' ? (
      <Hud label="สร้างตัวละคร" />
    ) : (
      <Hud
        label={screen === 'result' ? 'สรุปผล' : `ด่าน ${Math.min(idx + 1, stages.length)}/${stages.length}`}
        stages={stages}
        idx={screen === 'stage' ? idx : stages.length}
        done={done}
        coins={running}
      />
    )

  return <Layout hud={hud} left={left} right={<AvatarStage player={player} look={look} levelUpKey={levelUp} caption={caption} />} />
}

function Layout({ hud, left, right }) {
  return (
    <div className="app">
      {hud}
      <main className="main">
        <section className="left">{left}</section>
        <aside className="right">{right}</aside>
      </main>
      <footer className="foot">Life Money Quest · ตัวเลขเป็นการประมาณเพื่อความสนุก</footer>
    </div>
  )
}

function Hud({ label, stages = [], idx = 0, done = {}, coins }) {
  return (
    <header className="hud">
      <div className="logo">
        <span className="logo-coin">฿</span>
        <div>
          <b>Life Money Quest</b>
          <small>{label}</small>
        </div>
      </div>
      {stages.length > 0 && (
        <ol className="map" aria-label="ความคืบหน้า">
          {stages.map((s, i) => (
            <li key={s.id} className={`${done[s.id] ? 'done' : ''} ${i === idx ? 'cur' : ''}`} title={s.title}>
              {s.emoji}
            </li>
          ))}
        </ol>
      )}
      {coins !== undefined && (
        <div className="coins" title="ยอดสะสมตอนนี้">
          🪙 <b>{baht(coins)}</b>
        </div>
      )}
    </header>
  )
}
