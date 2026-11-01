// /r/:id → หน้าเว็บปกติ แต่ใส่หัวข้อ/คำอธิบายของผู้เล่นคนนั้น เพื่อให้พรีวิวลิงก์ใน LINE/Facebook สวย
import { db, isId } from './_lib/db.js'
import { TIERS } from '../src/data/tiers.js'

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

export async function GET(request) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  const fallback = Response.redirect(new URL(isId(id) ? `/?r=${id}` : '/', url.origin), 302)
  if (!isId(id)) return fallback
  try {
    const [rows, page] = await Promise.all([
      db()`select name, age, total, tier from players where id = ${id} and not hidden`,
      fetch(new URL('/index.html', url.origin)).then((r) => (r.ok ? r.text() : null)),
    ])
    if (!rows.length || !page) return fallback
    const p = rows[0]
    const tier = TIERS[p.tier]
    const title = `${p.name} มีเงินไหลผ่านชีวิต ${Number(p.total).toLocaleString('th-TH')} บาท | Life Money Quest`
    const desc = `อายุ ${p.age} ปี · ระดับ "${tier.title}" ${tier.emoji} — มาลองเล่นดูว่าของคุณเท่าไหร่!`
    const meta = [
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(desc)}" />`,
      `<meta property="og:url" content="${esc(`${url.origin}/r/${id}`)}" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(desc)}" />`,
      `<meta property="og:image" content="${esc(`${url.origin}/api/og?id=${id}`)}" />`,
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="630" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:image" content="${esc(`${url.origin}/api/og?id=${id}`)}" />`,
    ].join('\n    ')
    // ลบแท็กพรีวิวของหน้าแรก (ปกเว็บ) ออกก่อน แล้วใส่ของผู้เล่นคนนี้แทน กันพรีวิวซ้ำกันสองรูป
    const html = page
      .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
      .replace(/<meta property="og:(title|description|url|image[\w:]*)"[^>]*>\s*/g, '')
      .replace(/<meta name="twitter:(title|description|card|image)"[^>]*>\s*/g, '')
      .replace('</head>', `    ${meta}\n  </head>`)
    return new Response(html, {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error('GET /r/:id', err)
    return fallback
  }
}

// บอทพรีวิวลิงก์บางตัวเช็กด้วย HEAD ก่อน
export async function HEAD(request) {
  const res = await GET(request)
  return new Response(null, { status: res.status, headers: res.headers })
}
