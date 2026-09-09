# ชุดไฟล์สำหรับ deploy ขึ้น GitHub — 2026-09-09

อัปโหลด **22 ไฟล์นี้ทับของเดิมที่ root** ของ repo `wakaru-sukida/mee-erp-os` (branch main)
(README.md ไม่ต้องอัปโหลด)

## สิ่งที่แก้ในรอบนี้

| ไฟล์ | การแก้ไข |
|---|---|
| mee-ai.js | adapter Anthropic · OpenAI-compatible · Gemini · pingVendor · ดึงผู้ให้บริการหลักจากฐานข้อมูล · URL ฐานข้อมูลใหม่ (?v=9) |
| Mee-ERP OS.dc.html | ชื่อ Mee-ERP OS ทุกจุด · ป้ายผู้ให้บริการตามค่าจริง · แก้การเลื่อนกล่องแชต · เพิ่มไอคอน layers/sitemap/shapes/folder/ruler · URL ใหม่ |
| ITSA-AIEN.dc.html | GUI ตั้งค่า API Key รายผู้ให้บริการ (เชื่อมต่อด่วน / ขั้นสูง / ข้อมูล) · สถานะระดับระบบย้ายขึ้นหัวข้อ · URL ใหม่ |
| AI Center.dc.html | ดึงข้อมูลจริงจาก 3 ตาราง · KPI คำนวณจากแถวจริง · URL ใหม่ |
| อีก 18 ไฟล์ (ITSA-* · PROC-* · INVT-ITEM · ACCT-CURR) | เปลี่ยน URL ฐานข้อมูล Apps Script เป็น deployment ใหม่ |

## URL ฐานข้อมูลใหม่
`https://script.google.com/macros/s/AKfycbwJgoSbacCcStp2-c01q1Yb5zNjwKNHpaEMVSM07uHmiPCFZ9BHS5oAvPzFan3w4UlraQ/exec`

## Apps Script (แยกจาก GitHub)
ไฟล์ `code.gs` · `mee-ai-appsscript.gs` · `appsscript.json` อยู่ในโฟลเดอร์ `deploy-appsscript/`

## หลังอัปโหลด
รอ GitHub Pages build 1-2 นาที แล้ว hard refresh (Ctrl+Shift+R) ที่
https://wakaru-sukida.github.io/mee-erp-os/
