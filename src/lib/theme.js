import { useSyncExternalStore } from 'react'

// ธีมสว่าง/มืด: เริ่มตามเครื่อง กดสลับแล้วจำไว้ (ค่าเริ่มต้นตั้งโดย public/theme-init.js)
const KEY = 'lmq-theme'
const listeners = new Set()
const current = () => (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

export function toggleTheme() {
  const next = current() === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn())
}

export const useTheme = () => useSyncExternalStore((fn) => (listeners.add(fn), () => listeners.delete(fn)), current, () => 'light')
