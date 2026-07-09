# Design brief — Freelancer Kit (Poltergeist plugin)

Paste this into a claude.ai/design conversation on the **ghostbrain Design
System** project. Design all screens with the project's synced components
and tokens.

## Product

"Freelancer" is a plugin tab inside Poltergeist, a dark-first desktop
second-brain app. It turns work requests found in the user's vault into
branded quotes, converts accepted quotes into invoices, and tracks clients —
a personal freelance back office. Design it as one coherent kit: five
sub-tabs inside the plugin panel: **dashboard · quotes · invoices · clients
· settings**.

## How to build

- Use the library components: `Panel` (titled card), `Btn` (primary/
  secondary/ghost/danger, sm/md/lg), `Pill` (neon/moss/oxblood/fog/outline),
  `TopBar`, `Eyebrow`, `Lucide` (icons by name), `Toggle`, `SkeletonRows`,
  `PanelEmpty`, `PanelError`, `Ghost` (mascot), `ActivityFeedRow`.
- Dark theme only. Page background `var(--bg-paper)`; cards are Panel on
  vellum. Voice: lowercase mono labels (Eyebrow/Pill do this themselves).
- Neon-lime is THE accent — primary actions, selection, live counts.
  Oxblood = errors/overdue/declined. Moss = success/paid/accepted.
  Fog = neutral/draft.
- Layout glue: precompiled utility classes (`bg-paper`, `bg-vellum`,
  `text-ink-0/1/2`, `text-12/13`, `font-mono`, `border-hairline`,
  `rounded-sm`) or inline styles with token vars. For neon-colored text or
  icons use `color: var(--neon)` (there is no `text-neon` class).
- The panel is a desktop pane ~900–1200px wide. Sub-tab navigation across
  the top (mono lowercase labels, neon underline/active state).

## Status pills (used everywhere)

draft = fog · sent = neon · accepted = moss · paid = moss ·
declined = oxblood · overdue = oxblood.

## Screens

### 1. Dashboard (default tab) — filled + empty states

- Row of four stat tiles: **open work items** (count), **awaiting reply**
  (sent quotes count), **unpaid invoices** (count, with "N overdue" in
  oxblood when > 0), **revenue this month** (money, small delta vs last
  month).
- Two columns below. Left "needs attention" feed: rows with an icon, a
  one-line description, and an inline action button — e.g. new work item →
  [quote it]; accepted quote → [convert to invoice]; overdue invoice →
  [copy nudge]. Right "recent activity": compact rows (ActivityFeedRow
  pattern) — "quote sent — Acme redesign — 2d", "paid — INV-2026-006 —
  €2,400 — 4h".
- Empty state: Ghost mascot, "sweep your vault to find work", primary
  [sweep vault] button.

### 2. Quotes — list + composer

- Top panel "work items": suggestion cards from the vault sweep — title,
  client, 1–2 line ask, source note path (mono, ink-2), confidence, actions
  [draft quote] (primary) and [dismiss] (ghost). Sweep button with progress
  ("12/40") in the panel header.
- Middle panel "composer" (shown when drafting): client + project fields,
  scope summary textarea, line-item table (description · hours · rate
  dropdown · amount), [+ line item], assumptions list, live total (big,
  mono), [generate pdf] primary.
- Bottom panel "quote history": rows — client, project, total, date, status
  pill, and inline actions per status: draft→[mark sent], sent→[accepted]
  [declined], accepted→[convert to invoice] (primary). Rows with
  `invoiced` show a small linked-invoice number.

### 3. Invoices — list + composer

- Panel "invoices": rows — number (mono), client, total, due date, status
  pill; overdue rows tinted oxblood with "Nd overdue". Row actions:
  draft→[mark sent], sent→[mark paid]. Header actions: [new invoice]
  (menu: from accepted quote / from client / blank).
- Composer: number preview (mono, ink-2), client picker, issued + due date
  fields, same line-item table as quotes, then totals block: subtotal,
  VAT line ("vat 15% — €360" — hidden when rate is 0), total (big).
  [generate pdf] primary. When converted from a quote, show "from
  quote-acme-2026-07-02" as a mono breadcrumb.

### 4. Clients — list + detail

- Left third: search input, client rows (name, tag pills, small
  open-balance badge when they owe money), [+ new client], [bootstrap from
  vault] ghost button. Archived clients behind a toggle.
- Right two-thirds, detail: name + company header, contact fields (email,
  phone), per-client defaults (currency, vat %, payment terms), tags,
  free-text notes, and "documents" — that client's quotes and invoices as
  compact rows with status pills. [archive] danger-ghost in the corner.

### 5. Settings

- Three Panels: **branding** (business name, logo upload preview, accent
  color, contact line, payment terms, validity days), **rates** (currency,
  default hourly rate, named rates table name·rate with add/remove),
  **invoicing** (number prefix, next number, year-reset toggle, default
  vat %, default payment days). [save] primary, saved-state feedback.

## Realistic content

Use believable freelance data: clients like "Acme Studio", "Ferndale
Coffee Co", projects like "marketing site rebuild", EUR amounts in the
hundreds–thousands, invoice numbers INV-2026-00N, dates around July 2026.
Never lorem ipsum.
