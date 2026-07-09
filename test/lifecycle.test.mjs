import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {
  parseFrontmatter, setFrontmatterField,
  QUOTE_TRANSITIONS, INVOICE_TRANSITIONS, assertTransition, isOverdue,
} = require('../src/lib/lifecycle.cjs');

const NOTE = `---
client: "ACME GmbH"
total: 1200
status: draft
---

# Quote — ACME GmbH

Body stays untouched. | pipes | and --- dashes included.
`;

test('parseFrontmatter reads fields and body', () => {
  const { fields, body } = parseFrontmatter(NOTE);
  assert.equal(fields.client, 'ACME GmbH');
  assert.equal(fields.status, 'draft');
  assert.ok(body.includes('# Quote'));
});

test('setFrontmatterField rewrites only the target line', () => {
  const out = setFrontmatterField(NOTE, 'status', 'sent');
  assert.equal(parseFrontmatter(out).fields.status, 'sent');
  assert.equal(out.replace('status: sent', 'status: draft'), NOTE); // byte-for-byte otherwise
});

test('setFrontmatterField inserts a missing key before the closing ---', () => {
  const out = setFrontmatterField(NOTE, 'invoiced', 'true');
  assert.equal(parseFrontmatter(out).fields.invoiced, 'true');
  assert.ok(out.includes('status: draft')); // existing untouched
});

test('setFrontmatterField throws without frontmatter', () => {
  assert.throws(() => setFrontmatterField('# no fm\n', 'status', 'sent'), /frontmatter/);
});

test('transition tables allow the spec paths and nothing else', () => {
  assertTransition(QUOTE_TRANSITIONS, 'draft', 'sent');
  assertTransition(QUOTE_TRANSITIONS, 'sent', 'accepted');
  assertTransition(QUOTE_TRANSITIONS, 'sent', 'declined');
  assertTransition(QUOTE_TRANSITIONS, 'declined', 'sent');
  assert.throws(() => assertTransition(QUOTE_TRANSITIONS, 'accepted', 'draft'), /invalid transition/);
  assertTransition(INVOICE_TRANSITIONS, 'draft', 'sent');
  assertTransition(INVOICE_TRANSITIONS, 'sent', 'paid');
  assert.throws(() => assertTransition(INVOICE_TRANSITIONS, 'paid', 'sent'), /invalid transition/);
  assert.throws(() => assertTransition(INVOICE_TRANSITIONS, 'nope', 'sent'), /invalid transition/);
});

test('isOverdue only for sent past due', () => {
  const today = new Date('2026-07-09T12:00:00Z');
  assert.equal(isOverdue({ status: 'sent', due: '2026-07-08' }, today), true);
  assert.equal(isOverdue({ status: 'sent', due: '2026-07-09' }, today), false); // due today ≠ overdue
  assert.equal(isOverdue({ status: 'paid', due: '2026-07-01' }, today), false);
  assert.equal(isOverdue({ status: 'draft', due: '2026-07-01' }, today), false);
});
