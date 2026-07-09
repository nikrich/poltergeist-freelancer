# Freelancer

Your freelance business, haunting your second brain. Five tabs — dashboard,
quotes, invoices, clients, settings — covering the whole flow from spotting
a work request in your vault to getting paid for it.

## What it does

- **Dashboard** — business-at-a-glance home: stat tiles (open work items ·
  quotes awaiting reply · unpaid invoices, with overdue called out · revenue
  this month vs last), a needs-attention feed with inline actions (quote a
  new work item, convert an accepted quote to an invoice, nudge an overdue
  one), and recent activity.
- **Quotes** — an LLM sweep over your recent inbox and context notes surfaces
  work requests as suggestion cards (client, ask, source note, confidence);
  dismissals stick and re-sweeps are incremental, or point it at any note
  manually. The composer drafts a scope summary and line items (hours ×
  your rates) you edit inline with live totals. Generating one renders a
  branded A4 PDF and files `quote-<client>-<date>.md` + PDF into
  `30-cross-context/quotes/`. Quotes carry a lifecycle tracked in the note's
  frontmatter — `draft → sent → accepted/declined` (declined can be revised
  and re-sent) — with status pills and inline actions in the history list.
- **Invoices** — convert an accepted quote (or start fresh from a client or
  blank), with sequential `INV-YYYY-NNN` numbering, optional VAT, and a
  branded A4 PDF filed as `invoice-<client>-<number>.md` + PDF into
  `30-cross-context/invoices/`. Converting stamps the source quote as
  invoiced. Status runs `draft → sent → paid`, with overdue computed at read
  time from the due date — never written, so a stale note can't lie.
- **Clients CRM** — a searchable client list with an open-balance badge (sum
  of that client's sent + overdue invoices) and a detail view: contact info,
  tags, notes, and a cross-reference of that client's quotes and invoices
  with their statuses. Backed by a JSON store (`clients.json`) with
  best-effort vault mirror notes in `30-cross-context/clients/`. Bootstrap
  from existing vault notes; clients are archived, never deleted. Per-client
  defaults (currency, VAT rate, payment terms) prefill new quotes and
  invoices, overriding the plugin's brand-level defaults.
- **Settings** — business name, logo, accent color, contact line, payment
  terms, quote validity, currency, and a named rate card, plus an invoicing
  section: number prefix, next number, year-reset toggle, default VAT %, and
  default net payment days.

The vault is the source of truth for lifecycle state: all quote/invoice
status lives in each note's frontmatter, and lists/dashboard are built by
reading it at request time. Clients and the invoice counter live in JSON
under the plugin's data dir, since that state must never fork.

## Install

In Poltergeist: **Plugins → install from git**

- git url: `https://github.com/nikrich/poltergeist-freelancer`

Then open **Freelancer → settings**, set your rates, branding, and invoicing
defaults, and hit **sweep** on the quotes tab.

## Requirements

- Poltergeist with the local backend running (the plugin drafts via the app's
  `/v1/llm/run` bridge).
- A vault (default `~/ghostbrain/vault`; configurable in settings).

## Develop

```
npm install
npm run build   # bundles src/ → dist/ — commit dist/, installs never build
npm test        # node --test over the pure quote/invoice/client logic and handlers
```

PDF rendering smoke (needs a real Electron binary, not plain node):

```
npx electron test/pdf.electron.mjs
```

Asserts the branded quote and invoice templates both render to real PDF
buffers.
