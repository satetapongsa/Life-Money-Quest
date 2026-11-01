// ตั้งธีม (สว่าง/มืด) ก่อนหน้าเว็บแสดงผล กันจอกระพริบ — ค่าที่ผู้เล่นเลือกเองชนะค่าของเครื่อง
;(function () {
  var pref = null
  try { pref = localStorage.getItem('lmq-theme') } catch (e) {}
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
  function apply() {
    var t = pref === 'light' || pref === 'dark' ? pref : mq && mq.matches ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', t)
  }
  apply()
  if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (!pref) apply() })
})()
