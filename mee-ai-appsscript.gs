/**
 * Mee-ERP OS — Multi-vendor AI relay for Google Apps Script
 * ------------------------------------------------------------------
 * เบราว์เซอร์ยิงมาที่ relay ตัวเดียว → relay คุยกับผู้ให้บริการแต่ละเจ้าแทน
 * คีย์ทุกเจ้าอยู่ใน Script Properties ฝั่ง server ไม่หลุดไปที่ผู้ใช้
 * ไม่มีปัญหา CORS / mixed content
 *
 * ติดตั้ง (ทำครั้งเดียว)
 * 1. เปิดไฟล์ Apps Script ของระบบ → Add file › Script → วางโค้ดนี้
 * 2. ⚙ Project Settings → Script Properties → เพิ่มเฉพาะเจ้าที่ใช้:
 *      ANTHROPIC_API_KEY   sk-ant-...        (Claude)
 *      GEMINI_API_KEY      AIza...           (Gemini)
 *      OPENAI_API_KEY      sk-...            (OpenAI)
 *      TOGETHER_API_KEY    ...               (Together / GPT-OSS)
 *      หรือกำหนดรายเจ้าเอง: MEE_AI_KEY_<VENDOR_ID ตัวใหญ่>  เช่น MEE_AI_KEY_QWEN
 * 3. Deploy › Manage deployments › ✏️ → New version → Deploy
 *      Execute as     : Me
 *      Who has access : Anyone      ← สำคัญ ถ้าเป็น "Anyone with Google account" จะถูกบล็อก
 * 4. ก๊อป URL ที่ลงท้าย /exec ไปใส่ที่ ITSA › ผู้ให้บริการ AI › การ์ดผู้ให้บริการ › ตั้งค่า
 *    → เลือก "Apps Script Relay" → วาง URL → บันทึก
 *
 * ถ้าไฟล์เดิมมี doPost อยู่แล้ว: อย่าประกาศซ้ำ — ย้ายเฉพาะบรรทัด
 * `if (body.action === 'ai') return meeAiHandle(body);`
 * ไปวางไว้บนสุดของ doPost เดิม แล้วลบ doPost ในไฟล์นี้ออก
 *
 * รูปแบบคำขอที่ AI Engine ส่งมา:
 *   { action:'ai', vendor:'claude', api:'anthropic'|'openai'|'gemini',
 *     endpoint:'api.anthropic.com', model:'…', payload:{ messages, system, max_tokens } }
 *
 * หมายเหตุ on-prem: relay นี้รันบนเซิร์ฟเวอร์ของ Google จึงเข้าถึงเครื่องในวงแลนองค์กร
 * (เช่น ai-node-01.local) ไม่ได้ — กรณีนั้นต้องตั้ง relay ไว้ในองค์กรเอง
 */

var MEE_AI_DEFAULT_MODEL = {
  anthropic: 'claude-haiku-4-5',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash',
};

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
  if (body.action === 'ai') return meeAiHandle(body);
  return meeAiJson({ ok: false, error: 'unknown action' });
}

/** หาคีย์ของเจ้านั้น ๆ จาก Script Properties */
function meeAiKey(vendor, api) {
  var props = PropertiesService.getScriptProperties();
  var names = [];
  if (vendor) names.push('MEE_AI_KEY_' + String(vendor).toUpperCase().replace(/[^A-Z0-9]/g, '_'));
  if (api === 'anthropic') names.push('ANTHROPIC_API_KEY');
  if (api === 'gemini') names.push('GEMINI_API_KEY');
  if (api === 'openai') names.push('OPENAI_API_KEY', 'TOGETHER_API_KEY');
  for (var i = 0; i < names.length; i++) {
    var v = props.getProperty(names[i]);
    if (v) return v;
  }
  return '';
}

function meeAiBase(endpoint, fallback) {
  var e = String(endpoint || '').split(' ')[0].trim() || fallback;
  if (!e) return '';
  if (!/^https?:\/\//i.test(e)) e = 'https://' + e;
  return e.replace(/\/+$/, '');
}

function meeAiHandle(req) {
  req = req || {};
  var payload = req.payload || {};
  var api = req.api || 'anthropic';
  var vendor = req.vendor || '';
  var model = req.model || payload.model || MEE_AI_DEFAULT_MODEL[api];
  var maxTokens = Math.min(Number(payload.max_tokens) || 1024, 8192);
  var key = meeAiKey(vendor, api);

  if (!key && api !== 'openai') {
    return meeAiJson({ ok: false, error: 'ยังไม่ได้ตั้งคีย์ของ ' + (vendor || api) + ' ใน Script Properties' });
  }

  try {
    if (api === 'gemini') return meeAiGemini(key, req, payload, model, maxTokens);
    if (api === 'openai') return meeAiOpenAI(key, req, payload, model, maxTokens);
    return meeAiAnthropic(key, req, payload, model, maxTokens);
  } catch (err) {
    return meeAiJson({ ok: false, error: String(err) });
  }
}

function meeAiAnthropic(key, req, payload, model, maxTokens) {
  var body = { model: model, max_tokens: maxTokens, messages: payload.messages || [] };
  if (payload.system) body.system = payload.system;
  var res = UrlFetchApp.fetch(meeAiBase(req.endpoint, 'api.anthropic.com') + '/v1/messages', {
    method: 'post', contentType: 'application/json',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify(body), muteHttpExceptions: true,
  });
  var j = JSON.parse(res.getContentText() || '{}');
  if (res.getResponseCode() >= 300) return meeAiJson({ ok: false, error: (j.error && j.error.message) || ('HTTP ' + res.getResponseCode()) });
  var text = (j.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
  return meeAiJson({ ok: true, text: text, model: model, api: 'anthropic', usage: j.usage || null });
}

/** vLLM · Ollama · Together · OpenAI — /v1/chat/completions */
function meeAiOpenAI(key, req, payload, model, maxTokens) {
  var msgs = [];
  if (payload.system) msgs.push({ role: 'system', content: payload.system });
  msgs = msgs.concat(payload.messages || []);
  var headers = {};
  if (key) headers['Authorization'] = 'Bearer ' + key;
  var res = UrlFetchApp.fetch(meeAiBase(req.endpoint, 'api.openai.com') + '/v1/chat/completions', {
    method: 'post', contentType: 'application/json', headers: headers,
    payload: JSON.stringify({ model: model, messages: msgs, max_tokens: maxTokens }),
    muteHttpExceptions: true,
  });
  var j = JSON.parse(res.getContentText() || '{}');
  if (res.getResponseCode() >= 300) return meeAiJson({ ok: false, error: (j.error && (j.error.message || j.error)) || ('HTTP ' + res.getResponseCode()) });
  var ch = (j.choices || [])[0] || {};
  return meeAiJson({ ok: true, text: String((ch.message && ch.message.content) || ch.text || ''), model: model, api: 'openai', usage: j.usage || null });
}

function meeAiGemini(key, req, payload, model, maxTokens) {
  var contents = (payload.messages || []).map(function (m) {
    return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content || '') }] };
  });
  var body = { contents: contents, generationConfig: { maxOutputTokens: maxTokens } };
  if (payload.system) body.systemInstruction = { parts: [{ text: payload.system }] };
  var url = meeAiBase(req.endpoint, 'generativelanguage.googleapis.com')
    + '/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
  // AIza… (Standard key) และ AQ.Ab… (Auth key) → x-goog-api-key · ya29.… (OAuth token) → Bearer
  var gh = /^ya29\./.test(key) ? { 'Authorization': 'Bearer ' + key } : { 'x-goog-api-key': key };
  var res = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json', headers: gh,
    payload: JSON.stringify(body), muteHttpExceptions: true,
  });
  var j = JSON.parse(res.getContentText() || '{}');
  if (res.getResponseCode() >= 300) return meeAiJson({ ok: false, error: (j.error && j.error.message) || ('HTTP ' + res.getResponseCode()) });
  var cand = (j.candidates || [])[0] || {};
  var text = ((cand.content && cand.content.parts) || []).map(function (p) { return p.text || ''; }).join('');
  return meeAiJson({ ok: true, text: text, model: model, api: 'gemini', usage: j.usageMetadata || null });
}

function meeAiJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** ทดสอบจากใน Apps Script: กด Run แล้วดู Execution log */
function meeAiSelfTest() {
  var out = meeAiHandle({ api: 'anthropic', vendor: 'claude', payload: { messages: [{ role: 'user', content: 'ตอบคำเดียวว่า OK' }], max_tokens: 16 } });
  Logger.log(out.getContent());
}
