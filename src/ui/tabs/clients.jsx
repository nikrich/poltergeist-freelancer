// Clients tab: roster (search, tags, open balance) + detail (contact, defaults,
// tags, notes, documents cross-reference). Rewritten from the placeholder per
// docs/design/fk-clients.jsx (layout reference only — no Lucide icons here,
// unicode/text affordances instead) and the kit primitives used elsewhere.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatMoney } from '../../lib/money.cjs';
import { Panel, Btn, Pill, StatusPill, ErrorBanner, inputStyle } from '../kit.jsx';

function emptyClient() {
  return { name: '', legalName: '', website: '', status: 'prospect', tags: [], contacts: [], billing: {}, defaults: {}, notes: '' };
}

function ClientRow({ s, c, active, balance, onSelect }) {
  return (
    <div
      onClick={() => onSelect(c.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', cursor: 'pointer',
        borderRadius: 6, background: active ? s.fog : 'transparent',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: s.ink0 }}>{c.name}</div>
        {c.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {c.tags.map((t) => <Pill key={t} s={s} tone="outline">{t}</Pill>)}
          </div>
        )}
      </div>
      {balance > 0 && (
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: s.oxblood, flexShrink: 0 }}>
          {formatMoney(balance, c.defaults?.currency || 'EUR')}
        </span>
      )}
    </div>
  );
}

export function ClientsTab({ api, s }) {
  const [q, setQ] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [tagsText, setTagsText] = useState('');
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [bootstrapMsg, setBootstrapMsg] = useState('');

  // Tracks the "live" selection outside of React's render cycle so in-flight
  // save()/archive() calls can tell, once their IPC round-trip resolves,
  // whether the user has since selected a different client and bail instead
  // of clobbering the newer UI state.
  const selectedIdRef = useRef(null);
  const setSelection = (id) => {
    selectedIdRef.current = id;
    setSelectedId(id);
  };

  // Sequence guard: search keystrokes and other refreshList() callers can race
  // and resolve out of order. Only the result of the most recently *started*
  // call is allowed to land.
  const listSeqRef = useRef(0);
  const refreshList = useCallback(async () => {
    const seq = ++listSeqRef.current;
    try {
      const list = await api.ipc.invoke('clients:list', { q: q || undefined, status: showArchived ? 'archived' : 'all' });
      if (seq !== listSeqRef.current) return; // a newer refresh has since started; drop this stale result
      setClients(list);
    } catch (e) {
      if (seq !== listSeqRef.current) return;
      setError(e.message);
    }
  }, [api, q, showArchived]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    api.ipc.invoke('quotes:list').then(setQuotes).catch((e) => setError(e.message));
    api.ipc.invoke('invoices:list').then(setInvoices).catch((e) => setError(e.message));
  }, [api]);

  const balanceByClient = useMemo(() => {
    const map = {};
    for (const inv of invoices) {
      if (inv.status !== 'sent' || !inv.clientId) continue;
      map[inv.clientId] = (map[inv.clientId] ?? 0) + inv.total;
    }
    return map;
  }, [invoices]);

  const selectClient = async (id) => {
    setError('');
    setSelection(id);
    try {
      const c = await api.ipc.invoke('clients:get', id);
      setDetail(c);
      setTagsText((c.tags ?? []).join(', '));
    } catch (e) {
      setError(e.message);
    }
  };

  const newClient = () => {
    setError('');
    setSelection(null);
    setDetail(emptyClient());
    setTagsText('');
  };

  const save = async () => {
    setError('');
    // Capture the client this save is for; if the user selects someone else
    // before the round-trip resolves, we still refresh the list but skip the
    // selection/detail writeback below.
    const targetId = selectedIdRef.current;
    try {
      const payload = { ...detail, tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean) };
      const saved = await api.ipc.invoke('clients:upsert', payload);
      if (selectedIdRef.current === targetId) {
        setDetail(saved);
        setTagsText((saved.tags ?? []).join(', '));
        setSelection(saved.id);
      }
      await refreshList();
    } catch (e) {
      setError(e.message);
    }
  };

  const archive = async () => {
    if (!detail?.id) return;
    setError('');
    const targetId = detail.id;
    try {
      await api.ipc.invoke('clients:archive', detail.id);
      if (selectedIdRef.current === targetId) {
        setSelection(null);
        setDetail(null);
      }
      await refreshList();
    } catch (e) {
      setError(e.message);
    }
  };

  const bootstrap = async () => {
    setError('');
    try {
      const res = await api.ipc.invoke('clients:bootstrap');
      setBootstrapMsg(`created ${res.created}`);
      await refreshList();
      setTimeout(() => setBootstrapMsg(''), 2500);
    } catch (e) {
      setError(e.message);
    }
  };

  const contact0 = detail?.contacts?.[0] ?? {};
  const updContact = (patch) =>
    setDetail((d) => {
      const contacts = d.contacts && d.contacts.length ? [...d.contacts] : [{}];
      contacts[0] = { ...contacts[0], ...patch };
      return { ...d, contacts };
    });
  const updBilling = (patch) => setDetail((d) => ({ ...d, billing: { ...(d.billing ?? {}), ...patch } }));
  const updDefaults = (patch) => setDetail((d) => ({ ...d, defaults: { ...(d.defaults ?? {}), ...patch } }));

  const docs = useMemo(() => {
    if (!detail?.id) return [];
    const qs = quotes
      .filter((row) => row.clientId === detail.id)
      .map((row) => ({ key: `q-${row.file}`, id: row.file, total: row.total, currency: row.currency, status: row.status, when: row.generated }));
    const is = invoices
      .filter((row) => row.clientId === detail.id)
      .map((row) => ({ key: `i-${row.file}`, id: row.number || row.file, total: row.total, currency: row.currency, status: row.overdue ? 'overdue' : row.status, when: row.issued }));
    return [...qs, ...is].sort((a, b) => (a.when < b.when ? 1 : -1));
  }, [quotes, invoices, detail?.id]);

  const field = (label, value, onChange, extra = {}) => (
    <label style={{ fontSize: 11, color: s.ink2, display: 'block', marginBottom: 8 }}>
      {label}
      <input style={inputStyle(s)} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...extra} />
    </label>
  );

  return (
    <>
      <ErrorBanner error={error} s={s} />
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14 }}>
        <Panel title="clients" s={s} action={<span style={{ fontSize: 11, color: s.ink2 }}>{clients.length} {showArchived ? 'archived' : 'active'}</span>}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ color: s.ink2, fontSize: 12 }}>⌕</span>
            <input style={inputStyle(s)} placeholder="search clients…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
            {clients.map((c) => (
              <ClientRow key={c.id} s={s} c={c} active={selectedId === c.id} balance={balanceByClient[c.id] ?? 0} onSelect={selectClient} />
            ))}
            {clients.length === 0 && <div style={{ fontSize: 12, color: s.ink2, padding: '8px 0' }}>no clients yet.</div>}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: s.ink2, padding: '8px 0', borderTop: `1px solid ${s.hairline}`, marginBottom: 10 }}>
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            show archived
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn s={s} primary onClick={newClient}>+ new client</Btn>
            <Btn s={s} onClick={() => void bootstrap()}>bootstrap from vault</Btn>
          </div>
          {bootstrapMsg && <div style={{ fontSize: 11, color: s.moss, marginTop: 8 }}>{bootstrapMsg}</div>}
        </Panel>

        <div>
          {!detail && (
            <Panel title="detail" s={s}>
              <div style={{ fontSize: 12, color: s.ink2 }}>select a client on the left, or start a new one.</div>
            </Panel>
          )}
          {detail && (
            <>
              <Panel title="client" s={s} action={detail.id ? <Btn s={s} danger onClick={() => void archive()}>archive</Btn> : null}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {field('name', detail.name, (v) => setDetail((d) => ({ ...d, name: v })))}
                  {field('legal name', detail.legalName, (v) => setDetail((d) => ({ ...d, legalName: v })))}
                </div>
                {field('website', detail.website, (v) => setDetail((d) => ({ ...d, website: v })))}
                {field('tags (comma-separated)', tagsText, setTagsText)}
              </Panel>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Panel title="contact" s={s}>
                  {field('name', contact0.name, (v) => updContact({ name: v }))}
                  {field('email', contact0.email, (v) => updContact({ email: v }))}
                  {field('phone', contact0.phone, (v) => updContact({ phone: v }))}
                  {field('billing email', detail.billing?.email, (v) => updBilling({ email: v }))}
                </Panel>

                <Panel title="defaults" s={s}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {field('currency', detail.defaults?.currency, (v) => updDefaults({ currency: v.toUpperCase().slice(0, 3) }))}
                    {field('vat %', detail.defaults?.vatRate, (v) => updDefaults({ vatRate: v === '' ? undefined : Number(v) }), { type: 'number', min: 0, max: 100 })}
                  </div>
                  {field('payment terms', detail.defaults?.paymentTerms, (v) => updDefaults({ paymentTerms: v }))}
                </Panel>
              </div>

              <Panel title="notes" s={s}>
                <textarea
                  rows={3}
                  style={{ ...inputStyle(s), resize: 'vertical' }}
                  value={detail.notes ?? ''}
                  onChange={(e) => setDetail((d) => ({ ...d, notes: e.target.value }))}
                />
              </Panel>

              <Panel title="documents" s={s} action={<span style={{ fontSize: 11, color: s.ink2 }}>{docs.length} items</span>}>
                {docs.length === 0 && <div style={{ fontSize: 12, color: s.ink2 }}>nothing yet — draft a quote to get started.</div>}
                {docs.map((d) => (
                  <div key={d.key} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderTop: `1px solid ${s.hairline}` }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: s.ink1, flex: 1 }}>{d.id}</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: s.ink0 }}>{formatMoney(d.total, d.currency || 'EUR')}</span>
                    <StatusPill s={s} status={d.status} />
                  </div>
                ))}
              </Panel>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Btn s={s} primary onClick={() => void save()}>save</Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
