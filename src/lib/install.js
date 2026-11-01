import { useSyncExternalStore } from 'react'

// ติดตั้งเป็นแอป (PWA): ลงทะเบียน service worker และเก็บ event "ติดตั้งได้" ของเบราว์เซอร์ไว้ให้ปุ่มใช้
let promptEvent = null
const listeners = new Set()
const notify = () => listeners.forEach((fn) => fn())

export function setupPwa() {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    promptEvent = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    promptEvent = null
    notify()
  })
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
  }
}

export const useCanInstall = () =>
  useSyncExternalStore(
    (fn) => (listeners.add(fn), () => listeners.delete(fn)),
    () => !!promptEvent,
  )

export async function promptInstall() {
  if (!promptEvent) return false
  promptEvent.prompt()
  const { outcome } = await promptEvent.userChoice
  promptEvent = null
  notify()
  return outcome === 'accepted'
}

export const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)

export const isIos = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)
