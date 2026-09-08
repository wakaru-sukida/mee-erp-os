/**
 * Mee-ERP OS — AI relay for Google Apps Script
 * ------------------------------------------------------------------
 * วางโค้ดนี้เพิ่มในโปรเจกต์ Apps Script เดิมที่ใช้ต่อ Google Sheets อยู่แล้ว
 *
 * ติดตั้ง (ทำครั้งเดียว)
 * 1. เปิดไฟล์ Apps Script ของระบบ → Add file › Script → วางโค้ดนี้
 * 2. เมนูซ้าย ⚙ Project Settings → Script Properties → Add script property
 *      Property : ANTHROPIC_API_KEY
 *      Value    : sk-ant-...   (คีย์จาก console.anthropic.com)
 *    คีย์จะอยู่ฝั่ง server ไม่ถูกส่งไปที่เบราว์เซอร์
 * 3. Deploy › Manage deployments › ✏️ → New version → Deploy
 *      Execute as        : Me
 *      Who has access    : Anyone            ← สำคัญ ถ้าเป็น "Anyone with Google account" จะถูกบล็อก
 * 4. ก๊อป URL ที่ลงท้าย /exec ไปใส่ที่ ITSA › AI Settings › Proxy URL
 *
 * ถ้าไฟล์เดิมมี doPost อยู่แล้ว: อย่าประกาศซ้ำ — ย้ายเฉพาะบล็อก
 * `if (body.action === 'ai') return meeAiHandle(body.payload);`
 * ไปวางไว้บนสุดของ doPost เดิม แล้วลบ doPost ในไฟล์นี้ออก
 */

var MEE_AI_MODELS = {
  'claude-haiku-4-5': 'claude-haiku-4-5',
  'claude-sonnet-4-5': 'claude-sonnet-4-5',
};

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
  if (body.action === 'ai') return meeAiHandle(body.payload);
  return meeAiJson({ ok: false, error: 'unknown action' });
}

function meeAiHandle(payload) {
  var key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!key) return meeAiJson({ ok: false, error: 'ANTHROPIC_API_KEY ยังไม่ได้ตั้งใน Script Properties' });

  payload = payload || {};
  var model = MEE_AI_MODELS[payload.model] || 'claude-haiku-4-5';
  var req = {
    model: model,
    max_tokens: Math.min(Number(payload.max_tokens) || 1024, 8192),
    messages: payload.messages || [],
  };
  if (payload.system) req.system = payload.system;

  try {
    var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify(req),
      muteHttpExceptions: true,
    });
    var code = res.getResponseCode();
    var j = JSON.parse(res.getContentText());
    if (code >= 300) {
      return meeAiJson({ ok: false, error: (j.error && j.error.message) || ('HTTP ' + code) });
    }
    var text = (j.content || [])
      .filter(function (b) { return b.type === 'text'; })
      .map(function (b) { return b.text; })
      .join('');
    return meeAiJson({ ok: true, text: text, model: model, usage: j.usage || null });
  } catch (err) {
    return meeAiJson({ ok: false, error: String(err) });
  }
}

function meeAiJson(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** ทดสอบจากใน Apps Script: กด Run แล้วดู Execution log */
function meeAiSelfTest() {
  var out = meeAiHandle({ messages: [{ role: 'user', content: 'ตอบคำเดียวว่า OK' }], max_tokens: 16 });
  Logger.log(out.getContent());
}
