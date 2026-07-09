// fk-data.jsx — believable freelance back-office data (July 2026, EUR)

window.FK = {
  stats: {
    openWork: 6,
    awaitingReply: 3,
    unpaidInvoices: 4,
    overdue: 1,
    revenueMonth: 8450,
    revenueDelta: 12, // % vs last month
  },

  needsAttention: [
    { id: 'n1', kind: 'work',    icon: 'inbox',         text: 'new work item — Ferndale Coffee Co wants a loyalty microsite', action: 'quote it', variant: 'primary' },
    { id: 'n2', kind: 'accepted',icon: 'check-circle',  text: 'quote accepted — Acme Studio · marketing site rebuild', action: 'convert to invoice', variant: 'primary' },
    { id: 'n3', kind: 'overdue', icon: 'alert-triangle',text: 'INV-2026-004 is 6 days overdue — Northwind Labs · €1,800', action: 'copy nudge', variant: 'danger' },
    { id: 'n4', kind: 'work',    icon: 'inbox',         text: 'new work item — Mistral Bakery mentioned a menu redesign', action: 'quote it', variant: 'primary' },
    { id: 'n5', kind: 'sent',    icon: 'clock',         text: 'quote to Vellum Press sent 5 days ago — no reply yet', action: 'copy follow-up', variant: 'secondary' },
  ],

  recent: [
    { icon: 'send',        tone: 'neon',    verb: 'quote sent',  subject: 'Acme Studio · marketing site rebuild', meta: '2d' },
    { icon: 'banknote',    tone: 'moss',    verb: 'paid',        subject: 'INV-2026-006 · €2,400', meta: '4h' },
    { icon: 'check',       tone: 'moss',    verb: 'accepted',    subject: 'Ferndale Coffee Co · brand refresh', meta: '1d' },
    { icon: 'file-plus',   tone: 'fog',     verb: 'invoice drafted', subject: 'INV-2026-007 · Acme Studio', meta: '1d' },
    { icon: 'x',           tone: 'oxblood', verb: 'declined',    subject: 'Vellum Press · packaging system', meta: '3d' },
    { icon: 'user-plus',   tone: 'fog',     verb: 'client added', subject: 'Mistral Bakery', meta: '5d' },
    { icon: 'send',        tone: 'neon',    verb: 'quote sent',  subject: 'Northwind Labs · analytics dashboard', meta: '6d' },
  ],

  // ---- quotes ------------------------------------------------------------
  workItems: [
    { id: 'w1', title: 'loyalty microsite', client: 'Ferndale Coffee Co', ask: 'a small site where regulars track stamps and redeem a free cup. wants it live before the autumn campaign.', note: 'vault/clients/ferndale/2026-07-03.md', confidence: 92 },
    { id: 'w2', title: 'menu redesign', client: 'Mistral Bakery', ask: 'printed + digital menu, seasonal template they can update themselves.', note: 'vault/meetings/mistral-call.md', confidence: 78 },
    { id: 'w3', title: 'analytics dashboard', client: 'Northwind Labs', ask: 'internal dashboard pulling their warehouse metrics into one view.', note: 'vault/inbox/2026-07-01.md', confidence: 64 },
  ],
  sweep: { done: 12, total: 40 },

  quoteHistory: [
    { id: 'q1', client: 'Acme Studio',       project: 'marketing site rebuild', total: 6400, date: 'jul 2',  status: 'accepted' },
    { id: 'q2', client: 'Northwind Labs',    project: 'analytics dashboard',    total: 4200, date: 'jul 4',  status: 'sent' },
    { id: 'q3', client: 'Ferndale Coffee Co',project: 'brand refresh',          total: 2800, date: 'jun 28', status: 'accepted', invoice: 'INV-2026-006' },
    { id: 'q4', client: 'Vellum Press',      project: 'packaging system',       total: 5100, date: 'jun 24', status: 'declined' },
    { id: 'q5', client: 'Mistral Bakery',    project: 'menu redesign',          total: 1500, date: 'jul 5',  status: 'draft' },
  ],

  composerLines: [
    { id: 'l1', desc: 'discovery + information architecture', hours: 12, rate: 'standard', amount: 1080 },
    { id: 'l2', desc: 'responsive design, 6 key templates',   hours: 34, rate: 'standard', amount: 3060 },
    { id: 'l3', desc: 'build + cms integration',              hours: 26, rate: 'standard', amount: 2340 },
  ],
  rateOptions: [
    { id: 'standard', label: 'standard · €90/h', rate: 90 },
    { id: 'rush', label: 'rush · €130/h', rate: 130 },
    { id: 'nonprofit', label: 'nonprofit · €65/h', rate: 65 },
  ],
  assumptions: [
    'copy supplied by the client in final form',
    'up to two rounds of revision per template',
    'hosting and domain billed separately',
  ],

  // ---- invoices ----------------------------------------------------------
  invoices: [
    { id: 'INV-2026-007', client: 'Acme Studio',        total: 6400, due: 'jul 24', status: 'draft', fromQuote: 'quote-acme-2026-07-02' },
    { id: 'INV-2026-006', client: 'Ferndale Coffee Co', total: 2400, due: 'jul 12', status: 'paid' },
    { id: 'INV-2026-005', client: 'Northwind Labs',     total: 3200, due: 'jul 18', status: 'sent' },
    { id: 'INV-2026-004', client: 'Northwind Labs',     total: 1800, due: 'jul 1',  status: 'overdue', overdueDays: 6 },
    { id: 'INV-2026-003', client: 'Vellum Press',       total: 900,  due: 'jun 20', status: 'paid' },
  ],

  // ---- clients -----------------------------------------------------------
  clients: [
    { id: 'c1', name: 'Acme Studio', company: 'Acme Studio BV', email: 'ops@acme.studio', phone: '+31 20 555 0142', tags: ['retainer','design'], balance: 6400, currency: 'EUR', vat: 21, terms: 14,
      notes: 'prefers async updates in the shared vault. sasha signs off on scope; invoices go to finance@.',
      docs: [ { t: 'quote', id: 'quote-acme-2026-07-02', total: 6400, status: 'accepted' }, { t: 'invoice', id: 'INV-2026-007', total: 6400, status: 'draft' } ] },
    { id: 'c2', name: 'Ferndale Coffee Co', company: 'Ferndale Coffee Co', email: 'hello@ferndale.coffee', phone: '+44 161 555 0199', tags: ['small biz'], balance: 0, currency: 'EUR', vat: 20, terms: 14,
      notes: 'warm, quick to reply. wants everything editable by a non-technical team.',
      docs: [ { t: 'invoice', id: 'INV-2026-006', total: 2400, status: 'paid' }, { t: 'quote', id: 'quote-ferndale-2026-06', total: 2800, status: 'accepted' } ] },
    { id: 'c3', name: 'Northwind Labs', company: 'Northwind Labs Inc', email: 'accounts@northwind.io', phone: '+1 415 555 0161', tags: ['tech','net-30'], balance: 5000, currency: 'EUR', vat: 0, terms: 30,
      notes: 'slow payers — chase on day 3 past due. net-30 in contract.',
      docs: [ { t: 'invoice', id: 'INV-2026-005', total: 3200, status: 'sent' }, { t: 'invoice', id: 'INV-2026-004', total: 1800, status: 'overdue' } ] },
    { id: 'c4', name: 'Mistral Bakery', company: 'Mistral Bakery', email: 'marie@mistral.bakery', phone: '+33 1 55 55 01 88', tags: ['new'], balance: 0, currency: 'EUR', vat: 20, terms: 14,
      notes: 'first project. keep the quote simple.', docs: [] },
    { id: 'c5', name: 'Vellum Press', company: 'Vellum Press Ltd', email: 'studio@vellum.press', phone: '+44 20 555 0173', tags: ['publishing'], balance: 0, currency: 'EUR', vat: 20, terms: 21, archived: true,
      notes: 'declined the last packaging quote — budget. revisit in q4.',
      docs: [ { t: 'quote', id: 'quote-vellum-2026-06', total: 5100, status: 'declined' } ] },
  ],

  namedRates: [
    { id: 'r1', name: 'standard', rate: 90 },
    { id: 'r2', name: 'rush', rate: 130 },
    { id: 'r3', name: 'nonprofit', rate: 65 },
  ],
};

window.FK.money = (n, cur = 'EUR') => (cur === 'EUR' ? '€' : cur === 'GBP' ? '£' : '$') + n.toLocaleString('en-US');
window.FK.statusTone = (s) => ({ draft: 'fog', sent: 'neon', accepted: 'moss', paid: 'moss', declined: 'oxblood', overdue: 'oxblood', invoiced: 'outline' }[s] || 'fog');
