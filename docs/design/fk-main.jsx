// fk-main.jsx — Freelancer kit shell: topbar + subtabs + state switcher

const { WindowChrome: FWC, TopBar: FTB, Btn: FBtn, Eyebrow: FEb, Lucide: FLu } = window.Poltergeist;
const { Dashboard } = window.FKDashboard;
const { Quotes } = window.FKQuotes;
const { Invoices } = window.FKInvoices;
const { Clients } = window.FKClients;
const { Settings } = window.FKSettings;

const SUBTABS = [
  { id: 'dashboard', label: 'dashboard', icon: 'layout-dashboard' },
  { id: 'quotes',    label: 'quotes',    icon: 'file-text' },
  { id: 'invoices',  label: 'invoices',  icon: 'receipt' },
  { id: 'clients',   label: 'clients',   icon: 'users' },
  { id: 'settings',  label: 'settings',  icon: 'settings' },
];

const SubNav = ({ active, onChange }) => (
  <div style={{ display: 'inline-flex', gap: 2 }}>
    {SUBTABS.map(t => {
      const on = active === t.id;
      return (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer',
          border: 'none', background: 'transparent', padding: '0 12px', height: 44,
          color: on ? 'var(--ink-0)' : 'var(--ink-2)',
          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: on ? 600 : 500,
          borderBottom: '2px solid ' + (on ? 'var(--neon)' : 'transparent'), marginBottom: -1,
        }}>
          <FLu name={t.icon} size={14} color={on ? 'var(--neon)' : 'currentColor'} />
          {t.label}
        </button>
      );
    })}
  </div>
);

const FreelancerShell = ({ dashEmpty, setDashEmpty }) => {
  const [tab, setTab] = React.useState('dashboard');
  const [drafting, setDrafting] = React.useState(true);
  return (
    <div style={{ height: 860, border: '1px solid var(--hairline-2)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,.5)' }}>
      <FWC>
        <FTB
          title="freelancer"
          subtitle="poltergeist · back office"
          right={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>
            <FLu name="folder" size={13} color="var(--neon)" />vault/clients
          </span>}
        />
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: 44, borderBottom: '1px solid var(--hairline)', background: 'var(--bg-paper)' }}>
          <SubNav active={tab} onChange={setTab} />
        </div>
        <div className="fam-scroll" style={{ height: 'calc(860px - 57px - 45px)', overflowY: 'auto', padding: 20, background: 'var(--bg-paper)' }}>
          {tab === 'dashboard' && <Dashboard empty={dashEmpty} onSweep={() => setDashEmpty(false)} />}
          {tab === 'quotes'    && <Quotes drafting={drafting} setDrafting={setDrafting} />}
          {tab === 'invoices'  && <Invoices />}
          {tab === 'clients'   && <Clients />}
          {tab === 'settings'  && <Settings />}
        </div>
      </FWC>
    </div>
  );
};

const StateSwitcher = ({ value, onChange }) => {
  const states = [
    { id: 'filled', label: 'filled', icon: 'circle-check' },
    { id: 'empty', label: 'dashboard empty', icon: 'circle-dashed' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <FEb>dashboard state</FEb>
      <div style={{ display: 'inline-flex', gap: 3, padding: 3, background: 'var(--bg-vellum)', border: '1px solid var(--hairline)', borderRadius: 8 }}>
        {states.map(s => {
          const on = value === s.id;
          return (
            <button key={s.id} onClick={() => onChange(s.id)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
              border: '1px solid ' + (on ? 'var(--hairline-2)' : 'transparent'),
              background: on ? 'var(--bg-fog)' : 'transparent',
              color: on ? 'var(--ink-0)' : 'var(--ink-2)',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: on ? 600 : 500,
            }}>
              <FLu name={s.icon} size={13} color={on ? 'var(--neon)' : 'currentColor'} />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Page = () => {
  const [dashEmpty, setDashEmpty] = React.useState(false);
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 28px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <img src="../../assets/glyph.svg" alt="" style={{ width: 24, height: 26 }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19, letterSpacing: '-0.03em', color: 'var(--ink-0)' }}>ghostbrain</span>
        <span style={{ color: 'var(--ink-3)' }}>/</span>
        <span style={{ fontSize: 15, color: 'var(--ink-1)' }}>Freelancer — quotes, invoices &amp; clients</span>
      </div>
      <StateSwitcher value={dashEmpty ? 'empty' : 'filled'} onChange={v => setDashEmpty(v === 'empty')} />
      <FreelancerShell dashEmpty={dashEmpty} setDashEmpty={setDashEmpty} />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Page />);
