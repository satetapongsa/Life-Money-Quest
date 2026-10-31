import { useSyncExternalStore } from 'react'

// เสียงประกอบสังเคราะห์ด้วย Web Audio (ไม่มีไฟล์เสียง) — ปิดเสียงได้และจำค่าไว้ในเครื่อง
const KEY = 'lmq-muted'
let muted = (() => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
})()
const listeners = new Set()

export function setMuted(v) {
  muted = v
  try {
    localStorage.setItem(KEY, v ? '1' : '0')
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn())
}
export const useMuted = () =>
  useSyncExternalStore(
    (fn) => (listeners.add(fn), () => listeners.delete(fn)),
    () => muted,
  )

let ctx
function audio() {
  if (muted || typeof window === 'undefined' || !window.AudioContext) return null
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// โน้ตหนึ่งตัว: ความถี่ (เลื่อนไปที่ to ได้), เริ่มหลัง delay วินาที
function tone({ freq, to, dur = 0.15, delay = 0, type = 'square', vol = 0.08 }) {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime + delay
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

export const sfx = {
  click: () => tone({ freq: 660, dur: 0.06, vol: 0.05 }),
  coin: (delay = 0) => {
    tone({ freq: 988, dur: 0.07, delay, vol: 0.05 })
    tone({ freq: 1319, dur: 0.12, delay: delay + 0.07, vol: 0.05 })
  },
  // เสียงแปลงร่าง: หวีดไต่ขึ้น + ประกาย
  morph: () => {
    tone({ freq: 180, to: 1400, dur: 0.9, type: 'sawtooth', vol: 0.04 })
    tone({ freq: 360, to: 2200, dur: 0.9, type: 'triangle', vol: 0.05, delay: 0.05 })
    ;[0.5, 0.6, 0.7].forEach((d, i) => tone({ freq: 1600 + i * 300, dur: 0.08, delay: d, type: 'triangle', vol: 0.04 }))
  },
  levelUp: () => [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.14, delay: i * 0.09, vol: 0.07 })),
  fanfare: () => {
    ;[523, 523, 784, 1047].forEach((f, i) => tone({ freq: f, dur: i === 3 ? 0.45 : 0.12, delay: i * 0.13, vol: 0.07 }))
    tone({ freq: 262, dur: 0.6, delay: 0.39, type: 'triangle', vol: 0.06 })
  },
  boop: () => tone({ freq: 300, to: 520, dur: 0.12, type: 'triangle', vol: 0.07 }),
}
