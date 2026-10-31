# Life Money Quest 💸

เกมเว็บคำนวณ "เงินที่ไหลผ่านชีวิต" ตั้งแต่อนุบาลจนถึงอายุปัจจุบัน พร้อมตัวละครบล็อกที่โตขึ้นตามวัย จัดระดับฐานะ 10 ขั้น และแชร์ผลให้เพื่อนดูผ่านลิงก์

## รันในเครื่อง

```bash
npm install
npm run dev        # http://localhost:5173  (ดูตัวละครทั้งหมดที่ /#gallery — เฉพาะโหมด dev)
npm run build
npm run preview    # ทดสอบ build จริง พร้อม security headers ชุดเดียวกับ vercel.json
```

## Deploy (Vercel)

Import repo นี้ใน Vercel — ตั้งค่าไว้ใน `vercel.json` แล้ว (Vite, `npm run build`, output `dist`) ไม่ต้องใช้ environment variable ใดๆ

## ความเป็นส่วนตัว / ความปลอดภัย

- ไม่มี backend และไม่มีฐานข้อมูล ข้อมูลผู้เล่นอยู่ในเบราว์เซอร์เท่านั้น
- ลิงก์แชร์เก็บข้อมูลไว้หลัง `#` ซึ่งเบราว์เซอร์ไม่ส่งไปที่เซิร์ฟเวอร์ (ไม่ติด log ของ Vercel)
- ข้อมูลจากลิงก์ถูกตรวจและกรองทุกช่องใน `src/lib/share.js` ก่อนใช้งาน
- Security headers (CSP, X-Frame-Options, nosniff ฯลฯ) ตั้งใน `vercel.json`
