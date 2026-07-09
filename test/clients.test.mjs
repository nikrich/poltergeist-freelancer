import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyStore,
  normalizeClientName,
  validateClient,
  matchClients,
  filterByStatus,
  resolveClient,
  mergeUpsert,
  archiveClient,
  bootstrapFromNames,
  clientVaultNote,
  primaryContact,
} from '../src/lib/clients.cjs';

const fixedNow = () => new Date('2026-07-09T12:00:00.000Z');

test('normalizeClientName collapses punctuation and case', () => {
  assert.equal(normalizeClientName('  ACME GmbH! '), 'acme gmbh');
  assert.equal(normalizeClientName('Acme_GmbH'), 'acme gmbh');
});

test('validateClient requires name and cleans fields', () => {
  assert.throws(() => validateClient({}), /name is required/);
  assert.throws(() => validateClient({ name: 'x', contacts: [{ name: 'a', email: 'nope' }] }), /valid email/);

  const c = validateClient(
    {
      name: '  ACME GmbH  ',
      legalName: 'ACME Gesellschaft mbH',
      status: 'active',
      tags: ['saas', 'saas', ''],
      contacts: [
        { name: 'Petra', email: 'petra@acme.test', role: 'buyer', primary: true },
        { name: 'Otto', email: 'otto@acme.test', primary: true }, // second primary dropped
      ],
      billing: {
        email: 'billing@acme.test',
        addressLines: ['Hauptstr. 1', '', '  '],
        city: 'Berlin',
        postalCode: '10115',
        country: 'DE',
        taxId: 'DE123',
      },
      defaults: { currency: 'eur', rateName: 'development', paymentTerms: 'net 14' },
      notes: 'nice people',
    },
    { now: fixedNow },
  );

  assert.equal(c.name, 'ACME GmbH');
  assert.equal(c.status, 'active');
  assert.deepEqual(c.tags, ['saas']);
  assert.equal(c.contacts.length, 2);
  assert.equal(c.contacts[0].primary, true);
  assert.equal(c.contacts[1].primary, false);
  assert.equal(c.billing.taxId, 'DE123');
  assert.deepEqual(c.billing.addressLines, ['Hauptstr. 1']);
  assert.equal(c.defaults.currency, 'EUR');
  assert.equal(c.createdAt, '2026-07-09T12:00:00.000Z');
});

test('matchClients searches name tags and emails', () => {
  const clients = [
    validateClient({ name: 'ACME', tags: ['saas'], contacts: [{ name: 'P', email: 'p@acme.test' }], status: 'active' }, { now: fixedNow }),
    validateClient({ name: 'Beta Co', status: 'prospect' }, { now: fixedNow }),
  ];
  assert.equal(matchClients(clients, 'acme').length, 1);
  assert.equal(matchClients(clients, 'p@acme').length, 1);
  assert.equal(matchClients(clients, 'saas').length, 1);
  assert.equal(matchClients(clients, '').length, 2);
});

test('filterByStatus hides archived by default', () => {
  const clients = [
    { id: '1', name: 'A', status: 'active' },
    { id: '2', name: 'B', status: 'archived' },
    { id: '3', name: 'C', status: 'prospect' },
  ];
  assert.deepEqual(filterByStatus(clients, 'all').map((c) => c.id), ['1', '3']);
  assert.deepEqual(filterByStatus(clients, 'archived').map((c) => c.id), ['2']);
  assert.deepEqual(filterByStatus(clients, 'active').map((c) => c.id), ['1']);
});

test('resolveClient prefers exact normalized match', () => {
  const a = validateClient({ name: 'ACME GmbH', status: 'active' }, { now: fixedNow });
  const b = validateClient({ name: 'ACME Holdings', status: 'active' }, { now: fixedNow });
  const store = [a, b];

  const exact = resolveClient(store, 'acme gmbh');
  assert.equal(exact.client.id, a.id);

  const amb = resolveClient(store, 'acme');
  assert.equal(amb.client, null);
  assert.equal(amb.candidates.length, 2);

  const none = resolveClient(store, 'zeta');
  assert.equal(none.client, null);
  assert.equal(none.candidates.length, 0);
});

test('mergeUpsert create and update; archive soft-deletes', () => {
  let { store, client } = mergeUpsert(emptyStore(), { name: 'ACME', status: 'active' }, fixedNow);
  assert.equal(store.clients.length, 1);
  const id = client.id;

  ({ store, client } = mergeUpsert(store, { id, name: 'ACME GmbH', status: 'active', notes: 'hi' }, fixedNow));
  assert.equal(store.clients.length, 1);
  assert.equal(store.clients[0].name, 'ACME GmbH');
  assert.equal(store.clients[0].notes, 'hi');
  assert.equal(store.clients[0].createdAt, client.createdAt);

  store = archiveClient(store, id);
  assert.equal(store.clients[0].status, 'archived');
  assert.throws(() => archiveClient(store, 'missing'), /unknown client/);
});

test('bootstrapFromNames creates unique active clients', () => {
  const { store, created } = bootstrapFromNames(
    emptyStore(),
    ['ACME GmbH', 'acme gmbh', 'unknown', '', 'Beta Co', 'Beta Co'],
    fixedNow,
  );
  assert.equal(created, 2);
  assert.equal(store.clients.length, 2);
  assert.ok(store.clients.every((c) => c.status === 'active'));
  assert.ok(store.clients.every((c) => c.tags.includes('bootstrap')));
});

test('clientVaultNote escapes quotes and includes billing', () => {
  const c = validateClient(
    {
      name: 'ACME "Prime"',
      status: 'active',
      billing: { taxId: 'DE1', addressLines: ['Street 1'], city: 'Berlin', country: 'DE' },
      contacts: [{ name: 'Petra', email: 'p@a.test', primary: true }],
      notes: 'vip',
    },
    { now: fixedNow },
  );
  const { basename, markdown } = clientVaultNote(c);
  assert.ok(basename.startsWith('client-acme'));
  assert.ok(markdown.includes('type: client'));
  assert.ok(markdown.includes('Tax ID: DE1'));
  assert.ok(markdown.includes('name: "ACME \\"Prime\\""') || markdown.includes('ACME \\"Prime\\"'));
  assert.ok(markdown.includes('Petra'));
  assert.ok(markdown.includes('vip'));
});

test('primaryContact picks primary then first', () => {
  const c = validateClient(
    {
      name: 'X',
      contacts: [
        { name: 'A', primary: false },
        { name: 'B', primary: true },
      ],
    },
    { now: fixedNow },
  );
  assert.equal(primaryContact(c).name, 'B');
});

test('defaults accept a numeric vatRate and drop junk', () => {
  const c = validateClient({ name: 'Acme', defaults: { currency: 'eur', vatRate: 15 } });
  assert.equal(c.defaults.vatRate, 15);
  assert.equal(c.defaults.currency, 'EUR');
  const junk = validateClient({ name: 'Acme', defaults: { vatRate: 'abc' } });
  assert.equal(junk.defaults.vatRate, undefined);
  assert.throws(() => validateClient({ name: 'Acme', defaults: { vatRate: 120 } }), /vatRate/);
});
