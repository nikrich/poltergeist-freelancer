import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderQuoteHtml, quoteMarkdown, renderInvoiceHtml, invoiceMarkdown } from '../src/lib/template.cjs';
import { parseDataComment } from '../src/lib/invoices.cjs';
import { parseFrontmatter } from '../src/lib/lifecycle.cjs';

const quote = {
  client: '<script>alert(1)</script> GmbH',
  project: 'Website & Portal',
  scopeSummary: 'Build the thing',
  lineItems: [{ description: 'dev', hours: 10, rate: 'development' }],
  assumptions: ['content provided by client'],
  sourceNote: '00-inbox/mail.md',
};

const brand = {
  businessName: 'Richter Digital',
  logoDataUri: 'data:image/png;base64,AAA',
  accentColor: '#C5FF3D',
  contactLine: 'jannik@example.com',
  paymentTerms: '50% upfront',
  validityDays: 14,
};

const rates = { currency: 'EUR', default: 80, named: [{ name: 'development', hourly: 95 }] };

test('renderQuoteHtml escapes user strings and includes brand', () => {
  const html = renderQuoteHtml(quote, brand, rates);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('Richter Digital'));
  assert.ok(html.includes('#C5FF3D'));
  assert.ok(html.includes('50% upfront'));
  assert.ok(html.includes('data:image/png;base64,AAA'));
  assert.ok(html.includes('950')); // 10h × 95
});

test('renderQuoteHtml works without a logo', () => {
  const html = renderQuoteHtml(quote, { ...brand, logoDataUri: '' }, rates);
  assert.ok(!html.includes('<img'));
});

test('quoteMarkdown has frontmatter and totals', () => {
  const md = quoteMarkdown(quote, brand, rates);
  assert.ok(md.startsWith('---\n'));
  assert.ok(md.includes('client:'));
  assert.ok(md.includes('status: draft'));
  assert.ok(md.includes('950'));
  assert.ok(md.includes('00-inbox/mail.md'));
});

test('renderQuoteHtml bill-to includes tax id address and escapes client fields', () => {
  const client = {
    id: 'abc123',
    name: 'ACME',
    legalName: 'ACME <script> GmbH',
    contacts: [{ name: 'Petra', email: 'p@acme.test', role: 'buyer', primary: true }],
    billing: {
      addressLines: ['Hauptstr. 1'],
      city: 'Berlin',
      postalCode: '10115',
      country: 'DE',
      taxId: 'DE999',
    },
    defaults: { paymentTerms: 'net 30 client override' },
  };
  const html = renderQuoteHtml(quote, brand, rates, client);
  assert.ok(html.includes('Tax ID: DE999'));
  assert.ok(html.includes('Hauptstr. 1'));
  assert.ok(html.includes('10115 Berlin, DE') || html.includes('10115 Berlin'));
  assert.ok(html.includes('Petra'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('net 30 client override'));
});

test('quoteMarkdown includes clientId when provided', () => {
  const md = quoteMarkdown(
    { ...quote, clientId: 'cid-1', client: 'ACME' },
    brand,
    rates,
    { id: 'cid-1', name: 'ACME', legalName: 'ACME GmbH' },
  );
  assert.ok(md.includes('clientId: "cid-1"'));
  assert.ok(md.includes('ACME GmbH'));
});

test('quoteMarkdown embeds the machine-readable line items', () => {
  const md = quoteMarkdown(
    { client: 'Acme', project: 'Site', scopeSummary: 's', lineItems: [{ description: 'dev', hours: 2, rate: 'default' }], assumptions: [], sourceNote: 'x.md' },
    { paymentTerms: 'net 14', validityDays: 14 },
    { currency: 'EUR', default: 80, named: [] },
  );
  assert.ok(md.includes('freelancer:data'));
  assert.deepEqual(parseDataComment(md).lineItems, [{ description: 'dev', hours: 2, rate: 'default' }]);
});

test('quoteMarkdown data comment also carries scopeSummary and assumptions, for edit round-trip', () => {
  const md = quoteMarkdown(quote, brand, rates);
  const data = parseDataComment(md);
  assert.equal(data.scopeSummary, quote.scopeSummary);
  assert.deepEqual(data.assumptions, quote.assumptions);
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
