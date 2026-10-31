import { toRecord } from './record.js'

async function request(path, options) {
  const res = await fetch(path, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const savePlayer = (player, isPublic) =>
  request('/api/player', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ record: toRecord(player), isPublic }),
  })

export const fetchPlayer = (id) => request(`/api/player?id=${encodeURIComponent(id)}`)

export const fetchLeaderboard = (tier) => request(`/api/leaderboard${tier === null ? '' : `?tier=${tier}`}`)
