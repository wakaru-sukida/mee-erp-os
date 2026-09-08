// mee-ai.js — Mee-ERP OS AI Engine (OS Core layer)
// Host-neutral Claude client. Works in the design host, on GitHub Pages, and offline.
//
// Providers, tried in order of what is configured/available:
//   1. 'host'   window.claude.complete            — design-host preview only
//   2. 'proxy'  Google Apps Script web app        — for deployed builds (key stays server-side)  ← recommended
//   3. 'direct' api.anthropic.com + browser key   — demo/dev only, key is visible to the client
//
// Config is persisted in localStorage under meeerp.ai.config.v1 and can be set at runtime:
//   MeeAI.configure({ provider: 'proxy', proxyUrl: '<apps script /exec url>' })

const CFG_KEY = 'meeerp.ai.config.v1';
const DEFAULTS = { provider: 'auto', proxyUrl: '', apiKey: '', model: 'claude-sonnet-4-5', maxTokens: 1500 };

function loadCfg() {
  try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(CFG_KEY) || '{}')); }
  catch (e) { return Object.assign({}, DEFAULTS); }
}
function saveCfg(c) { try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) {} }

let cfg = loadCfg();

function hostAvailable() {
  return typeof window !== 'undefined' && window.claude && typeof window.claude.complete === 'function';
}

function resolveProvider() {
  if (cfg.provider && cfg.provider !== 'auto') return cfg.provider;
  if (hostAvailable()) return 'host';
  if (cfg.proxyUrl) return 'proxy';
  if (cfg.apiKey) return 'direct';
  return 'none';
}

// ---- provider: design host ----
async function viaHost(body) {
  const out = await window.claude.complete({
    messages: body.messages,
    system: body.system,
    model: body.model,
    max_tokens: body.max_tokens,
  });
  return String(out || '');
}

// ---- provider: Apps Script proxy ----
// text/plain avoids a CORS preflight, which Apps Script web apps do not answer.
async function viaProxy(body) {
  const r = await fetch(cfg.proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'ai', payload: body }),
  });
  if (!r.ok) throw new Error('AI proxy HTTP ' + r.status);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'AI proxy error');
  return String(j.text || '');
}

// ---- provider: direct browser call ----
async function viaDirect(body) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'Anthropic HTTP ' + r.status);
  return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
}

// ---- core ----
async function complete(input, opts) {
  opts = opts || {};
  const messages = typeof input === 'string'
    ? [{ role: 'user', content: input }]
    : (input.messages || []);
  const body = {
    model: opts.model || cfg.model,
    max_tokens: opts.maxTokens || cfg.maxTokens,
    messages,
  };
  const sys = opts.system || (typeof input === 'object' && input.system);
  if (sys) body.system = sys;

  const p = resolveProvider();
  if (p === 'none') {
    const e = new Error('AI ยังไม่ได้ตั้งค่า — กรุณาระบุ Proxy URL หรือ API Key ที่ ITSA › AI Settings');
    e.code = 'NOT_CONFIGURED';
    throw e;
  }
  if (p === 'host') return viaHost(body);
  if (p === 'proxy') return viaProxy(body);
  return viaDirect(body);
}

// JSON-shaped answers: asks for raw JSON and tolerates fenced output.
async function completeJSON(input, opts) {
  opts = Object.assign({}, opts);
  opts.system = (opts.system ? opts.system + '\n\n' : '')
    + 'ตอบกลับเป็น JSON ที่ถูกต้องอย่างเดียว ห้ามมีคำอธิบายหรือ markdown code fence.';
  const raw = await complete(input, opts);
  const s = raw.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(s); }
  catch (e) {
    const m = s.match(/[\[{][\s\S]*[\]}]/);
    if (m) { try { return JSON.parse(m[0]); } catch (e2) {} }
    throw new Error('AI ตอบกลับไม่ใช่ JSON: ' + s.slice(0, 200));
  }
}

// ---- context: modules publish what the user is looking at ----
let ctx = { module: '', screen: '', label: '', data: null };
function setContext(next) { ctx = Object.assign({}, ctx, next || {}); return ctx; }
function getContext() { return ctx; }
function ctxJSON(limit) {
  const d = ctx.data;
  if (d == null) return '(ไม่มีข้อมูลบนหน้าจอ)';
  let s2;
  try { s2 = JSON.stringify(d, null, 1); } catch (e) { s2 = String(d); }
  const cap = limit || 14000;
  return s2.length > cap ? s2.slice(0, cap) + '\n…(ตัดข้อมูลส่วนที่เหลือ)' : s2;
}

const SYS_BASE = 'คุณคือผู้ช่วย AI ในระบบ Mee-ERP OS (Enterprise Operating System ภาษาไทย) '
  + 'ตอบเป็นภาษาไทยกระชับ ตรงประเด็น อ้างเลขที่เอกสาร/รหัสสินค้าจริงจากข้อมูลที่ให้มาเสมอ '
  + 'ห้ามเดาตัวเลขที่ไม่มีในข้อมูล ถ้าข้อมูลไม่พอให้บอกว่าข้อมูลไม่พอ '
  + 'อย่าใช้ markdown heading หรือ code fence ใช้ย่อหน้าสั้นและ bullet ด้วยเครื่องหมาย · เท่านั้น';

// ---- feature tasks ----
const TASKS = {
  // 1. AI Assistant — ถามข้อมูลในระบบ
  async assistant(question, history) {
    const msgs = (history || []).slice(-8).concat([{ role: 'user', content: question }]);
    return complete({ messages: msgs }, {
      system: SYS_BASE + '\n\nผู้ใช้กำลังอยู่ที่: ' + (ctx.label || ctx.module || 'หน้าหลัก')
        + '\nข้อมูลบนหน้าจอ (JSON):\n' + ctxJSON(),
      maxTokens: 1200,
    });
  },

  // 2. Smart Fill — แปลงข้อความอิสระเป็นฟอร์ม PR/PO
  async smartFill(text, schema) {
    return completeJSON(
      'แปลงข้อความคำขอซื้อต่อไปนี้ให้เป็นข้อมูลฟอร์ม:\n\n' + text,
      {
        system: SYS_BASE + '\n\nหน้าที่: อ่านข้อความอิสระแล้วสกัดข้อมูลลงฟอร์ม '
          + 'ตอบเป็น JSON ตามโครงนี้เท่านั้น:\n' + JSON.stringify(schema || {
            dept: 'ชื่อแผนกผู้ขอ', need: 'วันที่ต้องการ YYYY-MM-DD', urgency: 'normal|urgent',
            note: 'หมายเหตุ',
            lineItems: [{ item: 'รหัส/ชื่อสินค้า', desc: 'รายละเอียด', uom: 'หน่วย', qty: 0, price: 0 }],
          }, null, 1)
          + '\nฟิลด์ที่ไม่พบให้ใส่ค่าว่าง "" หรือ 0 · ห้ามแต่งข้อมูลเพิ่ม'
          + '\n\nรายการสินค้าที่มีในระบบ (ใช้จับคู่รหัส):\n' + ctxJSON(6000),
        maxTokens: 2000,
      });
  },

  // 3. Document Insight — สรุปใบเอกสาร + ชี้ความเสี่ยง
  async docInsight(doc) {
    return completeJSON('วิเคราะห์เอกสารนี้:\n' + JSON.stringify(doc, null, 1), {
      system: SYS_BASE + '\n\nหน้าที่: สรุปเอกสารจัดซื้อ/ขาย และชี้ความเสี่ยง '
        + 'ตอบ JSON: {"summary":"สรุป 2-3 บรรทัด","risks":[{"level":"high|medium|low","title":"","detail":""}],'
        + '"checks":["สิ่งที่ควรตรวจก่อนอนุมัติ"]}'
        + '\nดูเรื่อง: ยอดรวมผิดปกติ · ราคาต่อหน่วยสูงเกิน · ข้อมูลไม่ครบ · ไม่มีผู้อนุมัติ · วันที่ย้อนหลัง · รายการซ้ำ',
      maxTokens: 1600,
    });
  },

  // 4. Vendor Advisor — เทียบผู้ขายแล้วแนะนำ
  async vendorAdvise(item, vendors) {
    return completeJSON(
      'สินค้าที่ต้องการจัดซื้อ:\n' + JSON.stringify(item, null, 1)
      + '\n\nผู้ขายที่มีในระบบ:\n' + JSON.stringify(vendors, null, 1), {
      system: SYS_BASE + '\n\nหน้าที่: เทียบผู้ขายด้วยราคา ประวัติการส่ง คุณภาพ เครดิต '
        + 'ตอบ JSON: {"recommend":{"vendor":"","reason":""},'
        + '"ranking":[{"vendor":"","price":"","score":0,"pro":"","con":""}],"negotiation":["ประเด็นที่ควรเจรจา"]}'
        + '\nscore เป็น 0-100 · เรียง ranking จากดีสุด',
      maxTokens: 1800,
    });
  },

  // 5. Dashboard Narrative — สรุปผู้บริหาร
  async dashboardNarrative(metrics, audience) {
    return complete('ตัวเลขบน Dashboard:\n' + JSON.stringify(metrics, null, 1), {
      system: SYS_BASE + '\n\nหน้าที่: เขียนสรุปผู้บริหาร (' + (audience || 'ผู้บริหารระดับสูง') + ') '
        + 'ความยาว 3 ย่อหน้าสั้น: (1) ภาพรวมและตัวเลขสำคัญ (2) สิ่งที่เปลี่ยนแปลงและสาเหตุที่เป็นไปได้ '
        + '(3) ข้อเสนอเชิงปฏิบัติ 2-3 ข้อ · ใช้ตัวเลขจริงประกอบทุกข้อสรุป',
      maxTokens: 1200,
    });
  },

  // 6. Item Enrichment — เติมข้อมูล Master สินค้า
  async itemEnrich(item, categories, uoms) {
    return completeJSON('สินค้าที่ต้องเติมข้อมูล:\n' + JSON.stringify(item, null, 1), {
      system: SYS_BASE + '\n\nหน้าที่: เติมข้อมูล Master สินค้าให้ครบและสอดคล้องกับที่มีอยู่ '
        + 'ตอบ JSON: {"nameTh":"","nameEn":"","desc":"คำอธิบาย 1-2 บรรทัด","category":"","uom":"","keywords":[""],"note":"เหตุผลที่เลือกหมวด/หน่วย"}'
        + '\nหมวดหมู่ที่ใช้ได้: ' + JSON.stringify(categories || [])
        + '\nหน่วยนับที่ใช้ได้: ' + JSON.stringify(uoms || [])
        + '\nถ้าฟิลด์เดิมมีค่าที่ถูกต้องแล้วให้คงค่าเดิม',
      maxTokens: 1200,
    });
  },
};

async function ping() {
  try {
    const t = await complete('ตอบกลับคำเดียวว่า OK', { maxTokens: 16 });
    return { ok: /ok/i.test(t), provider: resolveProvider(), text: t.trim() };
  } catch (e) {
    return { ok: false, provider: resolveProvider(), error: e.message, code: e.code };
  }
}

export const MeeAI = {
  complete,
  completeJSON,
  ping,
  tasks: TASKS,
  setContext,
  getContext,
  get config() { return Object.assign({}, cfg); },
  configure(patch) { cfg = Object.assign({}, cfg, patch || {}); saveCfg(cfg); return this.config; },
  reset() { cfg = Object.assign({}, DEFAULTS); saveCfg(cfg); return this.config; },
  get provider() { return resolveProvider(); },
  get ready() { return resolveProvider() !== 'none'; },
  hostAvailable,
};

if (typeof window !== 'undefined') window.MeeAI = MeeAI;
export default MeeAI;
