// GET /api/og?id=XXXXXXXXXX → รูป PNG 1200×630 สำหรับพรีวิวลิงก์ (LINE/Facebook/X)
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { db, fail, isId } from './_lib/db.js'
import { renderCardSvg } from './_gen/og-card.js'
import { computeResult, baht } from '../src/lib/calc.js'
import { lookForAge } from '../src/data/stages.js'
import { TIERS } from '../src/data/tiers.js'

// ใช้ path ของไฟล์ฟอนต์ (ตัวเลือก fontBuffers ของ resvg ไม่โหลดฟอนต์ให้จริง)
const FONT_FILES = ['./_fonts/Mitr_400Regular.ttf', './_fonts/Mitr_600SemiBold.ttf'].map((f) => fileURLToPath(new URL(f, import.meta.url)))
const TIER_SCENE = ['village', 'village', 'town', 'town', 'city', 'travel', 'villa', 'yacht', 'mansion', 'palace']

const tierTitle = (tier, gender) =>
  tier.title.replace('คุณหนู/คุณชาย', gender === 'f' ? 'คุณหนู' : 'คุณชาย').replace('ลูกเจ้าสัว', gender === 'f' ? 'ทายาทเจ้าสัว' : 'ลูกเจ้าสัว')

export async function GET(request) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!isId(id)) return fail(400, 'invalid id')
  try {
    const rows = await db()`select name, age, gender, look, entries, tier from players where id = ${id} and not hidden`
    if (!rows.length) return fail(404, 'not found')
    const p = rows[0]
    const r = computeResult({ age: p.age, entries: p.entries })
    const tier = TIERS[p.tier]
    const svg = renderCardSvg({
      name: p.name,
      age: p.age,
      gender: p.gender,
      look: p.look,
      total: baht(r.total),
      tierTitle: tierTitle(tier, p.gender),
      tierColor: tier.color,
      sceneId: TIER_SCENE[p.tier],
      ageLook: lookForAge(p.age),
      site: url.host,
    })
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: { fontFiles: FONT_FILES, defaultFontFamily: 'Mitr', loadSystemFonts: false },
    })
      .render()
      .asPng()
    return new Response(png, {
      headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' },
    })
  } catch (err) {
    console.error('GET /api/og', err)
    return fail(500, 'server error')
  }
}
