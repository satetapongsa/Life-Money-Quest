import { Box } from './Avatar'

// ฉากพื้นหลังแบบบล็อก (viewBox 420×560, พื้นอยู่ราว y=470)
const GROUND = 470

// ฉากตามช่วงวัย และตามระดับฐานะ (index = ระดับ 0–9)
export const LOOK_SCENE = { baby: 'home', kinder: 'kinder', primary: 'school', middle: 'school', high: 'school', uni: 'campus', work: 'office', senior: 'park' }
export const TIER_SCENE = ['village', 'village', 'town', 'town', 'city', 'travel', 'villa', 'yacht', 'mansion', 'palace']

export const SCENE_INFO = {
  home: { label: 'บ้านแสนอบอุ่น', ground: ['#c8a27a', '#8b5a2b'] },
  kinder: { label: 'โรงเรียนอนุบาล', ground: ['#7ed957', '#8b5a2b'] },
  school: { label: 'โรงเรียน', ground: ['#7ed957', '#8b5a2b'] },
  campus: { label: 'มหาวิทยาลัย', ground: ['#7ed957', '#8b5a2b'] },
  office: { label: 'ย่านออฟฟิศ', ground: ['#adb5bd', '#495057'] },
  park: { label: 'สวนยามเย็น', ground: ['#94d82d', '#8b5a2b'] },
  village: { label: 'ทุ่งนาบ้านเกิด', ground: ['#94d82d', '#8b5a2b'] },
  town: { label: 'ตึกแถวในเมือง', ground: ['#ced4da', '#495057'] },
  city: { label: 'คาเฟ่กลางเมือง', ground: ['#dee2e6', '#495057'] },
  travel: { label: 'ทะเลวันหยุด', ground: ['#ffe8a3', '#d9a441'] },
  villa: { label: 'บ้านพูลวิลล่า', ground: ['#e9ecef', '#868e96'] },
  yacht: { label: 'ดาดฟ้าเรือยอชต์', ground: ['#d4a373', '#7f5539'] },
  mansion: { label: 'คฤหาสน์หรู', ground: ['#c92a2a', '#7a1414'] },
  palace: { label: 'วังทองคำ', ground: ['#ffd43b', '#b8860b'] },
}

const windows = (key, x, y, cols, rows, w, h, gx, gy, c) => {
  const out = []
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) out.push(<rect key={`${key}${r}-${i}`} x={x + i * (w + gx)} y={y + r * (h + gy)} width={w} height={h} fill={c} />)
  return out
}
const Tree = ({ x, y, s = 1, c = '#40c057' }) => (
  <g>
    <Box x={x + 10 * s} y={y + 30 * s} w={10 * s} h={GROUND - y - 30 * s} c="#8b5a2b" d={4} />
    <Box x={x} y={y} w={30 * s} h={34 * s} c={c} d={8} />
  </g>
)
const Palm = ({ x, y }) => (
  <g>
    {[0, 1, 2, 3, 4, 5].map((i) => <Box key={i} x={x + i * 2} y={y + i * 22} w={10} h={23} c={i % 2 ? '#a0703c' : '#8b5a2b'} d={4} />)}
    <polygon points={`${x + 5},${y} ${x - 40},${y + 14} ${x - 30},${y + 20}`} fill="#2f9e44" />
    <polygon points={`${x + 5},${y} ${x + 50},${y + 12} ${x + 38},${y + 20}`} fill="#37b24d" />
    <polygon points={`${x + 5},${y} ${x - 20},${y - 26} ${x - 10},${y - 28}`} fill="#40c057" />
    <polygon points={`${x + 5},${y} ${x + 32},${y - 22} ${x + 22},${y - 28}`} fill="#2f9e44" />
  </g>
)
const Sun = ({ x, y, r = 30, c = '#ffd43b' }) => <rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={6} fill={c} opacity="0.95" />

const SCENES = {
  home: () => (
    <>
      <rect width="420" height="560" fill="#ffe3ec" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={i * 64} y="0" width="30" height="560" fill="#ffd6e4" />)}
      <rect x="250" y="90" width="120" height="110" fill="#a5d8ff" stroke="#fff" strokeWidth="8" />
      <line x1="310" y1="90" x2="310" y2="200" stroke="#fff" strokeWidth="6" />
      <rect x="40" y="70" width="70" height="4" fill="#868e96" />
      {[0, 1, 2].map((i) => <line key={i} x1={52 + i * 24} y1="74" x2={52 + i * 24} y2={104 + i * 6} stroke="#868e96" />)}
      {['#ffd43b', '#74c0fc', '#ff8787'].map((c, i) => <rect key={c} x={44 + i * 24} y={104 + i * 6} width="16" height="16" fill={c} />)}
      <Box x="40" y="402" w="34" h="34" c="#ff6b6b" />
      <Box x="64" y="436" w="34" h="34" c="#4dabf7" />
      <Box x="20" y="436" w="34" h="34" c="#ffd43b" />
      <Box x="330" y="380" w="60" h="90" c="#f8f9fa" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={338 + i * 14} y="388" width="5" height="74" fill="#dee2e6" />)}
    </>
  ),
  kinder: () => (
    <>
      <rect width="420" height="560" fill="url(#sky-day)" />
      <Sun x={360} y={70} />
      <Box x="20" y="250" w="170" h="220" c="#ffec99" />
      {['#ff8787', '#ffa94d', '#ffd43b', '#69db7c', '#74c0fc'].map((c, i) => <rect key={c} x="20" y={250 + i * 10} width="170" height="10" fill={c} />)}
      {windows('kw', 40, 330, 3, 2, 30, 30, 22, 30, '#a5d8ff')}
      <Box x="290" y="330" w="12" h="140" c="#868e96" d={4} />
      <polygon points="302,340 400,470 384,470 296,356" fill="#ffd43b" stroke="#e0a800" strokeWidth="2" />
      <Box x="280" y="320" w="32" h="12" c="#ff6b6b" d={4} />
    </>
  ),
  school: () => (
    <>
      <rect width="420" height="560" fill="url(#sky-day)" />
      <Box x="10" y="230" w="300" h="240" c="#fff4d6" />
      <polygon points="0,232 160,170 330,232" fill="#e03131" stroke="#a51d1d" strokeWidth="2" />
      {windows('sw', 26, 260, 6, 3, 30, 30, 18, 20, '#74c0fc')}
      <rect x="140" y="410" width="40" height="60" fill="#8b5a2b" />
      <rect x="360" y="150" width="6" height="320" fill="#adb5bd" />
      {['#e03131', '#ffffff', '#1c3faa', '#1c3faa', '#ffffff', '#e03131'].map((c, i) => <rect key={i} x="366" y={152 + i * 6} width="48" height={i === 2 || i === 3 ? 6 : 6} fill={c} />)}
    </>
  ),
  campus: () => (
    <>
      <rect width="420" height="560" fill="url(#sky-day)" />
      <Tree x={10} y={320} s={1.3} />
      <Box x="90" y="210" w="250" h="260" c="#f1f3f5" />
      <polygon points="80,212 215,140 350,212" fill="#ced4da" stroke="#868e96" strokeWidth="2" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={110 + i * 48} y="240" width="18" height="200" fill="#dee2e6" stroke="#adb5bd" />)}
      <rect x="86" y="440" width="258" height="12" fill="#adb5bd" />
      <rect x="190" y="160" width="50" height="30" rx="4" fill="#ffd43b" />
      <Tree x={360} y={330} s={1.1} c="#2f9e44" />
    </>
  ),
  office: () => (
    <>
      <rect width="420" height="560" fill="url(#sky-dusk)" />
      {[[0, 180, 90, '#364fc7'], [80, 120, 80, '#4263eb'], [150, 220, 70, '#3b5bdb'], [230, 90, 90, '#5c7cfa'], [330, 160, 90, '#364fc7']].map(([x, y, w, c], i) => (
        <g key={i}>
          <Box x={x} y={y} w={w} h={GROUND - y} c={c} />
          {windows('ow' + i, x + 10, y + 14, Math.floor((w - 10) / 18), Math.floor((GROUND - y - 20) / 22), 10, 12, 8, 10, '#ffe066')}
        </g>
      ))}
    </>
  ),
  park: () => (
    <>
      <rect width="420" height="560" fill="url(#sky-sunset)" />
      <Sun x={210} y={260} r={46} c="#ffa94d" />
      <Tree x={20} y={300} s={1.4} c="#2f9e44" />
      <Tree x={330} y={320} s={1.3} c="#37b24d" />
      <Box x="270" y="430" w="70" h="10" c="#a0703c" d={6} />
      <Box x="276" y="440" w="6" h="30" c="#5c3d1e" d={3} />
      <Box x="328" y="440" w="6" h="30" c="#5c3d1e" d={3} />
      <rect x="120" y="300" width="6" height="170" fill="#495057" />
      <rect x="110" y="290" width="26" height="14" fill="#ffe066" />
    </>
  ),
  village: () => (
    <>
      <rect width="420" height="560" fill="url(#sky-day)" />
      <polygon points="0,340 90,240 180,330 270,230 420,340 420,380 0,380" fill="#8ce99a" opacity="0.7" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x="0" y={370 + i * 17} width="420" height="9" fill={i % 2 ? '#69db7c' : '#94d82d'} />)}
      <Box x="20" y="300" w="110" h="70" c="#c08552" />
      <polygon points="10,302 75,250 140,302" fill="#8b5a2b" />
      {[30, 70, 110].map((x) => <rect key={x} x={x} y="370" width="8" height="100" fill="#7f5539" />)}
      <rect x="60" y="320" width="30" height="50" fill="#5c3d1e" />
      <Palm x={360} y={290} />
    </>
  ),
  town: () => (
    <>
      <rect width="420" height="560" fill="url(#sky-day)" />
      {[['#ffd8a8', '#e8590c', 'ร้านข้าว'], ['#d0ebff', '#1c7ed6', 'มินิมาร์ท'], ['#ffe3e3', '#e03131', 'ร้านทอง'], ['#d3f9d8', '#2f9e44', 'ซ่อมรถ']].map(([c, s, t], i) => (
        <g key={i}>
          <Box x={i * 105} y="250" w="100" h="220" c={c} />
          <rect x={i * 105 + 6} y="330" width="88" height="16" fill={s} />
          <text x={i * 105 + 50} y="342" textAnchor="middle" fontSize="11" fill="#fff" fontFamily="Kanit, sans-serif">{t}</text>
          {windows('tw' + i, i * 105 + 14, 270, 3, 2, 18, 18, 10, 14, '#a5d8ff')}
          <rect x={i * 105 + 10} y="360" width="80" height="110" fill={i % 2 ? '#868e96' : '#adb5bd'} />
          {[0, 1, 2, 3, 4, 5, 6].map((k) => <rect key={k} x={i * 105 + 10} y={364 + k * 15} width="80" height="2" fill="#495057" opacity="0.4" />)}
        </g>
      ))}
      <rect x="400" y="150" width="8" height="320" fill="#868e96" />
      <path d="M0,170 Q200,200 404,160 M0,182 Q200,214 404,172" fill="none" stroke="#343a40" strokeWidth="2" />
    </>
  ),
  city: () => (
    <>
      <rect width="420" height="560" fill="url(#sky-day)" />
      {[[10, 80, 90], [110, 40, 70], [190, 110, 80], [280, 60, 100]].map(([x, y, w], i) => (
        <g key={i}>
          <Box x={x} y={y} w={w} h={GROUND - y} c={['#91a7ff', '#748ffc', '#a5d8ff', '#5c7cfa'][i]} />
          {windows('cw' + i, x + 8, y + 12, Math.floor((w - 8) / 16), 14, 10, 10, 6, 12, '#e7f5ff')}
        </g>
      ))}
      <Box x="20" y="360" w="170" h="110" c="#fff4e6" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={20 + i * 21.25} y="350" width="21.25" height="22" fill={i % 2 ? '#fff' : '#f76707'} />)}
      <rect x="40" y="390" width="130" height="60" fill="#a5d8ff" />
      <text x="105" y="425" textAnchor="middle" fontSize="20">☕</text>
    </>
  ),
  travel: () => (
    <>
      <rect width="420" height="560" fill="url(#sky-day)" />
      <Sun x={340} y={90} />
      <rect y="320" width="420" height="80" fill="#22b8cf" />
      {[0, 1, 2].map((i) => <rect key={i} x={30 + i * 140} y={340 + i * 14} width="70" height="4" fill="#99e9f2" />)}
      <rect y="396" width="420" height="80" fill="#ffe8a3" />
      <Palm x={50} y={250} />
      <g className="sc-plane">
        <polygon points="80,120 150,112 160,118 150,124" fill="#fff" stroke="#adb5bd" />
        <polygon points="115,118 128,100 134,100 128,118" fill="#e9ecef" />
      </g>
      <polygon points="300,470 330,420 360,470" fill="#ff6b6b" />
      <rect x="328" y="420" width="4" height="50" fill="#868e96" />
    </>
  ),
  villa: () => (
    <>
      <rect width="420" height="560" fill="url(#sky-day)" />
      <Box x="140" y="230" w="260" h="150" c="#f8f9fa" />
      <Box x="120" y="210" w="290" h="20" c="#343a40" />
      <rect x="160" y="260" width="110" height="90" fill="#a5d8ff" />
      <rect x="290" y="260" width="90" height="90" fill="#a5d8ff" />
      <Box x="180" y="380" w="230" h="20" c="#ced4da" d={6} />
      <rect x="190" y="400" width="210" height="70" fill="#3bc9db" />
      {[0, 1, 2].map((i) => <rect key={i} x={210 + i * 60} y={420 + i * 12} width="40" height="4" fill="#c5f6fa" />)}
      <Tree x={20} y={330} s={1.3} c="#2b8a3e" />
      <Box x="10" y="440" w="140" h="30" c="#2f9e44" d={6} />
    </>
  ),
  yacht: () => (
    <>
      <rect width="420" height="560" fill="url(#sky-sunset)" />
      <Sun x={90} y={260} r={40} c="#ffa94d" />
      <rect y="300" width="420" height="260" fill="#1971c2" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={20 + i * 110} y={320 + (i % 2) * 18} width="60" height="4" fill="#74c0fc" />)}
      <polygon points="230,330 410,330 390,370 250,370" fill="#f8f9fa" stroke="#adb5bd" strokeWidth="2" />
      <Box x="270" y="300" w="100" h="30" c="#e9ecef" />
      <rect x="282" y="306" width="76" height="12" fill="#1c7ed6" />
      <rect x="318" y="220" width="4" height="80" fill="#868e96" />
      <path d="M150,170 l10,-8 l10,8 M180,150 l8,-6 l8,6" fill="none" stroke="#fff" strokeWidth="3" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={0} y={380 + i * 20} width="420" height="2" fill="#a5d8ff" opacity="0.4" />)}
      <rect y="450" width="420" height="30" fill="#b5835a" />
    </>
  ),
  mansion: () => (
    <>
      <rect width="420" height="560" fill="url(#sky-dusk)" />
      <Box x="40" y="200" w="340" h="270" c="#fff9db" />
      <polygon points="30,202 210,120 390,202" fill="#e9ecef" stroke="#adb5bd" strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={70 + i * 55} y="220" width="16" height="220" fill="#fff" stroke="#dee2e6" />)}
      {windows('mw', 95, 240, 5, 2, 20, 34, 35, 50, '#ffe066')}
      <rect x="185" y="380" width="50" height="90" rx="20" fill="#7f5539" />
      <circle cx="210" cy="170" r="14" fill="#ffd43b" />
      <Box x="0" y="430" w="40" h="40" c="#2b8a3e" d={6} />
      <Box x="380" y="430" w="40" h="40" c="#2b8a3e" d={6} />
    </>
  ),
  palace: () => (
    <>
      <rect width="420" height="560" fill="url(#sky-royal)" />
      <Box x="60" y="250" w="300" h="220" c="#ffd43b" />
      <polygon points="40,252 210,180 380,252" fill="#e03131" stroke="#ffd43b" strokeWidth="3" />
      <polygon points="80,182 210,110 340,182" fill="#c92a2a" stroke="#ffd43b" strokeWidth="3" />
      <polygon points="200,112 210,40 220,112" fill="#ffd43b" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={84 + i * 48} y="270" width="14" height="190" fill="#fab005" stroke="#e67700" />)}
      <rect x="180" y="390" width="60" height="80" rx="24" fill="#862e9c" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} className="sc-coin" x={20 + i * 52} y="-20" width="16" height="16" rx="8" fill="#ffd43b" stroke="#b8860b" strokeWidth="2" style={{ animationDelay: `${i * -0.45}s` }} />
      ))}
    </>
  ),
}

export default function Scene({ id }) {
  const draw = SCENES[id] ?? SCENES.home
  return (
    <svg className="scene" viewBox="0 0 420 560" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="sky-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#74c0fc" /><stop offset="1" stopColor="#d0ebff" /></linearGradient>
        <linearGradient id="sky-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5f3dc4" /><stop offset="1" stopColor="#ffa8a8" /></linearGradient>
        <linearGradient id="sky-sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff922b" /><stop offset="1" stopColor="#ffd8a8" /></linearGradient>
        <linearGradient id="sky-royal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5f3dc4" /><stop offset="1" stopColor="#e599f7" /></linearGradient>
      </defs>
      {draw()}
    </svg>
  )
}
