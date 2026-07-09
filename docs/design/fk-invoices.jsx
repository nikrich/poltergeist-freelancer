// fk-invoices.jsx — invoices tab: list + composer

const { Panel: IPanel, Btn: IBtn, Pill: IPill, Eyebrow: IEb, Lucide: ILu } = window.Poltergeist;
const IFK = window.FK;

const InvRow = ({ inv, first }) => {
  const overdue = inv.status === 'overdue';
  const actions = { draft: [{ label: 'mark sent', v: 'secondary' }], sent: [{ label: 'mark paid', v: 'primary' }], overdue: [{ label: 'mark paid', v: 'primary' }, { label: 'copy nudge', v: 'ghost' }] }[inv.status] || [];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 10px',
      borderTop: first ? 'none' : '1px solid var(--hairline)',
      background: overdue ? 'var(--oxblood-mist)' : 'transparent',
      borderLeft: overdue ? '2px solid var(--oxblood)' : '2px solid transparent',
      borderRadius: overdue ? 'var(--r-sm)' : 0,
    }}>
      <span className="font-mono" style={{ fontSize: 12, color: 'var(--ink-1)', width: 118 }}>{inv.id}</span>
      <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-0)' }}>{inv.client}</span>
      <span className="font-mono" style={{ fontSize: 13, color: 'var(--ink-0)', width: 76, textAlign: 'right' }}>{IFK.money(inv.total)}</span>
      <span className="font-mono" style={{ fontSize: 11, color: overdue ? 'var(--pill-oxblood-fg)' : 'var(--ink-2)', width: 110, textAlign: 'right' }}>
        {overdue ? `${inv.overdueDays}d overdue` : `due ${inv.due}`}
      </span>
      <IPill tone={IFK.statusTone(inv.status)}>{inv.status}</IPill>
      {actions.map(a => <IBtn key={a.label} variant={a.v} size="sm">{a.label}</IBtn>)}
    </div>
  );
};

const cell = { fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-0)', background: 'var(--bg-paper)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r-sm)', padding: '7px 9px', width: '100%', boxSizing: 'border-box', outline: 'none' };
const headCell = { fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', padding: '0 0 6px' };

const InvoiceComposer = () => {
  const lines = IFK.composerLines;
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const vatRate = 15;
  const vat = Math.round(subtotal * vatRate / 100);
  const total = subtotal + vat;
  return (
    <IPanel title="new invoice" subtitle="FROM ACCEPTED QUOTE"
      action={<IBtn variant="ghost" size="sm" icon={<ILu name="x" size={13} />}>close</IBtn>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <ILu name="corner-down-right" size={12} color="var(--ink-3)" />from quote-acme-2026-07-02
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div><IEb>number</IEb><div className="font-mono" style={{ ...cell, marginTop: 5, color: 'var(--ink-2)' }}>INV-2026-007</div></div>
          <div><IEb>issued</IEb><input style={{ ...cell, marginTop: 5 }} defaultValue="10 jul 2026" /></div>
          <div><IEb>due</IEb><input style={{ ...cell, marginTop: 5 }} defaultValue="24 jul 2026" /></div>
        </div>
        <div><IEb>client</IEb>
          <select style={{ ...cell, marginTop: 5, cursor: 'pointer' }} defaultValue="Acme Studio">
            {IFK.clients.map(c => <option key={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* line items */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 30px', gap: 8 }}>
            <div style={headCell}>description</div><div style={headCell}>hours</div><div style={{ ...headCell, textAlign: 'right' }}>amount</div><div></div>
          </div>
          {lines.map(l => (
            <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 30px', gap: 8, alignItems: 'center', paddingTop: 6 }}>
              <input style={cell} defaultValue={l.desc} />
              <input style={{ ...cell, fontFamily: 'var(--font-mono)', textAlign: 'center' }} defaultValue={l.hours} />
              <div className="font-mono" style={{ fontSize: 13, color: 'var(--ink-0)', textAlign: 'right' }}>{IFK.money(l.amount)}</div>
              <button aria-label="remove" style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--ink-3)', cursor: 'pointer' }}><ILu name="x" size={13} /></button>
            </div>
          ))}
          <div style={{ paddingTop: 8 }}><IBtn variant="ghost" size="sm" icon={<ILu name="plus" size={13} />}>line item</IBtn></div>
        </div>

        {/* totals */}
        <div style={{ marginLeft: 'auto', width: 260, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6, borderTop: '1px solid var(--hairline)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-1)' }}>
            <span>subtotal</span><span className="font-mono">{IFK.money(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-1)' }}>
            <span>vat {vatRate}%</span><span className="font-mono">{IFK.money(vat)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
            <IEb>total</IEb>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 30, letterSpacing: '-0.02em', color: 'var(--ink-0)' }}>{IFK.money(total)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ flex: 1 }} />
          <IBtn variant="secondary" size="md">preview</IBtn>
          <IBtn variant="primary" size="md" icon={<ILu name="file-down" size={14} />}>generate pdf</IBtn>
        </div>
      </div>
    </IPanel>
  );
};

const NewInvoiceMenu = () => {
  const [open, setOpen] = React.useState(false);
  const opts = [
    { icon: 'file-check', label: 'from accepted quote' },
    { icon: 'user', label: 'from client' },
    { icon: 'file', label: 'blank' },
  ];
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <IBtn variant="primary" size="sm" icon={<ILu name="plus" size={13} />} iconRight={<ILu name="chevron-down" size={12} />} onClick={() => setOpen(o => !o)}>new invoice</IBtn>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, zIndex: 20, minWidth: 200, background: 'var(--bg-vellum)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r-md)', boxShadow: '0 12px 32px rgba(0,0,0,.5)', padding: 4 }}>
          {opts.map(o => (
            <button key={o.label} onClick={() => setOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', padding: '9px 10px', border: 'none', background: 'transparent', color: 'var(--ink-1)', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontSize: 13 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-fog)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <ILu name={o.icon} size={14} color="var(--ink-2)" />{o.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
};

const Invoices = () => {
  const [composing, setComposing] = React.useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <IPanel title="invoices" subtitle={`${IFK.invoices.filter(i => i.status !== 'paid').length} UNPAID · ${IFK.invoices.filter(i => i.status === 'overdue').length} OVERDUE`}
        action={<NewInvoiceMenu />}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {IFK.invoices.map((inv, i) => <InvRow key={inv.id} inv={inv} first={i === 0} />)}
        </div>
      </IPanel>
      {composing && <InvoiceComposer />}
    </div>
  );
};

window.FKInvoices = { Invoices };
