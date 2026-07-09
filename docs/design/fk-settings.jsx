// fk-settings.jsx — settings tab: branding · rates · invoicing

const { Panel: SPanel, Btn: SBtn, Pill: SPill, Eyebrow: SEb, Lucide: SLu, Toggle: SToggle } = window.Poltergeist;
const SFK = window.FK;

const fld = { fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-0)', background: 'var(--bg-paper)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r-sm)', padding: '8px 10px', width: '100%', boxSizing: 'border-box', outline: 'none' };
const Row = ({ label, hint, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, padding: '12px 0', borderTop: '1px solid var(--hairline)' }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 13.5, color: 'var(--ink-0)', fontWeight: 500 }}>{label}</div>
      {hint && <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>{hint}</div>}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);
const Labeled = ({ label, children }) => (<div><SEb>{label}</SEb><div style={{ marginTop: 5 }}>{children}</div></div>);

const Branding = () => (
  <SPanel title="branding" subtitle="ON EVERY QUOTE & INVOICE">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 2 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 'var(--r-md)', flexShrink: 0, background: 'var(--bg-paper)', border: '1px dashed var(--hairline-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
          <SLu name="image" size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <Labeled label="business name"><input style={fld} defaultValue="Studio Marlow" /></Labeled>
        </div>
        <SBtn variant="secondary" size="sm" icon={<SLu name="upload" size={13} />}>logo</SBtn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Labeled label="accent color">
          <div style={{ display: 'flex', gap: 6 }}>
            {['#C5FF3D', '#7FB3D5', '#E8A24C', '#F2F3F5'].map((h, i) => (
              <span key={h} style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', background: h, cursor: 'pointer', border: i === 0 ? '2px solid var(--ink-0)' : '1px solid var(--hairline-2)' }} />
            ))}
          </div>
        </Labeled>
        <Labeled label="validity (days)"><input style={{ ...fld, fontFamily: 'var(--font-mono)' }} defaultValue="30" /></Labeled>
      </div>
      <Labeled label="contact line"><input style={fld} defaultValue="hello@studiomarlow.com · +31 20 555 0100 · studiomarlow.com" /></Labeled>
      <Labeled label="default payment terms"><input style={fld} defaultValue="payment due within 14 days of issue" /></Labeled>
    </div>
  </SPanel>
);

const Rates = () => {
  const [rates, setRates] = React.useState(SFK.namedRates);
  return (
    <SPanel title="rates" subtitle="NAMED HOURLY RATES">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Labeled label="currency">
            <select style={{ ...fld, cursor: 'pointer' }} defaultValue="EUR">{['EUR','GBP','USD'].map(c => <option key={c}>{c}</option>)}</select>
          </Labeled>
          <Labeled label="default hourly rate"><input style={{ ...fld, fontFamily: 'var(--font-mono)' }} defaultValue="90" /></Labeled>
        </div>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 30px', gap: 8, paddingBottom: 4 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)' }}>name</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)' }}>€ / hour</div>
            <div></div>
          </div>
          {rates.map(r => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 30px', gap: 8, alignItems: 'center', paddingTop: 6 }}>
              <input style={fld} defaultValue={r.name} />
              <input style={{ ...fld, fontFamily: 'var(--font-mono)' }} defaultValue={r.rate} />
              <button aria-label="remove" onClick={() => setRates(rs => rs.filter(x => x.id !== r.id))} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--ink-3)', cursor: 'pointer' }}><SLu name="x" size={13} /></button>
            </div>
          ))}
          <div style={{ paddingTop: 8 }}>
            <SBtn variant="ghost" size="sm" icon={<SLu name="plus" size={13} />} onClick={() => setRates(rs => [...rs, { id: 'r' + Date.now(), name: 'new rate', rate: 90 }])}>rate</SBtn>
          </div>
        </div>
      </div>
    </SPanel>
  );
};

const Invoicing = () => {
  const [yearReset, setYearReset] = React.useState(true);
  return (
    <SPanel title="invoicing" subtitle="NUMBERING & DEFAULTS">
      <div style={{ padding: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 4 }}>
          <Labeled label="number prefix"><input style={{ ...fld, fontFamily: 'var(--font-mono)' }} defaultValue="INV-2026-" /></Labeled>
          <Labeled label="next number"><input style={{ ...fld, fontFamily: 'var(--font-mono)' }} defaultValue="008" /></Labeled>
        </div>
        <Row label="reset numbering each year" hint="restart at 001 every january"><SToggle on={yearReset} onChange={setYearReset} /></Row>
        <Row label="default vat %" hint="applied to new invoices"><input style={{ ...fld, fontFamily: 'var(--font-mono)', width: 90 }} defaultValue="15" /></Row>
        <Row label="default payment days" hint="net terms on new invoices"><input style={{ ...fld, fontFamily: 'var(--font-mono)', width: 90 }} defaultValue="14" /></Row>
      </div>
    </SPanel>
  );
};

const Settings = () => {
  const [saved, setSaved] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Branding />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <Rates />
        <Invoicing />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flex: 1 }} />
        {saved && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--pill-moss-fg)' }}><SLu name="check" size={14} />saved</span>}
        <SBtn variant="primary" size="md" icon={<SLu name="check" size={14} />} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2400); }}>save</SBtn>
      </div>
    </div>
  );
};

window.FKSettings = { Settings };
