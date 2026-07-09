// Dashboard tab: at-a-glance stats, needs-attention feed, recent activity.
// Loads dashboard:summary fresh on every mount (the tab is remounted on each
// tab switch, so a mount effect is sufficient — see docs/design/fk-dashboard.jsx
// for the layout reference, no window.Poltergeist/Lucide here).

import { useEffect, useState } from 'react';
import { formatMoney } from '../../lib/money.cjs';
import { Panel, Btn, StatTile, ErrorBanner } from '../kit.jsx';

function AttentionRow({ s, item, busy, copied, onQuoteIt, onConvert, onCopyNudge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', borderTop: `1px solid ${s.hairline}` }}>
      <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: s.ink0, lineHeight: 1.4 }}>{item.label}</span>
      {item.kind === 'workItem' && <Btn s={s} onClick={onQuoteIt}>quote it</Btn>}
      {item.kind === 'acceptedQuote' && (
        <Btn s={s} primary disabled={busy} onClick={onConvert}>convert</Btn>
      )}
      {item.kind === 'overdueInvoice' && (
        <Btn s={s} onClick={onCopyNudge}>{copied ? 'copied' : 'copy nudge'}</Btn>
      )}
    </div>
  );
}

function ActivityRow({ s, item }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderTop: `1px solid ${s.hairline}` }}>
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: s.ink2, width: 64, flexShrink: 0 }}>{item.kind}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: s.ink0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: s.ink2, flexShrink: 0 }}>{(item.when || '').slice(0, 10)}</span>
    </div>
  );
}

export function DashboardTab({ api, s, setTab, setPendingInvoiceDraft }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [busyRef, setBusyRef] = useState(null);
  const [copiedRef, setCopiedRef] = useState(null);

  useEffect(() => {
    let alive = true;
    api.ipc
      .invoke('dashboard:summary')
      .then((d) => alive && setSummary(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [api]);

  if (!summary) {
    return (
      <Panel title="dashboard" s={s}>
        <ErrorBanner error={error} s={s} />
        <div style={{ fontSize: 12, color: s.ink2 }}>loading…</div>
      </Panel>
    );
  }

  const totalQuotes = summary.quotes.draft + summary.quotes.sent + summary.quotes.accepted + summary.quotes.declined;
  const totalInvoices = summary.invoices.draft + summary.invoices.sent + summary.invoices.paid;
  const isEmpty = summary.workItems === 0 && totalQuotes === 0 && totalInvoices === 0;

  if (isEmpty) {
    return (
      <Panel title="dashboard" s={s}>
        <ErrorBanner error={error} s={s} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: s.ink0 }}>sweep your vault to find work</div>
          <Btn s={s} primary onClick={() => setTab('quotes')}>sweep vault</Btn>
        </div>
      </Panel>
    );
  }

  const unpaidCount = summary.invoices.draft + summary.invoices.sent;
  const currency = summary.revenue.currency || summary.invoices.currency;

  const convert = async (ref) => {
    setError('');
    setBusyRef(ref);
    try {
      const draft = await api.ipc.invoke('invoices:draft', { quoteFile: ref });
      setPendingInvoiceDraft(draft);
      setTab('invoices');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyRef(null);
    }
  };

  const copyNudge = async (item) => {
    try {
      await navigator.clipboard.writeText(`friendly nudge: invoice ${item.label} is overdue — could you take a look?`);
      setCopiedRef(item.ref);
      setTimeout(() => setCopiedRef((r) => (r === item.ref ? null : r)), 1500);
    } catch {
      // clipboard access is best-effort — silently ignore if it's unavailable
    }
  };

  return (
    <>
      <ErrorBanner error={error} s={s} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <StatTile s={s} label="open work items" value={summary.workItems} />
        <StatTile s={s} label="awaiting reply" value={summary.quotes.sent} />
        <StatTile
          s={s}
          label="unpaid invoices"
          value={unpaidCount}
          sub={summary.invoices.overdue > 0 ? `${summary.invoices.overdue} overdue` : null}
          subTone={summary.invoices.overdue > 0 ? s.oxblood : undefined}
        />
        <StatTile
          s={s}
          label="revenue this month"
          value={formatMoney(summary.revenue.thisMonth, currency)}
          sub={`vs ${formatMoney(summary.revenue.lastMonth, currency)} last month`}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 14, alignItems: 'start' }}>
        <Panel title="needs attention" s={s}>
          {summary.attention.length === 0 && <div style={{ fontSize: 12, color: s.ink2 }}>nothing needs attention.</div>}
          {summary.attention.map((item, i) => (
            <AttentionRow
              key={`${item.kind}-${item.ref}-${i}`}
              s={s}
              item={item}
              busy={busyRef === item.ref}
              copied={copiedRef === item.ref}
              onQuoteIt={() => setTab('quotes')}
              onConvert={() => void convert(item.ref)}
              onCopyNudge={() => void copyNudge(item)}
            />
          ))}
        </Panel>

        <Panel title="recent activity" s={s}>
          {summary.activity.length === 0 && <div style={{ fontSize: 12, color: s.ink2 }}>no activity yet.</div>}
          {summary.activity.map((item, i) => (
            <ActivityRow key={i} s={s} item={item} />
          ))}
        </Panel>
      </div>
    </>
  );
}
