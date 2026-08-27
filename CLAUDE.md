# Mee-ERP OS

**ชื่อระบบ:** Mee-ERP OS (ใช้ชื่อนี้เสมอ)
Enterprise Operating System — "One Platform. Every Business Process."

**Vision:**
Mee-ERP OS คือระบบปฏิบัติการสำหรับองค์กร ที่รวมข้อมูลและกระบวนการทำงานไว้บนแพลตฟอร์มเดียว เพื่อให้องค์กรบริหารงานได้อย่างมีประสิทธิภาพ โปร่งใส และขยายธุรกิจได้อย่างยั่งยืน

แนวคิด: **Platform-centric Architecture** (ไม่ใช่ Module-centric) — Single Platform + Single Source of Truth

---

## สถาปัตยกรรม 3 องค์ประกอบหลัก

1. **Mee-ERP OS Core (Platform / OS Core)** — ชุด Engine ขับเคลื่อนระบบ ไม่มีหน้าจอให้ผู้ใช้โดยตรง
   Identity & Security · Workflow · Business Rule · Notification · Document · Report · Dashboard · Search · API Gateway · Integration · Automation · AI · Logging · Scheduler Engine
2. **Application Modules** — โมดูลที่ผู้ใช้ใช้งานจริง (9 โมดูลหลัก) ทุกโมดูลเรียกใช้ Engine เดียวกัน
   PROC · SALE · INVT · PROD · SRVC · ACCT · HRMS · ADMS · ITSA
   *(ITSA = Application Module สำหรับผู้ดูแลระบบ ไม่ใช่ OS Core)*
3. **Shared Services** — ทรัพยากร/บริการกลางที่ทุกโมดูลใช้ร่วมกัน
   Master Data · Numbering · File Storage · Attachment · Audit Trail · Activity Timeline · Comment · Localization · Currency · Calendar · Unit of Measure · Tax Master

---

## Architecture Standard v1.0 — ลำดับชั้น 6 ระดับ (กฎกลาง ใช้ทุกโมดูล)

| Level | Name | รายละเอียด | การตั้งชื่อ | ตัวอย่าง |
|---|---|---|---|---|
| L0 | Platform | แพลตฟอร์ม Mee-ERP OS | Product Name | Mee-ERP OS |
| L1 | Main Module | โมดูลหลัก | Code + Name | SALE – Sales Management System |
| L2 | Submodule | กลุ่มงานในโมดูล แบ่งเป็น 3 ประเภท | Noun | Sales Order, Work Order |
| L3 | Business Process / Business Feature | กระบวนการทำงาน/ฟีเจอร์ทางธุรกิจ | Business Process | Lead Management, Work Order Management |
| L4 | Screen (UI) | หน้าจอที่ผู้ใช้โต้ตอบกับระบบ | Screen Name | Lead List, Lead Detail, Lead Dashboard |
| L5 | Action (Operation) | คำสั่ง/การดำเนินการบนหน้าจอ | Verb | Create, Save, Convert, Import, Export |

```
L0 Platform (Mee-ERP OS)
 └── L1 Main Module (SALE, PROC, INVT, PROD, SRVC, ACCT, HRMS, ADMS, ITSA)
      └── L2 Submodule  (Core Functions / Extensions / Reports & Analytics)
           └── L3 Business Process / Business Feature   เช่น Lead Management
                └── L4 Screen (UI)                      เช่น Lead List · Lead Detail · Lead Dashboard
                     └── L5 Action (Operation)          เช่น Create · Save · Convert · Import · Export
```

ตัวอย่าง: SALE › CRM › **Lead Management** (L3 Feature) › **Lead List / Lead Detail / Lead Dashboard** (L4 UI) › **Create / Save / Convert / Import / Export** (L5 Operation)

### Module Type อยู่ที่ระดับ L2 (Submodule) — ทุก Main Module แบ่งเป็น 3 ประเภทเหมือนกัน
- **Core Functions** = ความสามารถหลักที่จำเป็นของโมดูล
- **Extensions** = ความสามารถเสริม เปิด/ปิดใช้ได้
- **Reports & Analytics** = Dashboard · Reports · Analytics · KPI

*(หมายเหตุ: Core Functions/Extensions/Reports & Analytics เป็นการจัดกลุ่ม Submodule ภายในแต่ละโมดูล ไม่ใช่การจัดประเภทของ 9 โมดูลหลักอีกต่อไป)*

---

**ไฟล์หลัก:**
- Mee-ERP OS.dc.html (ไฟล์ดีไซน์หลัก)
- support.js (ลอจิกและ helpers)
- Booking System.dc.html (ระบบจองรถ — sub-screen ตัวอย่าง)
