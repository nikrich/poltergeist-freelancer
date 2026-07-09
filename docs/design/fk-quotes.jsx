// fk-quotes.jsx — quotes tab: work items + composer + history

const { Panel: QPanel, Btn: QBtn, Pill: QPill, Eyebrow: QEb, Lucide: QLu } = window.Poltergeist;
const QFK = window.FK;

const WorkItemCard = ({ w, onDraft }) => (
  <div style={{ background: 'var(--bg-paper)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-0)' }}>{w.title}</span>
      <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>· {w.client}</span>
      <span style={{ flex: 1 }} />
      <QPill tone={w.confidence >= 85 ? 'neon' : w.confidence >= 70 ? 'fog' : 'outline'}>{w.confidence}% match</QPill>
    </div>
    <p style={{ fontSize: 13, color: 'var(--ink-1)', lineHeight: 1.5, margin: 0 }}>{w.ask}</p>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <QLu name="file-text" size={12} color="var(--ink-3)" />{w.note}
      </span>
      <span style={{ flex: 1 }} />
      <QBtn variant="ghost" size="sm">dismiss</QBtn>
      <QBtn variant="primary" size="sm" icon={<QLu name="file-plus" size={13} />} onClick={() => onDraft(w)}>draft quote</QBtn>
    </div>
  </div>
);

const lineCellHead = { fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', padding: '0 0 6px' };
const cellInput = { fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-0)', background: 'var(--bg-paper)', border: '1px solid var(--hairline-2)', borderRadius: 'var(--r-sm)', padding: '7px 9px', width: '100%', boxSizing: 'border-box', outline: 'none' };

const Composer = ({ item }) => {
  const [lines, setLines] = React.useState(QFK.composerLines);
  const total = lines.reduce((s, l) => s + l.amount, 0);
  return (
    <QPanel title="composer" subtitle={item ? `DRAFTING · ${item.client.toUpperCase()}` : 'NEW QUOTE'}
      action={<QBtn variant="ghost" size="sm" icon={<QLu name="x" size={13} />}>close</QBtn>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><QEb>client</QEb><input style={{ ...cellInput, marginTop: 5 }} defaultValue={item ? item.client : 'Ferndale Coffee Co'} /></div>
          <div><QEb>project</QEb><input style={{ ...cellInput, marginTop: 5 }} defaultValue={item ? item.title : 'loyalty microsite'} /></div>
        </div>
        <div><QEb>scope summary</QEb>
          <textarea rows={2} style={{ ...cellInput, marginTop: 5, resize: 'vertical', lineHeight: 1.5 }} defaultValue="a focused rebuild of the marketing site: new IA, six responsive templates, and a lightweight CMS the team can run themselves." />
        </div>

        {/* line items */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 150px 90px 30px', gap: 8, alignItems: 'end' }}>
            <div style={lineCellHead}>description</div>
            <div style={lineCellHead}>hours</div>
            <div style={lineCellHead}>rate</div>
            <div style={{ ...lineCellHead, textAlign: 'right' }}>amount</div>
            <div></div>
          </div>
          {lines.map((l, i) => (
            <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 150px 90px 30px', gap: 8, alignItems: 'center', paddingTop: 6 }}>
              <input style={cellInput} defaultValue={l.desc} />
              <input style={{ ...cellInput, fontFamily: 'var(--font-mono)', textAlign: 'center' }} defaultValue={l.hours} />
              <select style={{ ...cellInput, cursor: 'pointer' }} defaultValue={l.rate}>
                {QFK.rateOptions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <div className="font-mono" style={{ fontSize: 13, color: 'var(--ink-0)', textAlign: 'right' }}>{QFK.money(l.amount)}</div>
              <button aria-label="remove line" onClick={() => setLines(ls => ls.filter(x => x.id !== l.id))} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid transparent', background: 'transparent', color: 'var(--ink-3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><QLu name="x" size={13} /></button>
            </div>
          ))}
          <div style={{ paddingTop: 8 }}>
            <QBtn variant="ghost" size="sm" icon={<QLu name="plus" size={13} />}
              onClick={() => setLines(ls => [...ls, { id: 'l' + Date.now(), desc: 'new line item', hours: 4, rate: 'standard', amount: 360 }])}>line item</QBtn>
          </div>
        </div>

        <div><QEb>assumptions</QEb>
          <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {QFK.assumptions.map((a, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--ink-1)' }}>
                <QLu name="minus" size={13} color="var(--ink-3)" style={{ marginTop: 2, flexShrink: 0 }} />{a}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 6, borderTop: '1px solid var(--hairline)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <QEb>total</QEb>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 34, letterSpacing: '-0.02em', color: 'var(--ink-0)', lineHeight: 1.1 }}>{QFK.money(total)}</span>
          </div>
          <span style={{ flex: 1 }} />
          <QBtn variant="secondary" size="md">preview</QBtn>
          <QBtn variant="primary" size="md" icon={<QLu name="file-down" size={14} />}>generate pdf</QBtn>
        </div>
      </div>
    </QPanel>
  );
};

const HistoryRow = ({ q, first }) => {
  const actions = {
    draft: [{ label: 'mark sent', v: 'secondary' }],
    sent: [{ label: 'declined', v: 'ghost' }, { label: 'accepted', v: 'secondary' }],
    accepted: q.invoice ? [] : [{ label: 'convert to invoice', v: 'primary' }],
    declined: [],
  }[q.status] || [];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px', borderTop: first ? 'none' : '1px solid var(--hairline)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-0)' }}>{q.client}</span>
          <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>· {q.project}</span>
          {q.invoice && <span className="font-mono" style={{ fontSize: 10.5, color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><QLu name="link" size={11} color="var(--ink-3)" />{q.invoice}</span>}
        </div>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>{QFK.money(q.total)} · {q.date}</div>
      </div>
      <QPill tone={QFK.statusTone(q.status)}>{q.status}</QPill>
      {actions.map(a => <QBtn key={a.label} variant={a.v} size="sm">{a.label}</QBtn>)}
    </div>
  );
};

const Quotes = ({ drafting, setDrafting }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <QPanel title="work items" subtitle="FROM THE VAULT SWEEP"
      action={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--ink-2)' }}>{QFK.sweep.done}/{QFK.sweep.total}</span>
        <QBtn variant="secondary" size="sm" icon={<QLu name="radar" size={13} />}>sweep</QBtn>
      </span>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 2 }}>
        {QFK.workItems.map(w => <WorkItemCard key={w.id} w={w} onDraft={setDrafting} />)}
      </div>
    </QPanel>

    {drafting && <Composer item={drafting === true ? null : drafting} />}

    <QPanel title="quote history" subtitle="ALL QUOTES · NEWEST FIRST">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {QFK.quoteHistory.map((q, i) => <HistoryRow key={q.id} q={q} first={i === 0} />)}
      </div>
    </QPanel>
  </div>
);

window.FKQuotes = { Quotes };
