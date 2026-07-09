import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createHandlers } = require('../src/main.cjs');

function makeWorld() {
  const root = mkdtempSync(join(tmpdir(), 'freelancer-'));
  const vault = join(root, 'vault');
  mkdirSync(join(vault, '00-inbox'), { recursive: true });
  writeFileSync(
    join(vault, '00-inbox', 'mail-acme.md'),
    '# Mail from ACME\n\nHi, could you build us a small booking portal? Budget flexible. — Petra (ACME GmbH)\n',
  );

  const settings = new Map([
    ['config', {
      vaultPath: vault,
      brand: { businessName: 'Richter Digital', accentColor: '#C5FF3D', paymentTerms: 'net 14', validityDays: 14 },
      rates: { currency: 'EUR', default: 80, named: [{ name: 'development', hourly: 95 }] },
    }],
  ]);

  const llmResponses = [];
  const sent = [];
  const ctx = {
    pluginId: 'freelancer',
    pluginDir: root,
    dataDir: join(root, 'data'),
    settings: { get: (k) => settings.get(k), set: (k, v) => settings.set(k, v) },
    ipc: { handle: () => {}, send: (ch, p) => sent.push([ch, p]) },
    api: {
      fetch: async (method, apiPath, body) => {
        assert.equal(method, 'POST');
        assert.equal(apiPath, '/v1/llm/run');
        assert.ok(body.jsonSchema);
        const next = llmResponses.shift();
        if (!next) throw new Error('unexpected llm call');
        return { ok: true, data: { text: '', structured: next, error: null } };
      },
    },
    log: () => {},
  };

  const pdfCalls = [];
  const handlers = createHandlers(ctx, {
    renderPdf: async (html) => {
      pdfCalls.push(html);
      return Buffer.from('%PDF-fake');
    },
    now: () => new Date('2026-07-09T12:00:00Z'),
  });
  return { handlers, llmResponses, sent, pdfCalls, vault };
}

test('sweep finds the seeded work request and caches it', async () => {
  const w = makeWorld();
  w.llmResponses.push({
    items: [{ title: 'Booking portal', client: 'ACME GmbH', ask: 'Build a small booking portal', sourceNote: '00-inbox/mail-acme.md', confidence: 0.9 }],
  });
  const res = await w.handlers['quotes:sweep']({});
  assert.equal(res.scanned, 1);
  assert.equal(res.items.length, 1);
  assert.equal(res.items[0].client, 'ACME GmbH');
  assert.ok(w.sent.some(([ch]) => ch === 'quotes:sweep-progress'));

  // second sweep: nothing new, no llm call needed
  const res2 = await w.handlers['quotes:sweep']({});
  assert.equal(res2.scanned, 0);
  assert.equal(res2.items.length, 1);
});

test('dismiss removes and sticks across sweeps', async () => {
  const w = makeWorld();
  w.llmResponses.push({
    items: [{ title: 'Booking portal', client: 'ACME', ask: 'x', sourceNote: '00-inbox/mail-acme.md', confidence: 0.5 }],
  });
  const { items } = await w.handlers['quotes:sweep']({});
  await w.handlers['quotes:dismiss'](items[0].id);
  w.llmResponses.push({ items: [{ title: 'Booking portal', client: 'ACME', ask: 'x', sourceNote: '00-inbox/mail-acme.md', confidence: 0.5 }] });
  const res = await w.handlers['quotes:sweep']({ force: true });
  assert.equal(res.items.length, 0);
});

test('draft reads the source note and returns the llm draft', async () => {
  const w = makeWorld();
  w.llmResponses.push({
    client: 'ACME GmbH',
    project: 'Booking portal',
    scopeSummary: 'Small booking portal',
    lineItems: [{ description: 'backend', hours: 20, rate: 'development' }],
    assumptions: ['hosting provided'],
  });
  const draft = await w.handlers['quotes:draft']({ notePath: '00-inbox/mail-acme.md' });
  assert.equal(draft.client, 'ACME GmbH');
  assert.equal(draft.sourceNote, '00-inbox/mail-acme.md');
});

test('generate writes pdf + markdown note into the vault quotes dir', async () => {
  const w = makeWorld();
  const quote = {
    client: 'ACME GmbH',
    project: 'Booking portal',
    scopeSummary: 'Build it',
    lineItems: [{ description: 'backend', hours: 20, rate: 'development' }],
    assumptions: [],
    sourceNote: '00-inbox/mail-acme.md',
  };
  const { pdfPath, notePath } = await w.handlers['quotes:generate'](quote);
  assert.ok(existsSync(pdfPath) && readFileSync(pdfPath, 'utf-8').startsWith('%PDF'));
  assert.ok(notePath.includes('30-cross-context/quotes/quote-acme-gmbh-'));
  assert.ok(readFileSync(notePath, 'utf-8').includes('client: "ACME GmbH"'));
  assert.ok(w.pdfCalls[0].includes('Richter Digital'));

  // collision → -2 suffix
  const second = await w.handlers['quotes:generate'](quote);
  assert.ok(second.notePath.endsWith('-2.md'));

  const list = await w.handlers['quotes:list']();
  assert.equal(list.length, 2);
  assert.equal(list[0].client, 'ACME GmbH');
  assert.ok(list[0].pdf);
});

test('manual rejects paths escaping the vault; generate rejects empty quotes', async () => {
  const w = makeWorld();
  await assert.rejects(() => w.handlers['quotes:manual']('../../etc/passwd'), /escapes/);
  await assert.rejects(() => w.handlers['quotes:generate']({ client: 'x', lineItems: [] }), /line item/);
});

test('clients upsert list resolve archive and vault mirror', async () => {
  const w = makeWorld();
  const client = await w.handlers['clients:upsert']({
    name: 'ACME GmbH',
    status: 'active',
    contacts: [{ name: 'Petra', email: 'petra@acme.test', primary: true }],
    billing: { taxId: 'DE123', addressLines: ['Str. 1'], city: 'Berlin', country: 'DE' },
  });
  assert.ok(client.id);
  assert.equal(client.name, 'ACME GmbH');

  const list = await w.handlers['clients:list']({});
  assert.equal(list.length, 1);

  const resolved = await w.handlers['clients:resolve']('acme gmbh');
  assert.equal(resolved.client.id, client.id);

  const got = await w.handlers['clients:get'](client.id);
  assert.equal(got.billing.taxId, 'DE123');

  // vault mirror
  const mirror = join(w.vault, '30-cross-context', 'clients');
  assert.ok(existsSync(mirror));
  const notes = require('node:fs').readdirSync(mirror).filter((f) => f.endsWith('.md'));
  assert.equal(notes.length, 1);
  assert.ok(readFileSync(join(mirror, notes[0]), 'utf-8').includes('DE123'));

  await w.handlers['clients:archive'](client.id);
  const active = await w.handlers['clients:list']({});
  assert.equal(active.length, 0);
  const archived = await w.handlers['clients:list']({ status: 'archived' });
  assert.equal(archived.length, 1);
});

test('generate with clientId enriches pdf and frontmatter', async () => {
  const w = makeWorld();
  const client = await w.handlers['clients:upsert']({
    name: 'ACME GmbH',
    status: 'active',
    billing: { taxId: 'DE999', addressLines: ['Hauptstr. 1'] },
    defaults: { paymentTerms: 'net 45' },
  });
  const quote = {
    client: 'ACME GmbH',
    clientId: client.id,
    project: 'Portal',
    scopeSummary: 'Build',
    lineItems: [{ description: 'backend', hours: 10, rate: 'development' }],
    assumptions: [],
    sourceNote: '00-inbox/mail-acme.md',
  };
  const { notePath, clientId } = await w.handlers['quotes:generate'](quote);
  assert.equal(clientId, client.id);
  assert.ok(w.pdfCalls[0].includes('Tax ID: DE999'));
  assert.ok(w.pdfCalls[0].includes('Hauptstr. 1'));
  assert.ok(w.pdfCalls[0].includes('net 45'));
  const md = readFileSync(notePath, 'utf-8');
  assert.ok(md.includes(`clientId: "${client.id}"`));
});

test('bootstrap seeds clients from quote history and work items', async () => {
  const w = makeWorld();
  await w.handlers['quotes:generate']({
    client: 'Fresh Co',
    project: 'X',
    scopeSummary: 'y',
    lineItems: [{ description: 'a', hours: 1, rate: 'default' }],
    assumptions: [],
  });
  w.llmResponses.push({
    items: [{ title: 'Job', client: 'Work Item Inc', ask: 'do stuff', sourceNote: '00-inbox/mail-acme.md', confidence: 0.8 }],
  });
  await w.handlers['quotes:sweep']({});

  const { created } = await w.handlers['clients:bootstrap']();
  assert.ok(created >= 2);
  const list = await w.handlers['clients:list']({});
  const names = list.map((c) => c.name);
  assert.ok(names.includes('Fresh Co'));
  assert.ok(names.includes('Work Item Inc'));
});

test('draft attaches clientId when CRM has an exact match', async () => {
  const w = makeWorld();
  const client = await w.handlers['clients:upsert']({ name: 'ACME GmbH', status: 'active' });
  w.llmResponses.push({
    client: 'ACME GmbH',
    project: 'Booking portal',
    scopeSummary: 'Small booking portal',
    lineItems: [{ description: 'backend', hours: 20, rate: 'development' }],
    assumptions: [],
  });
  const draft = await w.handlers['quotes:draft']({ notePath: '00-inbox/mail-acme.md' });
  assert.equal(draft.clientId, client.id);
});

async function generateQuote(w) {
  w.llmResponses.push({ items: [{ title: 'Portal', client: 'ACME', ask: 'x', sourceNote: '00-inbox/mail-acme.md', confidence: 0.9 }] });
  await w.handlers['quotes:sweep']({});
  await w.handlers['quotes:generate']({
    client: 'ACME', project: 'Portal', scopeSummary: 's',
    lineItems: [{ description: 'dev', hours: 2, rate: 'default' }], assumptions: [], sourceNote: '00-inbox/mail-acme.md',
  });
  const [row] = await w.handlers['quotes:list']();
  return row;
}

test('quote status walks draft -> sent -> accepted and rejects bad moves', async () => {
  const w = makeWorld();
  const row = await generateQuote(w);
  assert.equal(row.status, 'draft');
  await w.handlers['quotes:set-status']({ file: row.file, status: 'sent' });
  await assert.rejects(w.handlers['quotes:set-status']({ file: row.file, status: 'draft' }), /invalid transition/);
  await w.handlers['quotes:set-status']({ file: row.file, status: 'accepted' });
  const [after] = await w.handlers['quotes:list']();
  assert.equal(after.status, 'accepted');
  await assert.rejects(w.handlers['quotes:set-status']({ file: row.file, status: 'sent' }), /invalid transition/);
  await assert.rejects(w.handlers['quotes:set-status']({ file: '../evil.md', status: 'sent' }), /basename|invalid/i);
});

test('invoice lifecycle: draft from accepted quote, generate, mark paid', async () => {
  const w = makeWorld();
  const q = await generateQuote(w);
  await w.handlers['quotes:set-status']({ file: q.file, status: 'sent' });
  await w.handlers['quotes:set-status']({ file: q.file, status: 'accepted' });

  const draft = await w.handlers['invoices:draft']({ quoteFile: q.file });
  assert.equal(draft.number, 'INV-2026-001');
  assert.equal(draft.quoteRef, q.file);
  assert.deepEqual(draft.lineItems, [{ description: 'dev', hours: 2, rate: 'default' }]);
  assert.equal(draft.due > draft.issued, true);

  const gen = await w.handlers['invoices:generate'](draft);
  assert.match(gen.notePath, /invoice-acme-INV-2026-001\.md$/);
  assert.ok(existsSync(gen.pdfPath));

  const [row] = await w.handlers['invoices:list']();
  assert.equal(row.number, 'INV-2026-001');
  assert.equal(row.status, 'draft');
  assert.equal(row.overdue, false);

  // counter advanced
  const draft2 = await w.handlers['invoices:draft']({});
  assert.equal(draft2.number, 'INV-2026-002');

  // quote stamped
  const [qAfter] = await w.handlers['quotes:list']();
  assert.equal(qAfter.invoiced, true);

  await w.handlers['invoices:set-status']({ file: row.file, status: 'sent' });
  await w.handlers['invoices:set-status']({ file: row.file, status: 'paid' });
  const [paid] = await w.handlers['invoices:list']();
  assert.equal(paid.status, 'paid');
  assert.ok(paid.paidAt);
  await assert.rejects(w.handlers['invoices:set-status']({ file: row.file, status: 'sent' }), /invalid transition/);
});

test('overdue is computed, never stored', async () => {
  const w = makeWorld();
  const draft = await w.handlers['invoices:draft']({});
  const gen = await w.handlers['invoices:generate']({ ...draft, client: 'Acme', lineItems: [{ description: 'x', hours: 1, rate: 'default' }], due: '2020-01-01' });
  const file = gen.notePath.split('/').pop();
  await w.handlers['invoices:set-status']({ file, status: 'sent' });
  const [row] = await w.handlers['invoices:list']();
  assert.equal(row.overdue, true);
  assert.ok(row.daysOverdue > 1000);
  const text = readFileSync(gen.notePath, 'utf-8');
  assert.ok(!text.includes('overdue'));
});
