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
