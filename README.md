# Mee-ERP OS

Enterprise Operating System — *One Platform. Every Business Process.*

ตัวอย่างนำเสนอ (prototype) ของ Mee-ERP OS — Platform-centric Architecture, Single Source of Truth

## Deploy บน GitHub Pages

1. สร้าง repository ใหม่บน GitHub แล้ว push ไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้นไปที่ branch `main`
2. ไปที่ **Settings › Pages** → Source: `Deploy from a branch` → Branch: `main` / `/ (root)` → Save
3. รอ 1–2 นาที แล้วเปิด `https://<username>.github.io/<repo>/`

`index.html` จะพาเข้าหน้าหลัก `Mee-ERP OS.dc.html` โดยอัตโนมัติ
ไฟล์ `.nojekyll` จำเป็นเพื่อให้ GitHub Pages ไม่กรองไฟล์ออก — อย่าลบ

## โครงสร้างไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| `index.html` | หน้า entry สำหรับ GitHub Pages |
| `Mee-ERP OS.dc.html` | Shell หลัก + เมนู + navigation ทุกโมดูล |
| `support.js` | Runtime ของ Design Component |
| `erp-kit.js` | Helper กลาง (สถาปัตยกรรม/ข้อมูล/สไตล์) |
| `<CODE>-<SUB>.dc.html` | หน้าจอระดับ L4 ของแต่ละโมดูล (เช่น `PROC-PR.dc.html`) |

## โมดูล

`PROC` · `SALE` · `INVT` · `PROD` · `SRVC` · `ACCT` · `HRMS` · `ADMS` · `ITSA`

## หมายเหตุการนำเสนอ

- ต้องเปิดผ่าน HTTP (GitHub Pages หรือ local server) — เปิดจากไฟล์ตรง ๆ (`file://`) จะโหลดโมดูลไม่ได้
- ข้อมูลบางส่วนดึงจาก Google Sheets ผ่าน Apps Script และ cache ไว้ใน localStorage ของเบราว์เซอร์
- ต้องต่ออินเทอร์เน็ตสำหรับฟอนต์และการดึงข้อมูล
