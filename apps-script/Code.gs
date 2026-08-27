/**
 * Mee-ERP OS — Google Sheets backend
 * Deploy: Extensions > Apps Script > paste this > Deploy > New deployment > Web app
 *   Execute as: Me | Who has access: Anyone
 *
 * Sheet/tab naming: {module-code}-{feature}  e.g. itsa-org-company, itsa-org-branch
 * Row 1 of each tab = header row = field keys used by the design (no, a, s, ...).
 *
 * API:
 *   GET  ?tab=itsa-org-company                → { ok:true, rows:[{...}, ...] }
 *   GET  ?tab=itsa-org-company&list=1          → { ok:true, tabs:[...] }  (list=1 ignores tab, lists all sheet names)
 *   POST body: { tab, action:'replaceAll', rows:[{...}, ...] }   → overwrite whole tab with rows
 *   POST body: { tab, action:'upsert', key:'no', row:{...} }     → insert or update one row matched by key field
 *   POST body: { tab, action:'delete', key:'no', value:'DP-001'} → delete row(s) where row[key] === value
 */

function doGet(e) {
  var tab = e.parameter.tab;
  if (e.parameter.list) return json_({ ok: true, tabs: SpreadsheetApp.getActive().getSheets().map(function (s) { return s.getName(); }) });
  if (!tab) return json_({ ok: false, error: 'missing tab param' });
  var sh = SpreadsheetApp.getActive().getSheetByName(tab);
  if (!sh) return json_({ ok: true, rows: [] });
  return json_({ ok: true, rows: readRows_(sh) });
}

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad json' }); }
  var tab = body.tab;
  if (!tab) return json_({ ok: false, error: 'missing tab' });
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(tab) || ss.insertSheet(tab);

  if (body.action === 'replaceAll') {
    writeRows_(sh, body.rows || []);
    return json_({ ok: true, rows: body.rows || [] });
  }
  if (body.action === 'upsert') {
    var rows = readRows_(sh);
    var key = body.key || 'no';
    var idx = -1;
    for (var i = 0; i < rows.length; i++) { if (rows[i][key] === body.row[key]) { idx = i; break; } }
    if (idx >= 0) rows[idx] = Object.assign({}, rows[idx], body.row); else rows.push(body.row);
    writeRows_(sh, rows);
    return json_({ ok: true, rows: rows });
  }
  if (body.action === 'delete') {
    var rows2 = readRows_(sh).filter(function (r) { return r[body.key] !== body.value; });
    writeRows_(sh, rows2);
    return json_({ ok: true, rows: rows2 });
  }
  if (body.action === 'deleteTab') {
    var target = ss.getSheetByName(tab);
    if (target) ss.deleteSheet(target);
    return json_({ ok: true });
  }
  return json_({ ok: false, error: 'unknown action' });
}

function readRows_(sh) {
  var vals = sh.getDataRange().getValues();
  if (vals.length < 1) return [];
  var head = vals[0];
  var out = [];
  for (var r = 1; r < vals.length; r++) {
    var row = {}, empty = true;
    for (var c = 0; c < head.length; c++) {
      if (!head[c]) continue;
      var v = vals[r][c];
      if (v !== '' && v !== null) empty = false;
      row[head[c]] = v;
    }
    if (!empty) out.push(row);
  }
  return out;
}

function writeRows_(sh, rows) {
  sh.clearContents();
  if (!rows.length) return;
  var keys = [];
  rows.forEach(function (r) { Object.keys(r).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); });
  var out = [keys].concat(rows.map(function (r) { return keys.map(function (k) { return r[k] !== undefined ? r[k] : ''; }); }));
  sh.getRange(1, 1, out.length, keys.length).setValues(out);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
