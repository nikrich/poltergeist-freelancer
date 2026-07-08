# Freelancer

Your freelance business, haunting your second brain. v1 is **quoting**: the
plugin sweeps your vault for things that look like incoming work requests —
emails, slack threads, meeting notes your connectors already pulled in — and
turns any of them into a branded, client-ready PDF quote plus a quote note
filed back into the vault.

## What it does

- **Work-item sweep** — an LLM pass over your recent inbox and context notes
  surfaces work requests as suggestion cards (client, ask, source note,
  confidence). Dismissals stick; re-sweeps are incremental. You can also point
  it at any note manually.
- **Quote composer** — a drafted quote (scope summary, line items with hours ×
  your rates, assumptions) you edit inline: add/remove line items, pick a rate
  per line, live totals.
- **Branded PDF** — one click renders a Greenlight-style A4 quote with your
  logo, business name, accent color, and payment terms, and files
  `quote-<client>-<date>.md` + the PDF into `30-cross-context/quotes/` in your
  vault.
- **Your branding** — business name, logo, accent color, contact line, payment
  terms, quote validity, currency, and a named rate card, all configured in the
  plugin's settings tab.

Future modules (invoices, clients, time) land as new tabs — same plugin.

## Install

In Poltergeist: **Plugins → install from git**

- git url: `https://github.com/nikrich/poltergeist-freelancer`

Then open **Freelancer → settings**, set your rates and branding, and hit
**sweep** on the quotes tab.

## Requirements

- Poltergeist with the local backend running (the plugin drafts via the app's
  `/v1/llm/run` bridge).
- A vault (default `~/ghostbrain/vault`; configurable in settings).

## Develop

```
npm install
npm run build   # bundles src/ → dist/ — commit dist/, installs never build
npm test        # node --test over the pure quote logic
```
