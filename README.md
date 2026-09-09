# ชุดอัปเดต — ผู้ให้บริการ AI หลายเจ้า + ศูนย์ AI ต่อฐานข้อมูล
อัปโหลดไฟล์ทั้ง 8 ไฟล์นี้ทับของเดิมที่ repo `wakaru-sukida/mee-erp-os` (branch main) ที่ root เดียวกัน

| ไฟล์ | สิ่งที่เปลี่ยน |
|---|---|
| mee-ai.js | adapter 3 แบบ (Anthropic · OpenAI-compatible · Gemini), pingVendor, ดึงผู้ให้บริการหลักจากฐานข้อมูลอัตโนมัติ (?v=9) |
| mee-ai-appsscript.gs | Relay รองรับหลายผู้ให้บริการ (ต้อง Deploy › New version ที่ Apps Script) |
| Mee-ERP OS.dc.html | ชื่อระบบ Mee-ERP OS ทุกจุด, ป้ายผู้ให้บริการจริง, แก้สกรอลล์กล่องแชต |
| ITSA-AIEN.dc.html | GUI ตั้งค่า API Key รายผู้ให้บริการ (เชื่อมต่อด่วน / ขั้นสูง / ข้อมูล) + บันทึกลงชีต |
| AI Center.dc.html | ดึง insight · automation · activity จากฐานข้อมูล, KPI คำนวณจริง |
| INVT-ITEM · PROC-PO · PROC-PR | อัปเดตเวอร์ชัน mee-ai.js เป็น ?v=9 |

## ขั้นตอน
1. อัปโหลดไฟล์ทั้งหมด (Add file › Upload files › Commit)
2. เปิดโปรเจกต์ Apps Script → วาง mee-ai-appsscript.gs → Deploy › Manage deployments › New version
3. เปิดเว็บแล้ว hard refresh (Ctrl+Shift+R)

## ตารางในฐานข้อมูล (สร้างแล้ว)
itsa-aien-provider · ai-center-insight · ai-center-automation · ai-center-activity
