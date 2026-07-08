// Quote rendering: branded A4 HTML for printToPDF, and the vault markdown note.
// Every user/LLM-supplied string goes through esc() before interpolation.

const { computeTotals, formatMoney } = require('./quotes.cjs');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

function renderQuoteHtml(quote, brand, rates) {
  const { rows, total } = computeTotals(quote.lineItems, rates);
  const accent = /^#[0-9a-fA-F]{3,8}$/.test(brand.accentColor ?? '') ? brand.accentColor : '#C5FF3D';
  const money = (n) => esc(formatMoney(n, rates.currency ?? 'EUR'));
  const today = new Date();
  const validUntil = new Date(today.getTime() + (Number(brand.validityDays) || 14) * 86400000);
  const fmtDate = (d) => d.toISOString().slice(0, 10);

  const lineRows = rows
    .map(
      (r) => `      <tr>
        <td>${esc(r.description)}</td>
        <td class="num">${esc(String(r.hours))}</td>
        <td class="num">${money(r.hourly)}</td>
        <td class="num">${money(r.amount)}</td>
      </tr>`,
    )
    .join('\n');

  const assumptions = (quote.assumptions ?? [])
    .map((a) => `      <li>${esc(a)}</li>`)
    .join('\n');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1a1c20; font-size: 13px; line-height: 1.5; padding: 48px 56px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand img { height: 44px; }
  .brand .name { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
  .brand .contact { font-size: 11px; color: #6a6e78; }
  .doc { text-align: right; }
  .doc .title { font-size: 26px; font-weight: 700; color: ${accent}; -webkit-print-color-adjust: exact; }
  .doc .meta { font-size: 11px; color: #6a6e78; }
  .block { margin-bottom: 28px; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #9a9ea8; margin-bottom: 4px; }
  h2 { font-size: 15px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 4px; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #9a9ea8; text-align: left; padding: 8px 10px; border-bottom: 2px solid ${accent}; }
  td { padding: 9px 10px; border-bottom: 1px solid #e7e9ee; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  th.num { text-align: right; }
  .total-row td { border-bottom: none; font-weight: 700; font-size: 15px; padding-top: 14px; }
  .total-row .amount { color: ${accent}; -webkit-print-color-adjust: exact; }
  ul { padding-left: 18px; }
  li { margin-bottom: 3px; }
  footer { margin-top: 44px; padding-top: 16px; border-top: 1px solid #e7e9ee; font-size: 11px; color: #6a6e78; display: flex; justify-content: space-between; gap: 24px; }
</style>
</head>
<body>
  <header>
    <div class="brand">
      ${brand.logoDataUri ? `<img src="${esc(brand.logoDataUri)}" alt="">` : ''}
      <div>
        <div class="name">${esc(brand.businessName || 'Quote')}</div>
        <div class="contact">${esc(brand.contactLine ?? '')}</div>
      </div>
    </div>
    <div class="doc">
      <div class="title">QUOTE</div>
      <div class="meta">date ${fmtDate(today)}<br>valid until ${fmtDate(validUntil)}</div>
    </div>
  </header>

  <div class="block">
    <div class="label">prepared for</div>
    <h2>${esc(quote.client)}</h2>
    <div>${esc(quote.project ?? '')}</div>
  </div>

  <div class="block">
    <div class="label">scope</div>
    <div>${esc(quote.scopeSummary ?? '')}</div>
  </div>

  <div class="block">
    <table>
      <thead><tr><th>item</th><th class="num">hours</th><th class="num">rate</th><th class="num">amount</th></tr></thead>
      <tbody>
${lineRows}
        <tr class="total-row"><td colspan="3">total</td><td class="num amount">${money(total)}</td></tr>
      </tbody>
    </table>
  </div>

${assumptions ? `  <div class="block">
    <div class="label">assumptions</div>
    <ul>
${assumptions}
    </ul>
  </div>
` : ''}
  <footer>
    <span>${esc(brand.paymentTerms ?? '')}</span>
    <span>${esc(brand.businessName ?? '')}</span>
  </footer>
</body>
</html>`;
}

function quoteMarkdown(quote, brand, rates) {
  const { rows, total } = computeTotals(quote.lineItems, rates);
  const currency = rates.currency ?? 'EUR';
  const lines = rows
    .map((r) => `| ${r.description.replace(/\|/g, '\\|')} | ${r.hours} | ${formatMoney(r.hourly, currency)} | ${formatMoney(r.amount, currency)} |`)
    .join('\n');
  return `---
client: "${String(quote.client ?? '').replace(/"/g, '\\"')}"
project: "${String(quote.project ?? '').replace(/"/g, '\\"')}"
total: ${total}
currency: ${currency}
status: draft
source: "${String(quote.sourceNote ?? '').replace(/"/g, '\\"')}"
generated: ${new Date().toISOString()}
---

# Quote — ${quote.client}

**Project:** ${quote.project ?? ''}

## Scope

${quote.scopeSummary ?? ''}

## Line items

| item | hours | rate | amount |
|------|-------|------|--------|
${lines}

**Total: ${formatMoney(total, currency)}**

## Assumptions

${(quote.assumptions ?? []).map((a) => `- ${a}`).join('\n')}

## Terms

${brand.paymentTerms ?? ''} — valid ${Number(brand.validityDays) || 14} days.
`;
}

module.exports = { esc, renderQuoteHtml, quoteMarkdown };
