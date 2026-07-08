import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTotals,
  formatMoney,
  mergeSweep,
  itemId,
  parseStrictJson,
  slug,
  quoteBasename,
} from '../src/lib/quotes.cjs';

const rates = {
  currency: 'EUR',
  default: 80,
  named: [
    { name: 'development', hourly: 95 },
    { name: 'design', hourly: 85 },
  ],
};

test('computeTotals resolves named rates and falls back to default', () => {
  const { rows, total } = computeTotals(
    [
      { description: 'build api', hours: 10, rate: 'development' },
      { description: 'logo tweaks', hours: 2, rate: 'design' },
      { description: 'misc', hours: 1, rate: 'nonexistent' },
    ],
    rates,
  );
  assert.equal(rows[0].hourly, 95);
  assert.equal(rows[0].amount, 950);
  assert.equal(rows[1].amount, 170);
  assert.equal(rows[2].hourly, 80); // fallback
  assert.equal(total, 950 + 170 + 80);
});

test('computeTotals tolerates bad hours', () => {
  const { rows, total } = computeTotals([{ description: 'x', hours: 'nope', rate: 'design' }], rates);
  assert.equal(rows[0].amount, 0);
  assert.equal(total, 0);
});

test('formatMoney formats with currency', () => {
  const s = formatMoney(1234.5, 'EUR');
  assert.ok(s.includes('1') && (s.includes('€') || s.includes('EUR')), s);
});

test('mergeSweep dedups, keeps dismissals, updates seen', () => {
  const a = { id: 'aaa', title: 'A', sourceNote: 'n1.md' };
  const b = { id: 'bbb', title: 'B', sourceNote: 'n2.md' };
  const cache = { seen: { 'n1.md': 1 }, items: [a], dismissed: ['bbb'] };
  const next = mergeSweep(cache, { items: [a, b], scannedMtimes: { 'n2.md': 5 } });
  assert.deepEqual(next.items.map((i) => i.id), ['aaa']); // b dismissed, a not duplicated
  assert.equal(next.seen['n2.md'], 5);
  assert.equal(next.seen['n1.md'], 1);
  assert.deepEqual(next.dismissed, ['bbb']);
});

test('itemId is stable and hexish', () => {
  assert.equal(itemId('n.md', 'Build site'), itemId('n.md', 'Build site'));
  assert.match(itemId('n.md', 'Build site'), /^[0-9a-f]{12}$/);
});

test('parseStrictJson strips fences and throws helpfully', () => {
  assert.deepEqual(parseStrictJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseStrictJson('{"a":1}'), { a: 1 });
  assert.throws(() => parseStrictJson('the model rambled'), /JSON/);
});

test('slug and quoteBasename', () => {
  assert.equal(slug('ACME GmbH & Co.'), 'acme-gmbh-co');
  assert.match(quoteBasename('ACME GmbH', new Date('2026-07-08')), /^quote-acme-gmbh-20260708$/);
});
