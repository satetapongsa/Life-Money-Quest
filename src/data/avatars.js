import { pick } from '../lib/color.js'

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

// v2: เพิ่มเพศละ 20 แบบ (ต่อท้ายเสมอ — ลำดับเดิมต้องไม่เปลี่ยน เพราะผลที่บันทึกไว้อ้างอิงด้วย index)
const P = (id, label, skin, hair, hairColor, fav, work, acc) => ({ id, label, skin, hair, hairColor, fav, work, acc })
PRESETS.m.push(
  P('m11', 'ปลื้ม', '#8d5524', 'afro', '#1a120d', '#ffb020', '#3a2a12', 'headphones'),
  P('m12', 'โอม', '#f1c27d', 'slick', '#2b1d14', '#1f6feb', '#111827', 'sunglasses'),
  P('m13', 'ข้าวปุ้น', '#e0ac69', 'topknot', '#24180f', '#12b886', '#1d3b33', 'beard'),
  P('m14', 'ภูมิ', '#fce3d0', 'longm', '#4a2c1a', '#e8590c', '#3b2618', 'none'),
  P('m15', 'ก้อง', '#c68642', 'beanie', '#1d1410', '#7048e8', '#2b2140', 'freckles'),
  P('m16', 'เพชร', '#f7d1b5', 'sporty', '#2b1d14', '#fa5252', '#1f2937', 'bandaid'),
  P('m17', 'ไผ่', '#ffe0bd', 'twoblock', '#151515', '#15aabf', '#164e63', 'earrings'),
  P('m18', 'เต้', '#a86b3c', 'flattop', '#24180f', '#fab005', '#3f2d12', 'mustache'),
  P('m19', 'ซัน', '#ffdbac', 'spiky', '#f08c00', '#ff922b', '#402510', 'heart'),
  P('m20', 'เมฆ', '#f1c27d', 'curly', '#ced4da', '#4dabf7', '#1c3d5a', 'glasses'),
  P('m21', 'นิว', '#f1c27d', 'sidepart', '#6b3fa0', '#be4bdb', '#2d1b3d', 'star'),
  P('m22', 'บิว', '#e0ac69', 'messy', '#2b8a3e', '#40c057', '#1e3a24', 'none'),
  P('m23', 'กาย', '#6e4123', 'mohawk', '#1971c2', '#339af0', '#132b47', 'earrings'),
  P('m24', 'ต้น', '#d9a066', 'cap', '#24180f', '#343a40', '#212529', 'sunglasses'),
  P('m25', 'โชกุน', '#fce3d0', 'undercut', '#1b1b1f', '#c92a2a', '#2b1111', 'beard'),
  P('m26', 'ปั้น', '#ffe0bd', 'bowl', '#c2410c', '#fd7e14', '#3d2410', 'freckles'),
  P('m27', 'ธาม', '#f7d1b5', 'slick', '#e8c170', '#0b7285', '#0c3540', 'glasses'),
  P('m28', 'ณัฐ', '#6e4123', 'buzz', '#0d0d0d', '#ae3ec9', '#2a1435', 'mustache'),
  P('m29', 'โจ้', '#a86b3c', 'afro', '#7a4a1e', '#e64980', '#3d1426', 'heart'),
  P('m30', 'อาร์ม', '#e0ac69', 'longm', '#111111', '#495057', '#1f2326', 'headphones'),
)
PRESETS.f.push(
  P('f11', 'ใยไหม', '#ffe0bd', 'spacebuns', '#2b1d14', '#f06595', '#4a1f33', 'heart'),
  P('f12', 'ปาย', '#f1c27d', 'highpony', '#24180f', '#4c6ef5', '#1e2a5a', 'earrings'),
  P('f13', 'นุ่น', '#8d5524', 'shortcurly', '#1d120c', '#ffd43b', '#3d3410', 'none'),
  P('f14', 'เอม', '#fce3d0', 'beret', '#4a2c1a', '#c92a2a', '#3a1414', 'blush'),
  P('f15', 'ออม', '#ffdbac', 'sidebraid', '#c2410c', '#2f9e44', '#16351f', 'freckles'),
  P('f16', 'พลอย', '#e0ac69', 'curtain', '#3a2416', '#7950f2', '#2a1d55', 'earrings'),
  P('f17', 'ดาว', '#f7d1b5', 'flowercrown', '#2b1d14', '#ff8787', '#4a2222', 'blush'),
  P('f18', 'เมย์', '#ffe0bd', 'catears', '#1b1b1f', '#f783ac', '#3a1d2b', 'star'),
  P('f19', 'น้ำฝน', '#f1c27d', 'long', '#6b3fa0', '#845ef7', '#2a1f4a', 'glasses'),
  P('f20', 'เบล', '#fce3d0', 'bob', '#e8c170', '#22b8cf', '#123b42', 'sunglasses'),
  P('f21', 'กิ๊ฟ', '#ffdbac', 'twintails', '#f783ac', '#ff6b6b', '#4a1f24', 'bow'),
  P('f22', 'ฟ้า', '#a86b3c', 'ponytail', '#1c2a4a', '#339af0', '#132b47', 'headphones'),
  P('f23', 'ขวัญ', '#e0ac69', 'hime', '#0d0d0d', '#e03131', '#3a1212', 'clip'),
  P('f24', 'แป้ง', '#ffe0bd', 'pixie', '#f08c00', '#fd7e14', '#3d2410', 'freckles'),
  P('f25', 'มินนี่', '#f7d1b5', 'spacebuns', '#e64980', '#be4bdb', '#3a1640', 'star'),
  P('f26', 'จันทร์', '#d9a066', 'wavy', '#dee2e6', '#5c7cfa', '#1e2a55', 'earrings'),
  P('f27', 'เนย', '#ffdbac', 'highpony', '#e8c170', '#fcc419', '#3d3410', 'bow'),
  P('f28', 'ส้ม', '#f1c27d', 'shortcurly', '#c2410c', '#ff922b', '#402510', 'heart'),
  P('f29', 'ลูกพีช', '#6e4123', 'beret', '#1d120c', '#f06595', '#3a1424', 'earrings'),
  P('f30', 'ไอริน', '#fce3d0', 'curtain', '#2b8a3e', '#20c997', '#123d30', 'glasses'),
)

// ท่าดีใจตอนโตขึ้น และท่าขยับเล่นระหว่างรอ
export const CELEBRATIONS = ['cheer', 'jump', 'spin', 'dance', 'fist', 'victory', 'flex']
export const FIDGETS = ['wave', 'hop', 'look', 'stretch', 'dance']

export const EXPRESSIONS = [
  { id: 'smile', eyes: 'dot', mouth: 'smile', label: 'ยิ้มหวาน' },
  { id: 'grin', eyes: 'happy', mouth: 'grin', label: 'ยิ้มกว้าง' },
  { id: 'wow', eyes: 'sparkle', mouth: 'o', label: 'ตาเป็นประกาย' },
  { id: 'wink', eyes: 'wink', mouth: 'tongue', label: 'ขยิบตา' },
  { id: 'cat', eyes: 'dot', mouth: 'cat', label: 'หน้าแมว' },
  { id: 'chill', eyes: 'sleepy', mouth: 'smile', label: 'ชิลล์ๆ' },
  { id: 'cool', eyes: 'dot', mouth: 'smirk', label: 'เท่ๆ' },
  { id: 'joy', eyes: 'happy', mouth: 'smile', label: 'อารมณ์ดี' },
  { id: 'excited', eyes: 'sparkle', mouth: 'grin', label: 'ตื่นเต้น' },
  { id: 'silly', eyes: 'happy', mouth: 'tongue', label: 'ทะเล้น' },
  { id: 'yawn', eyes: 'sleepy', mouth: 'o', label: 'ง่วงนิดๆ' },
  { id: 'flirt', eyes: 'wink', mouth: 'smile', label: 'ขยิบตาหวาน' },
]

export const POSES = [
  { id: 'idle', label: 'ยืนชิลล์' },
  { id: 'wave', label: 'โบกมือ' },
  { id: 'cheer', label: 'ชูสองมือ' },
  { id: 'hips', label: 'เท้าสะเอว' },
  { id: 'point', label: 'ชี้นิ้ว' },
  { id: 'peace', label: 'ชูสองนิ้ว' },
  { id: 'shrug', label: 'ยักไหล่' },
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
