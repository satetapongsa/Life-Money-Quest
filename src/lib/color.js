// ปรับสีให้สว่าง/มืดลง amt: -1..1
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) & 255
  let g = (n >> 8) & 255
  let b = n & 255
  const t = amt < 0 ? 0 : 255
  const p = Math.abs(amt)
  r = Math.round((t - r) * p + r)
  g = Math.round((t - g) * p + g)
  b = Math.round((t - b) * p + b)
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

export function pick(arr, rand = Math.random) {
  return arr[Math.floor(rand() * arr.length)]
}
