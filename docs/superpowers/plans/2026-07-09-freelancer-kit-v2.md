# Freelancer Kit v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Poltergeist Freelancer plugin from quoting-only into dashboard + quote lifecycle + invoices + clients CRM + settings, per the approved spec at `docs/superpowers/specs/2026-07-09-freelancer-kit-design.md`.

**Architecture:** Hybrid truth — quotes/invoices are vault markdown notes with lifecycle status in frontmatter (rewritten single-field, tmp+rename); clients live in `dataDir/clients.json`; the invoice counter in `dataDir/counter.json`. Main process exposes IPC handlers via the existing deps-injectable `createHandlers`; the renderer is rebuilt as a small token-faithful component kit + five tab modules, ported from the approved claude.ai/design screens.

**Tech Stack:** Node CommonJS libs (`src/lib/*.cjs`), React 19 renderer bundled by esbuild (`build.mjs`), `node --test` for tests, Electron `printToPDF` for PDFs.

## Global Constraints

- All lib code is CommonJS (`.cjs`) requireable by both `src/main.cjs` and `node --test`.
- Renderer must never import node builtins (bundled for the browser); money math stays in `src/lib/money.cjs`.
- Every user/LLM string interpolated into HTML goes through `esc()` from `src/lib/template.cjs`.
- Multi-byte file writes are tmp+rename. Frontmatter status rewrites change ONLY the target field, preserving the rest byte-for-byte.
- Handlers validate inputs and `throw new Error('...')` — never return error objects.
- Status transitions (reject anything else): quotes `draft→sent`, `sent→accepted|declined`, `declined→sent`; invoices `draft→sent`, `sent→paid`. `accepted`/`paid` terminal. `overdue` is computed at read time, never stored.
- Invoice numbers: `PREFIX-YYYY-NNN`, zero-padded 3, from `dataDir/counter.json`.
- VAT resolution: invoice override → client `defaults.vatRate` → settings `invoicing.vatRate` → 0.
- UI tokens come from host theme vars (`--ink-*`, `--paper`, `--vellum`, `--fog`, `--neon`, `--oxblood`, `--moss`, `--hairline*`); status pills: draft=fog, sent=neon, accepted/paid=moss, declined/overdue=oxblood.
- Run all tests with `npm test`. Commit after every task.

---

### Task 0: Commit the in-flight clients work

The working tree already contains the clients CRM (new `src/lib/clients.cjs`, `test/clients.test.mjs`; modified `src/main.cjs`, `src/lib/template.cjs`, tests). Land it before building on it.

**Files:**
- Commit as-is: `src/lib/clients.cjs`, `src/main.cjs`, `src/lib/template.cjs`, `test/clients.test.mjs`, `test/main.test.mjs`, `test/template.test.mjs`

**Interfaces:**
- Produces: `clients.cjs` exports (`validateClient`, `resolveClient`, `mergeUpsert`, `archiveClient`, `bootstrapFromNames`, `primaryContact`, `clientVaultNote`, `filterByStatus`, `matchClients`, `emptyStore`) and main.cjs `clients:*` handlers — used by Tasks 3, 6, 7, 11.

- [ ] **Step 1: Run the full suite**

Run: `npm test`
Expected: all tests pass (quotes, template, clients, main). If anything fails, STOP and surface it — do not fix-and-guess uncommitted work.

- [ ] **Step 2: Commit**

```bash
git add src/lib/clients.cjs src/main.cjs src/lib/template.cjs test/
git commit -m "feat: clients CRM (store, resolve, bootstrap, vault mirror)"
```

---

### Task 1: Lifecycle lib — frontmatter parse/rewrite + transitions

**Files:**
- Create: `src/lib/lifecycle.cjs`
- Test: `test/lifecycle.test.mjs`

**Interfaces:**
- Produces:
  - `parseFrontmatter(text) -> { fields: Record<string,string>, body: string }` — regex frontmatter reader (same tolerant style as `quotes:list`).
  - `setFrontmatterField(text, key, value) -> string` — rewrites/inserts one `key: value` line inside the `---` block; everything else byte-identical. Throws if no frontmatter block.
  - `QUOTE_TRANSITIONS`, `INVOICE_TRANSITIONS` — `Record<status, string[]>`.
  - `assertTransition(table, from, to)` — throws `invalid transition: <from> -> <to>` when not allowed.
  - `isOverdue({ status, due }, today) -> boolean` — `status === 'sent' && due < YYYY-MM-DD(today)`.

- [ ] **Step 1: Write the failing tests**

```js
// test/lifecycle.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {
  parseFrontmatter, setFrontmatterField,
  QUOTE_TRANSITIONS, INVOICE_TRANSITIONS, assertTransition, isOverdue,
} = require('../src/lib/lifecycle.cjs');

const NOTE = `---
client: "ACME GmbH"
total: 1200
status: draft
---

# Quote — ACME GmbH

Body stays untouched. | pipes | and --- dashes included.
`;

test('parseFrontmatter reads fields and body', () => {
  const { fields, body } = parseFrontmatter(NOTE);
  assert.equal(fields.client, 'ACME GmbH');
  assert.equal(fields.status, 'draft');
  assert.ok(body.includes('# Quote'));
});

test('setFrontmatterField rewrites only the target line', () => {
  const out = setFrontmatterField(NOTE, 'status', 'sent');
  assert.equal(parseFrontmatter(out).fields.status, 'sent');
  assert.equal(out.replace('status: sent', 'status: draft'), NOTE); // byte-for-byte otherwise
});

test('setFrontmatterField inserts a missing key before the closing ---', () => {
  const out = setFrontmatterField(NOTE, 'invoiced', 'true');
  assert.equal(parseFrontmatter(out).fields.invoiced, 'true');
  assert.ok(out.includes('status: draft')); // existing untouched
});

test('setFrontmatterField throws without frontmatter', () => {
  assert.throws(() => setFrontmatterField('# no fm\n', 'status', 'sent'), /frontmatter/);
});

test('transition tables allow the spec paths and nothing else', () => {
  assertTransition(QUOTE_TRANSITIONS, 'draft', 'sent');
  assertTransition(QUOTE_TRANSITIONS, 'sent', 'accepted');
  assertTransition(QUOTE_TRANSITIONS, 'sent', 'declined');
  assertTransition(QUOTE_TRANSITIONS, 'declined', 'sent');
  assert.throws(() => assertTransition(QUOTE_TRANSITIONS, 'accepted', 'draft'), /invalid transition/);
  assertTransition(INVOICE_TRANSITIONS, 'draft', 'sent');
  assertTransition(INVOICE_TRANSITIONS, 'sent', 'paid');
  assert.throws(() => assertTransition(INVOICE_TRANSITIONS, 'paid', 'sent'), /invalid transition/);
  assert.throws(() => assertTransition(INVOICE_TRANSITIONS, 'nope', 'sent'), /invalid transition/);
});

test('isOverdue only for sent past due', () => {
  const today = new Date('2026-07-09T12:00:00Z');
  assert.equal(isOverdue({ status: 'sent', due: '2026-07-08' }, today), true);
  assert.equal(isOverdue({ status: 'sent', due: '2026-07-09' }, today), false); // due today ≠ overdue
  assert.equal(isOverdue({ status: 'paid', due: '2026-07-01' }, today), false);
  assert.equal(isOverdue({ status: 'draft', due: '2026-07-01' }, today), false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/lifecycle.test.mjs`
Expected: FAIL — `Cannot find module '../src/lib/lifecycle.cjs'`

- [ ] **Step 3: Implement**

```js
// src/lib/lifecycle.cjs
// Lifecycle state for vault documents: tolerant frontmatter read, surgical
// single-field rewrite, and the status transition tables from the spec.

const FM_RE = /^---\n([\s\S]*?)\n---/;

function parseFrontmatter(text) {
  const m = String(text ?? '').match(FM_RE);
  const fields = {};
  if (m) {
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^(\w[\w-]*):\s*"?(.*?)"?\s*$/);
      if (kv) fields[kv[1]] = kv[2];
    }
  }
  return { fields, body: m ? text.slice(m[0].length) : String(text ?? '') };
}

function setFrontmatterField(text, key, value) {
  const m = String(text ?? '').match(FM_RE);
  if (!m) throw new Error('note has no frontmatter block');
  const lines = m[1].split('\n');
  const idx = lines.findIndex((l) => l.startsWith(`${key}:`));
  if (idx >= 0) lines[idx] = `${key}: ${value}`;
  else lines.push(`${key}: ${value}`);
  return `---\n${lines.join('\n')}\n---` + text.slice(m[0].length);
}

const QUOTE_TRANSITIONS = { draft: ['sent'], sent: ['accepted', 'declined'], declined: ['sent'], accepted: [] };
const INVOICE_TRANSITIONS = { draft: ['sent'], sent: ['paid'], paid: [] };

function assertTransition(table, from, to) {
  if (!table[from] || !table[from].includes(to)) {
    throw new Error(`invalid transition: ${from} -> ${to}`);
  }
}

function isOverdue(doc, today) {
  if (doc.status !== 'sent' || !doc.due) return false;
  return doc.due < today.toISOString().slice(0, 10);
}

module.exports = { parseFrontmatter, setFrontmatterField, QUOTE_TRANSITIONS, INVOICE_TRANSITIONS, assertTransition, isOverdue };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/lifecycle.test.mjs`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle.cjs test/lifecycle.test.mjs
git commit -m "feat: lifecycle lib (frontmatter rewrite, status transitions, overdue)"
```

---

### Task 2: Invoices lib — numbering, VAT totals, conversion payload

**Files:**
- Create: `src/lib/invoices.cjs`
- Test: `test/invoices.test.mjs`

**Interfaces:**
- Consumes: `computeTotals(lineItems, rates)` from `src/lib/money.cjs`; `slug` from `src/lib/quotes.cjs`.
- Produces:
  - `formatInvoiceNumber({ prefix, year, next }) -> "INV-2026-007"`.
  - `advanceCounter(counter, nowYear) -> counter` — bumps `next`; when `yearReset` and `nowYear !== counter.year`, resets to `{year: nowYear, next: 2}` (the consumed number was 1 of the new year).
  - `currentNumber(counter, nowYear) -> string` — the number the NEXT generate will use (handles pending year reset).
  - `computeInvoiceTotals(lineItems, rates, vatRate) -> { rows, subtotal, vatRate, vatAmount, total }` — VAT on top, half-up rounding to cents.
  - `invoiceBasename(client, number) -> "invoice-acme-INV-2026-007"`.
  - `dataComment(obj) -> "<!-- freelancer:data {...} -->"` and `parseDataComment(text) -> obj|null` — machine payload embedded in note bodies (carries `lineItems` for quote→invoice conversion).
  - `resolveVatRate({ invoiceVat, clientVat, settingsVat }) -> number`.

- [ ] **Step 1: Write the failing tests**

```js
// test/invoices.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {
  formatInvoiceNumber, advanceCounter, currentNumber,
  computeInvoiceTotals, invoiceBasename, dataComment, parseDataComment, resolveVatRate,
} = require('../src/lib/invoices.cjs');

test('formatInvoiceNumber pads to 3', () => {
  assert.equal(formatInvoiceNumber({ prefix: 'INV', year: 2026, next: 7 }), 'INV-2026-007');
  assert.equal(formatInvoiceNumber({ prefix: 'RD', year: 2026, next: 1234 }), 'RD-2026-1234');
});

test('currentNumber + advanceCounter without year reset', () => {
  const c = { prefix: 'INV', year: 2026, next: 7, yearReset: false };
  assert.equal(currentNumber(c, 2027), 'INV-2026-007');
  assert.deepEqual(advanceCounter(c, 2027), { ...c, next: 8 });
});

test('year reset consumes number 1 of the new year', () => {
  const c = { prefix: 'INV', year: 2026, next: 9, yearReset: true };
  assert.equal(currentNumber(c, 2027), 'INV-2027-001');
  assert.deepEqual(advanceCounter(c, 2027), { prefix: 'INV', year: 2027, next: 2, yearReset: true });
});

test('computeInvoiceTotals applies vat on top with cent rounding', () => {
  const rates = { currency: 'EUR', default: 80, named: [] };
  const r = computeInvoiceTotals([{ description: 'work', hours: 3, rate: 'default' }], rates, 15);
  assert.equal(r.subtotal, 240);
  assert.equal(r.vatRate, 15);
  assert.equal(r.vatAmount, 36);
  assert.equal(r.total, 276);
  const zero = computeInvoiceTotals([{ description: 'work', hours: 1, rate: 'default' }], rates, 0);
  assert.equal(zero.vatAmount, 0);
  assert.equal(zero.total, zero.subtotal);
  // rounding: 33.33 * 1.15 = 38.3295 -> 38.33
  const odd = computeInvoiceTotals([{ description: 'x', hours: 0.41665, rate: 'default' }], rates, 15);
  assert.equal(odd.vatAmount, Math.round(odd.subtotal * 0.15 * 100) / 100);
});

test('invoiceBasename slugs the client and keeps the number verbatim', () => {
  assert.equal(invoiceBasename('ACME GmbH', 'INV-2026-007'), 'invoice-acme-gmbh-INV-2026-007');
});

test('data comment round-trips and survives surrounding markdown', () => {
  const items = [{ description: 'a | b', hours: 2, rate: 'default' }];
  const note = `# Quote\n\ntext\n\n${dataComment({ lineItems: items })}\n`;
  assert.deepEqual(parseDataComment(note).lineItems, items);
  assert.equal(parseDataComment('# nothing here'), null);
});

test('resolveVatRate precedence: invoice > client > settings > 0', () => {
  assert.equal(resolveVatRate({ invoiceVat: 20, clientVat: 15, settingsVat: 10 }), 20);
  assert.equal(resolveVatRate({ invoiceVat: undefined, clientVat: 15, settingsVat: 10 }), 15);
  assert.equal(resolveVatRate({ clientVat: undefined, settingsVat: 10 }), 10);
  assert.equal(resolveVatRate({}), 0);
  assert.equal(resolveVatRate({ invoiceVat: 0, clientVat: 15 }), 0); // explicit 0 wins
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/invoices.test.mjs`
Expected: FAIL — `Cannot find module '../src/lib/invoices.cjs'`

- [ ] **Step 3: Implement**

```js
// src/lib/invoices.cjs
// Pure invoice logic: sequential numbering, VAT-on-top totals, filenames,
// and the machine-readable data comment that carries line items in notes.

const { computeTotals } = require('./money.cjs');
const { slug } = require('./quotes.cjs');

function pad3(n) {
  return String(n).padStart(3, '0');
}

function effectiveCounter(counter, nowYear) {
  if (counter.yearReset && nowYear !== counter.year) {
    return { ...counter, year: nowYear, next: 1 };
  }
  return counter;
}

function formatInvoiceNumber({ prefix, year, next }) {
  return `${prefix}-${year}-${pad3(next)}`;
}

function currentNumber(counter, nowYear) {
  return formatInvoiceNumber(effectiveCounter(counter, nowYear));
}

function advanceCounter(counter, nowYear) {
  const eff = effectiveCounter(counter, nowYear);
  return { ...eff, next: eff.next + 1 };
}

function computeInvoiceTotals(lineItems, rates, vatRate) {
  const { rows, total: subtotal } = computeTotals(lineItems, rates);
  const rate = Number.isFinite(Number(vatRate)) ? Number(vatRate) : 0;
  const vatAmount = Math.round(subtotal * (rate / 100) * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;
  return { rows, subtotal, vatRate: rate, vatAmount, total };
}

function invoiceBasename(client, number) {
  return `invoice-${slug(client)}-${number}`;
}

const DATA_RE = /<!-- freelancer:data (\{[\s\S]*?\}) -->/;

function dataComment(obj) {
  return `<!-- freelancer:data ${JSON.stringify(obj)} -->`;
}

function parseDataComment(text) {
  const m = String(text ?? '').match(DATA_RE);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

function resolveVatRate({ invoiceVat, clientVat, settingsVat } = {}) {
  for (const v of [invoiceVat, clientVat, settingsVat]) {
    if (v !== undefined && v !== null && Number.isFinite(Number(v))) return Number(v);
  }
  return 0;
}

module.exports = {
  formatInvoiceNumber, advanceCounter, currentNumber,
  computeInvoiceTotals, invoiceBasename, dataComment, parseDataComment, resolveVatRate,
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/invoices.test.mjs`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/invoices.cjs test/invoices.test.mjs
git commit -m "feat: invoice lib (numbering, vat totals, data comment, filenames)"
```

---

### Task 3: Client defaults gain `vatRate`

**Files:**
- Modify: `src/lib/clients.cjs` (function `cleanDefaults`, ~line 80)
- Test: `test/clients.test.mjs` (append)

**Interfaces:**
- Produces: `client.defaults.vatRate?: number` (0–100), consumed by Task 6's `invoices:draft` and Task 11's client detail form.

- [ ] **Step 1: Write the failing test** (append to `test/clients.test.mjs`)

```js
test('defaults accept a numeric vatRate and drop junk', () => {
  const c = validateClient({ name: 'Acme', defaults: { currency: 'eur', vatRate: 15 } });
  assert.equal(c.defaults.vatRate, 15);
  assert.equal(c.defaults.currency, 'EUR');
  const junk = validateClient({ name: 'Acme', defaults: { vatRate: 'abc' } });
  assert.equal(junk.defaults.vatRate, undefined);
  assert.throws(() => validateClient({ name: 'Acme', defaults: { vatRate: 120 } }), /vatRate/);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/clients.test.mjs`
Expected: FAIL — `vatRate` is `undefined` where 15 expected

- [ ] **Step 3: Implement** — in `cleanDefaults` in `src/lib/clients.cjs`:

```js
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test test/clients.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/clients.cjs test/clients.test.mjs
git commit -m "feat: per-client vatRate default"
```

---

### Task 4: Templates — line-item data in quote notes; invoice HTML + markdown

**Files:**
- Modify: `src/lib/template.cjs`
- Test: `test/template.test.mjs` (append)

**Interfaces:**
- Consumes: `computeInvoiceTotals`, `dataComment` from `src/lib/invoices.cjs`; existing `esc`, `billToHtml`.
- Produces:
  - `quoteMarkdown(...)` now ends with `dataComment({ lineItems: quote.lineItems })`.
  - `renderInvoiceHtml(invoice, brand, rates, client?) -> string` — invoice: `{ number, client, clientId?, project?, quoteRef?, issued: 'YYYY-MM-DD', due: 'YYYY-MM-DD', lineItems, vatRate, notes? }`. Same visual family as the quote (brand header, accent, table); doc title `INVOICE`, meta shows number + issued + due; totals block subtotal → `vat N%` line (omitted when `vatRate === 0`) → total; footer "payable to" uses `brand.contactLine` + terms.
  - `invoiceMarkdown(invoice, brand, rates, client?) -> string` — frontmatter exactly: `number, client, clientId?, quoteRef?, project?, issued, due, subtotal, vatRate, vatAmount, total, currency, status: draft, generated` + body table + `dataComment({ lineItems })`.

- [ ] **Step 1: Write the failing tests** (append to `test/template.test.mjs`; mirror its existing import style)

```js
test('quoteMarkdown embeds the machine-readable line items', () => {
  const md = quoteMarkdown(
    { client: 'Acme', project: 'Site', scopeSummary: 's', lineItems: [{ description: 'dev', hours: 2, rate: 'default' }], assumptions: [], sourceNote: 'x.md' },
    { paymentTerms: 'net 14', validityDays: 14 },
    { currency: 'EUR', default: 80, named: [] },
  );
  assert.ok(md.includes('freelancer:data'));
  assert.deepEqual(parseDataComment(md).lineItems, [{ description: 'dev', hours: 2, rate: 'default' }]);
});

const INVOICE = {
  number: 'INV-2026-007', client: 'Acme', project: 'Site',
  issued: '2026-07-09', due: '2026-07-23',
  lineItems: [{ description: 'development <b>', hours: 3, rate: 'default' }],
  vatRate: 15,
};
const BRAND = { businessName: 'Richter Digital', accentColor: '#C5FF3D', contactLine: 'jannik@richter.digital', paymentTerms: 'net 14' };
const RATES = { currency: 'EUR', default: 80, named: [] };

test('renderInvoiceHtml carries number, dates, vat line, escaped content', () => {
  const html = renderInvoiceHtml(INVOICE, BRAND, RATES);
  assert.ok(html.includes('INVOICE'));
  assert.ok(html.includes('INV-2026-007'));
  assert.ok(html.includes('2026-07-23'));
  assert.ok(html.includes('vat 15%'));
  assert.ok(html.includes('&lt;b&gt;'));         // esc applied
  assert.ok(!html.includes('development <b>'));  // raw never leaks
});

test('renderInvoiceHtml omits the vat line at rate 0', () => {
  const html = renderInvoiceHtml({ ...INVOICE, vatRate: 0 }, BRAND, RATES);
  assert.ok(!html.includes('vat 0%'));
});

test('invoiceMarkdown frontmatter has the full ledger and draft status', () => {
  const md = invoiceMarkdown(INVOICE, BRAND, RATES);
  const { fields } = parseFrontmatter(md);
  assert.equal(fields.number, 'INV-2026-007');
  assert.equal(fields.status, 'draft');
  assert.equal(fields.subtotal, '240');
  assert.equal(fields.vatAmount, '36');
  assert.equal(fields.total, '276');
  assert.equal(fields.due, '2026-07-23');
  assert.deepEqual(parseDataComment(md).lineItems, INVOICE.lineItems);
});
```

Add to the test file's requires: `parseDataComment` from `../src/lib/invoices.cjs`, `parseFrontmatter` from `../src/lib/lifecycle.cjs`, and the new template exports.

- [ ] **Step 2: Run to verify they fail**

Run: `node --test test/template.test.mjs`
Expected: FAIL — `renderInvoiceHtml is not a function` / missing data comment

- [ ] **Step 3: Implement in `src/lib/template.cjs`**

1. Require at top: `const { computeInvoiceTotals, dataComment } = require('./invoices.cjs');`
2. In `quoteMarkdown`, append before the final backtick: `\n${dataComment({ lineItems: quote.lineItems ?? [] })}\n`.
3. Extract the shared `<style>` block into `function baseStyles(accent)` returning the current CSS string (verbatim move), and reuse it in `renderQuoteHtml`.
4. Add:

```js
function renderInvoiceHtml(invoice, brand, rates, client) {
  const { rows, subtotal, vatRate, vatAmount, total } = computeInvoiceTotals(invoice.lineItems, rates, invoice.vatRate);
  const accent = /^#[0-9a-fA-F]{3,8}$/.test(brand.accentColor ?? '') ? brand.accentColor : '#C5FF3D';
  const money = (n) => esc(formatMoney(n, rates.currency ?? 'EUR'));
  const terms = client?.defaults?.paymentTerms || brand.paymentTerms || '';
  const lineRows = rows.map((r) => `      <tr>
        <td>${esc(r.description)}</td>
        <td class="num">${esc(String(r.hours))}</td>
        <td class="num">${money(r.hourly)}</td>
        <td class="num">${money(r.amount)}</td>
      </tr>`).join('\n');
  const vatRow = vatRate > 0
    ? `        <tr><td colspan="3" class="sub">vat ${esc(String(vatRate))}%</td><td class="num">${money(vatAmount)}</td></tr>\n`
    : '';
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${baseStyles(accent)}</style>
</head>
<body>
  <header>
    <div class="brand">
      ${brand.logoDataUri ? `<img src="${esc(brand.logoDataUri)}" alt="">` : ''}
      <div>
        <div class="name">${esc(brand.businessName || 'Invoice')}</div>
        <div class="contact">${esc(brand.contactLine ?? '')}</div>
      </div>
    </div>
    <div class="doc">
      <div class="title">INVOICE</div>
      <div class="meta">${esc(invoice.number)}<br>issued ${esc(invoice.issued)}<br>due ${esc(invoice.due)}</div>
    </div>
  </header>

  <div class="block">
    <div class="label">billed to</div>
${billToHtml(invoice, client)}
  </div>

  <div class="block">
    <table>
      <thead><tr><th>item</th><th class="num">hours</th><th class="num">rate</th><th class="num">amount</th></tr></thead>
      <tbody>
${lineRows}
        <tr><td colspan="3" class="sub">subtotal</td><td class="num">${money(subtotal)}</td></tr>
${vatRow}        <tr class="total-row"><td colspan="3">total due</td><td class="num amount">${money(total)}</td></tr>
      </tbody>
    </table>
  </div>

  <footer>
    <span>${esc(terms)}${terms ? ' · ' : ''}payable to ${esc(brand.contactLine ?? brand.businessName ?? '')}</span>
    <span>${esc(invoice.number)}</span>
  </footer>
</body>
</html>`;
}

function invoiceMarkdown(invoice, brand, rates, client) {
  const { rows, subtotal, vatRate, vatAmount, total } = computeInvoiceTotals(invoice.lineItems, rates, invoice.vatRate);
  const currency = rates.currency ?? 'EUR';
  const displayName = client?.legalName || client?.name || invoice.client;
  const escFm = (s) => String(s ?? '').replace(/"/g, '\\"');
  const opt = (k, v) => (v ? `${k}: "${escFm(v)}"\n` : '');
  const lines = rows
    .map((r) => `| ${r.description.replace(/\|/g, '\\|')} | ${r.hours} | ${formatMoney(r.hourly, currency)} | ${formatMoney(r.amount, currency)} |`)
    .join('\n');
  return `---
number: "${escFm(invoice.number)}"
client: "${escFm(displayName)}"
${opt('clientId', invoice.clientId || client?.id)}${opt('quoteRef', invoice.quoteRef)}${opt('project', invoice.project)}issued: ${invoice.issued}
due: ${invoice.due}
subtotal: ${subtotal}
vatRate: ${vatRate}
vatAmount: ${vatAmount}
total: ${total}
currency: ${currency}
status: draft
generated: ${new Date().toISOString()}
---

# Invoice ${invoice.number} — ${displayName}

| item | hours | rate | amount |
|------|-------|------|--------|
${lines}

subtotal ${formatMoney(subtotal, currency)}${vatRate > 0 ? `\nvat ${vatRate}% ${formatMoney(vatAmount, currency)}` : ''}
**Total due: ${formatMoney(total, currency)}** — due ${invoice.due}

${dataComment({ lineItems: invoice.lineItems ?? [] })}
`;
}
```

5. Export: `module.exports = { esc, billToHtml, renderQuoteHtml, quoteMarkdown, renderInvoiceHtml, invoiceMarkdown };`

- [ ] **Step 4: Run the full template + existing suites**

Run: `node --test test/template.test.mjs test/main.test.mjs`
Expected: PASS (quote golden tests still green — `baseStyles` extraction is a verbatim move)

- [ ] **Step 5: Commit**

```bash
git add src/lib/template.cjs src/lib/invoices.cjs test/template.test.mjs
git commit -m "feat: invoice html/markdown templates; quotes embed line-item data"
```

---

### Task 5: Handlers — quote status + richer quotes:list

**Files:**
- Modify: `src/main.cjs`
- Test: `test/main.test.mjs` (append)

**Interfaces:**
- Consumes: `setFrontmatterField`, `parseFrontmatter`, `QUOTE_TRANSITIONS`, `assertTransition` from `src/lib/lifecycle.cjs`.
- Produces:
  - `quotes:set-status ({ file, status })` — `file` is the basename (e.g. `quote-acme-20260709.md`) inside the quotes dir; validates transition against the note's current status; rewrites `status` via tmp+rename; returns `{ ok: true, status }`.
  - `quotes:list` rows gain `status` (default `'draft'` for legacy notes) and `invoiced: boolean`.

- [ ] **Step 1: Write the failing tests** (append to `test/main.test.mjs`; `makeWorld` unchanged)

```js
async function generateQuote(w) {
  w.llmResponses.push({ items: [{ title: 'Portal', client: 'ACME', ask: 'x', sourceNote: '00-inbox/mail-acme.md', confidence: 0.9 }] });
  await w.handlers['quotes:sweep']({});
  await w.handlers['quotes:generate']({
    client: 'ACME', project: 'Portal', scopeSummary: 's',
    lineItems: [{ description: 'dev', hours: 2, rate: 'default' }], assumptions: [], sourceNote: '00-inbox/mail-acme.md',
  });
  const [row] = await w.handlers['quotes:list']();
  return row;
}

test('quote status walks draft -> sent -> accepted and rejects bad moves', async () => {
  const w = makeWorld();
  const row = await generateQuote(w);
  assert.equal(row.status, 'draft');
  await w.handlers['quotes:set-status']({ file: row.file, status: 'sent' });
  await assert.rejects(w.handlers['quotes:set-status']({ file: row.file, status: 'draft' }), /invalid transition/);
  await w.handlers['quotes:set-status']({ file: row.file, status: 'accepted' });
  const [after] = await w.handlers['quotes:list']();
  assert.equal(after.status, 'accepted');
  await assert.rejects(w.handlers['quotes:set-status']({ file: row.file, status: 'sent' }), /invalid transition/);
  await assert.rejects(w.handlers['quotes:set-status']({ file: '../evil.md', status: 'sent' }), /basename|invalid/i);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/main.test.mjs`
Expected: FAIL — `w.handlers['quotes:set-status'] is not a function`

- [ ] **Step 3: Implement in `src/main.cjs`**

Require at top: `const { parseFrontmatter, setFrontmatterField, QUOTE_TRANSITIONS, INVOICE_TRANSITIONS, assertTransition, isOverdue } = require('./lib/lifecycle.cjs');`

Add a shared helper inside `createHandlers` (used again in Task 6):

```js
async function rewriteStatus(dir, file, status, table, extraFields = {}) {
  if (typeof file !== 'string' || file !== path.basename(file) || !file.endsWith('.md')) {
    throw new Error('file must be a note basename');
  }
  const full = path.join(dir, file);
  const text = await fsp.readFile(full, 'utf-8');
  const from = parseFrontmatter(text).fields.status || 'draft';
  assertTransition(table, from, status);
  let next = setFrontmatterField(text, 'status', status);
  for (const [k, v] of Object.entries(extraFields)) next = setFrontmatterField(next, k, v);
  const tmp = `${full}.tmp`;
  await fsp.writeFile(tmp, next);
  await fsp.rename(tmp, full);
  return { ok: true, status };
}
```

Handler: `'quotes:set-status': async ({ file, status } = {}) => rewriteStatus(quotesDir(), file, status, QUOTE_TRANSITIONS),`

In `quotes:list`, add to the pushed row: `status: get('status') || 'draft', invoiced: get('invoiced') === 'true',`

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS (all suites)

- [ ] **Step 5: Commit**

```bash
git add src/main.cjs test/main.test.mjs
git commit -m "feat: quote status transitions + status in quotes:list"
```

---

### Task 6: Handlers — invoices draft/generate/list/set-status + counter

**Files:**
- Modify: `src/main.cjs`
- Test: `test/main.test.mjs` (append)

**Interfaces:**
- Consumes: Task 2's `invoices.cjs` exports; Task 4's `renderInvoiceHtml`/`invoiceMarkdown`; Task 5's `rewriteStatus`; clients store helpers.
- Produces:
  - `DEFAULT_CONFIG.invoicing = { prefix: 'INV', vatRate: 0, netDays: 14, yearReset: true }` (settings-side; counter state is NOT in settings).
  - `invoices:counter ()` → current `counter.json` (`{ prefix, year, next, yearReset }`, seeded from config on first read) and `invoices:set-counter ({ next })` → validated positive-int write.
  - `invoices:draft ({ quoteFile? , clientId? })` → `{ number, client, clientId?, project?, quoteRef?, issued, due, lineItems, vatRate, currency }` — prefilled, nothing written.
  - `invoices:generate (invoice)` → writes `.md` + `.pdf` under `30-cross-context/invoices/`, advances counter, best-effort stamps source quote `invoiced: true`; returns `{ pdfPath, notePath, number }`.
  - `invoices:list ()` → rows `{ file, number, client, clientId, project, quoteRef, total, currency, issued, due, status, paidAt, overdue, daysOverdue, pdf }`.
  - `invoices:set-status ({ file, status })` — `paid` also stamps `paidAt`.

- [ ] **Step 1: Write the failing tests** (append to `test/main.test.mjs`)

```js
test('invoice lifecycle: draft from accepted quote, generate, mark paid', async () => {
  const w = makeWorld();
  const q = await generateQuote(w);
  await w.handlers['quotes:set-status']({ file: q.file, status: 'sent' });
  await w.handlers['quotes:set-status']({ file: q.file, status: 'accepted' });

  const draft = await w.handlers['invoices:draft']({ quoteFile: q.file });
  assert.equal(draft.number, 'INV-2026-001');
  assert.equal(draft.quoteRef, q.file);
  assert.deepEqual(draft.lineItems, [{ description: 'dev', hours: 2, rate: 'default' }]);
  assert.equal(draft.due > draft.issued, true);

  const gen = await w.handlers['invoices:generate'](draft);
  assert.match(gen.notePath, /invoice-acme-INV-2026-001\.md$/);
  assert.ok(existsSync(gen.pdfPath));

  const [row] = await w.handlers['invoices:list']();
  assert.equal(row.number, 'INV-2026-001');
  assert.equal(row.status, 'draft');
  assert.equal(row.overdue, false);

  // counter advanced
  const draft2 = await w.handlers['invoices:draft']({});
  assert.equal(draft2.number, 'INV-2026-002');

  // quote stamped
  const [qAfter] = await w.handlers['quotes:list']();
  assert.equal(qAfter.invoiced, true);

  await w.handlers['invoices:set-status']({ file: row.file, status: 'sent' });
  await w.handlers['invoices:set-status']({ file: row.file, status: 'paid' });
  const [paid] = await w.handlers['invoices:list']();
  assert.equal(paid.status, 'paid');
  assert.ok(paid.paidAt);
  await assert.rejects(w.handlers['invoices:set-status']({ file: row.file, status: 'sent' }), /invalid transition/);
});

test('overdue is computed, never stored', async () => {
  const w = makeWorld();
  const draft = await w.handlers['invoices:draft']({});
  const gen = await w.handlers['invoices:generate']({ ...draft, client: 'Acme', lineItems: [{ description: 'x', hours: 1, rate: 'default' }], due: '2020-01-01' });
  const file = gen.notePath.split('/').pop();
  await w.handlers['invoices:set-status']({ file, status: 'sent' });
  const [row] = await w.handlers['invoices:list']();
  assert.equal(row.overdue, true);
  assert.ok(row.daysOverdue > 1000);
  const text = readFileSync(gen.notePath, 'utf-8');
  assert.ok(!text.includes('overdue'));
});
```

(`makeWorld`'s injected `now` is real time; the counter year assertions use 2026 — inject `now: () => new Date('2026-07-09T12:00:00Z')` into `createHandlers` in `makeWorld` to pin them.)

- [ ] **Step 2: Run to verify they fail**

Run: `node --test test/main.test.mjs`
Expected: FAIL — `invoices:draft is not a function`

- [ ] **Step 3: Implement in `src/main.cjs`**

Requires: `const { currentNumber, advanceCounter, invoiceBasename, parseDataComment, resolveVatRate } = require('./lib/invoices.cjs');` and add `renderInvoiceHtml, invoiceMarkdown` to the template require. Add `invoicing: { prefix: 'INV', vatRate: 0, netDays: 14, yearReset: true }` to `DEFAULT_CONFIG`.

Inside `createHandlers`:

```js
const counterPath = path.join(ctx.dataDir, 'counter.json');
const invoicesDir = () => path.join(vaultDir(), '30-cross-context', 'invoices');

async function readCounter() {
  const { invoicing } = config();
  try {
    return JSON.parse(await fsp.readFile(counterPath, 'utf-8'));
  } catch {
    return { prefix: invoicing.prefix, year: now().getFullYear(), next: 1, yearReset: invoicing.yearReset };
  }
}
async function writeCounter(c) {
  await fsp.mkdir(ctx.dataDir, { recursive: true });
  const tmp = `${counterPath}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(c, null, 2));
  await fsp.rename(tmp, counterPath);
}
function fmtDate(d) { return d.toISOString().slice(0, 10); }
```

Handlers:

```js
'invoices:counter': async () => readCounter(),

'invoices:set-counter': async ({ next } = {}) => {
  const n = Number(next);
  if (!Number.isInteger(n) || n < 1) throw new Error('next must be a positive integer');
  const c = await readCounter();
  await writeCounter({ ...c, next: n });
  return { ok: true };
},

'invoices:draft': async (from = {}) => {
  const { invoicing, rates } = config();
  const counter = await readCounter();
  const number = currentNumber(counter, now().getFullYear());
  const issued = fmtDate(now());
  const due = fmtDate(new Date(now().getTime() + (Number(invoicing.netDays) || 14) * 86400000));
  let base = { number, issued, due, client: '', lineItems: [], vatRate: invoicing.vatRate ?? 0, currency: rates.currency };

  if (from.quoteFile) {
    if (from.quoteFile !== path.basename(from.quoteFile)) throw new Error('quoteFile must be a basename');
    const text = await fsp.readFile(path.join(quotesDir(), from.quoteFile), 'utf-8');
    const { fields } = parseFrontmatter(text);
    const data = parseDataComment(text);
    const store = await readClients();
    const client = fields.clientId ? store.clients.find((c) => c.id === fields.clientId) : resolveClient(store.clients, fields.client).client;
    base = {
      ...base,
      client: fields.client, clientId: client?.id, project: fields.project, quoteRef: from.quoteFile,
      lineItems: data?.lineItems ?? [],
      vatRate: resolveVatRate({ clientVat: client?.defaults?.vatRate, settingsVat: invoicing.vatRate }),
      currency: client?.defaults?.currency || rates.currency,
    };
  } else if (from.clientId) {
    const client = await findClient(from.clientId);
    if (!client) throw new Error(`unknown client: ${from.clientId}`);
    base = {
      ...base, client: client.name, clientId: client.id,
      vatRate: resolveVatRate({ clientVat: client.defaults?.vatRate, settingsVat: invoicing.vatRate }),
      currency: client.defaults?.currency || rates.currency,
    };
  }
  return base;
},

'invoices:generate': async (invoice) => {
  if (!invoice || typeof invoice !== 'object') throw new Error('generate needs an invoice');
  if (!invoice.client || !Array.isArray(invoice.lineItems) || invoice.lineItems.length === 0) {
    throw new Error('invoice needs a client and at least one line item');
  }
  const { brand, rates: baseRates, invoicing } = config();
  const client = invoice.clientId ? await findClient(invoice.clientId) : (await readClients()).clients && resolveClient((await readClients()).clients, invoice.client).client;
  const rates = { ...baseRates, currency: invoice.currency || client?.defaults?.currency || baseRates.currency };
  const counter = await readCounter();
  const year = now().getFullYear();
  const inv = {
    ...invoice,
    number: currentNumber(counter, year),
    issued: invoice.issued || fmtDate(now()),
    due: invoice.due || fmtDate(new Date(now().getTime() + (Number(invoicing.netDays) || 14) * 86400000)),
    vatRate: resolveVatRate({ invoiceVat: invoice.vatRate, clientVat: client?.defaults?.vatRate, settingsVat: invoicing.vatRate }),
  };
  const html = renderInvoiceHtml(inv, brand, rates, client || undefined);
  const pdf = await renderPdf(html);

  const dir = invoicesDir();
  await fsp.mkdir(dir, { recursive: true });
  let c = counter;
  let base = invoiceBasename(client?.name || inv.client, inv.number);
  for (;;) {
    try {
      await fsp.access(path.join(dir, `${base}.md`));
      c = advanceCounter(c, year);
      inv.number = currentNumber(c, year);
      base = invoiceBasename(client?.name || inv.client, inv.number);
    } catch {
      break;
    }
  }
  await fsp.writeFile(path.join(dir, `${base}.pdf`), pdf);
  await fsp.writeFile(path.join(dir, `${base}.md`), invoiceMarkdown(inv, brand, rates, client || undefined));
  await writeCounter(advanceCounter(c, year));

  if (inv.quoteRef) {
    try {
      const qFull = path.join(quotesDir(), inv.quoteRef);
      const qText = await fsp.readFile(qFull, 'utf-8');
      const next = setFrontmatterField(qText, 'invoiced', 'true');
      const tmp = `${qFull}.tmp`;
      await fsp.writeFile(tmp, next);
      await fsp.rename(tmp, qFull);
    } catch (err) {
      ctx.log('quote invoiced-stamp failed:', err.message);
    }
  }
  ctx.log('invoice generated:', path.join(dir, `${base}.pdf`));
  return { pdfPath: path.join(dir, `${base}.pdf`), notePath: path.join(dir, `${base}.md`), number: inv.number };
},

'invoices:list': async () => {
  let files;
  try {
    files = await fsp.readdir(invoicesDir());
  } catch {
    return [];
  }
  const out = [];
  const today = now();
  for (const f of files.filter((x) => x.endsWith('.md')).sort().reverse()) {
    const text = await fsp.readFile(path.join(invoicesDir(), f), 'utf-8').catch(() => '');
    const { fields } = parseFrontmatter(text);
    const status = fields.status || 'draft';
    const doc = { status, due: fields.due };
    const overdue = isOverdue(doc, today);
    out.push({
      file: f,
      number: fields.number ?? '',
      client: fields.client ?? '',
      clientId: fields.clientId || null,
      project: fields.project ?? '',
      quoteRef: fields.quoteRef || null,
      total: Number(fields.total) || 0,
      currency: fields.currency ?? '',
      issued: fields.issued ?? '',
      due: fields.due ?? '',
      status,
      paidAt: fields.paidAt || null,
      overdue,
      daysOverdue: overdue ? Math.floor((today.getTime() - new Date(fields.due).getTime()) / 86400000) : 0,
      pdf: files.includes(f.replace(/\.md$/, '.pdf')),
    });
  }
  return out;
},

'invoices:set-status': async ({ file, status } = {}) => {
  const extra = status === 'paid' ? { paidAt: now().toISOString() } : {};
  return rewriteStatus(invoicesDir(), file, status, INVOICE_TRANSITIONS, extra);
},
```

- [ ] **Step 4: Run to verify they pass**

Run: `npm test`
Expected: PASS (all suites)

- [ ] **Step 5: Commit**

```bash
git add src/main.cjs test/main.test.mjs
git commit -m "feat: invoice handlers (draft/generate/list/status) + counter"
```

---

### Task 7: Handler — dashboard:summary

**Files:**
- Modify: `src/main.cjs`
- Test: `test/main.test.mjs` (append)

**Interfaces:**
- Consumes: `quotes:list`, `invoices:list` handler logic (call the sibling handlers directly), work-items cache via `readCache()`.
- Produces: `dashboard:summary ()` →

```js
{
  workItems: number,                       // open suggestion cards
  quotes: { draft, sent, accepted, declined },   // counts
  invoices: { draft, sent, paid, overdue, unpaidTotal, currency },
  revenue: { thisMonth, lastMonth, currency },   // sum of paid totals by paidAt month
  attention: [ { kind: 'workItem'|'acceptedQuote'|'overdueInvoice', label, ref } ],
  activity:  [ { kind: 'quote'|'invoice'|'paid', label, when } ]  // newest first, max 10
}
```

- [ ] **Step 1: Write the failing test** (append to `test/main.test.mjs`)

```js
test('dashboard aggregates statuses, revenue, attention and activity', async () => {
  const w = makeWorld();
  const q = await generateQuote(w);
  await w.handlers['quotes:set-status']({ file: q.file, status: 'sent' });
  await w.handlers['quotes:set-status']({ file: q.file, status: 'accepted' });
  const draft = await w.handlers['invoices:draft']({ quoteFile: q.file });
  const gen = await w.handlers['invoices:generate'](draft);
  const file = gen.notePath.split('/').pop();
  await w.handlers['invoices:set-status']({ file, status: 'sent' });
  await w.handlers['invoices:set-status']({ file, status: 'paid' });

  const s = await w.handlers['dashboard:summary']();
  assert.equal(s.quotes.accepted, 1);
  assert.equal(s.invoices.paid, 1);
  assert.equal(s.revenue.thisMonth, 240 /* 2h × 80, vat 0 */);
  assert.ok(s.attention.some((a) => a.kind === 'acceptedQuote'));
  assert.ok(s.activity.length >= 2);
  assert.ok(s.activity[0].when >= s.activity[s.activity.length - 1].when);
});
```

(Note: `attention` contains `acceptedQuote` because the quote is accepted; once its `invoiced` flag is true it drops out — assert BEFORE checking, or regenerate a second accepted quote. Follow the implementation rule: `acceptedQuote` = status accepted AND not invoiced. Adjust the test: create a second quote left accepted-uninvoiced, then assert.)

- [ ] **Step 2: Run to verify it fails**

Run: `node --test test/main.test.mjs`
Expected: FAIL — `dashboard:summary is not a function`

- [ ] **Step 3: Implement in `src/main.cjs`** (inside `createHandlers`; `handlers` is the returned object — define it as `const handlers = { ... }; return handlers;` so siblings are callable)

```js
'dashboard:summary': async () => {
  const cache = await readCache();
  const quotes = await handlers['quotes:list']();
  const invoices = await handlers['invoices:list']();
  const { rates } = config();
  const count = (xs, k) => xs.filter((x) => x.status === k).length;
  const monthKey = (iso) => String(iso ?? '').slice(0, 7);
  const thisM = monthKey(now().toISOString());
  const lastM = monthKey(new Date(now().getFullYear(), now().getMonth() - 1, 15).toISOString());
  const paid = invoices.filter((i) => i.status === 'paid');
  const sum = (xs) => Math.round(xs.reduce((s, i) => s + i.total, 0) * 100) / 100;

  const attention = [
    ...cache.items.map((i) => ({ kind: 'workItem', label: `${i.client} — ${i.title}`, ref: i.id })),
    ...quotes.filter((q) => q.status === 'accepted' && !q.invoiced).map((q) => ({ kind: 'acceptedQuote', label: `${q.client} — ${q.project}`, ref: q.file })),
    ...invoices.filter((i) => i.overdue).map((i) => ({ kind: 'overdueInvoice', label: `${i.number} — ${i.client} — ${i.daysOverdue}d overdue`, ref: i.file })),
  ];
  const activity = [
    ...quotes.map((q) => ({ kind: 'quote', label: `quote ${q.status} — ${q.client}`, when: q.generated })),
    ...invoices.map((i) => ({ kind: 'invoice', label: `invoice ${i.status} — ${i.number}`, when: i.issued })),
    ...paid.map((i) => ({ kind: 'paid', label: `paid — ${i.number} — ${formatMoney(i.total, i.currency || rates.currency)}`, when: i.paidAt })),
  ].filter((a) => a.when).sort((a, b) => (a.when < b.when ? 1 : -1)).slice(0, 10);

  return {
    workItems: cache.items.length,
    quotes: { draft: count(quotes, 'draft'), sent: count(quotes, 'sent'), accepted: count(quotes, 'accepted'), declined: count(quotes, 'declined') },
    invoices: {
      draft: count(invoices, 'draft'), sent: count(invoices, 'sent'), paid: paid.length,
      overdue: invoices.filter((i) => i.overdue).length,
      unpaidTotal: sum(invoices.filter((i) => i.status === 'sent')),
      currency: rates.currency,
    },
    revenue: {
      thisMonth: sum(paid.filter((i) => monthKey(i.paidAt) === thisM)),
      lastMonth: sum(paid.filter((i) => monthKey(i.paidAt) === lastM)),
      currency: rates.currency,
    },
    attention,
    activity,
  };
},
```

Add `formatMoney` to the money require in main.cjs if not already there (it is exported from `./lib/quotes.cjs`).

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main.cjs test/main.test.mjs
git commit -m "feat: dashboard summary handler"
```

---

### Task 8: Electron PDF smoke for the invoice template

**Files:**
- Modify: `test/pdf.electron.mjs` (mirror the existing quote smoke — same harness, second document)

**Interfaces:**
- Consumes: `renderInvoiceHtml` from Task 4.

- [ ] **Step 1: Extend the smoke** — read `test/pdf.electron.mjs` first; add an invoice render alongside the quote one, asserting the returned buffer starts with `%PDF` and is > 5 KB:

```js
const invoiceHtml = renderInvoiceHtml(
  { number: 'INV-2026-001', client: 'Acme', issued: '2026-07-09', due: '2026-07-23',
    lineItems: [{ description: 'dev', hours: 2, rate: 'default' }], vatRate: 15 },
  { businessName: 'Richter Digital', accentColor: '#C5FF3D', paymentTerms: 'net 14' },
  { currency: 'EUR', default: 80, named: [] },
);
const invoicePdf = await renderPdf(invoiceHtml);
assert.ok(invoicePdf.subarray(0, 4).toString() === '%PDF' && invoicePdf.length > 5000);
```

- [ ] **Step 2: Run it** the same way the repo's README/package scripts run the electron smoke (check `package.json` — if it's not part of `npm test`, run its documented command).
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add test/pdf.electron.mjs
git commit -m "test: invoice pdf electron smoke"
```

---

### Task 9: Renderer — component kit + 5-tab shell

**GATE: requires the approved claude.ai/design screens.** The code below is the complete working wiring with sensible default styling; the implementer applies the approved design's exact spacing, sizing, and layout values on top. If the designs are not yet approved, STOP and ask the user.

**Files:**
- Create: `src/ui/kit.jsx` (kit: `Btn`, `Panel`, `Pill`, `StatusPill`, `StatTile`, `Input`, `Field`, `ErrorBanner`, theme access `S()`/`setTheme`)
- Modify: `src/renderer.jsx` (shell: theme, tabs, mount; delegates to tab modules)
- Verify: `npm run build` bundles cleanly (esbuild follows the imports)

**Interfaces:**
- Produces (consumed by Tasks 10–13):
  - `S() -> tokens` object (`ink0..ink2, paper, vellum, fog, hairline, hairline2, neon, oxblood, moss`).
  - `<Btn s primary danger onClick disabled>` , `<Panel title s action>`, `<Pill s tone>` (`tone: 'neon'|'moss'|'oxblood'|'fog'|'outline'`), `<StatusPill s status>` (maps draft=fog, sent=neon, accepted/paid=moss, declined/overdue=oxblood), `<StatTile s label value accent sub>`, `<Input s ...props>`, `<Field s label value onChange type>`, `<ErrorBanner error s>`.
  - Shell renders tabs `dashboard | quotes | invoices | clients | settings` (dashboard default) and passes `{ api, s, config, setConfig }` to each tab component.

- [ ] **Step 1: Create `src/ui/kit.jsx`** — move `S`/`T`, `inputStyle`, `btnStyle`, `Panel`, `ErrorBanner` out of `renderer.jsx` verbatim, then add:

```jsx
export function Pill({ s, tone = 'fog', children }) {
  const colors = {
    neon: { bg: 'rgba(197,255,61,0.12)', fg: s.neon },
    moss: { bg: 'rgba(92,124,79,0.25)', fg: '#9FBF8F' },
    oxblood: { bg: 'rgba(255,107,90,0.12)', fg: s.oxblood },
    fog: { bg: s.fog, fg: s.ink1 },
    outline: { bg: 'transparent', fg: s.ink2 },
  }[tone] ?? { bg: s.fog, fg: s.ink1 };
  return (
    <span style={{ background: colors.bg, color: colors.fg, border: tone === 'outline' ? `1px solid ${s.hairline2}` : 'none',
      borderRadius: 999, padding: '2px 8px', fontSize: 10, fontFamily: 'ui-monospace, monospace', textTransform: 'lowercase', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

const STATUS_TONE = { draft: 'fog', sent: 'neon', accepted: 'moss', paid: 'moss', declined: 'oxblood', overdue: 'oxblood' };
export function StatusPill({ s, status }) {
  return <Pill s={s} tone={STATUS_TONE[status] ?? 'fog'}>{status}</Pill>;
}

export function StatTile({ s, label, value, sub, accent }) {
  return (
    <div style={{ background: s.vellum, border: `1px solid ${s.hairline}`, borderRadius: 10, padding: '12px 14px', flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, textTransform: 'lowercase', letterSpacing: '0.1em', color: s.ink2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent ? s.neon : s.ink0, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: s.ink2, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export function Field({ s, label, value, onChange, type = 'text', ...rest }) {
  return (
    <label style={{ fontSize: 11, color: s.ink2, display: 'block', marginBottom: 8 }}>
      {label}
      <input style={inputStyle(s)} type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />
    </label>
  );
}
```

Export everything (`S`, `setTheme`, `inputStyle`, `btnStyle` as `Btn`-style helpers plus a `Btn` component wrapping `btnStyle`).

- [ ] **Step 2: Rewrite `src/renderer.jsx` as the shell** — keep `DEFAULT_CONFIG` (add `invoicing: { prefix: 'INV', vatRate: 0, netDays: 14, yearReset: true }`), the config-loading `useEffect` (deep-merge `invoicing` like `brand`/`rates`), the `tabBtn` underline pattern, and mount. Tabs:

```jsx
import { DashboardTab } from './ui/tabs/dashboard.jsx';
import { QuotesTab } from './ui/tabs/quotes.jsx';
import { InvoicesTab } from './ui/tabs/invoices.jsx';
import { ClientsTab } from './ui/tabs/clients.jsx';
import { SettingsTab } from './ui/tabs/settings.jsx';
// default tab: 'dashboard'; tab order: dashboard quotes invoices clients settings
```

For this task, create `src/ui/tabs/*.jsx` as stubs exporting their component with a `PanelEmpty`-style placeholder (`<Panel title="…" s={s}>coming in the next task</Panel>`) so the shell builds; Tasks 10–13 replace them. Move the existing quotes + settings JSX into `src/ui/tabs/quotes.jsx` / `settings.jsx` verbatim now (import kit pieces instead of local helpers) — they keep working while awaiting their redesign task.

- [ ] **Step 3: Build**

Run: `npm run build && npm test`
Expected: build clean, tests pass (renderer has no unit tests; the build is the gate)

- [ ] **Step 4: Commit**

```bash
git add src/ui/ src/renderer.jsx
git commit -m "refactor: component kit + five-tab shell"
```

---

### Task 10: Settings tab — invoicing section

**Files:**
- Modify: `src/ui/tabs/settings.jsx`

**Interfaces:**
- Consumes: kit `Panel`/`Field`/`Btn`; config shape incl. `invoicing`; handlers `invoices:counter`, `invoices:set-counter`.
- Produces: settings persist `config.invoicing = { prefix, vatRate, netDays, yearReset }` via the existing `save(config)` path; "next number" edits go through `invoices:set-counter`.

- [ ] **Step 1: Add the invoicing Panel** below rates (all via kit `Field`):

```jsx
<Panel title="invoicing" s={s}>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
    <Field s={s} label="number prefix" value={inv.prefix} onChange={(v) => upInv({ prefix: v.toUpperCase().slice(0, 8) })} />
    <Field s={s} label="next number" type="number" value={counter?.next ?? ''} onChange={setNextNumber} />
    <Field s={s} label="default vat %" type="number" value={inv.vatRate} onChange={(v) => upInv({ vatRate: Math.max(0, Math.min(100, Number(v) || 0)) })} />
    <Field s={s} label="payment terms (days)" type="number" value={inv.netDays} onChange={(v) => upInv({ netDays: Number(v) || 14 })} />
  </div>
  <label style={{ fontSize: 11, color: s.ink2 }}>
    <input type="checkbox" checked={inv.yearReset} onChange={(e) => upInv({ yearReset: e.target.checked })} /> reset numbering each year
  </label>
</Panel>
```

`counter` loads once via `api.ipc.invoke('invoices:counter')`; `setNextNumber` debounce-invokes `invoices:set-counter` and catches into the tab's `ErrorBanner`. `upInv` merges into config and calls the existing `save`.

- [ ] **Step 2: Build + manual check**

Run: `npm run build`
Expected: clean. Load the plugin in Poltergeist (per README install-from-folder flow) and confirm the invoicing section renders and persists.

- [ ] **Step 3: Commit**

```bash
git add src/ui/tabs/settings.jsx
git commit -m "feat: invoicing settings (prefix, counter, vat, terms)"
```

---

### Task 11: Clients tab

**Files:**
- Rewrite: `src/ui/tabs/clients.jsx`

**Interfaces:**
- Consumes: handlers `clients:list ({q?, status?})`, `clients:get`, `clients:upsert`, `clients:archive`, `clients:bootstrap`; `quotes:list`, `invoices:list` (for the documents cross-reference and open balance); kit components.
- Produces: the clients screen per spec — left list (search input; rows: name, tag `Pill`s, open-balance badge = sum of that client's `sent`+overdue invoice totals; `+ new client`, `bootstrap from vault`, archived toggle), right detail (name/legalName/website, contacts editor, defaults incl. `vatRate`, tags, notes, documents list with `StatusPill`s, archive button).

Layout: `display: grid; gridTemplateColumns: '1fr 2fr'; gap: 14`. All mutations optimistic-refresh: after `upsert`/`archive`, re-invoke `clients:list`. Errors → tab-level `ErrorBanner`. Match the approved design's arrangement; the data contract above is fixed.

- [ ] **Step 1: Implement the tab** (state: `q`, `showArchived`, `clients`, `selectedId`, `detail`, `docs` loaded via the three list handlers; open balance computed client-side by `clientId`).
- [ ] **Step 2: Build + manual check** — create, edit defaults (incl. vat), tag, archive, bootstrap; verify vault mirror file appears.
- [ ] **Step 3: Commit** — `git commit -m "feat: clients tab (list, detail, defaults, documents)"`

---

### Task 12: Quotes tab — history + status actions

**Files:**
- Modify: `src/ui/tabs/quotes.jsx`

**Interfaces:**
- Consumes: existing work-items/composer flow (unchanged logic); handlers `quotes:list`, `quotes:set-status`, `invoices:draft`; kit `StatusPill`.
- Produces: a third Panel `quote history`: rows `client · project · total (formatMoney) · generated date · StatusPill · actions`. Actions by status: draft→`[mark sent]`; sent→`[accepted] [declined]`; declined→`[mark sent]`; accepted && !invoiced→`[convert to invoice]` (primary) which calls `invoices:draft({quoteFile})` and hands the draft to the invoices tab (lift a `pendingInvoiceDraft` state up to the shell: `App` holds it; `convert` sets it and switches tab to `invoices`). Rows with `invoiced` show `Pill tone="outline"` `invoiced`.

- [ ] **Step 1: Implement** — after any `quotes:set-status`, re-invoke `quotes:list`; catch into `ErrorBanner`.
- [ ] **Step 2: Build + manual check** — walk draft→sent→accepted on a real note; confirm frontmatter changes in the vault file and illegal moves surface the handler error.
- [ ] **Step 3: Commit** — `git commit -m "feat: quote history with lifecycle actions + convert handoff"`

---

### Task 13: Invoices tab + Dashboard tab

**Files:**
- Rewrite: `src/ui/tabs/invoices.jsx`, `src/ui/tabs/dashboard.jsx`
- Modify: `src/renderer.jsx` (shell passes `pendingInvoiceDraft`/`clearPendingInvoiceDraft` and a `setTab` callback into tabs)

**Interfaces:**
- Consumes: `invoices:draft/generate/list/set-status`, `dashboard:summary`, `quotes:*` for dashboard actions; `computeTotals` idiom via a renderer-side call of `computeInvoiceTotals`? **No** — renderer must not require `invoices.cjs` (it's node-free actually, but keep the money path consistent): import `computeInvoiceTotals` from `src/lib/invoices.cjs` is safe ONLY if it stays free of node builtins — it requires `quotes.cjs` which pulls `node:crypto`. Instead: move nothing; compute preview totals in the renderer with `computeTotals` from `src/lib/money.cjs` plus inline vat math (`Math.round(subtotal * vat) / 100` pattern, same rounding as the lib).
- Produces:
  - **Invoices tab**: list Panel (number mono · client · total · due · `StatusPill` (shows `overdue` when `row.overdue`) · `daysOverdue` in oxblood; actions draft→[mark sent], sent→[mark paid]; header `[new invoice]` menu: from client / blank). Composer Panel (opens with `pendingInvoiceDraft` when set, clearing it): number preview (ink-2 mono), client picker fed by `clients:list`, issued/due date inputs, the same line-item editor as quotes, live subtotal / `vat N% — amount` (hidden at 0) / total, `[generate pdf]` primary → `invoices:generate`, then refresh list + clear composer. `quoteRef` breadcrumb when present.
  - **Dashboard tab**: `StatTile` row from `dashboard:summary` (`open work items`, `awaiting reply`, `unpaid invoices` with `sub: "N overdue"` when > 0, `revenue this month` with `sub` delta vs last month); two-column grid: attention feed (kind icon + label + inline action: workItem→`[quote it]` (setTab('quotes')), acceptedQuote→`[convert]` (drafts + setTab('invoices')), overdueInvoice→`[copy nudge]` (`navigator.clipboard.writeText(...)` best-effort)); recent activity rows. Empty state (`summary.workItems + quotes + invoices all zero`): centered ghost glyph + "sweep your vault to find work" + `[sweep vault]` → setTab('quotes').

- [ ] **Step 1: Implement invoices tab.** 
- [ ] **Step 2: Implement dashboard tab.** Refresh `dashboard:summary` on tab focus (`useEffect` keyed on active tab).
- [ ] **Step 3: Build + full manual walk** — sweep → quote → sent → accepted → convert → generate invoice → sent → paid; dashboard reflects each step; overdue shows for a hand-edited past-due note.
- [ ] **Step 4: Commit** — `git commit -m "feat: invoices tab + dashboard"`

---

### Task 14: README + final verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update README** — replace the v1 pitch: five tabs, quote lifecycle, invoices (numbering, VAT, PDF), clients, dashboard; settings additions; vault layout (`quotes/`, `invoices/`, `clients/`).
- [ ] **Step 2: Full suite + build**

Run: `npm test && npm run build`
Expected: all green; `dist/` rebuilt (commit `dist/` — installs never build, per README).

- [ ] **Step 3: Manual verify in Poltergeist** — the Task 13 walk once more on the built plugin; check both PDFs open and look like the approved designs' print family.
- [ ] **Step 4: Commit**

```bash
git add README.md dist/
git commit -m "docs: v2 README; build dist"
```

---

## Self-review notes

- Spec coverage: lifecycle (T1/T5), numbering+VAT (T2/T6), templates (T4/T8), client defaults (T3), dashboard (T7/T13), five-tab UI (T9–T13), README (T14). Design-brief handoff is outside the plan (user-driven in claude.ai/design); T9 gates on its approval.
- `quotes:generate` already writes `status: draft` frontmatter (shipped in the in-flight work) — no change needed there; T4 only adds the data comment.
- Type consistency: `rewriteStatus(dir, file, status, table, extraFields)` defined T5, reused T6. `currentNumber/advanceCounter` signatures match T2↔T6. `parseFrontmatter` fields are strings — tests compare `'240'` etc. accordingly.
