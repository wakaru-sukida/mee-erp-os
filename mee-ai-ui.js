// mee-ai-ui.js — Mee-ERP OS shared AI surfaces (settings panel + assistant dock).
// Host-neutral factory, same contract as erp-kit.js: createAIUI(React, K) -> helpers.
// K is the erp-kit instance (for btn/card/pill/Icon/tk).

export function createAIUI(React, K) {
  const h = React.createElement;
  const AI = (typeof window !== 'undefined' && window.MeeAI) || null;

  const PROVIDERS = [
    ['auto', 'อัตโนมัติ', 'เลือกช่องทางที่ใช้ได้เองตามลำดับ'],
    ['proxy', 'Apps Script Relay', 'คีย์เก็บฝั่ง server — แนะนำสำหรับ deploy'],
    ['direct', 'API Key ในเบราว์เซอร์', 'ง่ายสุด แต่คีย์อยู่ฝั่งผู้ใช้'],
    ['host', 'Design Host', 'ใช้ได้เฉพาะตอนเปิดในตัวแก้ไขดีไซน์'],
  ];
  const MODELS = [
    ['claude-sonnet-4-5', 'Sonnet 4.5', 'ฉลาดกว่า — วิเคราะห์เอกสาร/แนะนำผู้ขาย'],
    ['claude-haiku-4-5', 'Haiku 4.5', 'เร็วและถูก — ถาม-ตอบทั่วไป'],
  ];

  function field(T, label, value, onChange, opts) {
    const c = K.tk(T); opts = opts || {};
    return h('label', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
      h('span', { style: { fontSize: 11.5, fontWeight: 600, color: c.sub } }, label),
      h('input', {
        value: value || '', onChange: e => onChange(e.target.value),
        type: opts.type || 'text', placeholder: opts.placeholder || '', spellCheck: false,
        style: {
          height: 38, padding: '0 12px', borderRadius: 9, border: '1px solid ' + c.border,
          background: c.field, color: c.text, fontSize: 12.5, fontFamily: c.font,
          fontVariantNumeric: 'tabular-nums',
        },
      }),
      opts.hint ? h('span', { style: { fontSize: 11, color: c.sub, lineHeight: 1.5 } }, opts.hint) : null);
  }

  function radioRow(T, items, cur, onPick) {
    const c = K.tk(T);
    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
      items.map(([id, name, desc]) => {
        const on = cur === id;
        return h('button', {
          key: id, onClick: () => onPick(id),
          style: {
            display: 'flex', alignItems: 'flex-start', gap: 11, textAlign: 'left', cursor: 'pointer',
            padding: '11px 13px', borderRadius: 10, fontFamily: c.font,
            border: '1px solid ' + (on ? c.acc : c.border),
            background: on ? c.accSoft : c.field, color: c.text,
          },
        },
          h('span', {
            style: {
              flexShrink: 0, marginTop: 2, width: 15, height: 15, borderRadius: '50%',
              border: '2px solid ' + (on ? c.acc : c.border), background: on ? c.acc : 'transparent',
              boxShadow: on ? 'inset 0 0 0 2.5px ' + c.field : 'none',
            },
          }),
          h('span', { style: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 } },
            h('span', { style: { fontSize: 13, fontWeight: on ? 700 : 600 } }, name),
            h('span', { style: { fontSize: 11.5, color: c.sub, lineHeight: 1.45 } }, desc)));
      }));
  }

  // ---- AI Settings panel (used by AI Center and ITSA-AIEN) ----
  // cmp must hold state.aiCfg / state.aiTest and call cmp.setState.
  function settingsPanel(T, cmp) {
    const c = K.tk(T);
    if (!AI) return h('div', { style: { fontSize: 13, color: c.sub, padding: 20 } }, 'AI Engine ยังโหลดไม่เสร็จ');
    const cfg = cmp.state.aiCfg || AI.config;
    const test = cmp.state.aiTest || null;
    const set = patch => {
      const next = AI.configure(patch);
      cmp.setState({ aiCfg: next, aiTest: null });
    };
    const run = async () => {
      cmp.setState({ aiTest: { busy: true } });
      const r = await AI.ping();
      cmp.setState({ aiTest: Object.assign({ busy: false }, r) });
    };
    const eff = AI.provider;

    const status = h('div', {
      style: {
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 15px', borderRadius: 11,
        border: '1px solid ' + (AI.ready ? 'oklch(0.75 0.12 150)' : 'oklch(0.8 0.13 70)'),
        background: AI.ready ? 'oklch(0.96 0.04 150)' : 'oklch(0.97 0.05 80)',
        color: AI.ready ? 'oklch(0.4 0.13 150)' : 'oklch(0.42 0.13 60)', marginBottom: 16,
      },
    },
      h('span', { style: { display: 'flex', flexShrink: 0 } }, K.Icon(AI.ready ? 'check' : 'shield', 18)),
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('div', { style: { fontSize: 13, fontWeight: 700 } },
          AI.ready ? 'AI พร้อมใช้งาน' : 'AI ยังไม่ได้ตั้งค่า'),
        h('div', { style: { fontSize: 11.5, opacity: .85, marginTop: 2 } },
          AI.ready
            ? 'ช่องทางที่ใช้จริง: ' + (PROVIDERS.find(p => p[0] === eff) || [, eff])[1] + ' · โมเดล ' + cfg.model
            : 'เลือกช่องทางและใส่ Proxy URL หรือ API Key ด้านล่าง')),
      h('span', { style: { flexShrink: 0 } },
        K.btn(T, test && test.busy ? 'กำลังทดสอบ…' : 'ทดสอบการเชื่อมต่อ', true, 'spark', run)));

    const testOut = test && !test.busy ? h('div', {
      style: {
        fontSize: 12, lineHeight: 1.6, padding: '11px 14px', borderRadius: 10, marginBottom: 16,
        fontFamily: 'ui-monospace,Menlo,Consolas,monospace',
        border: '1px solid ' + c.border, background: c.field,
        color: test.ok ? 'oklch(0.45 0.14 150)' : 'oklch(0.5 0.19 25)',
      },
    }, test.ok
      ? '✓ เชื่อมต่อสำเร็จ · provider=' + test.provider + ' · ตอบกลับ: ' + test.text
      : '✕ ล้มเหลว · provider=' + test.provider + ' · ' + (test.error || '')) : null;

    const proxyBlock = h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
      field(T, 'Apps Script Web App URL', cfg.proxyUrl, v => set({ proxyUrl: v.trim() }), {
        placeholder: 'https://script.google.com/macros/s/…/exec',
        hint: 'วางโค้ดจากไฟล์ mee-ai-appsscript.gs ในโปรเจกต์ Apps Script เดิม ตั้ง Script Property ชื่อ ANTHROPIC_API_KEY แล้ว Deploy โดยตั้ง Who has access = Anyone',
      }));

    const keyBlock = h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
      field(T, 'Anthropic API Key', cfg.apiKey, v => set({ apiKey: v.trim() }), {
        type: 'password', placeholder: 'sk-ant-…',
        hint: 'เก็บใน localStorage ของเบราว์เซอร์เครื่องนี้เท่านั้น เหมาะกับการสาธิต — สำหรับใช้งานจริงแนะนำ Apps Script Relay',
      }));

    return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 720 } },
      status, testOut,
      K.card(T, [
        h('div', { style: { fontSize: 13.5, fontWeight: 800, marginBottom: 4 } }, 'ช่องทางเรียกใช้ AI'),
        h('div', { style: { fontSize: 11.5, color: c.sub, marginBottom: 13 } },
          'โหมดอัตโนมัติจะไล่ลำดับ Design Host → Apps Script Relay → API Key'),
        radioRow(T, PROVIDERS, cfg.provider, v => set({ provider: v })),
      ], { padding: '16px 18px' }),
      K.card(T, [
        h('div', { style: { fontSize: 13.5, fontWeight: 800, marginBottom: 13 } }, 'Apps Script Relay'),
        proxyBlock,
      ], { padding: '16px 18px' }),
      K.card(T, [
        h('div', { style: { fontSize: 13.5, fontWeight: 800, marginBottom: 13 } }, 'API Key ในเบราว์เซอร์'),
        keyBlock,
      ], { padding: '16px 18px' }),
      K.card(T, [
        h('div', { style: { fontSize: 13.5, fontWeight: 800, marginBottom: 13 } }, 'โมเดลเริ่มต้น'),
        radioRow(T, MODELS, cfg.model, v => set({ model: v })),
      ], { padding: '16px 18px' }),
      h('div', { style: { display: 'flex', gap: 10 } },
        K.btn(T, 'ล้างการตั้งค่า', false, null, () => {
          AI.reset(); cmp.setState({ aiCfg: AI.config, aiTest: null });
        })));
  }

  // ---- not-configured nudge, shown where a feature needs AI ----
  function nudge(T, onOpen) {
    const c = K.tk(T);
    return h('div', {
      style: {
        display: 'flex', alignItems: 'center', gap: 11, padding: '13px 15px', borderRadius: 11,
        border: '1px dashed ' + c.border, background: c.field, color: c.text,
      },
    },
      h('span', { style: { display: 'flex', flexShrink: 0, color: c.acc } }, K.Icon('spark', 18)),
      h('div', { style: { flex: 1, minWidth: 0 } },
        h('div', { style: { fontSize: 12.5, fontWeight: 700 } }, 'ยังไม่ได้ตั้งค่า AI'),
        h('div', { style: { fontSize: 11.5, color: c.sub, marginTop: 2, lineHeight: 1.5 } },
          'ตั้งค่าช่องทางเรียกใช้ Claude หนึ่งครั้ง แล้วฟีเจอร์ AI ทุกตัวในระบบจะทำงานทันที')),
      onOpen ? h('span', { style: { flexShrink: 0 } }, K.btn(T, 'ตั้งค่า AI', true, 'settings', onOpen)) : null);
  }

  return { settingsPanel, nudge, field, radioRow, PROVIDERS, MODELS, AI };
}
