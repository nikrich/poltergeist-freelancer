# Freelancer Kit v2 — design spec

2026-07-09. Approved via brainstorming session.

Expands the Poltergeist Freelancer plugin from quoting-only (v1, shipped) into
the full freelancer kit: **dashboard, quotes with lifecycle, invoices, clients
CRM, settings** — five tabs, one plugin. The UI is redesigned as one coherent
product in claude.ai/design against the **ghostbrain Design System** project,
then ported into the plugin renderer.

## Goals

- Quote lifecycle: draft → sent → accepted/declined, tracked in the vault.
- Invoices: convert accepted quotes (or start from client/blank), sequential
  numbering, optional VAT, branded A4 PDF, sent → paid/overdue tracking.
- Clients CRM: finish the in-flight module; per-client defaults feed quotes
  and invoices; cross-reference of a client's documents.
- Dashboard: business-at-a-glance home with actionable feed.
- One coherent DS-faithful UI across all five tabs.

## Non-goals

- Time tracking (explicitly cut).
- Multi-rate/per-line tax, tax-inclusive pricing, accounting exports.
- Payment detection from email (mark-paid is manual in v2).
- Editing generated PDFs in place (regenerate instead).

## Architecture (Approach A — hybrid truth)

- **Documents are vault-truth.** Quotes and invoices are markdown notes +
  PDFs in the vault; all lifecycle state lives in note frontmatter. Lists and
  the dashboard are built by parsing frontmatter at read time. Personal scale
  (dozens of files) — no caching until proven slow.
- **Registries are JSON-truth.** Clients live in `dataDir/clients.json`
  (atomic tmp+rename writes) with best-effort vault mirror notes, as already
  built in `src/lib/clients.cjs`.
- **Counters** (invoice numbering) live in `dataDir/counter.json` — the one
  datum that must never fork, and dataDir is single-writer.
- Same plugin surfaces: main-process IPC handlers built by `createHandlers`
  (deps-injectable for tests), renderer mounted per tab.

### Vault layout

```
30-cross-context/
  quotes/    quote-<client>-<date>[-n].md + .pdf     (existing)
  invoices/  invoice-<client>-<INV-...>.md + .pdf    (new)
  clients/   <client>.md mirrors                     (in-flight)
```

## Data model

### Quote frontmatter (additions)

- `status: draft | sent | accepted | declined` — written `draft` at generate;
  status actions rewrite ONLY this field (read-modify-write, tmp+rename).
  Legal transitions: draft→sent; sent→accepted|declined; declined→sent
  (re-send after revision). Accepted is terminal. Invoices: draft→sent;
  sent→paid. Paid is terminal. Anything else rejected.
- `invoiced: true` — stamped when a conversion generates an invoice.

### Invoice frontmatter

```
number: INV-2026-007        client / clientId
quoteRef: quote-....md      (optional)
issued: ISO date            due: ISO date (issued + net days, editable)
subtotal / vatRate / vatAmount / total / currency
status: draft | sent | paid    paidAt: ISO (when paid)
```

`overdue` is **computed at read time** (`status == sent && due < today`),
never written — a stale note can't lie.

### Numbering

`counter.json`: `{ prefix: "INV", year: 2026, next: 7, yearReset: true }`.
Format `PREFIX-YYYY-NNN` (zero-padded 3). Prefix, next number, and year-reset
are editable in settings. Collision guard: if the target filename exists,
increment and retry.

### VAT

Single optional percentage. Resolution order: invoice-level override →
client default → settings default → 0. Applied on top of subtotal; own line
on the PDF. Money math stays in `src/lib/money.cjs` (integer-cents style
consistent with `computeTotals`).

### Client defaults (extend in-flight schema)

`defaults: { currency, vatRate, paymentTerms }` — prefill invoice composer
and override brand-level terms.

## IPC surface (new/changed handlers)

- `quotes:set-status (file, status)` — validated transition, frontmatter
  field rewrite.
- `quotes:list` — now also returns `status`, `invoiced`.
- `invoices:draft (from)` — `{quoteFile}` | `{clientId}` | `{}`; returns a
  prefilled editable draft (line items, VAT, due date, number preview).
- `invoices:generate (invoice)` — allocates number, renders PDF, writes note
  + PDF, stamps source quote `invoiced`, returns paths.
- `invoices:list` / `invoices:set-status (file, status)` — `paid` stamps
  `paidAt`; `overdue` computed in list, not settable.
- `dashboard:summary` — `{ workItems, quotes: {byStatus}, invoices:
  {unpaid, overdue, byStatus}, revenue: {thisMonth, lastMonth}, activity:
  [...] }` from frontmatter + work-items cache.
- Clients handlers: as built (`list/get/upsert/archive/resolve/bootstrap`),
  plus defaults fields.

## Per-tab UX

### Dashboard (home)

Top: four stat tiles — open work items · quotes awaiting reply · unpaid
invoices (overdue count called out) · revenue this month (delta vs last).
Below, two columns: **action feed** (new work items → *quote it*; accepted
quotes → *convert to invoice*; overdue invoices → *nudge* copies a reminder
line to clipboard) and **recent activity** (latest quotes/invoices/paid
events). Empty state: Ghost mascot + "sweep your vault to find work".

### Quotes

Work items → composer, as v1 (editing model unchanged), restyled. New
**quote history list**: status pills, inline status actions, *convert to
invoice* on accepted rows.

### Invoices

**List**: number, client, total, due, status pill; overdue rows oxblood.
**Composer** reachable via convert / new-from-client / blank; live subtotal,
VAT line, total; due date auto from terms, editable. *Generate* files
note + PDF. *Mark paid* on list rows.

### Clients

Left: searchable list (name, tag pills, open-balance badge = sum of that
client's sent+overdue invoice totals). Right: detail —
contact fields, per-client defaults, tags, notes, cross-reference of that
client's quotes and invoices with statuses. Bootstrap-from-vault; archive,
never delete.

### Settings

Existing branding + rates, plus **invoicing**: number prefix, next number,
year-reset toggle, default VAT %, default net payment days.

### Status-pill color mapping (DS tokens)

draft = fog · sent = neon · accepted/paid = moss · declined/overdue = oxblood.

## Claude Design handoff

The design is produced in claude.ai/design attached to the **ghostbrain
Design System** project (synced 2026-07-09). The design brief lives at
`docs/superpowers/specs/2026-07-09-freelancer-kit-design-brief.md` and is
self-contained: paste it into a new design conversation on that project.
Screens to design: dashboard (filled + empty), quotes (list + composer),
invoices (list + composer + overdue state), clients (list + detail),
settings. Build with the synced components (`Panel`, `Btn`, `Pill`, `TopBar`,
`Eyebrow`, `Lucide`, `Toggle`, `SkeletonRows`, `PanelEmpty`, `PanelError`,
`Ghost`) and the conventions-header vocabulary.

**Implementation ports the designs** — the plugin cannot import the DS
bundle at runtime; it reads host theme tokens. The designed screens become
the visual contract, recreated as a small local component kit in the
renderer (`Btn`, `Panel`, `Pill`, `StatTile`, `StatusPill`, `Input`,
`TabBar`…) that is pixel-faithful to the design and token-faithful to the
host (`--ink-*`, `--paper`, `--vellum`, `--fog`, `--neon`, `--oxblood`,
`--moss`, `--hairline*`). This kit replaces the ad-hoc `btnStyle`/
`inputStyle` helpers. Renderer splits into per-tab modules if `renderer.jsx`
grows past ~500 lines per tab.

## PDF templates

`src/lib/template.cjs` gains `renderInvoiceHtml` + `invoiceMarkdown`, sharing
the brand header/footer blocks with the quote template (extract shared
partials rather than duplicating). Invoice adds: number, issued/due dates,
VAT line, "payable to" block. Same A4 print pipeline
(`renderPdfElectron`, sandboxed, JS off).

## Error handling

- Handlers validate inputs and throw; host rejects only that call.
- Renderer catches into per-panel `ErrorBanner`.
- Vault mirrors, clipboard, and quote `invoiced`-stamping are best-effort
  (log, don't fail the primary write).
- All multi-byte writes are tmp+rename. Frontmatter rewrites touch only the
  target field.
- Invalid status transitions (e.g. paid → draft) are rejected in the handler.

## Testing

`node --test`, matching the existing stack:

- **Units (pure libs)**: status transition table; numbering (prefix, padding,
  year reset, collision retry); VAT math incl. rounding; overdue computation
  around the due-date boundary; frontmatter single-field rewrite preserves
  the rest of the note byte-for-byte; quote→invoice conversion mapping.
- **Handler tests**: exported `createHandlers` with injected `renderPdf`/`now`
  and a temp vault, as `test/main.test.mjs` does today — covering draft
  sources (quote/client/blank), generate side effects (note+PDF+counter+
  quote stamp), dashboard aggregation, and rejection paths.
- **Electron smoke**: invoice PDF render alongside the existing quote smoke.
- **Manual verify**: run the plugin in Poltergeist, walk sweep → quote →
  send → accept → convert → invoice → paid, confirm dashboard reflects
  each step.

## Build order (for the implementation plan)

1. Pure libs: statuses, numbering, VAT/money, invoice template, conversion.
2. Handlers: quotes status, invoices CRUD, dashboard summary; finish clients.
3. Design brief → claude.ai/design → approved screens.
4. Renderer: local component kit from the designs, then tabs (settings →
   clients → quotes → invoices → dashboard, dependency order).
5. Electron smoke + manual verify + README update.
