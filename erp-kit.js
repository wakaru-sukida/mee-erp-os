// erp-kit.js — Mee-ERP OS shared UI kit (host-neutral).
// = MeeErpOS.Kit (RCL) in ARCHITECTURE.md. Pure factory: createKit(React) -> helpers.
// Every helper takes the theme object T explicitly (no `this`), so any module DC can use it.

export function createKit(React) {
  const h = React.createElement;

  // ---- theme token resolver (safe fallbacks when a token is missing) ----
  function tk(T) {
    T = T || {};
    const dark = T.name === 'dark';
    return {
      dark,
      acc: T.acc || 'oklch(0.55 0.16 255)',
      accSoft: T.accSoft || (dark ? 'rgba(120,160,255,.16)' : 'rgba(60,110,240,.10)'),
      aTxt: T.accText || T.acc || 'oklch(0.5 0.16 255)',
      bg: T.bg || (dark ? 'oklch(0.19 0.012 265)' : 'oklch(0.98 0.004 255)'),
      card: T.card || (dark ? 'oklch(0.23 0.014 265)' : '#fff'),
      win: T.win || (dark ? 'oklch(0.25 0.014 265)' : '#fff'),
      winHead: T.winHead || (dark ? 'oklch(0.22 0.012 265)' : 'oklch(0.975 0.004 255)'),
      text: T.text || (dark ? 'oklch(0.94 0.01 265)' : 'oklch(0.25 0.02 265)'),
      sub: T.sub || (dark ? 'oklch(0.68 0.02 265)' : 'oklch(0.55 0.02 265)'),
      border: T.border || (dark ? 'oklch(0.32 0.014 265)' : 'oklch(0.9 0.006 255)'),
      line: T.line || (dark ? 'oklch(0.29 0.012 265)' : 'oklch(0.93 0.005 255)'),
      field: T.field || (dark ? 'oklch(0.21 0.012 265)' : '#fff'),
      radius: T.radius != null ? T.radius : 10,
      font: T.font || "'IBM Plex Sans Thai','Inter',sans-serif",
    };
  }

  // ---- icon (compact glyph set used across ERP modules) ----
  const GLYPH = {
    user: ['circle:12,8,4', 'path:M5 20a7 7 0 0114 0'],
    box: ['path:M3 8l9-4 9 4v8l-9 4-9-4z', 'path:M3 8l9 4 9-4', 'path:M12 12v8'],
    crm: ['circle:9,8,3', 'path:M3 20a6 6 0 0112 0', 'path:M16 4a4 4 0 010 8'],
    cash: ['rect:2,6,20,12', 'circle:12,12,3'],
    search: ['circle:11,11,7', 'path:M21 21l-4-4'],
    plus: ['path:M12 5v14', 'path:M5 12h14'],
    doc: ['path:M6 2h9l5 5v15H6z', 'path:M15 2v5h5'],
    check: ['path:M4 12l5 5L20 6'],
    reports: ['rect:3,3,18,18', 'path:M8 17v-5', 'path:M12 17V8', 'path:M16 17v-3'],
    gauge: ['path:M4 18a8 8 0 1116 0', 'path:M12 18l4-5'],
    arrowdown: ['path:M12 4v14', 'path:M6 12l6 6 6-6'],
    chevron2: ['path:M9 6l6 6-6 6'],
    tag: ['path:M3 3h8l10 10-8 8L3 11z', 'circle:7.5,7.5,1.5'],
    settings: ['circle:12,12,3', 'path:M12 3v3', 'path:M12 18v3', 'path:M3 12h3', 'path:M18 12h3'],
    scale: ['path:M12 3v18', 'path:M6 7h12', 'path:M4 13l2-6 2 6z', 'path:M16 13l2-6 2 6z'],
    wrench: ['path:M14 6a4 4 0 00-5 5l-6 6 3 3 6-6a4 4 0 005-5l-3 3-3-3z'],
    car: ['path:M3 12l2-5h14l2 5v5H3z', 'circle:7,17,1.5', 'circle:17,17,1.5'],
    cloud: ['path:M7 18a4 4 0 010-8 5 5 0 019.6-1.5A3.5 3.5 0 0117 18z'],
    list: ['path:M8 6h13', 'path:M8 12h13', 'path:M8 18h13', 'path:M3 6h.01', 'path:M3 12h.01', 'path:M3 18h.01'],
    spark: ['path:M12 3l1.9 5.6L19.5 10l-5.6 1.4L12 17l-1.9-5.6L4.5 10l5.6-1.4z', 'path:M18.5 14l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6z'],
    cpu: ['rect:5,5,14,14', 'rect:9,9,6,6', 'path:M9 2v3', 'path:M15 2v3', 'path:M9 19v3', 'path:M15 19v3', 'path:M2 9h3', 'path:M2 15h3', 'path:M19 9h3', 'path:M19 15h3'],
    server: ['rect:3,4,18,7', 'rect:3,13,18,7', 'circle:7,7.5,0.7', 'circle:7,16.5,0.7'],
    route: ['circle:6,6,2.4', 'circle:18,18,2.4', 'path:M8.2 6H15a3 3 0 013 3v6.5'],
    shield: ['path:M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z'],
    layers: ['path:M12 3l9 5-9 5-9-5z', 'path:M3 13l9 5 9-5'],
    cart: ['circle:9,20,1.4', 'circle:18,20,1.4', 'path:M2 3h3l2.5 13h11l2-9H6'],
    credit: ['rect:2,5,20,14', 'path:M2 10h20', 'path:M6 15h4'],
    return: ['path:M9 7l-5 5 5 5', 'path:M4 12h11a5 5 0 015 5v1'],
    mega: ['path:M3 11v2l12 5V6z', 'path:M15 8a4 4 0 010 8', 'path:M6 13v4a2 2 0 004 0'],
    clock: ['circle:12,12,9', 'path:M12 7v5l3.5 2'],
    grid: ['rect:3,3,7,7', 'rect:14,3,7,7', 'rect:14,14,7,7', 'rect:3,14,7,7'],
    sitemap: ['rect:9,3,6,5', 'rect:3,16,6,5', 'rect:15,16,6,5', 'path:M12 8v3', 'path:M6 16v-5h12v5'],
    shapes: ['circle:8,8,4.4', 'rect:13.5,13.5,7,7', 'path:M7.6 13.2l4 7.6h-8z'],
    folder: ['path:M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z'],
    star: ['path:M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.9l6-.8z'],
    ruler: ['path:M3 14.5L14.5 3 21 9.5 9.5 21z', 'path:M7 11l2 2', 'path:M10 8l2 2', 'path:M13 5l2 2'],
  };
  function Icon(name, size) {
    size = size || 16;
    const spec = GLYPH[name] || GLYPH.box;
    const kids = spec.map((s, i) => {
      const [t, v] = s.split(':');
      const n = (v || '').split(',').map(Number);
      if (t === 'path') return h('path', { key: i, d: v });
      if (t === 'rect') return h('rect', { key: i, x: n[0], y: n[1], width: n[2], height: n[3], rx: 2 });
      if (t === 'circle') return h('circle', { key: i, cx: n[0], cy: n[1], r: n[2] });
      return null;
    });
    return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }, kids);
  }

  function card(T, children, extra) {
    const c = tk(T);
    return h('div', { style: Object.assign({ background: c.card, border: `1px solid ${c.border}`, borderRadius: c.radius + 4, padding: 16 }, extra || {}) }, children);
  }

  function pill(T, text, hue) {
    hue = hue == null ? 220 : hue;
    const c = tk(T);
    return h('span', { style: { fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: c.dark ? `oklch(0.32 0.06 ${hue})` : `oklch(0.95 0.05 ${hue})`, color: c.dark ? `oklch(0.86 0.09 ${hue})` : `oklch(0.45 0.15 ${hue})`, whiteSpace: 'nowrap' } }, text);
  }

  function badge(T, txt, hue, solid) {
    hue = hue == null ? 220 : hue;
    return h('span', { style: { fontSize: 9.5, fontWeight: 700, letterSpacing: .4, padding: '2px 7px', borderRadius: 6, background: solid ? `oklch(0.53 0.16 ${hue})` : `oklch(0.95 0.05 ${hue})`, color: solid ? '#fff' : `oklch(0.45 0.15 ${hue})`, whiteSpace: 'nowrap' } }, txt);
  }

  function btn(T, label, primary, icon, onClick) {
    const c = tk(T);
    return h('button', {
      onClick: (e) => { e.stopPropagation(); if (onClick) onClick(e); },
      style: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: primary ? 'none' : `1px solid ${c.border}`, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: c.font, background: primary ? c.acc : c.win, color: primary ? '#fff' : c.text },
    }, icon && Icon(icon, 15), label);
  }

  // ---- shared cross-mount store (bus + localStorage) ----
  function bus() {
    if (typeof window === 'undefined') return null;
    const sheetsOnly = !!window.__erpSheetsOnly;
    if (!window.__erpBus) {
      const LS = 'meeerp.bus.v2';
      const persist = (kk) => !sheetsOnly && kk.indexOf('org.') !== 0;
      let saved = {}; if (!sheetsOnly) { try { saved = JSON.parse(window.localStorage.getItem(LS) || '{}') || {}; } catch (e) { saved = {}; } }
      const st = { data: Object.assign({}, saved), subs: [] };
      const flush = () => { try { const out = {}; Object.keys(st.data).forEach(kk => { if (persist(kk)) out[kk] = st.data[kk]; }); window.localStorage.setItem(LS, JSON.stringify(out)); } catch (e) {} };
      window.__erpBus = {
        get: (kk, d) => st.data[kk] !== undefined ? st.data[kk] : d,
        set: (kk, v) => { st.data[kk] = v; if (persist(kk)) flush(); st.subs.forEach(f => f(kk, v)); },
        on: (f) => { st.subs.push(f); return () => { st.subs = st.subs.filter(x => x !== f); }; }
      };
    }
    return window.__erpBus;
  }
  function dbWire(cmp, key) {
    const b = bus(); if (!b || cmp._offBus) return;
    const saved = b.get(key, null);
    // Sheet-backed tabs are the source of truth: never let the persisted snapshot overwrite rows
    // a completed sheet pull already put in state (that race showed stale pre-edit data after refresh).
    const sheetKeys = Object.keys(cmp.SHEETS_TABS || {});
    const mergeSaved = (src) => {
      const cur = cmp.state.db || {};
      const out = Object.assign({}, src);
      sheetKeys.forEach(k => { if (cmp._sheetsPulled && cur[k] !== undefined) out[k] = cur[k]; });
      return out;
    };
    if (saved && typeof saved === 'object') { const next = mergeSaved(saved); cmp._lastDb = next; cmp.setState({ db: next }); }
    cmp._offBus = b.on((kk, v) => { if (kk !== key) return; if (v !== cmp.state.db) { const next = (v && typeof v === 'object') ? mergeSaved(v) : {}; cmp._lastDb = next; cmp.setState({ db: next }); } });
  }
  // one writer per DB key: extra instances of the same module (warm mounts, second windows)
  // must not push/persist — they would overwrite the live editor's rows with their own stale copy.
  function claimWriter(cmp, key) {
    if (typeof window === 'undefined') return true;
    if (cmp.props && cmp.props.warm) return false;
    window.__erpDbOwner = window.__erpDbOwner || {};
    const reg = window.__erpDbOwner;
    const now = Date.now();
    const cur = reg[key];
    if (!cur || cur.cmp === cmp || (now - (cur.ts || 0)) > 15000) { reg[key] = { cmp: cmp, ts: now }; return true; }
    return false;
  }
  function isWriter(cmp, key) {
    if (typeof window === 'undefined') return true;
    if (cmp.props && cmp.props.warm) return false;
    const reg = window.__erpDbOwner || {};
    const cur = reg[key];
    if (!cur) return claimWriter(cmp, key);
    if (cur.cmp === cmp) { cur.ts = Date.now(); return true; }
    return (Date.now() - (cur.ts || 0)) > 15000 ? claimWriter(cmp, key) : false;
  }
  function dbPersist(cmp, key) {
    const b = bus(); if (!b) return;
    // warm (off-screen preload) instances never write: they would overwrite the live window's rows and the sheet
    if (cmp.props && cmp.props.warm) return;
    if (!isWriter(cmp, key)) return;
    if (cmp.state.db !== cmp._lastDb) { cmp._lastDb = cmp.state.db; b.set(key, cmp.state.db); }
    if (cmp._sheetsPush && cmp.SHEETS_TABS && cmp._sheetsPulled) {
      cmp._lastPushedRef = cmp._lastPushedRef || {};
      Object.keys(cmp.SHEETS_TABS).forEach(k => {
        const rows = cmp.state.db[k];
        if (rows !== undefined && rows !== cmp._lastPushedRef[k]) { cmp._lastPushedRef[k] = rows; cmp._sheetsPush(k, rows); }
      });
    }
  }

  function sheetsLoading(cmp, label) {
    if (!cmp.SHEETS_URL) return null;
    const st = cmp.state.sheetsStatus;
    if (st && st !== 'connecting') return null;
    const T = cmp.T(); const c = tk(T);
    return { fg: c.text, view: h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '60px 20px', width: '100%', background: 'transparent', fontFamily: c.font } },
      h('div', { style: { width: 40, height: 40, borderRadius: '50%', border: `3px solid ${c.border}`, borderTopColor: c.acc, animation: 'erpspin .8s linear infinite' } }),
      h('div', { style: { fontSize: 13.5, fontWeight: 600, color: c.text } }, 'กำลังเชื่อมต่อฐานข้อมูล Google Sheet…'),
      label ? h('div', { style: { fontSize: 11.5, color: c.sub } }, label) : null) };
  }
  function sheetsBadge(T, status, opt) { opt = opt || {}; const c = tk(T);
    const M = { connecting: ['กำลังเชื่อมต่อ Sheet…', '#f5a623'], connected: ['เชื่อมต่อ Sheet แล้ว', '#1ba94c'], offline: ['เชื่อมต่อ Sheet ไม่ได้', '#e2483d'] }[status];
    if (!M) return null;
    return h('div', { style: { marginLeft: opt.marginLeft !== undefined ? opt.marginLeft : 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: M[1], background: c.win, border: `1px solid ${c.border}`, borderRadius: 999, padding: '4px 10px', flexShrink: 0 } }, h('span', { style: { width: 7, height: 7, borderRadius: '50%', background: M[1], flexShrink: 0 } }), M[0]);
  }
  // ---- standard company/branch filter (sidebar dropdown + row filtering), shared across generic reports/admin modules ----
  const CB_COS = ['บมจ. มี กรุ๊ป', 'บจก. มี เทรดดิ้ง', 'บจก. มี โลจิสติกส์'];
  const CB_BR_MAP = { 'บมจ. มี กรุ๊ป': ['สำนักงานใหญ่ (สาทร)', 'สาขาเชียงใหม่'], 'บจก. มี เทรดดิ้ง': ['สำนักงานใหญ่ (ลาดพร้าว)', 'สาขาขอนแก่น'], 'บจก. มี โลจิสติกส์': ['สำนักงานใหญ่ (บางนา)'] };
  // live company/branch master data: bus 'org.companies'/'org.branches' (published by ITSA-ORG this session),
  // then the PERSISTED ITSA-ORG database (db:itsa-org:v5/v4/v3 in bus or localStorage), then the static demo list.
  function orgDbMaster() {
    const tabs = (db) => {
      const cos = (db && (db['company-management'] || [])) || [];
      const brs = (db && (db['branch-management'] || [])) || [];
      const coNames = cos.map(c => c.name_th || c.a || c.co).filter(Boolean);
      if (!coNames.length) return null;
      const brMap = {};
      coNames.forEach(nm => { brMap[nm] = brs.filter(x => (x.scope_company || x.co) === nm).map(x => x.name_th || x.a).filter(Boolean); });
      return { COS: coNames, BR_MAP: brMap };
    };
    const keys = ['db:itsa-org:v5', 'db:itsa-org:v4', 'db:itsa-org:v3'];
    try {
      const b = (typeof window !== 'undefined') ? window.__erpBus : null;
      if (b && b.get) { for (const k of keys) { const r = tabs(b.get(k, null)); if (r) return r; } }
    } catch (e) {}
    try {
      const raw = JSON.parse(window.localStorage.getItem('meeerp.bus.v2') || '{}') || {};
      for (const k of keys) { const r = tabs(raw[k]); if (r) return r; }
    } catch (e) {}
    return null;
  }
  function liveCoBr() {
    try {
      const b = (typeof window !== 'undefined') ? window.__erpBus : null;
      const cos = b && b.get ? b.get('org.companies', null) : null;
      const brs = b && b.get ? b.get('org.branches', null) : null;
      if (cos && cos.length) {
        const brMap = {};
        cos.forEach(co => { brMap[co.name_th] = (brs || []).filter(x => x.scope_company === co.name_th).map(x => x.name_th); });
        return { COS: cos.map(co => co.name_th), BR_MAP: brMap };
      }
    } catch (e) {}
    const fromDb = orgDbMaster();
    if (fromDb) return fromDb;
    return { COS: CB_COS, BR_MAP: CB_BR_MAP };
  }
  function coBrRows(rows) { const { COS, BR_MAP } = liveCoBr(); return (rows || []).map((r, i) => (r.scope_company ? r : Object.assign({}, r, { scope_company: COS[i % COS.length], scope_branch: (BR_MAP[COS[i % COS.length]] || [])[i % (BR_MAP[COS[i % COS.length]] || ['']).length] }))); }
  function coBrState(cmp) {
    const { COS, BR_MAP } = liveCoBr();
    const defCo = (cmp.props.api && cmp.props.api.userCo && COS.indexOf(cmp.props.api.userCo) > -1) ? cmp.props.api.userCo : COS[0];
    const coSel = (cmp.state.filterCo || [defCo]).filter(o => COS.indexOf(o) > -1);
    const coSelFinal = coSel.length ? coSel : [defCo];
    const coAll = coSelFinal.length === COS.length;
    const brOpts = Array.from(new Set([].concat(...(coAll ? COS : coSelFinal).map(o => BR_MAP[o] || []))));
    const defBr = (cmp.props.api && cmp.props.api.userBr && brOpts.indexOf(cmp.props.api.userBr) > -1) ? [cmp.props.api.userBr] : null;
    const brSel = (cmp.state.filterBr || defBr || []).filter(o => brOpts.indexOf(o) > -1);
    const brSelFinal = brSel.length ? brSel : brOpts;
    const brAll = brSelFinal.length === brOpts.length;
    return { coSel: coSelFinal, coAll, brOpts, brSelFinal, brAll, COS, BR_MAP };
  }
  function coBrFilter(cmp, rows) {
    const { coSel, coAll, brSelFinal, brAll } = coBrState(cmp);
    return coBrRows(rows).filter(r => (!r.scope_company || coAll || coSel.indexOf(r.scope_company) > -1) && (!r.scope_branch || brAll || brSelFinal.indexOf(r.scope_branch) > -1));
  }
  function coBrDropdown(cmp, T) {
    const c = tk(T);
    const { coSel, coAll, brOpts, brSelFinal, brAll, COS } = coBrState(cmp);
    const ddOpenId = cmp.state.cbOpenDd || null;
    const ddToggle = (id) => cmp.setState(s => ({ cbOpenDd: s.cbOpenDd === id ? null : id }));
    const ddWrap = (id, label, active, content) => h('div', { key: 'dd-' + id, style: { position: 'relative', display: 'flex' } },
      h('button', { type: 'button', onClick: () => ddToggle(id), style: { display: 'flex', alignItems: 'center', gap: 7, height: 30, width: '100%', fontSize: 12.5, fontWeight: 600, padding: '0 12px', borderRadius: 8, border: `1px solid ${c.border}`, background: active ? c.accSoft : c.win, color: active ? c.aTxt : c.text, cursor: 'pointer', fontFamily: c.font, whiteSpace: 'nowrap' } },
        h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' } }, label), h('span', { style: { display: 'flex', color: c.sub } }, Icon('arrowdown', 13))),
      ddOpenId === id ? h('div', { key: 'bd', onClick: () => cmp.setState({ cbOpenDd: null }), style: { position: 'fixed', inset: 0, zIndex: 199 } }) : null,
      ddOpenId === id ? h('div', { key: 'pop', onClick: e => e.stopPropagation(), style: { position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 200, minWidth: 200, maxHeight: 260, overflowY: 'auto', background: c.win, border: `1px solid ${c.border}`, borderRadius: 10, boxShadow: '0 12px 32px rgba(15,20,35,.18)', padding: 6 } }, content) : null);
    const coLabel = coAll ? 'บริษัท: ทั้งหมด' : (coSel.length === 1 ? coSel[0] : 'บริษัท (' + coSel.length + ')');
    const coContent = [h('label', { key: '_all', style: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: c.font } },
      h('input', { type: 'checkbox', checked: coAll, ref: el => { if (el) el.indeterminate = coSel.length > 0 && !coAll; }, onChange: () => cmp.setState({ filterCo: coAll ? [] : COS.slice(), filterBr: [] }), style: { cursor: 'pointer' } }), h('span', null, 'ทั้งหมด'))]
      .concat(COS.map(o => h('label', { key: o, style: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, fontFamily: c.font } },
        h('input', { type: 'checkbox', checked: coSel.indexOf(o) > -1, onChange: () => { const next = coSel.indexOf(o) > -1 ? coSel.filter(x => x !== o) : coSel.concat([o]); cmp.setState({ filterCo: next, filterBr: [] }); }, style: { cursor: 'pointer' } }), h('span', null, o))));
    const brLabel = brAll ? 'สาขา: ทั้งหมด' : (brSelFinal.length === 1 ? brSelFinal[0] : 'สาขา (' + brSelFinal.length + ')');
    const brContent = [h('label', { key: '_all', style: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: c.font } },
      h('input', { type: 'checkbox', checked: brAll, ref: el => { if (el) el.indeterminate = brSelFinal.length > 0 && !brAll; }, onChange: () => cmp.setState({ filterBr: brAll ? [] : brOpts.slice() }), style: { cursor: 'pointer' } }), h('span', null, 'ทั้งหมด'))]
      .concat(brOpts.map(o => h('label', { key: o, style: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, fontFamily: c.font } },
        h('input', { type: 'checkbox', checked: brSelFinal.indexOf(o) > -1, onChange: () => { const next = brSelFinal.indexOf(o) > -1 ? brSelFinal.filter(x => x !== o) : brSelFinal.concat([o]); cmp.setState({ filterBr: next }); }, style: { cursor: 'pointer' } }), h('span', null, o))));
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } }, ddWrap('co', coLabel, !coAll, coContent), ddWrap('br', brLabel, !brAll, brContent));
  }


  const SHEET_HDR = {};
  function sheetsRename_(row) {
    const o = {}; Object.keys(row).forEach(kk => { if (kk.indexOf('_f:') === 0) return; o[SHEET_HDR[kk] || kk] = row[kk]; }); return o;
  }
  const SHEET_HDR_REV = Object.fromEntries(Object.entries(SHEET_HDR).map(([k, v]) => [v, k]));
  function sheetsUnrename_(row) {
    const o = {}; Object.keys(row).forEach(kk => { o[SHEET_HDR_REV[kk] || kk] = row[kk]; }); return o;
  }
  function sheetsBind(cmp, url, tabMap, normalizers) {
    if (!url || cmp._sheetsBound) return;
    if (cmp.props && cmp.props.warm) { cmp._sheetsBound = true; cmp._sheetsPull = function () {}; cmp._sheetsPush = function () {}; cmp._sheetsSyncAll = function () {}; return; }
    if (cmp.DBKEY && !claimWriter(cmp, cmp.DBKEY)) { cmp._sheetsBound = true; cmp._sheetsPull = function () {}; cmp._sheetsPush = function () {}; cmp._sheetsSyncAll = function () {}; return; }
    cmp._sheetsBound = true;
    const sheetsOnly = typeof window !== 'undefined' && window.__erpSheetsOnly;
    cmp._sheetsLast = cmp._sheetsLast || {};
    cmp._sheetsPull = async function () {
      cmp.setState({ sheetsStatus: 'connecting' });
      const keys = Object.keys(tabMap);
      const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
      const results = await Promise.all(keys.map(async key => {
        try {
          const res = await withTimeout(fetch(url + '?tab=' + encodeURIComponent(tabMap[key]) + '&_=' + Date.now(), { cache: 'no-store' }), 12000);
          const j = await res.json();
          if (j && j.ok) {
            let rows = (j.rows || []).map(sheetsUnrename_);
            if (normalizers && normalizers[key]) rows = rows.map(normalizers[key]);
            return { key, ok: true, rows };
          }
          return { key, ok: false };
        } catch (e) { return { key, ok: false }; }
      }));
      let any = false, failed = false;
      const dbPatch = {};
      results.forEach(({ key, ok, rows }) => {
        if (ok) {
          any = true;
          // Sheet is the source of truth: a successful pull replaces runtime for this tab (including empty). No manual localStorage reset needed. Outages return ok:false and leave existing data untouched.
          cmp._sheetsLast[key] = JSON.stringify(rows.map(sheetsRename_)); dbPatch[key] = rows;
        } else failed = true;
      });
      if (Object.keys(dbPatch).length) cmp.setState(s => ({ db: Object.assign({}, s.db, dbPatch) }));
      cmp.setState({ sheetsStatus: any ? 'connected' : (failed ? 'offline' : 'connected') });
      cmp._sheetsPulled = true; // only push to Sheets AFTER the first pull — skip the spurious echo-write on mount
    };
    cmp._sheetsPush = function (key, rowsIn) {
      if (!cmp._sheetsPulled) return;
      const rows = (rowsIn || []).map(sheetsRename_);
      const sig = JSON.stringify(rows);
      if (cmp._sheetsLast[key] === sig) return;
      cmp._sheetsLast[key] = sig;
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ tab: tabMap[key], action: 'replaceAll', rows: rows }) })
        .then(r => r.json()).then(j => {
          if (!j || !j.ok) { cmp._sheetsLast[key] = null; cmp.setState({ sheetsStatus: 'offline' }); if (cmp.toast) cmp.toast('บันทึกขึ้น Sheet ไม่สำเร็จ: ' + ((j && j.error) || 'unknown')); }
          else cmp.setState({ sheetsStatus: 'connected' });
        })
        .catch(err => { cmp._sheetsLast[key] = null; cmp.setState({ sheetsStatus: 'offline' }); if (cmp.toast) cmp.toast('เชื่อมต่อ Sheet ไม่ได้ (' + err.message + ')'); });
    };
    cmp._sheetsSyncAll = function () {
      Object.keys(tabMap).forEach(key => { const rows = cmp.state.db[key]; if (rows !== undefined) cmp._sheetsPush(key, rows); });
    };
    cmp._sheetsPull();
  }

  const GRID = { ROW_H: 44, PAGE_SZ: 5, CHROME_H: 80, minH(pageSz) { return (pageSz || GRID.PAGE_SZ) * GRID.ROW_H + GRID.CHROME_H; } };
  function codeKeyOf(cols) { cols = cols || []; const m = cols.find(c => c && c.code === true); if (m && m.k) return m.k; const byName = cols.find(c => typeof c.k === 'string' && (/(^|_)code$/i.test(c.k) || c.k === 'no')); if (byName) return byName.k; const bold = cols.find(c => c && c.b && typeof c.k === 'string'); if (bold) return bold.k; const first = cols.find(c => typeof c.k === 'string'); return first ? first.k : null; }
  function orderKeyOf(cols) { cols = cols || []; const m = cols.find(c => c && (c.order === true || c.k === 'sort' || c.h === 'ลำดับ')); return m && m.k ? m.k : null; }
  function defaultSortKeyOf(cols) { return orderKeyOf(cols) || codeKeyOf(cols); }
  function orderFirst(cols) { cols = cols || []; const i = cols.findIndex(c => c && (c.order === true || c.k === 'sort' || c.h === 'ลำดับ')); if (i <= 0) return cols; return [cols[i]].concat(cols.slice(0, i), cols.slice(i + 1)); }

  // ---- paginated datagrid: fixed height (PAGE_SZ rows), equal row heights, page nav when rows > PAGE_SZ ----
  class GridCmp extends React.Component {
    constructor(p) { super(p); const b = bus(); this.state = { pages: {}, pageSizes: (b && b.get('grid.pageSizes', null)) || {}, qs: '', expOpen: false }; }
    _cellText(col, r) { if (typeof col.k === 'string' && r[col.k] != null) return String(r[col.k]); if (typeof col.render === 'function') { try { const v = col.render(r); if (typeof v === 'string' || typeof v === 'number') return String(v); } catch (e) {} } return ''; }
    _cols() { return orderFirst(this.props.cols || []); }
    _codeKey() { return defaultSortKeyOf(this.props.cols); }
    _defaultSort(rows) { const sc = this.props.sortCfg; if (sc && sc.key) return rows; const k = this._codeKey(); if (!k) return rows; return rows.slice().sort((a, b) => String(a[k] == null ? '' : a[k]).localeCompare(String(b[k] == null ? '' : b[k]), undefined, { numeric: true, sensitivity: 'base' })); }
    _filtered() { const { cols, rows } = this.props; const q = (this.state.qs || '').trim().toLowerCase(); const all = rows || []; const base = !q ? all : all.filter(r => (cols || []).some(c => this._cellText(c, r).toLowerCase().indexOf(q) > -1) || Object.keys(r).some(kk => typeof r[kk] === 'string' && r[kk].toLowerCase().indexOf(q) > -1)); return this._defaultSort(base); }
    _rowsOut() { const use = this._cols().filter(col => col.h); return { use, data: this._filtered() }; }
    _download(name, mime, text) {
      const blob = new Blob([text], { type: mime });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (this.props.exportName || this.props.pageKey || 'export') + name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      this.setState({ expOpen: false });
    }
    _csv(sep, ext) {
      const { use, data } = this._rowsOut();
      const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      const lines = [use.map(col => esc(col.h)).join(sep)];
      data.forEach(r => lines.push(use.map(col => esc(this._cellText(col, r))).join(sep)));
      this._download(ext, 'text/csv;charset=utf-8', '\ufeff' + lines.join('\r\n'));
    }
    _json() {
      const { use, data } = this._rowsOut();
      const out = data.map(r => { const o = {}; use.forEach(col => { o[col.h] = this._cellText(col, r); }); return o; });
      this._download('.json', 'application/json;charset=utf-8', JSON.stringify(out, null, 2));
    }
    _htmlTable() {
      const { use, data } = this._rowsOut();
      const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;');
      const th = use.map(col => '<th style="background:#eef;border:1px solid #999;padding:6px">' + esc(col.h) + '</th>').join('');
      const rows = data.map(r => '<tr>' + use.map(col => '<td style="border:1px solid #ccc;padding:6px">' + esc(this._cellText(col, r)) + '</td>').join('') + '</tr>').join('');
      return '<meta charset="utf-8"><table style="border-collapse:collapse;font-family:sans-serif;font-size:12px"><thead><tr>' + th + '</tr></thead><tbody>' + rows + '</tbody></table>';
    }
    _xls() { this._download('.xls', 'application/vnd.ms-excel;charset=utf-8', '\ufeff' + this._htmlTable()); }
    _print() {
      const title = (this.props.exportName || 'export');
      const doc = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + title + '</title>' +
        '<style>@page{size:A4 landscape;margin:12mm}body{margin:0;font-family:"IBM Plex Sans Thai",sans-serif}h1{font-size:15px;margin:0 0 10px}table{width:100%}</style></head><body>' +
        '<h1>' + title + '</h1>' + this._htmlTable() + '</body></html>';
      let done = false;
      try {
        const fr = document.createElement('iframe');
        fr.setAttribute('aria-hidden', 'true');
        fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0';
        fr.onload = () => {
          try {
            fr.contentWindow.addEventListener('beforeprint', () => { done = true; });
            fr.contentWindow.focus();
            fr.contentWindow.print();
          } catch (e) {}
          setTimeout(() => {
            if (!done && !this._printFellBack) { this._printFellBack = true; this._download('.html', 'text/html;charset=utf-8', doc); setTimeout(() => { this._printFellBack = false; }, 3000); }   // print blocked (sandboxed preview) → keep a print-ready file
            try { document.body.removeChild(fr); } catch (e2) {}
          }, 1200);
        };
        document.body.appendChild(fr);
        fr.srcdoc = doc;
      } catch (e) {
        this._download('.html', 'text/html;charset=utf-8', doc);
      }
      this.setState({ expOpen: false });
    }
    componentDidMount() { this._syncFocus(); this._onDoc = (e) => { if (!this.state.expOpen) return; const p = this._expWrap; if (p && !p.contains(e.target)) this.setState({ expOpen: false }); }; this._onKey = (e) => { if (e.key === 'Escape' && this.state.expOpen) this.setState({ expOpen: false }); }; document.addEventListener('pointerdown', this._onDoc, true); document.addEventListener('keydown', this._onKey, true); }
    componentWillUnmount() { if (this._onDoc) document.removeEventListener('pointerdown', this._onDoc, true); if (this._onKey) document.removeEventListener('keydown', this._onKey, true); }
    componentDidUpdate(prev) { if (prev.focus !== this.props.focus) this._syncFocus(); }
    _syncFocus() {
      const { rows, pageSize, focus, pageKey } = this.props;
      if (focus == null || focus === '') return;
      const all = rows || [], PZ = pageSize || GRID.PAGE_SZ;
      let i = -1;
      for (let n = 0; n < all.length; n++) { const r = all[n]; if (r && (r.code === focus || r.name_th === focus)) { i = n; break; } }
      if (i < 0) return;
      const p = Math.floor(i / PZ) + 1, pk = pageKey || '_';
      if ((this.state.pages[pk] || 1) !== p) this.setState(s => ({ pages: Object.assign({}, s.pages, { [pk]: p }) }));
    }
    render() {
      const { T, cols, rows, onRow, selRow, sortCfg, pageSize, pageKey } = this.props;
      const pk = pageKey || '_';
      const c = tk(T), all = this._filtered(), PZ = this.state.pageSizes[pk] || pageSize || GRID.PAGE_SZ;
      const pageCount = Math.max(1, Math.ceil(all.length / PZ));
      const cur = Math.min(Math.max(1, this.state.pages[pk] || 1), pageCount);
      const setPage = (p) => this.setState(s => ({ pages: Object.assign({}, s.pages, { [pk]: Math.max(1, Math.min(p, pageCount)) }) }));
      const setPageSize = (n) => this.setState(s => { const pageSizes = Object.assign({}, s.pageSizes, { [pk]: n }); const b = bus(); if (b) b.set('grid.pageSizes', pageSizes); return { pageSizes, pages: Object.assign({}, s.pages, { [pk]: 1 }) }; });
      const pageRows = all.slice((cur - 1) * PZ, cur * PZ);
      const arrow = (dir, disabled, onClick) => h('button', { onClick, disabled, style: { border: `1px solid ${c.border}`, background: c.win, color: disabled ? c.sub : c.text, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'default' : 'pointer', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, h('span', { style: { display: 'flex', transform: `rotate(${dir}deg)` } }, Icon('arrowdown', 12)));
      const sizeOpts = [5, 10, 20, 50, 100];
      const sizePicker = all.length > Math.min(...sizeOpts) ? h('div', { key: 'sz', style: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: c.sub } },
        h('span', null, 'แสดง'), h('select', { value: PZ, onChange: e => setPageSize(parseInt(e.target.value, 10)), style: { border: `1px solid ${c.border}`, background: c.win, color: c.text, borderRadius: 7, padding: '4px 6px', fontSize: 11.5, fontFamily: c.font, cursor: 'pointer' } }, sizeOpts.map(n => h('option', { key: n, value: n }, n))), h('span', null, 'แถว/หน้า')) : null;
      const nav = h('div', { key: 'pg', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '10px 4px 0' } },
        h('div', { style: { fontSize: 11.5, color: c.sub } }, all.length ? `แสดง ${(cur - 1) * PZ + 1}–${Math.min(cur * PZ, all.length)} จาก ${all.length} รายการ` : 'ไม่มีข้อมูล'),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' } },
          sizePicker,
          pageCount > 1 ? h('div', { style: { display: 'flex', alignItems: 'center', gap: 4 } },
            arrow(90, cur <= 1, () => setPage(cur - 1)),
            Array.from({ length: pageCount }, (_, i) => i + 1).map(p => h('button', { key: p, onClick: () => setPage(p), style: { border: `1px solid ${p === cur ? c.acc : c.border}`, background: p === cur ? c.acc : c.win, color: p === cur ? '#fff' : c.text, cursor: 'pointer', borderRadius: 7, width: 28, height: 28, fontSize: 12, fontWeight: 600, fontFamily: c.font } }, p)),
            arrow(-90, cur >= pageCount, () => setPage(cur + 1))) : null));
      const FMTS = [
        ['csv', 'CSV (.csv)', 'เปิดได้ทุกโปรแกรม รองรับภาษาไทย', 'doc'],
        ['xls', 'Excel (.xls)', 'เปิดใน Microsoft Excel ได้ทันที', 'reports'],
        ['json', 'JSON (.json)', 'สำหรับส่งต่อระบบอื่นหรือ API', 'settings'],
        ['txt', 'ข้อความคั่นแท็บ (.txt)', 'วางลง Excel / Google Sheets', 'list']
      ];
      const fmt = this.state.expFmt || 'csv';
      const runExport = () => { if (fmt === 'csv') this._csv(',', '.csv'); else if (fmt === 'txt') this._csv('\t', '.txt'); else if (fmt === 'xls') this._xls(); else this._json(); };
      const dialog = this.state.expOpen ? h('div', { onClick: () => this.setState({ expOpen: false }), style: { position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(15,18,28,.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 } },
        h('div', { onClick: e => e.stopPropagation(), style: { width: 440, maxWidth: '100%', maxHeight: '90%', overflow: 'auto', background: c.card, border: '1px solid ' + c.border, borderRadius: c.radius + 6, boxShadow: '0 24px 60px rgba(0,0,0,.28)', padding: 20, fontFamily: c.font, color: c.text } },
          h('div', { key: 'h', style: { fontSize: 16, fontWeight: 800, marginBottom: 4 } }, 'ส่งออกข้อมูล'),
          h('div', { key: 's', style: { fontSize: 12, color: c.sub, marginBottom: 16 } }, (this.props.exportName || 'ข้อมูล') + ' · ' + all.length + ' รายการ · ' + (this.props.cols || []).filter(cc => cc.h).length + ' คอลัมน์'),
          h('div', { key: 'o', style: { display: 'flex', flexDirection: 'column', gap: 8 } }, FMTS.map(([id, lb, hint, ic]) => h('label', { key: id, style: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: '1px solid ' + (fmt === id ? c.acc : c.border), background: fmt === id ? c.winHead : c.win } },
            h('input', { type: 'radio', checked: fmt === id, onChange: () => this.setState({ expFmt: id }), style: { marginTop: 3, cursor: 'pointer' } }),
            h('span', { style: { display: 'flex', color: fmt === id ? c.acc : c.sub, marginTop: 1 } }, Icon(ic, 16)),
            h('span', null, h('div', { style: { fontSize: 13, fontWeight: 700 } }, lb), h('div', { style: { fontSize: 11.5, color: c.sub, marginTop: 2 } }, hint))))),
          h('div', { key: 'f', style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 } },
            h('button', { onClick: () => this.setState({ expOpen: false }), style: { padding: '9px 15px', borderRadius: 9, border: '1px solid ' + c.border, background: c.win, color: c.text, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: c.font } }, 'ยกเลิก'),
            h('button', { onClick: runExport, style: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: 'none', background: c.acc, color: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: c.font } }, Icon('arrowdown', 15), 'ส่งออก')))) : null;
      const toolbar = h('div', { key: 'gt', style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 } },
        h('div', { style: { position: 'relative', flex: '0 1 260px', minWidth: 180 } },
          h('span', { style: { position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: c.sub } }, Icon('search', 15)),
          h('input', { value: this.state.qs, onChange: e => this.setState({ qs: e.target.value, pages: {} }), placeholder: 'ค้นหาในตาราง', style: Object.assign({}, inp(T), { paddingLeft: 32 }) })),
        h('div', { style: { flex: 1 } }),
        this.state.qs ? h('span', { style: { fontSize: 11.5, color: c.sub } }, 'พบ ' + all.length + ' รายการ') : null,
        h('button', { onClick: () => this.setState({ expOpen: true }), style: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 9, border: '1px solid ' + c.border, background: c.win, color: c.text, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: c.font } }, Icon('arrowdown', 15), 'ส่งออก'),
        this.props.actions || null);
      return h('div', null, toolbar, dialog, card(T, [(() => {
        const openFn = onRow || null;
        const effSel = this.state.selRow || selRow || null;
        const selectFn = (r) => { if (this.props.onSelect) this.props.onSelect(r); this.setState({ selRow: r }); };
        return table(T, this._cols(), pageRows, openFn, effSel, sortCfg, GRID.minH(PZ), selectFn);
      })()]), nav);
    }
  }
  const grid = (T, cols, rows, onRow, selRow, sortCfg, pageSize, pageKey, focus, exportName, actions, onSelect) => h(GridCmp, { T, cols, rows, onRow, selRow, sortCfg, pageSize, pageKey, focus, exportName, actions, onSelect });

  function table(T, cols, rows, onRow, selRow, sortCfg, fixedHeight, onSelect) {
    const c = tk(T);
    const sortable = !!(sortCfg && sortCfg.onSort);
    const dfltKey = defaultSortKeyOf(cols);
    const actKey = (sortCfg && sortCfg.key) ? sortCfg.key : dfltKey;
    const actDir = (sortCfg && sortCfg.key) ? sortCfg.dir : 'asc';
    return h('div', { style: { overflow: 'auto', border: `1px solid ${c.border}`, borderRadius: c.radius + 2, background: c.card, height: fixedHeight || 'auto' } },
      h('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: 12.5 } },
        h('thead', null, h('tr', { style: { background: c.winHead } }, cols.map((col, i) => {
          const canSort = sortable && col.k;
          const active = canSort && actKey === col.k;
          return h('th', {
            key: i, onClick: canSort ? () => sortCfg.onSort(col.k) : undefined,
            style: { textAlign: col.r ? 'right' : 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: active ? c.acc : c.sub, whiteSpace: 'nowrap', borderBottom: `1px solid ${c.border}`, cursor: canSort ? 'pointer' : 'default', userSelect: 'none' }
          }, h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 4 } }, col.h,
            canSort ? h('span', { style: { display: 'flex', opacity: active ? 1 : 0.35, transform: active && actDir === 'asc' ? 'rotate(180deg)' : 'none' } }, Icon('arrowdown', 10)) : null));
        }))),
        h('tbody', null, rows.length ? rows.map((r, ri) => {
          const seld = selRow && (r === selRow || (r.no != null && selRow.no != null ? r.no === selRow.no : (r.code != null && selRow.code != null ? r.code === selRow.code : r.name_th != null && r.name_th === selRow.name_th)));
          const selBg = c.dark ? `color-mix(in oklch, ${c.acc} 22%, ${c.winHead})` : `color-mix(in oklch, ${c.acc} 12%, ${c.winHead})`;
          const hovBg = c.dark ? 'rgba(120,160,255,.07)' : 'rgba(60,110,240,.05)';
          const interactive = !!(onSelect || onRow);
          return h('tr', {
            key: ri,
            onClick: onSelect ? () => onSelect(r) : (onRow ? () => onRow(r) : undefined),
            onDoubleClick: onRow ? () => onRow(r) : undefined,
            style: { height: GRID.ROW_H, borderBottom: `1px solid ${c.line}`, cursor: interactive ? 'pointer' : 'default', userSelect: 'none', background: seld ? selBg : 'transparent', boxShadow: seld ? `inset 3px 0 0 ${c.acc}` : 'none' },
            onMouseEnter: (e) => { if (!seld) e.currentTarget.style.background = hovBg; },
            onMouseLeave: (e) => { e.currentTarget.style.background = seld ? selBg : 'transparent'; },
          }, cols.map((col, ci) => h('td', { key: ci, style: { height: GRID.ROW_H, boxSizing: 'border-box', textAlign: col.r ? 'right' : 'left', padding: '0 14px', fontWeight: col.b ? 600 : 400, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
            typeof col.render === 'function' ? col.render(r) : r[col.k])));
        }) : h('tr', null, h('td', { colSpan: cols.length, style: { height: GRID.ROW_H * 2, textAlign: 'center', color: c.sub, fontSize: 12.5 } }, 'ไม่มีข้อมูล')))));
  }

  function kpi(T, cards) {
    const c = tk(T);
    return h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 14 } },
      cards.map((cc, i) => card(T, [
        h('div', { key: 0, style: { fontSize: 11.5, color: c.sub, fontWeight: 600, marginBottom: 6 } }, cc[0]),
        h('div', { key: 1, style: { fontSize: 22, fontWeight: 800, letterSpacing: -.5 } }, cc[1]),
        h('div', { key: 2, style: { fontSize: 11, color: `oklch(0.6 0.14 ${cc[3] || 145})`, fontWeight: 600, marginTop: 3 } }, cc[2]),
      ])));
  }

  function sectionHead(T, title, sub, right) {
    const c = tk(T);
    return h('div', { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' } },
      h('div', null,
        h('div', { style: { fontSize: 18, fontWeight: 800, letterSpacing: -.3 } }, title),
        sub && h('div', { style: { fontSize: 11.5, color: c.sub, marginTop: 2 } }, sub)),
      right);
  }

  const inp = (T) => { const c = tk(T); return { width: '100%', padding: '10px 11px', borderRadius: 8, border: `1px solid ${c.border}`, background: c.win, color: c.text, fontSize: 12.5, lineHeight: 1.7, fontFamily: c.font, outline: 'none', boxSizing: 'border-box' }; };
  function field(T, label, node, req, fw) {
    const c = tk(T);
    return h('label', { key: label, style: { display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, gridColumn: fw ? '1 / -1' : 'auto' } },
      h('span', { style: { fontSize: 11.5, fontWeight: 600, color: c.sub } }, label, req && h('span', { style: { color: 'oklch(0.6 0.18 25)' } }, ' *')), node);
  }
  const txt = (T, ph, val) => h('input', { placeholder: ph, defaultValue: val || '', style: inp(T) });
  const sel = (T, opts, val) => h('select', { defaultValue: val, style: Object.assign({}, inp(T), { cursor: 'pointer' }) }, opts.map(o => h('option', { key: o, value: o }, o)));
  function roField(T, v) { const c = tk(T); return h('div', { title: (typeof v === 'string' ? v : ''), style: Object.assign({}, inp(T), { background: c.dark ? 'oklch(0.26 0.01 265)' : 'oklch(0.975 0.004 255)', color: c.text, minHeight: 20, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }) }, v || '—'); }
  function formSec(T, title, icon, children, cols) {
    const c = tk(T);
    return card(T, [
      h('div', { key: 'h', style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } }, h('span', { style: { display: 'flex', color: c.acc } }, Icon(icon, 16)), h('span', { style: { fontSize: 13.5, fontWeight: 700 } }, title)),
      h('div', { key: 'g', style: { display: 'grid', gridTemplateColumns: `repeat(${cols || 2},1fr)`, gap: 14 } }, children),
    ], { marginBottom: 14 });
  }

  return { h, tk, Icon, GRID, grid, bus, dbWire, dbPersist, sheetsBind, sheetsBadge, sheetsLoading, coBrFilter, coBrDropdown, coBrState, liveCoBr, orgDbMaster, card, pill, badge, btn, table, kpi, sectionHead, field, txt, sel, roField, formSec, inp };
}
