// Quotes tab: work items → composer → generated quote. Moved from renderer.jsx
// verbatim (pre-redesign); imports now come from the shared kit.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { computeTotals, formatMoney } from '../../lib/money.cjs';
import { Panel, ErrorBanner, btnStyle, inputStyle } from '../kit.jsx';

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

export function QuotesTab({ api, s, config }) {
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
