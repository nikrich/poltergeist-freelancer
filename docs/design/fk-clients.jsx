// fk-clients.jsx — clients tab: list + detail

const { Panel: CPanel, Btn: CBtn, Pill: CPill, Eyebrow: CEb, Lucide: CLu } = window.Poltergeist;
const CFK = window.FK;

const ClientRow = ({ c, active, onSelect }) => (
  <button onClick={() => onSelect(c.id)} style={{
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
    padding: '10px 10px', cursor: 'pointer', borderRadius: 'var(--r-sm)',
    border: '1px solid ' + (active ? 'var(--hairline-3)' : 'transparent'),
    background: active ? 'var(--bg-fog)' : 'transparent',
  }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-paper)'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--ink-0)' }}>{c.name}</div>
      <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
        {c.tags.map(t => <CPill key={t} tone="outline">{t}</CPill>)}
      </div>
    </div>
    {c.balance > 0 && <span className="font-mono" style={{ fontSize: 11, color: 'var(--pill-oxblood-fg)', flexShrink: 0 }}>{CFK.money(c.balance)}</span>}
  </button>
);

const contactField = { fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-0)', background: 'var(--bg-paper)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r-sm)', padding: '8px 10px', width: '100%', boxSizing: 'border-box', outline: 'none' };

const ClientDetail = ({ c }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 24, letterSpacing: '-0.02em', color: 'var(--ink-0)' }}>{c.name}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>{c.company}</div>
      </div>
      <CBtn variant="danger" size="sm" icon={<CLu name="archive" size={13} />}>archive</CBtn>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
      <CPanel title="contact">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 2 }}>
          <div><CEb>email</CEb><input style={{ ...contactField, marginTop: 5 }} defaultValue={c.email} /></div>
          <div><CEb>phone</CEb><input style={{ ...contactField, marginTop: 5 }} defaultValue={c.phone} /></div>
        </div>
      </CPanel>
      <CPanel title="defaults">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><CEb>currency</CEb><div style={{ ...contactField, marginTop: 5, fontFamily: 'var(--font-mono)' }}>{c.currency}</div></div>
            <div><CEb>vat %</CEb><div style={{ ...contactField, marginTop: 5, fontFamily: 'var(--font-mono)' }}>{c.vat}%</div></div>
          </div>
          <div><CEb>payment terms</CEb><div style={{ ...contactField, marginTop: 5, fontFamily: 'var(--font-mono)' }}>net-{c.terms}</div></div>
        </div>
      </CPanel>
    </div>

    <CPanel title="notes">
      <textarea rows={2} style={{ ...contactField, resize: 'vertical', lineHeight: 1.5 }} defaultValue={c.notes} />
    </CPanel>

    <CPanel title="documents" subtitle={`${c.docs.length} ITEMS`}>
      {c.docs.length === 0
        ? <div style={{ fontSize: 12.5, color: 'var(--ink-3)', padding: '14px 6px', textAlign: 'center' }}>nothing yet — draft a quote to get started.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {c.docs.map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', borderTop: i === 0 ? 'none' : '1px solid var(--hairline)' }}>
                <CLu name={d.t === 'quote' ? 'file-text' : 'receipt'} size={14} color="var(--ink-2)" />
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink-1)', flex: 1 }}>{d.id}</span>
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink-0)' }}>{CFK.money(d.total)}</span>
                <CPill tone={CFK.statusTone(d.status)}>{d.status}</CPill>
              </div>
            ))}
          </div>
        )}
    </CPanel>
  </div>
);

const Clients = () => {
  const [showArchived, setShowArchived] = React.useState(false);
  const list = CFK.clients.filter(c => showArchived ? true : !c.archived);
  const [sel, setSel] = React.useState('c1');
  const active = CFK.clients.find(c => c.id === sel) || list[0];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
      <CPanel title="clients" subtitle={`${CFK.clients.filter(c => !c.archived).length} ACTIVE`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-paper)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r-sm)', padding: '7px 10px' }}>
            <CLu name="search" size={14} color="var(--ink-3)" />
            <input placeholder="search clients…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-0)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {list.map(c => <ClientRow key={c.id} c={c} active={active && active.id === c.id} onSelect={setSel} />)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-2)', cursor: 'pointer' }} onClick={() => setShowArchived(v => !v)}>
              <CLu name={showArchived ? 'eye' : 'eye-off'} size={13} />show archived
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <CBtn variant="primary" size="sm" icon={<CLu name="plus" size={13} />}>new client</CBtn>
            <CBtn variant="ghost" size="sm" icon={<CLu name="radar" size={13} />}>bootstrap from vault</CBtn>
          </div>
        </div>
      </CPanel>

      <div>{active && <ClientDetail c={active} />}</div>
    </div>
  );
};

window.FKClients = { Clients };
