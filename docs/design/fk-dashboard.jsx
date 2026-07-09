// fk-dashboard.jsx — dashboard tab (filled + empty)

const { Panel: DPanel, Btn: DBtn, Pill: DPill, Eyebrow: DEb, Lucide: DLu, Ghost: DGhost } = window.Poltergeist;
const DFK = window.FK;

// shared: colored activity row (ActivityFeedRow pattern, Lucide glyph)
const ActRow = ({ icon, tone, verb, subject, meta, first }) => {
  const c = { neon: 'var(--neon)', moss: 'var(--pill-moss-fg)', oxblood: 'var(--pill-oxblood-fg)', fog: 'var(--ink-2)' }[tone] || 'var(--ink-2)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px',
      borderTop: first ? 'none' : '1px solid var(--hairline)',
    }}>
      <DLu name={icon} size={14} color={c} />
      <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink-2)', minWidth: 96, whiteSpace: 'nowrap' }}>{verb}</span>
      <span style={{ flex: 1, fontSize: 12, color: 'var(--ink-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subject}</span>
      <span className="font-mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{meta}</span>
    </div>
  );
};
window.FKParts = { ActRow };

const StatTile = ({ label, value, sub, subTone, icon }) => (
  <div style={{ background: 'var(--bg-vellum)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-lg)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <DLu name={icon} size={14} color="var(--ink-2)" />
      <DEb>{label}</DEb>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 32, letterSpacing: '-0.02em', color: 'var(--ink-0)', lineHeight: 1 }}>{value}</span>
      {sub && <span className="font-mono" style={{ fontSize: 11, color: subTone || 'var(--ink-2)' }}>{sub}</span>}
    </div>
  </div>
);

const AttentionRow = ({ item, first }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px', borderTop: first ? 'none' : '1px solid var(--hairline)' }}>
    <div style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', flexShrink: 0, background: 'var(--bg-paper)', border: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <DLu name={item.icon} size={15} color={item.kind === 'overdue' ? 'var(--oxblood)' : item.kind === 'accepted' ? 'var(--pill-moss-fg)' : 'var(--neon)'} />
    </div>
    <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-0)', lineHeight: 1.4 }}>{item.text}</span>
    <DBtn variant={item.variant} size="sm">{item.action}</DBtn>
  </div>
);

const Dashboard = ({ empty, onSweep }) => {
  if (empty) {
    return (
      <DPanel title="dashboard" subtitle="NOTHING SWEPT YET">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '48px 24px', textAlign: 'center' }}>
          <DGhost size={52} floating />
          <div style={{ maxWidth: 340 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 21, letterSpacing: '-0.02em', color: 'var(--ink-0)', marginBottom: 6 }}>sweep your vault to find work</div>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, margin: 0 }}>freelancer reads your notes for anything that smells like a request — then turns each into a quote you can send.</p>
          </div>
          <DBtn variant="primary" size="md" icon={<DLu name="radar" size={14} />} onClick={onSweep}>sweep vault</DBtn>
        </div>
      </DPanel>
    );
  }
  const s = DFK.stats;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatTile label="open work" value={s.openWork} icon="inbox" />
        <StatTile label="awaiting reply" value={s.awaitingReply} sub="sent quotes" icon="clock" />
        <StatTile label="unpaid invoices" value={s.unpaidInvoices} sub={s.overdue > 0 ? `${s.overdue} overdue` : null} subTone="var(--pill-oxblood-fg)" icon="receipt" />
        <StatTile label="revenue · july" value={DFK.money(s.revenueMonth)} sub={`▲ ${s.revenueDelta}%`} subTone="var(--pill-moss-fg)" icon="trending-up" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 16, alignItems: 'start' }}>
        <DPanel title="needs attention" subtitle={`${DFK.needsAttention.length} ITEMS`}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {DFK.needsAttention.map((it, i) => <AttentionRow key={it.id} item={it} first={i === 0} />)}
          </div>
        </DPanel>

        <DPanel title="recent activity" subtitle="LAST 7 DAYS">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {DFK.recent.map((r, i) => <ActRow key={i} {...r} meta={r.meta} first={i === 0} />)}
          </div>
        </DPanel>
      </div>
    </div>
  );
};

window.FKDashboard = { Dashboard };
