import { toRecord } from './record.js'

async function request(path, options) {
  const res = await fetch(path, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status, code: data.code })
  return data
}

const postJson = (path, body) =>
  request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

export const savePlayer = (player, isPublic) => postJson('/api/player', { record: toRecord(player), isPublic })

export const fetchPlayer = (id) => request(`/api/player?id=${encodeURIComponent(id)}`)

export const fetchLeaderboard = (tier) => request(`/api/leaderboard${tier === null ? '' : `?tier=${tier}`}`)

export const reportPlayer = (id) => postJson('/api/report', { id })
