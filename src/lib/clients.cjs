// Pure client CRM logic: identity, match/resolve, validate, store merge, vault notes.
// CommonJS so main.cjs and node --test can require it.

const { createHash, randomBytes } = require('node:crypto');
const { slug } = require('./quotes.cjs');

const STATUSES = new Set(['prospect', 'active', 'inactive', 'archived']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emptyStore() {
  return { version: 1, clients: [] };
}

function normalizeClientName(name) {
  return String(name ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function newId(seed) {
  if (seed) {
    return createHash('sha1').update(String(seed)).digest('hex').slice(0, 12);
  }
  return randomBytes(6).toString('hex');
}

function contactId(seed) {
  return newId(seed || randomBytes(8).toString('hex'));
}

function trimOrUndef(v, max = 500) {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  return s.slice(0, max);
}

function validateEmail(email, label) {
  if (!email) return undefined;
  const e = String(email).trim();
  if (!e) return undefined;
  if (!EMAIL_RE.test(e)) throw new Error(`${label} is not a valid email: ${e}`);
  return e.slice(0, 200);
}

function cleanContact(c, idx) {
  if (!c || typeof c !== 'object') throw new Error(`contact ${idx}: expected object`);
  const name = trimOrUndef(c.name, 120);
  if (!name) throw new Error(`contact ${idx}: name is required`);
  return {
    id: typeof c.id === 'string' && c.id ? c.id : contactId(`${name}-${idx}`),
    name,
    email: validateEmail(c.email, `contact ${idx} email`),
    phone: trimOrUndef(c.phone, 40),
    role: trimOrUndef(c.role, 80),
    primary: Boolean(c.primary),
  };
}

function cleanBilling(b) {
  if (!b || typeof b !== 'object') return {};
  const addressLines = Array.isArray(b.addressLines)
    ? b.addressLines.map((l) => trimOrUndef(l, 120)).filter(Boolean).slice(0, 4)
    : undefined;
  return {
    email: validateEmail(b.email, 'billing email'),
    addressLines: addressLines?.length ? addressLines : undefined,
    city: trimOrUndef(b.city, 80),
    region: trimOrUndef(b.region, 80),
    postalCode: trimOrUndef(b.postalCode, 20),
    country: trimOrUndef(b.country, 80),
    taxId: trimOrUndef(b.taxId, 40),
  };
}

function cleanDefaults(d) {
  if (!d || typeof d !== 'object') return {};
  const currency = trimOrUndef(d.currency, 3);
  let vatRate;
  if (d.vatRate !== undefined && d.vatRate !== null && String(d.vatRate).trim() !== '') {
    const n = Number(d.vatRate);
    if (Number.isFinite(n)) {
      if (n < 0 || n > 100) throw new Error(`vatRate must be 0-100, got ${n}`);
      vatRate = n;
    }
  }
  return {
    currency: currency ? currency.toUpperCase() : undefined,
    rateName: trimOrUndef(d.rateName, 60),
    paymentTerms: trimOrUndef(d.paymentTerms, 200),
    vatRate,
  };
}

/** Validate and normalize a client payload. Throws on bad input. */
function validateClient(input, { now = () => new Date() } = {}) {
  if (!input || typeof input !== 'object') throw new Error('client payload required');
  const name = trimOrUndef(input.name, 120);
  if (!name) throw new Error('client name is required');

  const status = input.status ?? 'prospect';
  if (!STATUSES.has(status)) throw new Error(`invalid status: ${status}`);

  const contacts = Array.isArray(input.contacts)
    ? input.contacts.map((c, i) => cleanContact(c, i))
    : [];
  // ensure at most one primary
  let seenPrimary = false;
  for (const c of contacts) {
    if (c.primary) {
      if (seenPrimary) c.primary = false;
      else seenPrimary = true;
    }
  }
  if (contacts.length && !seenPrimary) contacts[0].primary = true;

  const tags = Array.isArray(input.tags)
    ? [...new Set(input.tags.map((t) => trimOrUndef(t, 40)).filter(Boolean))]
    : [];

  const sourceNotes = Array.isArray(input.sourceNotes)
    ? [...new Set(input.sourceNotes.map((p) => trimOrUndef(p, 500)).filter(Boolean))]
    : [];

  const ts = now().toISOString();
  const id =
    typeof input.id === 'string' && /^[a-z0-9-]{6,32}$/i.test(input.id)
      ? input.id
      : newId(`${name}\n${ts}`);

  return {
    id,
    name,
    legalName: trimOrUndef(input.legalName, 160),
    status,
    tags,
    website: trimOrUndef(input.website, 300),
    contacts,
    billing: cleanBilling(input.billing),
    defaults: cleanDefaults(input.defaults),
    notes: trimOrUndef(input.notes, 8000),
    sourceNotes,
    createdAt: typeof input.createdAt === 'string' && input.createdAt ? input.createdAt : ts,
    updatedAt: ts,
  };
}

function matchClients(clients, query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return [...(clients ?? [])];
  return (clients ?? []).filter((c) => {
    const hay = [
      c.name,
      c.legalName,
      ...(c.tags ?? []),
      ...(c.contacts ?? []).flatMap((x) => [x.name, x.email]),
      c.billing?.email,
      c.billing?.taxId,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

function filterByStatus(clients, status) {
  if (!status || status === 'all') {
    return (clients ?? []).filter((c) => c.status !== 'archived');
  }
  return (clients ?? []).filter((c) => c.status === status);
}

/**
 * Exact normalized name match first, else substring candidates.
 * Returns { client, candidates }.
 */
function resolveClient(clients, name) {
  const list = clients ?? [];
  const norm = normalizeClientName(name);
  if (!norm) return { client: null, candidates: [] };

  const exact = list.filter((c) => normalizeClientName(c.name) === norm && c.status !== 'archived');
  if (exact.length === 1) return { client: exact[0], candidates: exact };
  if (exact.length > 1) return { client: null, candidates: exact };

  const partial = list.filter(
    (c) => c.status !== 'archived' && normalizeClientName(c.name).includes(norm),
  );
  if (partial.length === 1) return { client: partial[0], candidates: partial };
  return { client: null, candidates: partial };
}

function mergeUpsert(store, input, now = () => new Date()) {
  const base = store?.clients ? store : emptyStore();
  const clients = [...(base.clients ?? [])];
  const validated = validateClient(input, { now });

  const idx = clients.findIndex((c) => c.id === validated.id);
  if (idx >= 0) {
    // preserve createdAt on update
    validated.createdAt = clients[idx].createdAt;
    clients[idx] = validated;
  } else {
    // soft-warn style: if another active client has same normalized name, still allow
    clients.push(validated);
  }
  return { store: { version: 1, clients }, client: validated };
}

function archiveClient(store, id) {
  const base = store?.clients ? store : emptyStore();
  const clients = (base.clients ?? []).map((c) =>
    c.id === id ? { ...c, status: 'archived', updatedAt: new Date().toISOString() } : c,
  );
  if (!(base.clients ?? []).some((c) => c.id === id)) throw new Error(`unknown client: ${id}`);
  return { version: 1, clients };
}

function bootstrapFromNames(store, names, now = () => new Date()) {
  let next = store?.clients ? { version: 1, clients: [...store.clients] } : emptyStore();
  let created = 0;
  const seen = new Set(next.clients.map((c) => normalizeClientName(c.name)));
  for (const raw of names ?? []) {
    const name = trimOrUndef(raw, 120);
    if (!name) continue;
    const norm = normalizeClientName(name);
    if (!norm || norm === 'unknown' || seen.has(norm)) continue;
    const { store: s, client } = mergeUpsert(
      next,
      { name, status: 'active', tags: ['bootstrap'] },
      now,
    );
    next = s;
    seen.add(norm);
    created += 1;
    void client;
  }
  return { store: next, created };
}

function primaryContact(client) {
  const contacts = client?.contacts ?? [];
  return contacts.find((c) => c.primary) || contacts[0] || null;
}

/** Vault note markdown for a client card under 30-cross-context/clients/. */
function clientVaultNote(client) {
  const basename = `client-${slug(client.name)}`;
  const contactLines = (client.contacts ?? [])
    .map((c) => {
      const bits = [c.name, c.role, c.email, c.phone].filter(Boolean).join(' · ');
      return `- ${bits}${c.primary ? ' (primary)' : ''}`;
    })
    .join('\n');
  const billing = client.billing ?? {};
  const addr = [...(billing.addressLines ?? []), [billing.city, billing.postalCode].filter(Boolean).join(' '), billing.region, billing.country]
    .filter(Boolean)
    .join('\n');

  const tagsYaml = (client.tags ?? []).map((t) => JSON.stringify(t)).join(', ');
  const escQ = (s) => String(s ?? '').replace(/"/g, '\\"');

  const md = `---
type: client
id: "${client.id}"
name: "${escQ(client.name)}"
legalName: "${escQ(client.legalName ?? '')}"
status: ${client.status}
tags: [${tagsYaml}]
taxId: "${escQ(billing.taxId ?? '')}"
created: ${client.createdAt}
updated: ${client.updatedAt}
---

# ${client.name}

${client.legalName && client.legalName !== client.name ? `**Legal name:** ${client.legalName}\n` : ''}
${client.website ? `**Website:** ${client.website}\n` : ''}

## Contacts

${contactLines || '_none_'}

## Billing

${addr || '_no address_'}
${billing.email ? `\nEmail: ${billing.email}` : ''}
${billing.taxId ? `\nTax ID: ${billing.taxId}` : ''}

## Notes

${client.notes ?? ''}
`;
  return { basename, markdown: md };
}

module.exports = {
  STATUSES,
  emptyStore,
  normalizeClientName,
  newId,
  validateClient,
  matchClients,
  filterByStatus,
  resolveClient,
  mergeUpsert,
  archiveClient,
  bootstrapFromNames,
  primaryContact,
  clientVaultNote,
  slug,
};
