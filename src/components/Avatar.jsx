import { shade } from '../lib/color'
import { getPreset, EXPRESSIONS } from '../data/avatars'

// ตัวละครบล็อกแบบ 2.5D (หน้า + ด้านบน + ด้านข้าง) วาดด้วย SVG
const G = 262 // ระดับพื้น
const CX = 106
const D = 7 // ความลึกของบล็อก

// สัดส่วนร่างกายตามวัย [กว้าง, สูง]
const BODY = {
  baby: { head: [60, 52], torso: [40, 26], leg: [13, 12], arm: [10, 20] },
  kinder: { head: [60, 54], torso: [44, 34], leg: [15, 22], arm: [11, 28] },
  primary: { head: [58, 52], torso: [46, 42], leg: [16, 32], arm: [12, 36] },
  middle: { head: [56, 52], torso: [48, 50], leg: [17, 42], arm: [12, 44] },
  high: { head: [54, 50], torso: [50, 56], leg: [18, 48], arm: [13, 50] },
  uni: { head: [54, 50], torso: [52, 60], leg: [19, 54], arm: [13, 54] },
  work: { head: [54, 50], torso: [54, 62], leg: [20, 56], arm: [14, 56] },
  senior: { head: [54, 50], torso: [56, 58], leg: [20, 52], arm: [14, 52] },
}

const POSE_ANGLES = {
  idle: [6, -6],
  wave: [8, -150],
  cheer: [155, -155],
  hips: [38, -38],
  point: [8, -92],
}

function Box({ x, y, w, h, c, d = D, line = true }) {
  const top = `${x},${y} ${x + d},${y - d} ${x + w + d},${y - d} ${x + w},${y}`
  const side = `${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y + h - d} ${x + w},${y + h}`
  const stroke = line ? shade(c, -0.45) : 'none'
  return (
    <g strokeWidth="1" strokeLinejoin="round" stroke={stroke}>
      {d > 0 && <polygon points={side} fill={shade(c, -0.22)} />}
      {d > 0 && <polygon points={top} fill={shade(c, 0.2)} />}
      <rect x={x} y={y} width={w} height={h} fill={c} />
    </g>
  )
}

const Flat = ({ x, y, w, h, c, r = 0 }) => <rect x={x} y={y} width={w} height={h} rx={r} fill={c} />

// ---------------- เสื้อผ้าตามวัย ----------------
function outfitFor(look, gender, p, variant) {
  const white = '#f7f7fb'
  const navy = '#24315e'
  const black = '#26262e'
  const skirtFem = gender === 'f'
  switch (look) {
    case 'baby':
      return { shirt: shade(p.fav, 0.45), pants: shade(p.fav, 0.45), sleeve: 'short', bottom: 'full', shoes: shade(p.fav, 0.6), extras: ['bib', variant % 2 ? 'pacifier' : null] }
    case 'kinder':
      return { shirt: p.fav, pants: skirtFem ? null : '#2f3e75', skirt: skirtFem ? '#2f3e75' : null, sleeve: 'short', bottom: 'shorts', shoes: '#d64545', socks: white, extras: ['collar', 'badge', 'straps'] }
    case 'primary':
      return { shirt: white, pants: skirtFem ? null : navy, skirt: skirtFem ? navy : null, sleeve: 'short', bottom: 'shorts', shoes: black, socks: white, extras: ['collar', 'nameTag', 'straps'] }
    case 'middle':
      return { shirt: white, pants: skirtFem ? null : '#b08a52', skirt: skirtFem ? navy : null, sleeve: 'short', bottom: 'shorts', shoes: skirtFem ? black : '#6b4428', socks: white, extras: skirtFem ? ['sailorTie', 'nameTag'] : ['collar', 'belt', 'nameTag'] }
    case 'high':
      return { shirt: white, pants: skirtFem ? null : black, skirt: skirtFem ? navy : null, sleeve: 'short', bottom: 'shorts', shoes: black, socks: white, extras: skirtFem ? ['bowTie', 'nameTag', 'pleats'] : ['collar', 'belt', 'nameTag'] }
    case 'uni':
      return skirtFem
        ? { shirt: white, skirt: black, sleeve: 'short', bottom: 'skirt', shoes: black, extras: ['collar', 'goldBelt', 'pin'] }
        : { shirt: white, pants: black, sleeve: 'long', bottom: 'full', shoes: black, extras: ['collar', 'tie', 'goldBelt'] }
    case 'work': {
      const trousers = gender === 'm' || variant % 2 === 0
      return { shirt: p.work, inner: shade(p.fav, 0.75), pants: trousers ? shade(p.work, -0.25) : null, skirt: trousers ? null : shade(p.work, -0.25), sleeve: 'long', bottom: trousers ? 'full' : 'skirt', shoes: '#1b1b22', extras: ['blazer', gender === 'm' ? 'tie' : null, 'lanyard'] }
    }
    case 'senior':
      return { shirt: shade(p.fav, -0.15), inner: '#f1ead8', pants: '#b9a888', sleeve: 'long', bottom: 'full', shoes: '#7a5a3a', extras: ['cardigan'] }
    default:
      return { shirt: p.fav, pants: navy, sleeve: 'short', bottom: 'full', shoes: black, extras: [] }
  }
}

// ---------------- ทรงผม ----------------
function hairParts(style, h, hc, ctx) {
  const { x, y, w, h: hh } = h
  const dark = shade(hc, -0.25)
  const back = []
  const front = []
  const cap = (extra = 0) => <Box key="cap" x={x - 3} y={y - 7 - extra} w={w + 6} h={13 + extra} c={hc} />
  const sideL = (len, k = 'sl') => <Box key={k} x={x - 4} y={y + 2} w={7} h={len} c={hc} d={4} />
  const sideR = (len, k = 'sr') => <Box key={k} x={x + w - 3} y={y + 2} w={7} h={len} c={hc} d={4} />
  const fringe = (fy, k = 'fr') => <Flat key={k} x={x - 1} y={y + 4} w={w + 2} h={fy} c={hc} />
  const longBack = (len) => <Box key="lb" x={x - 6} y={y - 4} w={w + 12} h={hh + len} c={dark} />
  const L = ctx.torsoH

  if (ctx.look === 'baby') {
    front.push(<Box key="tuft" x={x + w / 2 - 4} y={y - 14} w={8} h={8} c={hc} d={4} />)
    front.push(<Flat key="tf" x={x + 4} y={y - 2} w={w - 8} h={5} c={hc} />)
    if (ctx.gender === 'f') front.push(<Bow key="bbow" x={x + w - 14} y={y - 10} c={ctx.fav} />)
    return { back, front }
  }

  switch (style) {
    case 'short':
      front.push(cap(), fringe(6), sideL(12), sideR(12))
      break
    case 'spiky':
      front.push(cap())
      for (let i = 0; i < 5; i++) {
        const sx = x - 2 + i * ((w + 4) / 5)
        front.push(<polygon key={'sp' + i} points={`${sx},${y - 6} ${sx + w / 10},${y - 20 - (i % 2) * 5} ${sx + w / 5 + 2},${y - 6}`} fill={hc} stroke={shade(hc, -0.45)} />)
      }
      front.push(fringe(5), sideL(10), sideR(10))
      break
    case 'sidepart':
      front.push(cap(2), <Flat key="f1" x={x - 1} y={y + 4} w={w * 0.62} h={11} c={hc} />, <Flat key="f2" x={x + w * 0.62} y={y + 4} w={w * 0.38 + 1} h={6} c={hc} />, sideL(14), sideR(14))
      break
    case 'buzz':
      front.push(<Box key="bz" x={x - 1} y={y - 4} w={w + 2} h={8} c={hc} d={D} />, <Flat key="bzf" x={x} y={y + 3} w={w} h={2} c={dark} />)
      break
    case 'curly':
      front.push(cap(2))
      for (let i = 0; i < 6; i++) front.push(<Box key={'cu' + i} x={x - 6 + i * (w / 5)} y={y - 14 + (i % 2) * 3} w={12} h={10} c={i % 2 ? hc : shade(hc, 0.12)} d={4} />)
      front.push(sideL(16), sideR(16), fringe(5))
      break
    case 'mohawk':
      front.push(<Box key="mb" x={x - 1} y={y - 3} w={w + 2} h={7} c={shade(hc, -0.4)} />, <Box key="mh" x={x + w / 2 - 7} y={y - 22} w={14} h={22} c={hc} />)
      break
    case 'bowl':
      front.push(cap(3), fringe(14), sideL(hh * 0.5), sideR(hh * 0.5))
      break
    case 'messy':
      front.push(cap(3))
      for (let i = 0; i < 6; i++) front.push(<Flat key={'ms' + i} x={x - 1 + i * ((w + 2) / 6)} y={y + 4} w={(w + 2) / 6 + 0.5} h={[12, 7, 14, 6, 11, 8][i]} c={i % 2 ? hc : shade(hc, 0.1)} />)
      front.push(<Box key="mt" x={x + 6} y={y - 16} w={10} h={8} c={hc} d={4} />, <Box key="mt2" x={x + w - 20} y={y - 15} w={9} h={7} c={hc} d={4} />, sideL(13), sideR(13))
      break
    case 'cap':
      front.push(sideL(12), sideR(12), <Box key="hat" x={x - 4} y={y - 12} w={w + 8} h={16} c={ctx.fav} />, <Box key="brim" x={x - 10} y={y + 2} w={w * 0.75} h={5} c={shade(ctx.fav, -0.15)} d={3} />, <Flat key="logo" x={x + w / 2 - 4} y={y - 8} w={8} h={8} c="#fff" r={2} />)
      break
    case 'undercut':
      front.push(<Box key="uc" x={x - 1} y={y - 2} w={w + 2} h={7} c={shade(hc, -0.35)} />, <Box key="ut" x={x - 4} y={y - 16} w={w * 0.8} h={16} c={hc} />, <Flat key="uf" x={x - 1} y={y} w={w * 0.55} h={9} c={hc} />)
      break
    // ---- ผู้หญิง ----
    case 'long':
      back.push(longBack(L * 0.8))
      front.push(cap(), fringe(9), sideL(hh + L * 0.35, 'll'), sideR(hh + L * 0.35, 'lr'))
      break
    case 'ponytail':
      back.push(<Box key="pt" x={x + w + 3} y={y + 6} w={14} h={hh * 0.4 + L * 0.7} c={dark} />)
      front.push(cap(), fringe(8), sideL(12), sideR(12), <Box key="tie" x={x + w + 2} y={y + 4} w={8} h={7} c={ctx.fav} d={3} />)
      break
    case 'twintails':
      back.push(<Box key="tl" x={x - 16} y={y + 10} w={13} h={hh * 0.5 + L * 0.5} c={hc} />, <Box key="tr" x={x + w + 3} y={y + 10} w={13} h={hh * 0.5 + L * 0.5} c={hc} />)
      front.push(cap(), fringe(9), sideL(10), sideR(10), <Box key="tbl" x={x - 9} y={y + 6} w={8} h={7} c={ctx.fav} d={3} />, <Box key="tbr" x={x + w + 1} y={y + 6} w={8} h={7} c={ctx.fav} d={3} />)
      break
    case 'bob':
      front.push(cap(2), fringe(10), sideL(hh * 0.82), sideR(hh * 0.82))
      break
    case 'bun':
      front.push(<Box key="bun" x={x + w / 2 - 12} y={y - 26} w={24} h={18} c={hc} />, cap(), fringe(7), sideL(14), sideR(14))
      break
    case 'braids':
      front.push(cap(), <Flat key="bfl" x={x - 1} y={y + 4} w={w / 2 - 1} h={8} c={hc} />, <Flat key="bfr" x={x + w / 2 + 1} y={y + 4} w={w / 2} h={8} c={hc} />)
      for (const side of [-1, 1]) {
        const bx = side < 0 ? x - 6 : x + w - 2
        for (let i = 0; i < 4; i++) front.push(<Box key={`br${side}${i}`} x={bx} y={y + 8 + i * ((hh * 0.55 + L * 0.35) / 4)} w={9} h={(hh * 0.55 + L * 0.35) / 4 + 1} c={i % 2 ? hc : shade(hc, 0.15)} d={3} />)
        front.push(<Box key={`brt${side}`} x={bx + 1} y={y + 8 + hh * 0.55 + L * 0.35} w={7} h={5} c={ctx.fav} d={3} />)
      }
      break
    case 'sideponytail':
      back.push(<Box key="sp" x={x - 16} y={y + 4} w={14} h={hh * 0.5 + L * 0.55} c={dark} />)
      front.push(cap(), <Flat key="sf" x={x - 1} y={y + 4} w={w + 2} h={6} c={hc} />, <Flat key="sf2" x={x + w * 0.45} y={y + 4} w={w * 0.55 + 1} h={12} c={hc} />, sideL(10), sideR(10), <Box key="spt" x={x - 10} y={y + 2} w={8} h={7} c={ctx.fav} d={3} />)
      break
    case 'wavy':
      back.push(longBack(L * 0.7))
      front.push(cap(2), fringe(8))
      for (let i = 0; i < 4; i++) {
        const yy = y + 4 + i * ((hh + L * 0.3) / 4)
        const off = i % 2 ? 2 : -2
        front.push(<Box key={'wl' + i} x={x - 5 + off} y={yy} w={8} h={(hh + L * 0.3) / 4 + 1} c={i % 2 ? hc : shade(hc, 0.12)} d={3} />, <Box key={'wr' + i} x={x + w - 3 - off} y={yy} w={8} h={(hh + L * 0.3) / 4 + 1} c={i % 2 ? shade(hc, 0.12) : hc} d={3} />)
      }
      break
    case 'pixie':
      front.push(cap(1), <Flat key="pf" x={x - 1} y={y + 4} w={w * 0.7} h={10} c={hc} />, <polygon key="pf2" points={`${x + w * 0.7 - 1},${y + 4} ${x + w * 0.85},${y + 4} ${x + w * 0.7 - 1},${y + 14}`} fill={hc} />, sideL(16), sideR(10))
      break
    case 'hime':
      back.push(longBack(L * 0.9))
      front.push(cap(), fringe(14), <Box key="hl" x={x - 4} y={y + 2} w={8} h={hh * 0.8} c={hc} d={4} />, <Box key="hr" x={x + w - 4} y={y + 2} w={8} h={hh * 0.8} c={hc} d={4} />)
      break
    default:
      front.push(cap(), fringe(6))
  }
  return { back, front }
}

function Bow({ x, y, c }) {
  return (
    <g stroke={shade(c, -0.45)} strokeWidth="1" strokeLinejoin="round">
      <polygon points={`${x},${y} ${x + 9},${y + 5} ${x},${y + 10}`} fill={c} />
      <polygon points={`${x + 18},${y} ${x + 9},${y + 5} ${x + 18},${y + 10}`} fill={c} />
      <rect x={x + 7} y={y + 3} width={4} height={4} fill={shade(c, -0.2)} />
    </g>
  )
}

// ---------------- หน้า ----------------
function Face({ h, expr, acc, skin, look }) {
  const { x, y, w, h: hh } = h
  const s = w / 56
  const cx = x + w / 2
  const ey = y + hh * 0.52
  const ex = w * 0.2
  const ink = '#2a1f2d'
  const eyes = []
  const drawEye = (type, px, k) => {
    switch (type) {
      case 'happy':
        return <polyline key={k} points={`${px - 4 * s},${ey + 2} ${px},${ey - 3 * s} ${px + 4 * s},${ey + 2}`} fill="none" stroke={ink} strokeWidth={2.6 * s} strokeLinecap="round" strokeLinejoin="round" />
      case 'sparkle':
        return (
          <g key={k}>
            <rect x={px - 4.5 * s} y={ey - 6 * s} width={9 * s} height={11 * s} rx={1.5} fill={ink} />
            <rect x={px - 3 * s} y={ey - 4.5 * s} width={3.5 * s} height={3.5 * s} fill="#fff" />
            <rect x={px + 1 * s} y={ey + 1 * s} width={2 * s} height={2 * s} fill="#fff" />
          </g>
        )
      case 'sleepy':
        return <rect key={k} x={px - 4.5 * s} y={ey - 1} width={9 * s} height={3 * s} rx={1} fill={ink} />
      default:
        return (
          <g key={k}>
            <rect x={px - 3.5 * s} y={ey - 5 * s} width={7 * s} height={9 * s} rx={1.2} fill={ink} />
            <rect x={px - 2 * s} y={ey - 3.5 * s} width={2.5 * s} height={2.5 * s} fill="#fff" />
          </g>
        )
    }
  }
  if (expr.eyes === 'wink') {
    eyes.push(drawEye('dot', cx - ex, 'el'), drawEye('happy', cx + ex, 'er'))
  } else {
    eyes.push(drawEye(expr.eyes, cx - ex, 'el'), drawEye(expr.eyes, cx + ex, 'er'))
  }

  const my = y + hh * 0.76
  let mouth
  switch (expr.mouth) {
    case 'grin':
      mouth = (
        <g>
          <path d={`M${cx - 7 * s},${my - 2} h${14 * s} v${2 * s} q0,${6 * s} ${-7 * s},${6 * s} q${-7 * s},0 ${-7 * s},${-6 * s}z`} fill="#7a2235" />
          <rect x={cx - 6 * s} y={my - 2} width={12 * s} height={2.6 * s} fill="#fff" />
        </g>
      )
      break
    case 'o':
      mouth = <rect x={cx - 3 * s} y={my - 3 * s} width={6 * s} height={6 * s} rx={2} fill="#7a2235" />
      break
    case 'cat':
      mouth = <path d={`M${cx - 6 * s},${my - 2} q${3 * s},${4 * s} ${6 * s},0 q${3 * s},${4 * s} ${6 * s},0`} fill="none" stroke={ink} strokeWidth={2 * s} strokeLinecap="round" />
      break
    case 'smirk':
      mouth = <path d={`M${cx - 5 * s},${my} q${6 * s},${2 * s} ${10 * s},${-3 * s}`} fill="none" stroke={ink} strokeWidth={2.2 * s} strokeLinecap="round" />
      break
    case 'tongue':
      mouth = (
        <g>
          <path d={`M${cx - 6 * s},${my - 2} q${6 * s},${6 * s} ${12 * s},0`} fill="none" stroke={ink} strokeWidth={2 * s} strokeLinecap="round" />
          <rect x={cx + 0.5 * s} y={my + 0.5 * s} width={5 * s} height={5 * s} rx={2} fill="#ff6b81" />
        </g>
      )
      break
    default:
      mouth = <path d={`M${cx - 6 * s},${my - 2} q${6 * s},${6 * s} ${12 * s},0`} fill="none" stroke={ink} strokeWidth={2.2 * s} strokeLinecap="round" />
  }

  const blush = acc === 'blush' || look === 'baby' || expr.id === 'grin' || expr.id === 'wink'
  return (
    <g>
      <g className="av-eyes">{eyes}</g>
      {blush && (
        <g fill="#ff8fa3" opacity="0.55">
          <rect x={cx - ex - 9 * s} y={ey + 6 * s} width={8 * s} height={4 * s} rx={2} />
          <rect x={cx + ex + 1 * s} y={ey + 6 * s} width={8 * s} height={4 * s} rx={2} />
        </g>
      )}
      {acc === 'freckles' && (
        <g fill={shade(skin, -0.35)}>
          {[-9, -6, -8, 6, 9, 7].map((dx, i) => (
            <rect key={i} x={cx + dx * s + (dx > 0 ? ex - 4 : -ex + 2)} y={ey + (6 + (i % 3) * 2) * s} width={1.8 * s} height={1.8 * s} />
          ))}
        </g>
      )}
      {acc === 'mole' && <rect x={cx + ex + 4 * s} y={my - 3 * s} width={2.2 * s} height={2.2 * s} fill={ink} />}
      {acc === 'bandaid' && (
        <g transform={`rotate(-15 ${cx - ex - 4 * s} ${ey + 9 * s})`}>
          <rect x={cx - ex - 10 * s} y={ey + 7 * s} width={12 * s} height={5 * s} rx={1.5} fill="#f2c18d" stroke="#c99a66" strokeWidth="0.8" />
        </g>
      )}
      {acc === 'glasses' && look !== 'baby' && (
        <g fill="none" stroke="#1d1d26" strokeWidth={2 * s}>
          <rect x={cx - ex - 7 * s} y={ey - 7 * s} width={14 * s} height={12 * s} rx={2} fill="rgba(255,255,255,0.18)" />
          <rect x={cx + ex - 7 * s} y={ey - 7 * s} width={14 * s} height={12 * s} rx={2} fill="rgba(255,255,255,0.18)" />
          <line x1={cx - ex + 7 * s} y1={ey - 2 * s} x2={cx + ex - 7 * s} y2={ey - 2 * s} />
        </g>
      )}
      {mouth}
    </g>
  )
}

// ---------------- ตัวละคร ----------------
export function avatarGeometry(look) {
  const b = BODY[look] ?? BODY.work
  const legTop = G - b.leg[1]
  const torsoTop = legTop + 2 - b.torso[1]
  const headTop = torsoTop + 2 - b.head[1]
  return { b, legTop, torsoTop, headTop }
}

export default function Avatar({ gender, look, presetIndex, expression, pose, variant = 0, name, className = '' }) {
  const p = getPreset(gender, presetIndex)
  const expr = EXPRESSIONS.find((e) => e.id === expression) ?? EXPRESSIONS[0]
  const { b, legTop, torsoTop, headTop } = avatarGeometry(look)
  const o = outfitFor(look, gender, p, variant)
  const hairColor = look === 'senior' ? '#d9d9e0' : p.hairColor
  const skin = p.skin
  const [tw, th] = b.torso
  const [lw, lh] = b.leg
  const [aw, ah] = b.arm
  const [hw, hh] = b.head
  const gap = look === 'baby' ? 4 : 5
  const head = { x: CX - hw / 2, y: headTop, w: hw, h: hh }
  const hair = hairParts(p.hair, head, hairColor, { look, gender, fav: p.fav, torsoH: th })

  // ---- ขา ----
  const shoeH = look === 'baby' ? 5 : 8
  const legs = [CX - gap / 2 - lw, CX + gap / 2].map((lx, i) => {
    const parts = []
    const legBodyH = lh - shoeH
    if (o.bottom === 'full' && o.pants) {
      parts.push(<Box key="p" x={lx} y={legTop} w={lw} h={legBodyH + 1} c={o.pants} d={5} />)
    } else {
      parts.push(<Box key="s" x={lx} y={legTop} w={lw} h={legBodyH + 1} c={skin} d={5} />)
      if (o.pants) parts.push(<Box key="sh" x={lx - 1} y={legTop} w={lw + 2} h={legBodyH * 0.42} c={o.pants} d={5} />)
      if (o.socks) parts.push(<Flat key="so" x={lx} y={G - shoeH - legBodyH * 0.22} w={lw} h={legBodyH * 0.22 + 1} c={o.socks} />)
    }
    parts.push(<Box key="shoe" x={lx - 1} y={G - shoeH} w={lw + (i ? 3 : 2)} h={shoeH} c={o.shoes} d={5} />)
    return <g key={i}>{parts}</g>
  })

  // ---- กระโปรง ----
  let skirt = null
  if (o.skirt) {
    const sh = o.bottom === 'skirt' ? lh * 0.62 : lh * 0.5
    skirt = (
      <g>
        <Box x={CX - tw / 2 - 2} y={legTop - 4} w={tw + 4} h={sh} c={o.skirt} />
        {o.extras.includes('pleats') && [1, 2, 3, 4].map((i) => <line key={i} x1={CX - tw / 2 - 2 + (i * (tw + 4)) / 5} y1={legTop} x2={CX - tw / 2 - 2 + (i * (tw + 4)) / 5} y2={legTop - 4 + sh} stroke={shade(o.skirt, -0.35)} strokeWidth="1.2" />)}
      </g>
    )
  }

  // ---- ลำตัว ----
  const tx = CX - tw / 2
  const ex = o.extras.filter(Boolean)
  const torsoParts = [<Box key="t" x={tx} y={torsoTop} w={tw} h={th} c={o.shirt} />]
  if (ex.includes('blazer') || ex.includes('cardigan')) {
    torsoParts.push(<polygon key="v" points={`${CX - tw * 0.2},${torsoTop} ${CX + tw * 0.2},${torsoTop} ${CX},${torsoTop + th * 0.55}`} fill={o.inner} stroke={shade(o.inner, -0.4)} strokeWidth="1" />)
    torsoParts.push(<line key="bl" x1={CX} y1={torsoTop + th * 0.55} x2={CX} y2={torsoTop + th} stroke={shade(o.shirt, -0.45)} strokeWidth="1.5" />)
    ;[0.68, 0.84].forEach((f, i) => torsoParts.push(<rect key={'bt' + i} x={CX - 2} y={torsoTop + th * f} width={4} height={4} rx={1} fill={shade(o.shirt, 0.35)} />))
  }
  if (ex.includes('collar')) {
    torsoParts.push(<polygon key="cl" points={`${CX - tw * 0.28},${torsoTop} ${CX},${torsoTop} ${CX - tw * 0.08},${torsoTop + 9}`} fill={look === 'kinder' ? '#fff' : shade(o.shirt, -0.06)} stroke="#9aa0b5" strokeWidth="1" />)
    torsoParts.push(<polygon key="cr" points={`${CX + tw * 0.28},${torsoTop} ${CX},${torsoTop} ${CX + tw * 0.08},${torsoTop + 9}`} fill={look === 'kinder' ? '#fff' : shade(o.shirt, -0.06)} stroke="#9aa0b5" strokeWidth="1" />)
  }
  if (ex.includes('tie')) {
    const tc = look === 'uni' ? '#2a3f8f' : shade(p.fav, -0.1)
    torsoParts.push(<polygon key="tie" points={`${CX - 3},${torsoTop + 3} ${CX + 3},${torsoTop + 3} ${CX + 5},${torsoTop + th * 0.55} ${CX},${torsoTop + th * 0.65} ${CX - 5},${torsoTop + th * 0.55}`} fill={tc} stroke={shade(tc, -0.4)} strokeWidth="1" />)
  }
  if (ex.includes('sailorTie')) {
    torsoParts.push(<polygon key="st" points={`${CX - 10},${torsoTop} ${CX + 10},${torsoTop} ${CX},${torsoTop + 12}`} fill="#24315e" />)
    torsoParts.push(<rect key="st2" x={CX - 3} y={torsoTop + 8} width={6} height={14} fill="#24315e" />)
  }
  if (ex.includes('bowTie')) torsoParts.push(<Bow key="bt" x={CX - 9} y={torsoTop + 1} c="#3a5bd9" />)
  if (ex.includes('belt') || ex.includes('goldBelt')) {
    torsoParts.push(<rect key="belt" x={tx} y={torsoTop + th - 6} width={tw} height={5} fill="#1d1d24" />)
    torsoParts.push(<rect key="buckle" x={CX - 4} y={torsoTop + th - 7} width={8} height={7} rx={1} fill={ex.includes('goldBelt') ? '#f2c94c' : '#9aa0a6'} />)
  }
  if (ex.includes('nameTag')) torsoParts.push(<rect key="nt" x={CX + tw * 0.12} y={torsoTop + th * 0.32} width={tw * 0.28} height={3} fill="#3a5bd9" />)
  if (ex.includes('pin')) torsoParts.push(<circle key="pin" cx={CX + tw * 0.26} cy={torsoTop + th * 0.3} r={3} fill="#f2c94c" stroke="#a4801f" />)
  if (ex.includes('badge')) torsoParts.push(<rect key="bd" x={CX + tw * 0.08} y={torsoTop + th * 0.38} width={tw * 0.3} height={9} rx={2} fill="#ffe066" stroke="#c9a227" />)
  if (ex.includes('straps')) {
    torsoParts.push(<rect key="s1" x={tx + tw * 0.14} y={torsoTop} width={5} height={th - 4} fill="#d9480f" opacity="0.9" />)
    torsoParts.push(<rect key="s2" x={tx + tw * 0.86 - 5} y={torsoTop} width={5} height={th - 4} fill="#d9480f" opacity="0.9" />)
  }
  if (ex.includes('lanyard')) {
    torsoParts.push(<polyline key="ly" points={`${CX - 9},${torsoTop} ${CX},${torsoTop + th * 0.5} ${CX + 9},${torsoTop}`} fill="none" stroke="#e03131" strokeWidth="2" />)
    torsoParts.push(<rect key="id" x={CX - 6} y={torsoTop + th * 0.48} width={12} height={15} rx={1.5} fill="#fff" stroke="#adb5bd" />)
    torsoParts.push(<rect key="idp" x={CX - 3} y={torsoTop + th * 0.48 + 3} width={6} height={5} fill={shade(p.fav, 0.3)} />)
  }
  if (ex.includes('bib')) torsoParts.push(<rect key="bib" x={CX - tw * 0.3} y={torsoTop + 1} width={tw * 0.6} height={th * 0.6} rx={6} fill="#fff" stroke="#e1d5e7" />)

  // ---- แขน ----
  const [angL, angR] = POSE_ANGLES[pose] ?? POSE_ANGLES.idle
  const sleeveLen = o.sleeve === 'long' ? ah - 8 : ah * 0.38
  const sleeveColor = o.shirt
  const arm = (side) => {
    const ax = side < 0 ? tx - aw : tx + tw
    const sx = side < 0 ? tx : tx + tw
    const sy = torsoTop + 4
    const angle = side < 0 ? angL : angR
    const animClass = side > 0 && pose === 'wave' ? 'av-wave' : pose === 'idle' ? (side < 0 ? 'av-swing-l' : 'av-swing-r') : ''
    return (
      <g key={side} transform={`rotate(${angle} ${sx} ${sy})`}>
        <g className={animClass} style={{ transformOrigin: `${sx}px ${sy}px` }}>
          <Box x={ax} y={torsoTop + 2} w={aw} h={ah} c={skin} d={5} />
          <Box x={ax} y={torsoTop + 2} w={aw} h={sleeveLen} c={sleeveColor} d={5} />
          {pose === 'point' && side > 0 && <Box x={ax + aw / 2 - 2} y={torsoTop + ah} w={4} h={8} c={skin} d={3} />}
        </g>
      </g>
    )
  }

  // ---- จุกนม ----
  const pacifier = ex.includes('pacifier') && (
    <g>
      <circle cx={CX} cy={head.y + hh * 0.78} r={6} fill="#ff9ebb" stroke="#d6608a" />
      <rect x={CX - 2} y={head.y + hh * 0.78 - 2} width={4} height={4} fill="#fff" />
    </g>
  )
  const accFront = p.acc === 'clip' && look !== 'baby'
    ? <polygon points={star(head.x + hw - 12, head.y + 6, 6)} fill="#ffd43b" stroke="#c99a00" />
    : p.acc === 'bow' && look !== 'baby' && p.hair !== 'twintails'
      ? <Bow x={head.x + hw - 18} y={head.y - 12} c={p.fav} />
      : null

  return (
    <svg className={`avatar ${className}`} viewBox="0 0 220 280" role="img" aria-label={`ตัวละครของ ${name || 'ผู้เล่น'}`}>
      <ellipse cx={CX + 4} cy={G + 4} rx={tw * 0.75 + 6} ry={7} fill="rgba(20,10,40,0.22)" />
      <g className="av-body">
        {hair.back}
        {arm(-1)}
        {legs}
        {skirt}
        {torsoParts}
        {arm(1)}
        <Box x={head.x} y={head.y} w={hw} h={hh} c={skin} />
        <Face h={head} expr={expr} acc={p.acc} skin={skin} look={look} />
        {hair.front}
        {accFront}
        {pacifier}
      </g>
    </svg>
  )
}

function star(cx, cy, r) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r
    const a = (Math.PI / 5) * i - Math.PI / 2
    pts.push(`${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`)
  }
  return pts.join(' ')
}
