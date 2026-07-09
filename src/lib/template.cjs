// Quote and invoice rendering: branded A4 HTML for printToPDF, and the vault markdown notes.
// Every user/LLM-supplied string goes through esc() before interpolation.

const { computeTotals, formatMoney } = require('./quotes.cjs');
const { primaryContact } = require('./clients.cjs');
const { computeInvoiceTotals, dataComment } = require('./invoices.cjs');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

/** Build the prepared-for block (name, contact, billing, tax) for PDF HTML. */
function billToHtml(quote, client) {
  const displayName = client?.legalName || client?.name || quote.client;
  const parts = [`    <h2>${esc(displayName)}</h2>`];
  if (client?.legalName && client.name && client.legalName !== client.name) {
    parts.push(`    <div class="sub">${esc(client.name)}</div>`);
  }
  const contact = primaryContact(client);
  if (contact) {
    const line = [contact.name, contact.role, contact.email, contact.phone].filter(Boolean).join(' · ');
    parts.push(`    <div class="sub">${esc(line)}</div>`);
  }
  const b = client?.billing ?? {};
  for (const line of b.addressLines ?? []) {
    parts.push(`    <div class="sub">${esc(line)}</div>`);
  }
  const cityLine = [b.postalCode, b.city].filter(Boolean).join(' ');
  const regionLine = [cityLine, b.region, b.country].filter(Boolean).join(', ');
  if (regionLine) parts.push(`    <div class="sub">${esc(regionLine)}</div>`);
  if (b.email && (!contact || contact.email !== b.email)) {
    parts.push(`    <div class="sub">${esc(b.email)}</div>`);
  }
  if (b.taxId) parts.push(`    <div class="sub">Tax ID: ${esc(b.taxId)}</div>`);
  if (quote.project) parts.push(`    <div style="margin-top:6px">${esc(quote.project)}</div>`);
  return parts.join('\n');
}

function baseStyles(accent) {
  return `
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
  .sub { font-size: 12px; color: #4a4e58; }
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
`;
}

function renderQuoteHtml(quote, brand, rates, client) {
  const { rows, total } = computeTotals(quote.lineItems, rates);
  const accent = /^#[0-9a-fA-F]{3,8}$/.test(brand.accentColor ?? '') ? brand.accentColor : '#C5FF3D';
  const money = (n) => esc(formatMoney(n, rates.currency ?? 'EUR'));
  const today = new Date();
  const validUntil = new Date(today.getTime() + (Number(brand.validityDays) || 14) * 86400000);
  const fmtDate = (d) => d.toISOString().slice(0, 10);
  const terms = client?.defaults?.paymentTerms || brand.paymentTerms || '';

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
<style>${baseStyles(accent)}</style>
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
${billToHtml(quote, client)}
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
    <span>${esc(terms)}</span>
    <span>${esc(brand.businessName ?? '')}</span>
  </footer>
</body>
</html>`;
}

function quoteMarkdown(quote, brand, rates, client) {
  const { rows, total } = computeTotals(quote.lineItems, rates);
  const currency = rates.currency ?? 'EUR';
  const terms = client?.defaults?.paymentTerms || brand.paymentTerms || '';
  const displayName = client?.legalName || client?.name || quote.client;
  const lines = rows
    .map((r) => `| ${r.description.replace(/\|/g, '\\|')} | ${r.hours} | ${formatMoney(r.hourly, currency)} | ${formatMoney(r.amount, currency)} |`)
    .join('\n');
  const escFm = (s) => String(s ?? '').replace(/"/g, '\\"');
  const clientIdLine = quote.clientId || client?.id ? `clientId: "${escFm(quote.clientId || client?.id)}"\n` : '';
  return `---
client: "${escFm(displayName)}"
${clientIdLine}project: "${escFm(quote.project)}"
total: ${total}
currency: ${currency}
status: draft
source: "${escFm(quote.sourceNote)}"
generated: ${new Date().toISOString()}
---

# Quote — ${displayName}

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

${terms} — valid ${Number(brand.validityDays) || 14} days.

${dataComment({ lineItems: quote.lineItems ?? [], scopeSummary: quote.scopeSummary ?? '', assumptions: quote.assumptions ?? [] })}
`;
}

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

module.exports = { esc, billToHtml, renderQuoteHtml, quoteMarkdown, renderInvoiceHtml, invoiceMarkdown };
