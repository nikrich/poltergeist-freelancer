// Quotes tab: work items → composer → generated quote. Moved from renderer.jsx
// verbatim (pre-redesign); imports now come from the shared kit.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computeTotals, formatMoney } from '../../lib/money.cjs';
import { Panel, Btn, Pill, StatusPill, ErrorBanner, btnStyle, inputStyle } from '../kit.jsx';

function WorkItems({ api, s, onQuote }) {
  const [items, setItems] = useState([]);
  const [recent, setRecent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(0);

  const sweep = useCallback(async (force) => {
    setBusy(true);
    setError('');
    try {
      const res = await api.ipc.invoke('quotes:sweep', { force });
      setItems(res.items);
      setRemaining(res.remaining ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [api]);

  useEffect(() => {
    const off = api.ipc.on('quotes:sweep-progress', (p) => setProgress(p));
    // Cheap cache read — no LLM, no vault scan. The sweep button is the only
    // thing that triggers quotes:sweep; a tab visit must never cost an LLM pass.
    api.ipc
      .invoke('quotes:items')
      .then((res) => setItems(res.items))
      .catch((e) => setError(e.message));
    return off;
  }, [api]);

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
        {remaining > 0 && (
          <div style={{ fontSize: 11, color: s.ink2, marginBottom: 8 }}>
            {remaining.toLocaleString()} older notes not swept yet — sweep again to continue
          </div>
        )}
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
  const allRatesZero = !rates.default && (rates.named ?? []).every((r) => !r.hourly);

  useEffect(() => {
    let alive = true;
    // Editing an old quote: the caller already loaded it via quotes:load — drop
    // it straight into the composer, no drafting LLM call needed.
    if (draftRef?.prefill) {
      setQuote(draftRef.prefill);
      return;
    }
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
    const openPdf = () => {
      setError('');
      api.ipc.invoke('files:open', result.pdfPath).catch((e) => setError(e.message));
    };
    return (
      <Panel title="quote generated" s={s}>
        <ErrorBanner error={error} s={s} />
        <div style={{ fontSize: 13, color: s.ink0, marginBottom: 8 }}>
          {quote.client} — {formatMoney(total, rates.currency)}
        </div>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: s.ink1, marginBottom: 12 }}>
          {result.pdfPath}
          <br />
          {result.notePath}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnStyle(s, true)} onClick={openPdf}>open pdf</button>
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

      {allRatesZero && (
        <div style={{ fontSize: 11, color: s.oxblood, opacity: 0.75, marginBottom: 6 }}>
          all amounts are €0 — set your hourly rates in settings → rates
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: s.neon }}>{formatMoney(total, rates.currency)}</span>
        <button style={btnStyle(s, true)} disabled={busy} onClick={() => void generate()}>
          {busy ? 'generating…' : 'generate pdf'}
        </button>
      </div>
    </Panel>
  );
}

function HistoryRow({ s, row, busy, onSetStatus, onConvert, onOpen, onEdit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: `1px solid ${s.hairline}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: s.ink0 }}>{row.client}</span>
          {row.project && <span style={{ color: s.ink2 }}> · {row.project}</span>}
        </div>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: s.ink2, marginTop: 2 }}>
          {formatMoney(row.total, row.currency || 'EUR')} · {(row.generated || '').slice(0, 10)}
        </div>
      </div>
      {row.pdf && (
        <Btn s={s} disabled={busy} onClick={() => onOpen('pdf')}>pdf</Btn>
      )}
      <Btn s={s} disabled={busy} onClick={() => onOpen('note')}>note</Btn>
      <Btn s={s} disabled={busy} onClick={onEdit}>edit</Btn>
      <StatusPill s={s} status={row.status} />
      {row.status === 'draft' && (
        <Btn s={s} disabled={busy} onClick={() => onSetStatus('sent')}>mark sent</Btn>
      )}
      {row.status === 'sent' && (
        <>
          <Btn s={s} danger disabled={busy} onClick={() => onSetStatus('declined')}>declined</Btn>
          <Btn s={s} disabled={busy} onClick={() => onSetStatus('accepted')}>accepted</Btn>
        </>
      )}
      {row.status === 'declined' && (
        <Btn s={s} disabled={busy} onClick={() => onSetStatus('sent')}>mark sent</Btn>
      )}
      {row.status === 'accepted' && !row.invoiced && (
        <Btn s={s} primary disabled={busy} onClick={onConvert}>convert to invoice</Btn>
      )}
      {row.invoiced && <Pill s={s} tone="outline">invoiced</Pill>}
    </div>
  );
}

function QuoteHistory({ api, s, history, onRefresh, setTab, setPendingInvoiceDraft, onEdit }) {
  const [error, setError] = useState('');
  const [busyFile, setBusyFile] = useState(null);

  const setStatus = async (file, status) => {
    setError('');
    setBusyFile(file);
    try {
      await api.ipc.invoke('quotes:set-status', { file, status });
      await onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyFile(null);
    }
  };

  const convert = async (file) => {
    setError('');
    setBusyFile(file);
    try {
      const draft = await api.ipc.invoke('invoices:draft', { quoteFile: file });
      setPendingInvoiceDraft(draft);
      setTab('invoices');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyFile(null);
    }
  };

  const open = async (file, which) => {
    setError('');
    setBusyFile(file);
    try {
      await api.ipc.invoke('quotes:open', { file, which });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyFile(null);
    }
  };

  const edit = async (file) => {
    setError('');
    setBusyFile(file);
    try {
      const loaded = await api.ipc.invoke('quotes:load', { file });
      onEdit(loaded);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyFile(null);
    }
  };

  if (history.length === 0) return null;

  return (
    <Panel title="quote history" s={s}>
      <ErrorBanner error={error} s={s} />
      {history.map((row) => (
        <HistoryRow
          key={row.file}
          s={s}
          row={row}
          busy={busyFile === row.file}
          onSetStatus={(status) => void setStatus(row.file, status)}
          onConvert={() => void convert(row.file)}
          onOpen={(which) => void open(row.file, which)}
          onEdit={() => void edit(row.file)}
        />
      ))}
    </Panel>
  );
}

export function QuotesTab({ api, s, config, setTab, setPendingInvoiceDraft }) {
  const [draftRef, setDraftRef] = useState(null);
  const [history, setHistory] = useState([]);

  // Sequence guard: history refreshes fire from mount and from every status
  // action / composer generate; only the most recently *started* refresh is
  // allowed to land (same idiom as clients.jsx's listSeqRef).
  const historySeqRef = useRef(0);
  const loadHistory = useCallback(async () => {
    const seq = ++historySeqRef.current;
    try {
      const list = await api.ipc.invoke('quotes:list');
      if (seq !== historySeqRef.current) return; // a newer refresh has since started; drop this stale result
      setHistory(list);
    } catch {
      // history is best-effort here; per-action errors surface in QuoteHistory's own banner
    }
  }, [api]);
  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

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
          void loadHistory();
        }}
      />
    );
  }
  return (
    <>
      <WorkItems api={api} s={s} onQuote={setDraftRef} />
      <QuoteHistory
        api={api}
        s={s}
        history={history}
        onRefresh={loadHistory}
        setTab={setTab}
        setPendingInvoiceDraft={setPendingInvoiceDraft}
        onEdit={(loaded) => setDraftRef({ prefill: loaded })}
      />
    </>
  );
}
