// ช่วงอายุสำหรับกรองลีดเดอร์บอร์ด (ใช้ทั้งเว็บและ API)
export const AGE_BANDS = [
  { id: 'all', label: 'ทุกวัย', min: 0, max: 200 },
  { id: 'u20', label: 'ต่ำกว่า 20', min: 0, max: 19 },
  { id: '20s', label: '20–29', min: 20, max: 29 },
  { id: '30s', label: '30–39', min: 30, max: 39 },
  { id: '40s', label: '40–49', min: 40, max: 49 },
  { id: '50p', label: '50+', min: 50, max: 200 },
]

export const ageBand = (id) => AGE_BANDS.find((b) => b.id === id) ?? null
