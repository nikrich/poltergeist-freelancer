import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderQuoteHtml, quoteMarkdown } from '../src/lib/template.cjs';

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
