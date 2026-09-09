// mee-ai.js — Mee-ERP OS AI Engine (OS Core layer)
// Host-neutral multi-vendor client (Anthropic · OpenAI-compatible · Gemini). Works in the design host, on GitHub Pages, and offline.
//
// Providers, tried in order of what is configured/available:
//   1. 'host'   window.claude.complete            — design-host preview only
//   2. 'proxy'  Google Apps Script web app        — for deployed builds (key stays server-side)  ← recommended
//   3. 'direct' api.anthropic.com + browser key   — demo/dev only, key is visible to the client
//
// Config is persisted in localStorage under meeerp.ai.config.v1 and can be set at runtime:
//   MeeAI.configure({ provider: 'proxy', proxyUrl: '<apps script /exec url>' })

const CFG_KEY = 'meeerp.ai.config.v1';
const DEFAULTS = { provider: 'auto', proxyUrl: '', apiKey: '', model: 'claude-sonnet-4-5', maxTokens: 1500, vendor: null };

function loadCfg() {
  try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(CFG_KEY) || '{}')); }
  catch (e) { return Object.assign({}, DEFAULTS); }
}
function saveCfg(c) { try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) {} }

let cfg = loadCfg();

function hostAvailable() {
  return typeof window !== 'undefined' && window.claude && typeof window.claude.complete === 'function';
}

function vendorReady(v) { return !!(v && (v.apiKey || v.proxyUrl || v.auth === 'none')); }

// ---- bootstrap: adopt the primary provider row saved at ITSA › ผู้ให้บริการ AI ----
// ทำให้ทุกโมดูล (รวม Shell) ใช้ผู้ให้บริการหลักเดียวกัน แม้เครื่องนั้นยังไม่เคยเปิดหน้า ITSA
const PROV_SHEET = 'https://script.google.com/macros/s/AKfycbxoyL61PLDzlZNKKJcT1Wwy0UpH2f84HeXEAF12EWj4kzkLTxrOujEuRx0HjAwKSF2lRQ/exec';
const PROV_TAB = 'itsa-aien-provider';
let _bootPromise = null;

function adoptRow(r) {
  if (!r) return false;
  const v = { id: r.id, name: r.name, api: r.api, auth: r.auth, apiKey: r.apiKey, proxyUrl: r.proxyUrl, endpoint: r.endpoint || r.host, model: r.model };
  if (!vendorReady(v)) return false;
  cfg = Object.assign({}, cfg, { provider: 'vendor', vendor: v, model: v.model || cfg.model,
    apiKey: v.api === 'anthropic' ? v.apiKey : '', proxyUrl: v.api === 'anthropic' ? v.proxyUrl : '' });
  saveCfg(cfg);
  return true;
}

function bootstrapVendor() {
  if (_bootPromise) return _bootPromise;
  _bootPromise = (async () => {
    try {
      const res = await fetch(PROV_SHEET + '?tab=' + encodeURIComponent(PROV_TAB) + '&_=' + Date.now(), { cache: 'no-store' });
      const j = await res.json();
      const rows = (j && j.ok && Array.isArray(j.rows)) ? j.rows : [];
      const primary = rows.find(r => r.primary === true || r.primary === 'true' || r.primary === 'TRUE');
      return adoptRow(primary) || adoptRow(rows.find(r => vendorReady({ apiKey: r.apiKey, proxyUrl: r.proxyUrl, auth: r.auth })));
    } catch (e) { return false; }
  })();
  return _bootPromise;
}

function resolveProvider() {
  // ผู้ให้บริการหลักที่ตั้งไว้ที่ ITSA › ผู้ให้บริการ AI ชนะค่าเก่าที่เคยตั้งไว้เสมอ
  if (vendorReady(cfg.vendor)) return 'vendor';
  if (cfg.provider && cfg.provider !== 'auto' && cfg.provider !== 'vendor') return cfg.provider;
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



// fetch with a diagnosable error — "Failed to fetch" alone tells the user nothing
async function vfetch(url, init) {
  try { return await fetch(url, init); }
  catch (e) {
    const page = (typeof location !== 'undefined' && location.protocol) || '';
    let why = 'เรียกปลายทางไม่สำเร็จ';
    if (page === 'https:' && /^http:\/\//i.test(url)) why = 'หน้าเว็บเป็น https แต่ปลายทางเป็น http — เบราว์เซอร์บล็อก (mixed content) ต้องทำ HTTPS ให้ปลายทาง หรือเรียกผ่าน Relay';
    else if (/(\.local|localhost|127\.|192\.168\.|10\.)/i.test(url)) why = 'เข้าถึงเครื่องในวงแลนไม่ได้จากหน้านี้ — ต้องอยู่วงเน็ตเวิร์กเดียวกัน หรือเรียกผ่าน Relay ที่ตั้งในองค์กร';
    else why = 'ปลายทางไม่ตอบ หรือไม่อนุญาต CORS จากโดเมนนี้ (ตรวจ URL/อินเทอร์เน็ต แล้วลองใช้ Relay)';
    throw new Error(why + ' · ' + url);
  }
}

// ---- vendor adapters (anthropic · openai-compatible · gemini) ----
// A "vendor" is one provider row from ITSA-AIEN:
//   { id, api:'anthropic'|'openai'|'gemini', auth:'key'|'relay'|'none', apiKey, proxyUrl, endpoint, model }
function baseUrl(v, fallback) {
  let e = String(v.endpoint || '').split(' ')[0].trim() || fallback;
  if (!e) return '';
  if (!/^https?:\/\//i.test(e)) e = (/(\.local|^localhost|^127\.|^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\.)/i.test(e) ? 'http://' : 'https://') + e;
  return e.replace(/\/+$/, '');
}
function msgText(body) { return body; }

async function vendorAnthropic(v, body) {
  const r = await vfetch(baseUrl(v, 'api.anthropic.com') + '/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': v.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify(Object.assign({}, body, { model: v.model || body.model })),
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'Anthropic HTTP ' + r.status);
  return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
}

// vLLM · Ollama · Together · OpenAI — /v1/chat/completions
async function vendorOpenAI(v, body) {
  if (!baseUrl(v, '')) throw new Error('ยังไม่ได้ใส่ปลายทาง (endpoint) เช่น api.openai.com หรือ api.together.xyz');
  const msgs = (body.system ? [{ role: 'system', content: body.system }] : []).concat(body.messages || []);
  const headers = { 'Content-Type': 'application/json' };
  if (v.apiKey) headers['Authorization'] = 'Bearer ' + v.apiKey;
  const r = await vfetch(baseUrl(v, '') + '/v1/chat/completions', {
    method: 'POST', headers,
    body: JSON.stringify({ model: v.model || body.model, messages: msgs, max_tokens: body.max_tokens }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && (j.error.message || j.error)) || 'OpenAI-compatible HTTP ' + r.status);
  const ch = (j.choices || [])[0] || {};
  return String((ch.message && ch.message.content) || ch.text || '');
}

async function vendorGemini(v, body) {
  const model = v.model || 'gemini-2.5-pro';
  // aistudio.google.com is the console UI, not the API host — correct it silently
  if (/aistudio\.google\.com/i.test(v.endpoint || '')) v = Object.assign({}, v, { endpoint: 'generativelanguage.googleapis.com' });
  const key = String(v.apiKey || '');
  // AIza… (Standard key) และ AQ.Ab… (Auth key) ส่งเป็น x-goog-api-key เหมือนกัน
  // ya29.… เป็น OAuth access token จริง ต้องส่งเป็น Bearer
  const oauth = /^ya29\./.test(key);
  const url = baseUrl(v, 'generativelanguage.googleapis.com') + '/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
  const gh = { 'Content-Type': 'application/json' };
  if (oauth) gh['Authorization'] = 'Bearer ' + key; else gh['x-goog-api-key'] = key;
  const contents = (body.messages || []).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content || '') }] }));
  const payload = { contents, generationConfig: { maxOutputTokens: body.max_tokens } };
  if (body.system) payload.systemInstruction = { parts: [{ text: body.system }] };
  const r = await vfetch(url, { method: 'POST', headers: gh, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.message) || 'Gemini HTTP ' + r.status);
  const cand = (j.candidates || [])[0] || {};
  return ((cand.content && cand.content.parts) || []).map(p => p.text || '').join('');
}

// relay: one server-side endpoint speaks to every vendor; the key never reaches the browser
async function vendorRelay(v, body) {
  const r = await vfetch(v.proxyUrl, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'ai', vendor: v.id || '', api: v.api || 'anthropic', endpoint: v.endpoint || '', model: v.model || body.model, payload: body }),
  });
  if (!r.ok) throw new Error('AI relay HTTP ' + r.status);
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'AI relay error');
  return String(j.text || '');
}

function apiOf(v) {
  if (v.api) return v.api;
  const s = (v.id || '') + ' ' + (v.model || '') + ' ' + (v.endpoint || '');
  if (/claude|anthropic/i.test(s)) return 'anthropic';
  if (/gemini|generativelanguage/i.test(s)) return 'gemini';
  return 'openai';
}

async function callVendor(vIn, body) {
  const v = Object.assign({}, vIn, { api: apiOf(vIn) });
  if (v.auth === 'relay' || (!v.apiKey && v.proxyUrl)) {
    if (!v.proxyUrl) throw new Error('ยังไม่ได้ตั้ง Relay URL');
    return vendorRelay(v, body);
  }
  if (v.api === 'gemini') return vendorGemini(v, body);
  if (v.api === 'openai') return vendorOpenAI(v, body);
  return vendorAnthropic(v, body);
}

// test one vendor without changing the active config
async function pingVendor(v) {
  // 24 tokens is not enough for reasoning models — they spend the budget thinking and return empty text
  const body = { model: v.model, max_tokens: 512, messages: [{ role: 'user', content: 'ตอบกลับสั้น ๆ ว่า OK' }] };
  try {
    const t = String(await callVendor(v, body)).trim();
    if (!t) return { ok: false, api: apiOf(v), error: 'ปลายทางตอบกลับเป็นข้อความว่าง — ตรวจชื่อโมเดลว่าถูกต้อง (' + (v.model || '—') + ')' };
    return { ok: true, api: apiOf(v), text: t.slice(0, 120) };
  } catch (e) { return { ok: false, api: apiOf(v), error: e.message }; }
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
  if (opts.vendor) return callVendor(opts.vendor, body);
  if (!vendorReady(cfg.vendor)) { await bootstrapVendor(); if (vendorReady(cfg.vendor)) return callVendor(cfg.vendor, body); }
  if (p === 'vendor') {
    if (!vendorReady(cfg.vendor)) { const e = new Error('ยังไม่ได้ตั้งผู้ให้บริการหลัก'); e.code = 'NOT_CONFIGURED'; throw e; }
    return callVendor(cfg.vendor, body);
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
  callVendor,
  pingVendor,
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
  bootstrapVendor,
  adoptVendor: adoptRow,
};

if (typeof window !== 'undefined') window.MeeAI = MeeAI;
export default MeeAI;
