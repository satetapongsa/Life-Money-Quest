import { useCallback, useEffect, useMemo, useState } from 'react'
import AvatarStage from './components/AvatarStage'
import StartPage from './components/StartPage'
import StagePage from './components/StagePage'
import CalculatingPage from './components/CalculatingPage'
import ResultPage from './components/ResultPage'
import Leaderboard from './components/Leaderboard'
import AdminPage from './components/AdminPage'
import Gallery from './components/Gallery'
import { Layout, Hud } from './components/Shell'
import { LOOK_SCENE, TIER_SCENE } from './components/Scene'
import { randomLook } from './data/avatars'
import { itemForTier } from './data/items'
import { stagesForAge, lookForAge, stageTotal } from './data/stages'
import { computeResult } from './lib/calc'
import { readSharedFromHash } from './lib/share'
import { fetchPlayer } from './lib/api'
import { useRoute, navigate } from './lib/router'

const freshPlayer = () => {
  const gender = Math.random() < 0.5 ? 'm' : 'f'
  return { name: '', age: '', gender, look: randomLook(gender), entries: {}, isPublic: true, claim: null }
}

const stageLook = (stage, entry) => (stage.altMode && entry?.mode === 'work' ? stage.altMode.look : stage.look)

export default function App() {
  if (import.meta.env.DEV && window.location.hash.startsWith('#gallery')) return <Gallery />
  return <Router />
}

function Router() {
  const route = useRoute()
  // สถานะเกมอยู่ที่นี่ เพื่อให้กดไปดูลีดเดอร์บอร์ดแล้วกลับมาเล่นต่อได้
  const game = useGame()
  const [hashShared] = useState(readSharedFromHash)

  if (route.name === 'leaderboard') return <Leaderboard />
  if (route.name === 'admin') return <AdminPage />
  if (route.name === 'result') return <SharedResult key={route.id} id={route.id} onRestart={game.restart} />
  if (hashShared && game.screen === 'start' && window.location.hash) {
    return <SharedView player={hashShared} onRestart={game.restart} />
  }
  return <Game game={game} />
}

// ---- การ์ดผู้เล่น (ลิงก์ /r/<id> หรือกดจากลีดเดอร์บอร์ด) ----
function SharedResult({ id, onRestart }) {
  const [state, setState] = useState({ loading: true })
  useEffect(() => {
    let alive = true
    fetchPlayer(id)
      .then((p) => alive && setState({ player: p, loading: false }))
      .catch((err) => alive && setState({ loading: false, error: err.status === 410 ? 'hidden' : 'missing' }))
    return () => {
      alive = false
    }
  }, [id])

  if (state.player) return <SharedView player={state.player} id={id} onRestart={onRestart} />
  const msg = state.loading
    ? 'กำลังเปิดการ์ดผู้เล่น...'
    : state.error === 'hidden'
      ? 'ผลนี้ถูกซ่อนแล้ว เพราะถูกรายงานว่าไม่เหมาะสม'
      : 'ไม่พบผลลัพธ์นี้ ลิงก์อาจไม่ถูกต้อง'
  return (
    <Layout
      hud={<Hud label="การ์ดผู้เล่น" />}
      left={
        <div className="card calc-card pop-in">
          {state.loading && <div className="coin-spin">฿</div>}
          <h2 className="stage-title">{msg}</h2>
          {!state.loading && <button className="btn" onClick={() => (onRestart(), navigate('/'))}>เริ่มเล่นของฉัน ▶</button>}
        </div>
      }
      right={<AvatarStage player={{ name: '', gender: 'f', look: { presetIndex: 0, expression: 'wow', pose: 'wave', variant: 0 } }} look="uni" scene="city" />}
    />
  )
}

function SharedView({ player, id, onRestart }) {
  const tier = useMemo(() => computeResult(player).tierIndex, [player])
  const restart = () => {
    onRestart()
    navigate('/')
  }
  return (
    <Layout
      hud={<Hud label="การ์ดผู้เล่น" />}
      left={<ResultPage player={player} shared savedId={id} onRestart={restart} />}
      right={<AvatarStage player={player} look={lookForAge(player.age)} scene={TIER_SCENE[tier]} item={itemForTier(tier)} caption={`${player.name} · ${player.age} ปี`} />}
    />
  )
}

// ---- สถานะเกม ----
function useGame() {
  const [player, setPlayer] = useState(freshPlayer)
  const [screen, setScreen] = useState('start') // start | stage | calc | result
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState({})
  const [levelUp, setLevelUp] = useState(0)
  const [savedId, setSavedId] = useState(null) // id ในฐานข้อมูล กันบันทึกซ้ำ
  const restart = useCallback(() => {
    setSavedId(null)
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname)
    setPlayer(freshPlayer())
    setDone({})
    setIdx(0)
    setScreen('start')
  }, [])
  return { player, setPlayer, screen, setScreen, idx, setIdx, done, setDone, levelUp, setLevelUp, savedId, setSavedId, restart }
}

function Game({ game }) {
  const { player, setPlayer, screen, setScreen, idx, setIdx, done, setDone, levelUp, setLevelUp, savedId, setSavedId, restart } = game
  const age = Number(player.age)
  const stages = useMemo(() => (age ? stagesForAge(age) : []), [age])
  const running = stages.reduce((a, s) => a + (done[s.id] ? stageTotal(s, player.entries[s.id]) : 0), 0)
  const finishCalc = useCallback(() => setScreen('result'), [setScreen])
  // ดูตัวเองในอนาคตจากการ์ดทำนายอนาคต (เฉพาะหน้าสรุปผล)
  const [futureLook, setFutureLook] = useState(null)
  const [itemEquipped, setItemEquipped] = useState(true)
  useEffect(() => {
    if (screen !== 'result') setFutureLook(null)
  }, [screen])
  const previewLook = useCallback((l) => {
    setFutureLook(l)
    setLevelUp((n) => n + 1)
  }, [setLevelUp])

  // ---- ลุคตัวละครและฉากตามหน้าปัจจุบัน ----
  let look = lookForAge(age || 20)
  let caption = 'นี่คือคุณในตอนนี้!'
  let scene = LOOK_SCENE[look]
  if (screen === 'stage') {
    const s = stages[idx]
    if (done[s.id]) look = stageLook(s, player.entries[s.id])
    else look = idx === 0 ? 'baby' : stageLook(stages[idx - 1], player.entries[stages[idx - 1].id])
    scene = LOOK_SCENE[look]
    caption = done[s.id] ? 'โตขึ้นแล้ว! 🎉' : idx === 0 ? 'เริ่มต้นจากวัยทารก 👶' : 'กรอกเงินแล้วกดเสร็จสิ้นเพื่อโตขึ้น'
  } else if (screen !== 'start') {
    look = (screen === 'result' && futureLook) || lookForAge(age)
    scene = screen === 'result' ? TIER_SCENE[computeResult(player).tierIndex] : LOOK_SCENE[look]
    caption = screen === 'result' ? (futureLook ? 'ตัวคุณในอนาคต 🔮' : 'จบการผจญภัย 🏁') : 'กำลังนับเงิน...'
  }

  const setEntry = (id, entry) => setPlayer((p) => ({ ...p, entries: { ...p.entries, [id]: entry } }))

  let left
  if (screen === 'start') {
    left = (
      <StartPage
        player={player}
        setPlayer={setPlayer}
        onStart={() => {
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
        age={age}
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
    left = <ResultPage player={player} savedId={savedId} onSaved={setSavedId} onRestart={restart} onPreviewLook={previewLook} itemEquipped={itemEquipped} onEquip={setItemEquipped} />
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

  return <Layout hud={hud} left={left} right={<AvatarStage player={player} look={look} scene={scene} levelUpKey={levelUp} caption={caption} item={screen === 'result' && itemEquipped ? itemForTier(computeResult(player).tierIndex) : null} idPrefix="main-avatar" />} />
}
