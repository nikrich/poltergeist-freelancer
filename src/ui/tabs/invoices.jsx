// Invoices tab: list (draft/sent/paid, overdue highlighting) + composer
// (from an accepted quote, a client, or blank). Follows the quotes.jsx
// composer + seq-guard refresh idiom; layout per docs/design/fk-invoices.jsx
// (visual reference only — no window.Poltergeist/Lucide here, kit primitives
// and text affordances instead).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computeTotals, formatMoney } from '../../lib/money.cjs';
import { Panel, Btn, ErrorBanner, StatusPill, btnStyle, inputStyle } from '../kit.jsx';

const menuItemStyle = (s) => ({
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '8px 10px',
  border: 'none',
  background: 'transparent',
  color: s.ink1,
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
});

const menuStyle = (s) => ({
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: 6,
  zIndex: 20,
  minWidth: 220,
  background: s.fog,
  border: `1px solid ${s.hairline2}`,
  borderRadius: 8,
  padding: 4,
  boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
});

function NewInvoiceMenu({ s, acceptedQuotes, clients, onPick }) {
  // null | 'root' | 'quote' | 'client'
  const [open, setOpen] = useState(null);
  const close = () => setOpen(null);
  const pick = (from) => {
    onPick(from);
    close();
  };

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button style={btnStyle(s, true)} onClick={() => setOpen((o) => (o ? null : 'root'))}>
        + new invoice
      </button>
      {open === 'root' && (
        <div style={menuStyle(s)}>
          <button
            style={{ ...menuItemStyle(s), opacity: acceptedQuotes.length === 0 ? 0.4 : 1 }}
            disabled={acceptedQuotes.length === 0}
            onClick={() => setOpen('quote')}
          >
            from accepted quote{acceptedQuotes.length === 0 ? ' (none)' : ''}
          </button>
          <button style={menuItemStyle(s)} onClick={() => setOpen('client')}>from client</button>
          <button style={menuItemStyle(s)} onClick={() => pick({})}>blank</button>
        </div>
      )}
      {open === 'quote' && (
        <div style={menuStyle(s)}>
          {acceptedQuotes.map((q) => (
            <button key={q.file} style={menuItemStyle(s)} onClick={() => pick({ quoteFile: q.file })}>
              {q.client}{q.project ? ` — ${q.project}` : ''}
            </button>
          ))}
          <button style={menuItemStyle(s)} onClick={() => setOpen('root')}>← back</button>
        </div>
      )}
      {open === 'client' && (
        <div style={menuStyle(s)}>
          {clients.map((c) => (
            <button key={c.id} style={menuItemStyle(s)} onClick={() => pick({ clientId: c.id })}>
              {c.name}
            </button>
          ))}
          {clients.length === 0 && <div style={{ padding: '8px 10px', fontSize: 12, color: s.ink2 }}>no clients yet.</div>}
          <button style={menuItemStyle(s)} onClick={() => setOpen('root')}>← back</button>
        </div>
      )}
    </span>
  );
}

function InvoiceRow({ s, row, busy, onSetStatus }) {
  const overdue = !!row.overdue;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 8px',
        borderTop: `1px solid ${s.hairline}`,
        borderLeft: overdue ? `2px solid ${s.oxblood}` : '2px solid transparent',
        background: overdue ? 'rgba(255,107,90,0.06)' : 'transparent',
        borderRadius: overdue ? 6 : 0,
      }}
    >
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: s.ink1, width: 110, flexShrink: 0 }}>{row.number}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: s.ink0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.client}</span>
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: s.ink0, width: 90, textAlign: 'right', flexShrink: 0 }}>
        {formatMoney(row.total, row.currency || 'EUR')}
      </span>
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: overdue ? s.oxblood : s.ink2, width: 120, textAlign: 'right', flexShrink: 0 }}>
        {overdue ? `${row.daysOverdue}d overdue` : `due ${row.due}`}
      </span>
      <StatusPill s={s} status={overdue ? 'overdue' : row.status} />
      {row.status === 'draft' && (
        <Btn s={s} disabled={busy} onClick={() => onSetStatus('sent')}>mark sent</Btn>
      )}
      {row.status === 'sent' && (
        <Btn s={s} primary disabled={busy} onClick={() => onSetStatus('paid')}>mark paid</Btn>
      )}
    </div>
  );
}

function Composer({ api, s, draft, config, onBack, onDone }) {
  const [inv, setInv] = useState(draft);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const rates = config?.rates ?? { currency: 'EUR', default: 0, named: [] };
  const rateNames = useMemo(() => ['default', ...rates.named.map((r) => r.name)], [rates]);

  const currency = inv.currency || rates.currency;
  const { rows, total: subtotal } = computeTotals(inv.lineItems, rates);
  const vatRate = Number(inv.vatRate) || 0;
  const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;

  const upd = (patch) => setInv((q) => ({ ...q, ...patch }));
  const updLine = (idx, patch) => upd({ lineItems: inv.lineItems.map((li, i) => (i === idx ? { ...li, ...patch } : li)) });

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      await api.ipc.invoke('invoices:generate', { ...inv, vatRate });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="new invoice" s={s} action={<button style={btnStyle(s, false)} onClick={onBack}>← back</button>}>
      <ErrorBanner error={error} s={s} />
      {inv.quoteRef && (
        <div style={{ fontSize: 11, color: s.ink2, marginBottom: 10 }}>from {inv.quoteRef}</div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: s.ink2, marginBottom: 4 }}>number</div>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: s.ink2 }}>{inv.number}</div>
        </div>
        <label style={{ fontSize: 11, color: s.ink2 }}>
          issued
          <input style={inputStyle(s)} value={inv.issued} onChange={(e) => upd({ issued: e.target.value })} />
        </label>
        <label style={{ fontSize: 11, color: s.ink2 }}>
          due
          <input style={inputStyle(s)} value={inv.due} onChange={(e) => upd({ due: e.target.value })} />
        </label>
      </div>

      <label style={{ fontSize: 11, color: s.ink2, display: 'block', marginBottom: 10 }}>
        client
        <input style={inputStyle(s)} value={inv.client} onChange={(e) => upd({ client: e.target.value })} />
      </label>

      {inv.lineItems.map((li, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
          <input style={{ ...inputStyle(s), flex: 3 }} value={li.description} onChange={(e) => updLine(idx, { description: e.target.value })} />
          <input style={{ ...inputStyle(s), flex: 1 }} type="number" min="0" step="0.5" value={li.hours} onChange={(e) => updLine(idx, { hours: e.target.value })} />
          <select style={{ ...inputStyle(s), flex: 2 }} value={rateNames.includes(li.rate) ? li.rate : 'default'} onChange={(e) => updLine(idx, { rate: e.target.value })}>
            {rateNames.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: s.ink1, width: 90, textAlign: 'right' }}>
            {formatMoney(rows[idx]?.amount ?? 0, currency)}
          </span>
          <button style={btnStyle(s, false)} onClick={() => upd({ lineItems: inv.lineItems.filter((_, i) => i !== idx) })}>✕</button>
        </div>
      ))}
      <button style={{ ...btnStyle(s, false), marginBottom: 12 }} onClick={() => upd({ lineItems: [...inv.lineItems, { description: '', hours: 1, rate: 'default' }] })}>
        + line item
      </button>

      <label style={{ fontSize: 11, color: s.ink2, display: 'block', marginBottom: 12, width: 100 }}>
        vat %
        <input
          style={inputStyle(s)}
          type="number"
          min="0"
          max="100"
          value={vatRate}
          onChange={(e) => upd({ vatRate: e.target.value === '' ? 0 : Number(e.target.value) })}
        />
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: s.ink1 }}>
          subtotal <span style={{ fontFamily: 'ui-monospace, monospace' }}>{formatMoney(subtotal, currency)}</span>
        </div>
        {vatAmount > 0 && (
          <div style={{ fontSize: 12, color: s.ink1 }}>
            vat {vatRate}% — <span style={{ fontFamily: 'ui-monospace, monospace' }}>{formatMoney(vatAmount, currency)}</span>
          </div>
        )}
        <div style={{ fontSize: 20, fontWeight: 700, color: s.neon }}>{formatMoney(total, currency)}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button style={btnStyle(s, true)} disabled={busy} onClick={() => void generate()}>
          {busy ? 'generating…' : 'generate pdf'}
        </button>
      </div>
    </Panel>
  );
}

export function InvoicesTab({ api, s, config, pendingInvoiceDraft, setPendingInvoiceDraft }) {
  const [rows, setRows] = useState([]);
  const [clients, setClients] = useState([]);
  const [acceptedQuotes, setAcceptedQuotes] = useState([]);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [busyFile, setBusyFile] = useState(null);

  // Sequence guard: same idiom as quotes.jsx's historySeqRef — only the most
  // recently *started* list refresh is allowed to land.
  const listSeqRef = useRef(0);
  const loadList = useCallback(async () => {
    const seq = ++listSeqRef.current;
    try {
      const list = await api.ipc.invoke('invoices:list');
      if (seq !== listSeqRef.current) return; // a newer refresh has since started; drop this stale result
      setRows(list);
    } catch (e) {
      if (seq !== listSeqRef.current) return;
      setError(e.message);
    }
  }, [api]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadAcceptedQuotes = useCallback(async () => {
    try {
      const qs = await api.ipc.invoke('quotes:list');
      setAcceptedQuotes(qs.filter((q) => q.status === 'accepted' && !q.invoiced));
    } catch (e) {
      setError(e.message);
    }
  }, [api]);

  useEffect(() => {
    api.ipc.invoke('clients:list', {}).then(setClients).catch((e) => setError(e.message));
    void loadAcceptedQuotes();
  }, [api, loadAcceptedQuotes]);

  // Consume a draft handed off from the quotes tab's "convert to invoice" flow.
  useEffect(() => {
    if (pendingInvoiceDraft) {
      setDraft(pendingInvoiceDraft);
      setPendingInvoiceDraft(null);
    }
  }, [pendingInvoiceDraft, setPendingInvoiceDraft]);

  const startDraft = async (from) => {
    setError('');
    try {
      const d = await api.ipc.invoke('invoices:draft', from);
      setDraft(d);
    } catch (e) {
      setError(e.message);
    }
  };

  const setStatus = async (file, status) => {
    setError('');
    setBusyFile(file);
    try {
      await api.ipc.invoke('invoices:set-status', { file, status });
      await loadList();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyFile(null);
    }
  };

  if (draft) {
    return (
      <Composer
        api={api}
        s={s}
        draft={draft}
        config={config}
        onBack={() => setDraft(null)}
        onDone={() => {
          setDraft(null);
          void loadList();
          // A just-invoiced quote must drop out of the "from accepted quote" menu.
          void loadAcceptedQuotes();
        }}
      />
    );
  }

  const unpaid = rows.filter((r) => r.status !== 'paid').length;
  const overdue = rows.filter((r) => r.overdue).length;

  return (
    <Panel
      title="invoices"
      s={s}
      action={
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: s.ink2 }}>{unpaid} unpaid · {overdue} overdue</span>
          <NewInvoiceMenu s={s} acceptedQuotes={acceptedQuotes} clients={clients} onPick={(from) => void startDraft(from)} />
        </span>
      }
    >
      <ErrorBanner error={error} s={s} />
      {rows.length === 0 && <div style={{ fontSize: 12, color: s.ink2 }}>no invoices yet — generate one from a quote or client.</div>}
      {rows.map((row) => (
        <InvoiceRow
          key={row.file}
          s={s}
          row={row}
          busy={busyFile === row.file}
          onSetStatus={(status) => void setStatus(row.file, status)}
        />
      ))}
    </Panel>
  );
}
