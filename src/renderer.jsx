// Freelancer renderer shell: theme, tabs, mount. Delegates tab bodies to
// src/ui/tabs/*.jsx; shared styling primitives live in src/ui/kit.jsx.
// React is bundled into dist/renderer.mjs; the host mounts via mount(el, api).

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { S, setTheme, btnStyle } from './ui/kit.jsx';
import { DashboardTab } from './ui/tabs/dashboard.jsx';
import { QuotesTab } from './ui/tabs/quotes.jsx';
import { InvoicesTab } from './ui/tabs/invoices.jsx';
import { ClientsTab } from './ui/tabs/clients.jsx';
import { SettingsTab } from './ui/tabs/settings.jsx';

/* ---------- app shell ---------- */

const TABS = [
  { id: 'dashboard', label: 'dashboard', Component: DashboardTab },
  { id: 'quotes', label: 'quotes', Component: QuotesTab },
  { id: 'invoices', label: 'invoices', Component: InvoicesTab },
  { id: 'clients', label: 'clients', Component: ClientsTab },
  { id: 'settings', label: 'settings', Component: SettingsTab },
];

const DEFAULT_CONFIG = {
  vaultPath: '~/ghostbrain/vault',
  brand: { businessName: '', logoDataUri: '', accentColor: '#C5FF3D', contactLine: '', paymentTerms: '50% upfront, balance on delivery', validityDays: 14 },
  rates: { currency: 'EUR', default: 0, named: [] },
  invoicing: { prefix: 'INV', vatRate: 0, netDays: 14, yearReset: true },
};

function App({ api }) {
  const s = S();
  const [tab, setTab] = useState('dashboard');
  const [config, setConfig] = useState(null);
  const [pendingInvoiceDraft, setPendingInvoiceDraft] = useState(null);

  useEffect(() => {
    api.settings
      .get('config')
      .then((c) =>
        setConfig({
          ...DEFAULT_CONFIG,
          ...(c ?? {}),
          brand: { ...DEFAULT_CONFIG.brand, ...(c?.brand ?? {}) },
          rates: { ...DEFAULT_CONFIG.rates, ...(c?.rates ?? {}) },
          invoicing: { ...DEFAULT_CONFIG.invoicing, ...(c?.invoicing ?? {}) },
        })
      )
      .catch(() => setConfig(DEFAULT_CONFIG));
  }, [api]);

  if (!config) return null;

  const tabBtn = (id, label) => (
    <button
      key={id}
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

  const Active = TABS.find((t) => t.id === tab)?.Component ?? DashboardTab;

  return (
    <div style={{ padding: 18, color: s.ink0, fontSize: 13, fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${s.hairline}`, marginBottom: 14 }}>
        {TABS.map((t) => tabBtn(t.id, t.label))}
      </div>
      <Active
        api={api}
        s={s}
        config={config}
        setConfig={setConfig}
        setTab={setTab}
        pendingInvoiceDraft={pendingInvoiceDraft}
        setPendingInvoiceDraft={setPendingInvoiceDraft}
      />
    </div>
  );
}

export function mount(el, api) {
  setTheme(api.theme ?? {});
  const root = createRoot(el);
  root.render(<App api={api} />);
  return () => root.unmount();
}
