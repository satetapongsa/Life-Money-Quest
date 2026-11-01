// สร้างรูปปกเว็บสำหรับพรีวิวลิงก์หน้าแรก: npm run build:cover → public/og-cover.png (commit ไว้)
import { writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import { renderCoverSvg } from '../api/_gen/og-card.js'

const svg = renderCoverSvg({ site: 'lifemoneyquest.vercel.app' })
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: { fontFiles: ['api/_fonts/Mitr_400Regular.ttf', 'api/_fonts/Mitr_600SemiBold.ttf'], loadSystemFonts: false, defaultFontFamily: 'Mitr' },
}).render().asPng()
writeFileSync('public/og-cover.png', png)
console.log(`public/og-cover.png (${Math.round(png.length / 1024)} KB)`)
