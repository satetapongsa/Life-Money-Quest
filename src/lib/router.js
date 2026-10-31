import { useEffect, useState } from 'react'

// เส้นทางของเว็บ: /  ·  /leaderboard  ·  /admin  ·  /r/<id> (หรือ /?r=<id>)
export function parseRoute(loc = window.location) {
  const m = loc.pathname.match(/^\/r\/([A-Za-z0-9]{10})\/?$/)
  const q = new URLSearchParams(loc.search).get('r')
  if (m) return { name: 'result', id: m[1] }
  if (q && /^[A-Za-z0-9]{10}$/.test(q)) return { name: 'result', id: q }
  if (/^\/leaderboard\/?$/.test(loc.pathname)) return { name: 'leaderboard' }
  if (/^\/admin\/?$/.test(loc.pathname)) return { name: 'admin' }
  return { name: 'home' }
}

export function navigate(path) {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0 })
}

export function useRoute() {
  const [route, setRoute] = useState(parseRoute)
  useEffect(() => {
    const on = () => setRoute(parseRoute())
    window.addEventListener('popstate', on)
    return () => window.removeEventListener('popstate', on)
  }, [])
  return route
}
