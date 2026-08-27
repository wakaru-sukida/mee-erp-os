# Mee-ERP OS — Architecture

เอกสารสถาปัตยกรรมสำหรับยกระดับโปรโตไทป์ (Design Component) ขึ้นสู่ระบบจริงบน .NET 10 (MAUI Blazor Hybrid + Blazor Web App)

**หลักการเลือก:** เริ่มด้วย **Monorepo** แต่ออกแบบ *module contract* ให้ **graduate เป็น Multi-Repo** ได้ในอนาคตโดยไม่ต้อง rewrite

---

## 1. โครงสร้าง Design Component (DC) — โปรโตไทป์ปัจจุบัน

```
project-root/
├─ Mee-ERP OS.dc.html      ← OS Shell: desktop, window, taskbar, theme,
│                             start menu, tab routing, live data store (db/formDraft/_sel)
├─ erp-kit.js              ← Shared kit (helper .js): Icon, card, table, btn, pill,
│                             field/form builders, fmt utils, toast bridge
├─ modules/
│  ├─ ITSA-ORG.dc.html     ← 1 ไฟล์ = 1 submodule
│  ├─ ITSA-TENT.dc.html
│  ├─ SALE-CRM.dc.html
│  ├─ PROC-VEND.dc.html
│  └─ …
├─ ARCHITECTURE.md
└─ CLAUDE.md
```

**Mount contract (Shell → module):**
```html
<dc-import name="ITSA-ORG" win="{{w}}" theme="{{T}}"
  api="{{erpApi}}" hint-size="100%,100%"></dc-import>
```

โมดูลทุกตัวรับ props ชุดเดียวกัน:
- `win` — หน้าต่างปัจจุบัน (id/geometry)
- `theme` — theme token object (T)
- `api` — callback bundle: `toast`, `dbRows`, `dbAdd`, `dbUpdate`, `guardNav`, `openTab`

**กติกา:** โมดูลห้ามแตะ state ของ Shell ตรงๆ — สื่อสารผ่าน `api` เท่านั้น → ย้ายไฟล์ไป repo ไหนก็ได้

> สถานะปัจจุบัน: ยังเป็นไฟล์เดียว (`Mee-ERP OS.dc.html`). แผนแยกไฟล์: เริ่มจาก `erp-kit.js` → `ITSA-ORG.dc.html` เป็น proof-of-concept → ทยอยแยกที่เหลือ

---

## 2. โครงสร้าง .NET — อิง template "MAUI Blazor Web App" (.NET 10), Monorepo, graduate-ready

ยึดตาม 4 โปรเจกต์มาตรฐานของ template (Shared RCL + MAUI + Web + Web.Client) แล้ว **เสริมโปรเจกต์กลาง 2 ตัว (Contracts, Kit) + โฟลเดอร์ Modules** เพื่อรองรับการแยกโมดูลย่อยและ graduate

```
MeeErpOS/                                   ← 1 repo (Monorepo)
├─ MeeErpOS.slnx
└─ MeeErpOS/
   ├─ Directory.Packages.props              ← Central Package Management (เวอร์ชันรวมศูนย์)
   │
   ├─ MeeErpOS.Shared/                      ← [1] RCL หลักของ template (host-neutral UI)
   │   ├─ Layout/  (MainLayout, NavMenu)    ←     = OS Shell: desktop/taskbar/theme/start menu
   │   ├─ Pages/   (Home, …)
   │   ├─ Shell/   (WindowManager, TabHost, StartMenu, ThemeProvider)  ← ย้ายแกน OS มาที่นี่
   │   ├─ Services/ (IFormFactor, IModuleHost, IThemeService, IDataStore, INavService)
   │   ├─ Routes.razor · _Imports.razor · wwwroot/
   │
   ├─ MeeErpOS.Contracts/                    ← [+] ⭐ interface กลาง — หัวใจของการ graduate
   │   └─ IModule.cs · IModuleHost.cs · IAuthContext.cs · Feature.cs
   │
   ├─ MeeErpOS.Kit/                          ← [+] RCL: UI kit ใช้ร่วม (Table, Card, Button,
   │   └─ Components/ · Forms/ · Theme/            Pill, FormBuilder) = erp-kit.js
   │
   ├─ Modules/                               ← [+] โมดูลย่อย (1 โปรเจกต์ = 1 submodule)
   │   ├─ MeeErpOS.ITSA.ORG/                 ←     RCL: implements IModule, อ้าง Contracts+Kit เท่านั้น
   │   │   ├─ OrgModule.cs  (: IModule)
   │   │   └─ Screens/  (CompanyList, CompanyDetail, OrgChart …)  ← L4
   │   ├─ MeeErpOS.SALE.CRM/
   │   └─ …
   │
   ├─ MeeErpOS.Maui/                         ← [2] MAUI (เนทีฟ) — host BlazorWebView
   │   ├─ App.xaml · MainPage.xaml · MauiProgram.cs (DI + ModuleLoader)
   │   ├─ Services/FormFactor.cs  ("Native")
   │   ├─ Platforms/ · Resources/ · wwwroot/index.html
   │
   ├─ MeeErpOS.Web/                          ← [3] ASP.NET Core host (Blazor Web App)
   │   ├─ Program.cs (pipeline + render modes + ModuleLoader)
   │   ├─ Components/App.razor · Pages/Error.razor
   │   └─ Services/FormFactor.cs  ("Web")
   │
   └─ MeeErpOS.Web.Client/                   ← [4] Blazor WASM client
       ├─ Program.cs (bootstrap WASM + DI)
       └─ Services/FormFactor.cs  ("WebAssembly")
```

**การอ้างอิง (reference graph):**
- `Maui` / `Web` / `Web.Client` → อ้าง `Shared` (ตาม template เดิม) + ทำหน้าที่ **composition root** (ลงทะเบียนโมดูลผ่าน DI)
- `Shared` → อ้าง `Contracts` + `Kit`
- `Modules/*` → อ้าง **`Contracts` + `Kit` เท่านั้น** (ห้ามอ้าง Shared/host/โมดูลอื่น) ← กติกาที่ทำให้ graduate ได้
- โมดูลถูกค้นพบ/โหลดผ่าน `IModule` (DI ตอน build หรือ `AssemblyLoadContext` ตอน runtime สำหรับ plugin)

**Contract กลาง (`MeeErpOS.Contracts`):**
```csharp
public interface IModule {
    string Code { get; }                      // "ITSA-ORG"
    string TitleTh { get; }
    IEnumerable<Feature> Features { get; }     // L3 Business Process/Feature
    Type GetScreen(string featureId);          // L4 Screen component
}

public interface IModuleHost {                 // Shell ส่งให้โมดูล
    IAuthContext Auth { get; }                 // token/session — ไม่ส่ง user/pass
    INavService  Nav { get; }
    IThemeService Theme { get; }
    IDataStore   Data { get; }
}
```

---

## 3. กติกาที่ทำให้ graduate เป็น Multi-Repo ได้ (ทำตั้งแต่วันแรก)

1. โมดูลอ้างอิง **`MeeErpOS.Contracts` + `MeeErpOS.Shared` เท่านั้น** — ห้ามอ้างโมดูลอื่นหรือ Shell ตรงๆ
2. สื่อสารผ่าน **interface + DI** ล้วน (loose coupling)
3. แต่ละโมดูลมี `.csproj` + test ของตัวเอง
4. ใช้ `Directory.Packages.props` คุมเวอร์ชันจุดเดียว

**graduate → Multi-Repo:** ย้ายโฟลเดอร์โมดูลออก repo + เปลี่ยน `<ProjectReference>` → `<PackageReference>` (NuGet) — logic ไม่แตะ เพราะผูกผ่าน Contracts อยู่แล้ว (งาน DevOps ไม่กี่วัน ไม่ใช่ rewrite)

---

## 4. Deployment ต่อแพลตฟอร์ม

| แพลตฟอร์ม | แยก deploy โมดูลย่อย? | วิธี |
|---|---|---|
| **Blazor Web App** | ✅ ได้จริง | โหลด assembly/โมดูล runtime จากเซิร์ฟเวอร์ |
| **MAUI desktop (.exe/.msix)** | ⚠️ เสมือนได้ | Plugin folder + dynamic assembly loading (`AssemblyLoadContext`) — **ต้องวางโครง IModule แต่เนิ่นๆ** / หรือ server-driven |
| **MAUI mobile (.aab/.ipa)** | ❌ ไม่ได้ | store bundle ก้อนเดียว — เสมือนได้เฉพาะ server-driven (โมดูลโหลดจากเว็บผ่าน BlazorWebView) |

**หลักสำคัญ:** ความสามารถแยก deploy ขึ้นกับ **แพลตฟอร์ม** ไม่ใช่ repo strategy — Multi-Repo แยกที่ "การพัฒนา/เผยแพร่ package" แต่จุด composition (Shell) ยังประกอบทุกโมดูลกลับเป็น Mee-ERP OS เดียว

**Auth ข้ามโปรเซส (ถ้าใช้ plugin/multi-process):** ใช้ **token/IPC (named pipe, stdin, credential store)** — ห้ามส่ง user/pass ผ่าน command-line argument (รั่วใน Task Manager/logs). แนะนำ single-process + plugin loading มากกว่า multi-.exe เว้นแต่ต้องการ process isolation จริง

---

## 5. Mapping DC ↔ .NET

| Design Component | .NET (MAUI Blazor Web App template) |
|---|---|
| `erp-kit.js` | `MeeErpOS.Kit` (RCL) |
| `dc-import props` (`api`/`theme`/`win`) | `IModuleHost` (Contracts) |
| `ITSA-ORG.dc.html` | `Modules/MeeErpOS.ITSA.ORG` (RCL, implements `IModule`) |
| `Mee-ERP OS.dc.html` (Shell) | `MeeErpOS.Shared/Shell/*` (host-neutral) |
| host (browser desktop/mobile) | `MeeErpOS.Maui` / `.Web` / `.Web.Client` (composition root) |
| Live data store (db/formDraft) | `IDataStore` service (DI) |
| theme token (T) | `IThemeService` |
