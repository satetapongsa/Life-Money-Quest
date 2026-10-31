import { pick } from '../lib/color'

// ตัวละครตั้งต้น เพศละ 10 แบบ
export const PRESETS = {
  m: [
    { id: 'm1', label: 'ต้นกล้า', skin: '#f1c27d', hair: 'short', hairColor: '#2b1d14', fav: '#4f8cff', work: '#2c3e66', acc: 'none' },
    { id: 'm2', label: 'ภูผา', skin: '#c68642', hair: 'spiky', hairColor: '#1b1b1f', fav: '#ff7a45', work: '#3b3f4a', acc: 'bandaid' },
    { id: 'm3', label: 'ไอซ์', skin: '#ffe0bd', hair: 'sidepart', hairColor: '#5b3a24', fav: '#36c5b0', work: '#1f4f5a', acc: 'glasses' },
    { id: 'm4', label: 'บอส', skin: '#e0ac69', hair: 'buzz', hairColor: '#24180f', fav: '#8a5cf6', work: '#2a2438', acc: 'mole' },
    { id: 'm5', label: 'ต่อ', skin: '#8d5524', hair: 'curly', hairColor: '#120c08', fav: '#ffc53d', work: '#4a3b1f', acc: 'none' },
    { id: 'm6', label: 'เจได', skin: '#f1c27d', hair: 'mohawk', hairColor: '#d6336c', fav: '#ff4d6d', work: '#3d1f2b', acc: 'freckles' },
    { id: 'm7', label: 'ฟลุ๊ค', skin: '#ffdbac', hair: 'bowl', hairColor: '#3a2a1e', fav: '#52c41a', work: '#24412a', acc: 'blush' },
    { id: 'm8', label: 'เก่ง', skin: '#e0ac69', hair: 'messy', hairColor: '#7a4a1e', fav: '#13c2c2', work: '#334155', acc: 'glasses' },
    { id: 'm9', label: 'นนท์', skin: '#c68642', hair: 'cap', hairColor: '#1d1410', fav: '#f5222d', work: '#2b2b2b', acc: 'none' },
    { id: 'm10', label: 'แม็ก', skin: '#ffe0bd', hair: 'undercut', hairColor: '#e8c170', fav: '#2f54eb', work: '#1e293b', acc: 'freckles' },
  ],
  f: [
    { id: 'f1', label: 'มายด์', skin: '#ffe0bd', hair: 'long', hairColor: '#2b1d14', fav: '#ff85c0', work: '#5a2a45', acc: 'blush' },
    { id: 'f2', label: 'ฝน', skin: '#f1c27d', hair: 'ponytail', hairColor: '#4a2c1a', fav: '#40a9ff', work: '#23395b', acc: 'none' },
    { id: 'f3', label: 'เฟิร์น', skin: '#ffdbac', hair: 'twintails', hairColor: '#1b1b1f', fav: '#b37feb', work: '#3b2a5a', acc: 'bow' },
    { id: 'f4', label: 'ใบเตย', skin: '#e0ac69', hair: 'bob', hairColor: '#3a2416', fav: '#73d13d', work: '#2d4a2b', acc: 'glasses' },
    { id: 'f5', label: 'มุก', skin: '#c68642', hair: 'bun', hairColor: '#120c08', fav: '#ffa940', work: '#4a3420', acc: 'clip' },
    { id: 'f6', label: 'แพรว', skin: '#ffe0bd', hair: 'braids', hairColor: '#8b4a22', fav: '#ff4d4f', work: '#4a1f24', acc: 'freckles' },
    { id: 'f7', label: 'จูน', skin: '#f1c27d', hair: 'sideponytail', hairColor: '#e2b04a', fav: '#36cfc9', work: '#1f4045', acc: 'blush' },
    { id: 'f8', label: 'น้ำหวาน', skin: '#8d5524', hair: 'wavy', hairColor: '#1d120c', fav: '#f759ab', work: '#3a2433', acc: 'clip' },
    { id: 'f9', label: 'ปิ่น', skin: '#ffdbac', hair: 'pixie', hairColor: '#6b3fa0', fav: '#597ef7', work: '#262a4a', acc: 'mole' },
    { id: 'f10', label: 'ข้าวหอม', skin: '#e0ac69', hair: 'hime', hairColor: '#24180f', fav: '#ffd666', work: '#3d3420', acc: 'bow' },
  ],
}

export const EXPRESSIONS = [
  { id: 'smile', eyes: 'dot', mouth: 'smile', label: 'ยิ้มหวาน' },
  { id: 'grin', eyes: 'happy', mouth: 'grin', label: 'ยิ้มกว้าง' },
  { id: 'wow', eyes: 'sparkle', mouth: 'o', label: 'ตาเป็นประกาย' },
  { id: 'wink', eyes: 'wink', mouth: 'tongue', label: 'ขยิบตา' },
  { id: 'cat', eyes: 'dot', mouth: 'cat', label: 'หน้าแมว' },
  { id: 'chill', eyes: 'sleepy', mouth: 'smile', label: 'ชิลล์ๆ' },
  { id: 'cool', eyes: 'dot', mouth: 'smirk', label: 'เท่ๆ' },
  { id: 'joy', eyes: 'happy', mouth: 'smile', label: 'อารมณ์ดี' },
]

export const POSES = [
  { id: 'idle', label: 'ยืนชิลล์' },
  { id: 'wave', label: 'โบกมือ' },
  { id: 'cheer', label: 'ชูสองมือ' },
  { id: 'hips', label: 'เท้าสะเอว' },
  { id: 'point', label: 'ชี้นิ้ว' },
]

export function randomLook(gender, keepPresetIndex = null) {
  const list = PRESETS[gender]
  const presetIndex = keepPresetIndex ?? Math.floor(Math.random() * list.length)
  return {
    presetIndex,
    expression: pick(EXPRESSIONS).id,
    pose: pick(POSES).id,
    variant: Math.floor(Math.random() * 1000), // ใช้สุ่มรายละเอียดย่อย เช่น จุกนม กระโปรง/กางเกง
  }
}

export function getPreset(gender, index) {
  return PRESETS[gender][index] ?? PRESETS[gender][0]
}
