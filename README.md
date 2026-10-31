# Life Money Quest 💸

เกมเว็บคำนวณ "เงินที่ไหลผ่านชีวิต" ตั้งแต่อนุบาลจนถึงอายุปัจจุบัน พร้อมตัวละครบล็อกที่โตขึ้นตามวัย (เพศละ 30 แบบ) จัดระดับฐานะ 10 ขั้น ลีดเดอร์บอร์ด และการ์ดสรุปผลที่แชร์/ดาวน์โหลดได้

เว็บจริง: https://lifemoneyquest.vercel.app

## รันในเครื่อง

```bash
npm install
cp .env.example .env.local   # ใส่ DATABASE_URL (Neon) และ IP_HASH_SALT
npm run db:migrate           # สร้างตาราง players (รันซ้ำได้ ไม่ลบข้อมูล)
npm run dev                  # http://localhost:5173  (API /api/* รันในตัว, ดูตัวละครทั้งหมดที่ /#gallery)
npm run build && npm run preview   # ทดสอบ build จริง + security headers + API แบบ Node ล้วน
```

## Deploy (Vercel)

1. Project Settings → Environment Variables เพิ่ม `DATABASE_URL` และ `IP_HASH_SALT` (ค่าสุ่มยาวๆ)
2. Push ขึ้น GitHub — Vercel build ด้วย `vercel.json` (Vite + ฟังก์ชันในโฟลเดอร์ `api/`)

## โครงสร้าง

| ส่วน | ไฟล์ |
| --- | --- |
| API (Vercel Functions) | `api/player.js` (บันทึก/อ่านผล), `api/leaderboard.js`, `api/share-page.js` (ลิงก์ `/r/:id` พร้อมพรีวิว) |
| ตรวจข้อมูล/คำนวณ (ใช้ร่วมเว็บ+API) | `src/lib/record.js`, `src/lib/calc.js` |
| ตัวละคร / ฉาก | `src/components/Avatar.jsx`, `src/components/Scene.jsx`, `src/data/avatars.js` |
| ประวัติเวอร์ชัน | `src/data/versions.js` (เพิ่มรายการใหม่ทุกครั้งที่อัปเดตใหญ่) |
| สร้างตาราง | `scripts/migrate.mjs` |

## ความปลอดภัย / ความเป็นส่วนตัว

- ค่าลับอยู่ใน `.env.local` (ไม่ขึ้น git) และ Environment Variables ของ Vercel เท่านั้น ไม่ถูกส่งเข้าเว็บ
- API ใช้ SQL แบบ parameterized ทั้งหมด, ตรวจ/กรองข้อมูลทุกช่องด้วย `fromRecord`, คำนวณยอดและระดับใหม่ที่เซิร์ฟเวอร์ (โกงตัวเลขจากเครื่องไม่ได้)
- จำกัด 10 ครั้ง / 10 นาที ต่อ IP — เก็บเฉพาะค่าแฮชของ IP ไม่เก็บ IP จริง
- ผู้เล่นเลือกได้ว่าจะขึ้นลีดเดอร์บอร์ดหรือไม่ (ไม่ขึ้น = เห็นได้เฉพาะคนมีลิงก์ ซึ่ง id สุ่ม 10 ตัวอักษร)
- หน้า `/r/:id` escape ชื่อผู้เล่นก่อนใส่ใน HTML
- Security headers (CSP, X-Frame-Options, nosniff ฯลฯ) ตั้งใน `vercel.json`
