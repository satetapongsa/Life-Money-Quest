import { toRecord } from './record.js'

async function request(path, options) {
  const res = await fetch(path, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status, code: data.code })
  return data
}

const postJson = (path, body) =>
  request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

export const savePlayer = (player, isPublic) => postJson('/api/player', { record: toRecord(player), isPublic, claim: player.claim })

export const checkName = (name) => request(`/api/name?name=${encodeURIComponent(name)}`)

export const claimName = (name, pin, mode) => postJson('/api/claim', { name, pin, mode })

export const fetchPlayer = (id) => request(`/api/player?id=${encodeURIComponent(id)}`)

export function fetchLeaderboard(tier, band = 'all') {
  const qs = new URLSearchParams({ band })
  if (tier !== null) qs.set('tier', tier)
  return request(`/api/leaderboard?${qs}`)
}

export const fetchStats = () => request('/api/stats')

export const reportPlayer = (id) => postJson('/api/report', { id })

export const managePlayer = (id, token, action) => postJson('/api/manage', { id, token, action })
