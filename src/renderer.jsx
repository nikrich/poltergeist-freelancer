// Freelancer renderer: quotes (work items → composer) + settings tabs.
// React is bundled into dist/renderer.mjs; the host mounts via mount(el, api).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
// pure lib shared with main — esbuild bundles the cjs module for the browser
import { computeTotals, formatMoney } from './lib/money.cjs';

/* ---------- tiny styling system on the host theme ---------- */
let T = {};
const t = (k, fb) => T[k] || fb;
const S = () => ({
  ink0: t('--ink-0', '#F2F3F5'),
  ink1: t('--ink-1', '#B7BAC2'),
  ink2: t('--ink-2', '#7A7E88'),
  paper: t('--paper', '#0E0F12'),
  vellum: t('--vellum', '#15171B'),
  fog: t('--fog', '#1E2026'),
  hairline: t('--hairline', 'rgba(242,243,245,0.08)'),
  hairline2: t('--hairline-2', 'rgba(242,243,245,0.14)'),
  neon: t('--neon', '#C5FF3D'),
  oxblood: t('--oxblood', '#FF6B5A'),
  moss: t('--moss', '#5C7C4F'),
});

const inputStyle = (s) => ({
  background: s.paper,
  border: `1px solid ${s.hairline2}`,
  borderRadius: 6,
  color: s.ink0,
  fontSize: 12,
  padding: '6px 8px',
  outline: 'none',
  width: '100%',
});

const btnStyle = (s, primary) => ({
  background: primary ? s.neon : 'transparent',
  color: primary ? s.paper : s.ink1,
  border: primary ? 'none' : `1px solid ${s.hairline2}`,
  borderRadius: 6,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: primary ? 600 : 400,
  cursor: 'pointer',
});

function Panel({ title, s, action, children }) {
  return (
    <div style={{ background: s.vellum, border: `1px solid ${s.hairline}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: s.ink2 }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function ErrorBanner({ error, s }) {
  if (!error) return null;
  return <div style={{ color: s.oxblood, fontSize: 12, margin: '8px 0' }}>{error}</div>;
}

/* ---------- quotes tab ---------- */

function WorkItems({ api, s, onQuote }) {
  const [items, setItems] = useState([]);
  const [recent, setRecent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');

  const sweep = useCallback(async (force) => {
    setBusy(true);
    setError('');
    try {
      const res = await api.ipc.invoke('quotes:sweep', { force });
      setItems(res.items);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [api]);

  useEffect(() => {
    const off = api.ipc.on('quotes:sweep-progress', (p) => setProgress(p));
    void sweep(false);
    return off;
  }, [api, sweep]);

  const dismiss = async (id) => {
    try {
      await api.ipc.invoke('quotes:dismiss', id);
      setItems((xs) => xs.filter((i) => i.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <Panel
        title="work items"
        s={s}
        action={
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {progress && <span style={{ fontSize: 11, color: s.ink2 }}>{progress.done}/{progress.total}</span>}
            <button style={btnStyle(s, true)} disabled={busy} onClick={() => void sweep(true)}>
              {busy ? 'sweeping…' : 'sweep vault'}
            </button>
          </span>
        }
      >
        <ErrorBanner error={error} s={s} />
        {items.length === 0 && !busy && (
          <div style={{ fontSize: 12, color: s.ink2 }}>no open work requests found — sweep again after new mail lands, or pick a note below.</div>
        )}
        {items.map((i) => (
          <div key={i.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderTop: `1px solid ${s.hairline}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: s.ink0 }}>
                {i.title}
                <span style={{ fontWeight: 400, color: s.ink2 }}> · {i.client}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: s.ink2 }}> · {(i.confidence * 100) | 0}%</span>
              </div>
              <div style={{ fontSize: 12, color: s.ink1 }}>{i.ask}</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: s.ink2 }}>{i.sourceNote}</div>
            </div>
            <button style={btnStyle(s, true)} onClick={() => onQuote({ itemId: i.id })}>quote this</button>
            <button style={btnStyle(s, false)} title="dismiss" onClick={() => void dismiss(i.id)}>✕</button>
          </div>
        ))}
      </Panel>

      <Panel
        title="quote any note"
        s={s}
        action={
          recent === null ? (
            <button
              style={btnStyle(s, false)}
              onClick={async () => {
                try {
                  setRecent(await api.ipc.invoke('quotes:recent-notes'));
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              browse recent notes
            </button>
          ) : (
            <button style={btnStyle(s, false)} onClick={() => setRecent(null)}>hide</button>
          )
        }
      >
        {recent?.map((n) => (
          <div key={n.path} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderTop: `1px solid ${s.hairline}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 12, color: s.ink0 }}>{n.title}</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: s.ink2 }}> · {n.path}</span>
            </div>
            <button style={btnStyle(s, false)} onClick={() => onQuote({ notePath: n.path })}>quote</button>
          </div>
        ))}
        {recent?.length === 0 && <div style={{ fontSize: 12, color: s.ink2 }}>no recent notes in the sweep window.</div>}
      </Panel>
    </>
  );
}

function Composer({ api, s, draftRef, config, onDone, onBack }) {
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const rates = config?.rates ?? { currency: 'EUR', default: 0, named: [] };
  const rateNames = useMemo(() => ['default', ...rates.named.map((r) => r.name)], [rates]);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    api.ipc
      .invoke('quotes:draft', draftRef)
      .then((d) => alive && setQuote(d))
      .catch((e) => alive && setError(`drafting failed: ${e.message}`))
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [api, draftRef]);

  if (busy && !quote) return <div style={{ fontSize: 12, color: s.ink2, padding: 20 }}>summoning a draft…</div>;
  if (error && !quote) return (
    <div style={{ padding: 8 }}>
      <ErrorBanner error={error} s={s} />
      <button style={btnStyle(s, false)} onClick={onBack}>← back</button>
    </div>
  );
  if (!quote) return null;

  const { rows, total } = computeTotals(quote.lineItems, rates);
  const upd = (patch) => setQuote((q) => ({ ...q, ...patch }));
  const updLine = (idx, patch) =>
    upd({ lineItems: quote.lineItems.map((li, i) => (i === idx ? { ...li, ...patch } : li)) });

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      setResult(await api.ipc.invoke('quotes:generate', quote));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <Panel title="quote generated" s={s}>
        <div style={{ fontSize: 13, color: s.ink0, marginBottom: 8 }}>
          {quote.client} — {formatMoney(total, rates.currency)}
        </div>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: s.ink1, marginBottom: 12 }}>
          {result.pdfPath}
          <br />
          {result.notePath}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnStyle(s, true)} onClick={() => api.openExternal('file://' + result.pdfPath)}>open pdf</button>
          <button style={btnStyle(s, false)} onClick={onDone}>done</button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="quote composer" s={s} action={<button style={btnStyle(s, false)} onClick={onBack}>← back</button>}>
      <ErrorBanner error={error} s={s} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <label style={{ fontSize: 11, color: s.ink2 }}>
          client
          <input style={inputStyle(s)} value={quote.client} onChange={(e) => upd({ client: e.target.value })} />
        </label>
        <label style={{ fontSize: 11, color: s.ink2 }}>
          project
          <input style={inputStyle(s)} value={quote.project ?? ''} onChange={(e) => upd({ project: e.target.value })} />
        </label>
      </div>
      <label style={{ fontSize: 11, color: s.ink2, display: 'block', marginBottom: 10 }}>
        scope
        <textarea rows={3} style={{ ...inputStyle(s), resize: 'vertical' }} value={quote.scopeSummary ?? ''} onChange={(e) => upd({ scopeSummary: e.target.value })} />
      </label>

      {quote.lineItems.map((li, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <input style={{ ...inputStyle(s), flex: 3 }} value={li.description} onChange={(e) => updLine(idx, { description: e.target.value })} />
          <input style={{ ...inputStyle(s), flex: 1 }} type="number" min="0" step="0.5" value={li.hours} onChange={(e) => updLine(idx, { hours: e.target.value })} />
          <select style={{ ...inputStyle(s), flex: 2 }} value={rateNames.includes(li.rate) ? li.rate : 'default'} onChange={(e) => updLine(idx, { rate: e.target.value })}>
            {rateNames.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: s.ink1, width: 90, textAlign: 'right' }}>
            {formatMoney(rows[idx]?.amount ?? 0, rates.currency)}
          </span>
          <button style={btnStyle(s, false)} onClick={() => upd({ lineItems: quote.lineItems.filter((_, i) => i !== idx) })}>✕</button>
        </div>
      ))}
      <button style={{ ...btnStyle(s, false), marginBottom: 12 }} onClick={() => upd({ lineItems: [...quote.lineItems, { description: '', hours: 1, rate: 'default' }] })}>
        + line item
      </button>

      <label style={{ fontSize: 11, color: s.ink2, display: 'block', marginBottom: 12 }}>
        assumptions (one per line)
        <textarea
          rows={3}
          style={{ ...inputStyle(s), resize: 'vertical' }}
          value={(quote.assumptions ?? []).join('\n')}
          onChange={(e) => upd({ assumptions: e.target.value.split('\n').filter(Boolean) })}
        />
      </label>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: s.neon }}>{formatMoney(total, rates.currency)}</span>
        <button style={btnStyle(s, true)} disabled={busy} onClick={() => void generate()}>
          {busy ? 'generating…' : 'generate pdf'}
        </button>
      </div>
    </Panel>
  );
}

function QuotesTab({ api, s, config }) {
  const [draftRef, setDraftRef] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(() => {
    api.ipc.invoke('quotes:list').then(setHistory).catch(() => {});
  }, [api]);
  useEffect(loadHistory, [loadHistory]);

  if (draftRef) {
    return (
      <Composer
        api={api}
        s={s}
        draftRef={draftRef}
        config={config}
        onBack={() => setDraftRef(null)}
        onDone={() => {
          setDraftRef(null);
          loadHistory();
        }}
      />
    );
  }
  return (
    <>
      <WorkItems api={api} s={s} onQuote={setDraftRef} />
      {history.length > 0 && (
        <Panel title="quote history" s={s}>
          {history.map((h) => (
            <div key={h.file} style={{ display: 'flex', gap: 10, padding: '6px 0', borderTop: `1px solid ${s.hairline}`, fontSize: 12 }}>
              <span style={{ flex: 1, color: s.ink0 }}>{h.client}{h.project ? ` — ${h.project}` : ''}</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', color: s.ink1 }}>{formatMoney(h.total, h.currency || 'EUR')}</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', color: s.ink2 }}>{h.generated.slice(0, 10)}</span>
            </div>
          ))}
        </Panel>
      )}
    </>
  );
}

/* ---------- settings tab ---------- */

function SettingsTab({ api, s, config, setConfig }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const brand = config.brand;
  const rates = config.rates;

  const save = async (next) => {
    setConfig(next);
    setSaved(false);
    try {
      await api.settings.set('config', next);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError(e.message);
    }
  };
  const upBrand = (patch) => save({ ...config, brand: { ...brand, ...patch } });
  const upRates = (patch) => save({ ...config, rates: { ...rates, ...patch } });

  const pickLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => upBrand({ logoDataUri: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const field = (label, value, onChange, extra = {}) => (
    <label style={{ fontSize: 11, color: s.ink2, display: 'block', marginBottom: 8 }}>
      {label}
      <input style={inputStyle(s)} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...extra} />
    </label>
  );

  return (
    <>
      <Panel title="branding" s={s} action={saved && <span style={{ fontSize: 11, color: s.moss }}>saved</span>}>
        <ErrorBanner error={error} s={s} />
        {field('business name', brand.businessName, (v) => upBrand({ businessName: v }))}
        {field('contact line', brand.contactLine, (v) => upBrand({ contactLine: v }))}
        {field('accent color', brand.accentColor, (v) => upBrand({ accentColor: v }))}
        {field('payment terms', brand.paymentTerms, (v) => upBrand({ paymentTerms: v }))}
        {field('quote validity (days)', brand.validityDays, (v) => upBrand({ validityDays: Number(v) || 14 }), { type: 'number' })}
        <label style={{ fontSize: 11, color: s.ink2, display: 'block' }}>
          logo
          <input type="file" accept="image/*" onChange={pickLogo} style={{ display: 'block', marginTop: 4, color: s.ink1, fontSize: 11 }} />
        </label>
        {brand.logoDataUri && <img src={brand.logoDataUri} alt="logo" style={{ height: 36, marginTop: 8 }} />}
      </Panel>

      <Panel title="rates" s={s}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {field('currency', rates.currency, (v) => upRates({ currency: v.toUpperCase().slice(0, 3) }))}
          {field('default hourly rate', rates.default, (v) => upRates({ default: Number(v) || 0 }), { type: 'number' })}
        </div>
        {rates.named.map((r, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input style={{ ...inputStyle(s), flex: 2 }} placeholder="name (e.g. development)" value={r.name} onChange={(e) => upRates({ named: rates.named.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)) })} />
            <input style={{ ...inputStyle(s), flex: 1 }} type="number" value={r.hourly} onChange={(e) => upRates({ named: rates.named.map((x, i) => (i === idx ? { ...x, hourly: Number(e.target.value) || 0 } : x)) })} />
            <button style={btnStyle(s, false)} onClick={() => upRates({ named: rates.named.filter((_, i) => i !== idx) })}>✕</button>
          </div>
        ))}
        <button style={btnStyle(s, false)} onClick={() => upRates({ named: [...rates.named, { name: '', hourly: 0 }] })}>+ named rate</button>
      </Panel>

      <Panel title="vault" s={s}>
        {field('vault path', config.vaultPath, (v) => save({ ...config, vaultPath: v }))}
      </Panel>
    </>
  );
}

/* ---------- app shell ---------- */

const DEFAULT_CONFIG = {
  vaultPath: '~/ghostbrain/vault',
  brand: { businessName: '', logoDataUri: '', accentColor: '#C5FF3D', contactLine: '', paymentTerms: '50% upfront, balance on delivery', validityDays: 14 },
  rates: { currency: 'EUR', default: 0, named: [] },
};

function App({ api }) {
  const s = S();
  const [tab, setTab] = useState('quotes');
  const [config, setConfig] = useState(null);

  useEffect(() => {
    api.settings
      .get('config')
      .then((c) => setConfig({ ...DEFAULT_CONFIG, ...(c ?? {}), brand: { ...DEFAULT_CONFIG.brand, ...(c?.brand ?? {}) }, rates: { ...DEFAULT_CONFIG.rates, ...(c?.rates ?? {}) } }))
      .catch(() => setConfig(DEFAULT_CONFIG));
  }, [api]);

  if (!config) return null;

  const tabBtn = (id, label) => (
    <button
      style={{
        ...btnStyle(s, false),
        border: 'none',
        borderBottom: tab === id ? `2px solid ${s.neon}` : '2px solid transparent',
        borderRadius: 0,
        color: tab === id ? s.ink0 : s.ink2,
        fontWeight: tab === id ? 600 : 400,
      }}
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  );

  return (
    <div style={{ padding: 18, color: s.ink0, fontSize: 13, fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${s.hairline}`, marginBottom: 14 }}>
        {tabBtn('quotes', 'quotes')}
        {tabBtn('settings', 'settings')}
      </div>
      {tab === 'quotes' ? <QuotesTab api={api} s={s} config={config} /> : <SettingsTab api={api} s={s} config={config} setConfig={setConfig} />}
    </div>
  );
}

export function mount(el, api) {
  T = api.theme ?? {};
  const root = createRoot(el);
  root.render(<App api={api} />);
  return () => root.unmount();
}
