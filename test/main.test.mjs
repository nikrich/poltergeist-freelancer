import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createHandlers } = require('../src/main.cjs');

function makeWorld(extraDeps = {}) {
  const root = mkdtempSync(join(tmpdir(), 'freelancer-'));
  const vault = join(root, 'vault');
  const dataDir = join(root, 'data');
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
    dataDir,
    settings: { get: (k) => settings.get(k), set: (k, v) => settings.set(k, v) },
    ipc: { handle: () => {}, send: (ch, p) => sent.push([ch, p]) },
    api: {
      fetch: async (method, apiPath, body) => {
        assert.equal(method, 'POST');
        assert.equal(apiPath, '/v1/llm/run');
        assert.ok(body.jsonSchema);
        const next = llmResponses.shift();
        if (!next) throw new Error('unexpected llm call');
        // A response entry may be a function (optionally async) returning the
        // structured payload — lets tests gate/delay a call to test joining.
        const structured = typeof next === 'function' ? await next() : next;
        return { ok: true, data: { text: '', structured, error: null } };
      },
    },
    log: () => {},
  };

  const pdfCalls = [];
  const openCalls = [];
  const handlers = createHandlers(ctx, {
    renderPdf: async (html) => {
      pdfCalls.push(html);
      return Buffer.from('%PDF-fake');
    },
    now: () => new Date('2026-07-09T12:00:00Z'),
    openPath: async (p) => {
      openCalls.push(p);
      return '';
    },
    ...extraDeps,
  });
  return { handlers, llmResponses, sent, pdfCalls, openCalls, vault, dataDir, settings };
}

// Seeds `total` markdown notes in 00-inbox with distinct, controlled mtimes so
// candidateNotes()'s newest-first ordering is deterministic across the test
// run. makeWorld() already writes 00-inbox/mail-acme.md; this reuses it as the
// OLDEST of the set and adds `total - 1` newer notes (note-0 newest).
function seedNotes(vault, total, baseMs = new Date('2026-07-09T10:00:00Z').getTime()) {
  const inbox = join(vault, '00-inbox');
  const files = [];
  for (let i = 0; i < total - 1; i++) {
    const name = `note-${i}.md`;
    const p = join(inbox, name);
    writeFileSync(p, `# ${name}\n\nSome incoming ask about ${name}.\n`);
    files.push(p);
  }
  files.push(join(inbox, 'mail-acme.md'));
  files.forEach((p, idx) => {
    const t = new Date(baseMs - idx * 60000);
    utimesSync(p, t, t);
  });
  return files;
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

test('manual rejects a sibling directory whose name merely shares the vault path as a string prefix', async () => {
  const w = makeWorld();
  // vault is <root>/vault; <root>/vault-evil is a sibling, NOT inside the vault,
  // but its path starts with the vault's path as a raw string.
  const evilDir = `${w.vault}-evil`;
  mkdirSync(evilDir, { recursive: true });
  writeFileSync(join(evilDir, 'secret.pdf'), 'nope');
  // reach it via a notePath that resolves outside the vault through '..'
  await assert.rejects(() => w.handlers['quotes:manual']('../vault-evil/secret.pdf'), /vault/);
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

test('concurrent generates never mint the same invoice number', async () => {
  const w = makeWorld();
  const draft = await w.handlers['invoices:draft']({});
  const inv = (n) => ({ ...draft, client: `Client ${n}`, lineItems: [{ description: 'x', hours: 1, rate: 'default' }] });
  const [a, b] = await Promise.all([
    w.handlers['invoices:generate'](inv(1)),
    w.handlers['invoices:generate'](inv(2)),
  ]);
  assert.notEqual(a.number, b.number);
});

test('generate rejects an unknown clientId', async () => {
  const w = makeWorld();
  await assert.rejects(
    w.handlers['invoices:generate']({ client: 'X', clientId: 'nope-123', lineItems: [{ description: 'x', hours: 1, rate: 'default' }] }),
    /unknown client/,
  );
});

test('dashboard aggregates statuses, revenue, attention and activity', async () => {
  const w = makeWorld();
  const q = await generateQuote(w);
  await w.handlers['quotes:set-status']({ file: q.file, status: 'sent' });
  await w.handlers['quotes:set-status']({ file: q.file, status: 'accepted' });
  const draft = await w.handlers['invoices:draft']({ quoteFile: q.file });
  const gen = await w.handlers['invoices:generate'](draft);
  const file = gen.notePath.split('/').pop();
  await w.handlers['invoices:set-status']({ file, status: 'sent' });
  await w.handlers['invoices:set-status']({ file, status: 'paid' });

  // `q` is now accepted + invoiced, so it no longer counts as "needs attention".
  // Generate a second quote that stays accepted but is never turned into an
  // invoice, so the acceptedQuote attention bucket still has an entry at
  // assert time (per the brief's note: acceptedQuote = accepted AND !invoiced).
  const q2gen = await w.handlers['quotes:generate']({
    client: 'ACME', project: 'Portal 2', scopeSummary: 's',
    lineItems: [{ description: 'dev', hours: 1, rate: 'default' }], assumptions: [], sourceNote: '00-inbox/mail-acme.md',
  });
  const q2File = q2gen.notePath.split('/').pop();
  await w.handlers['quotes:set-status']({ file: q2File, status: 'sent' });
  await w.handlers['quotes:set-status']({ file: q2File, status: 'accepted' });

  const s = await w.handlers['dashboard:summary']();
  assert.equal(s.quotes.accepted, 2 /* q (invoiced) + q2 (not invoiced) */);
  assert.equal(s.invoices.paid, 1);
  assert.equal(s.revenue.thisMonth, 160 /* 2h x 80, vat 0 */);
  assert.ok(s.attention.some((a) => a.kind === 'acceptedQuote'));
  assert.ok(s.activity.length >= 2);
  assert.ok(s.activity[0].when >= s.activity[s.activity.length - 1].when);
});

test('finding 1: once counter.json exists, live prefix/yearReset settings still apply (year/next stay file-truth)', async () => {
  const w = makeWorld();
  const draft = await w.handlers['invoices:draft']({});
  await w.handlers['invoices:generate']({
    ...draft, client: 'Acme', lineItems: [{ description: 'x', hours: 1, rate: 'default' }],
  });
  // counter.json now persists with prefix "INV". Change the live settings.
  const cfg = w.settings.get('config');
  w.settings.set('config', { ...cfg, invoicing: { ...(cfg.invoicing ?? {}), prefix: 'RD' } });

  const draft2 = await w.handlers['invoices:draft']({});
  assert.ok(draft2.number.startsWith('RD-'), `expected number to start with RD-, got ${draft2.number}`);
  // next/year are still file-truth: second invoice continues the sequence, doesn't reset.
  assert.equal(draft2.number, 'RD-2026-002');
});

test('finding 2: quoteRef path traversal is rejected in the generate stamp step', async () => {
  const w = makeWorld();
  const evilPath = join(w.vault, 'evil.md');
  const evilOriginal = '---\nstatus: draft\ninvoiced: false\n---\n\n# Evil\n';
  writeFileSync(evilPath, evilOriginal);

  const draft = await w.handlers['invoices:draft']({});
  const gen = await w.handlers['invoices:generate']({
    ...draft, client: 'Acme', lineItems: [{ description: 'x', hours: 1, rate: 'default' }],
    quoteRef: '../../evil.md',
  });
  assert.ok(existsSync(gen.notePath));
  assert.equal(readFileSync(evilPath, 'utf-8'), evilOriginal, 'evil.md outside quotesDir must be untouched');
});

test('finding 3: pdf carries the collision-resolved invoice number, not the pre-collision one', async () => {
  const w = makeWorld();
  const draft = await w.handlers['invoices:draft']({});
  const first = await w.handlers['invoices:generate']({
    ...draft, client: 'Acme', lineItems: [{ description: 'x', hours: 1, rate: 'default' }],
  });
  // roll the counter back so the next generate collides with the first invoice's filename
  await w.handlers['invoices:set-counter']({ next: 1 });
  const second = await w.handlers['invoices:generate']({
    ...draft, client: 'Acme', lineItems: [{ description: 'x', hours: 1, rate: 'default' }],
  });
  assert.notEqual(second.number, first.number);
  const html = w.pdfCalls[w.pdfCalls.length - 1];
  assert.ok(html.includes(second.number), `pdf html should contain final number ${second.number}`);
  assert.ok(!html.includes(first.number), `pdf html should not contain pre-collision number ${first.number}`);
});

test('sweep caps notes per pass and reports how many are still unswept', async () => {
  const w = makeWorld({ sweepMaxNotes: 2 });
  seedNotes(w.vault, 5); // + the default mail-acme.md note from makeWorld = 5 total

  w.llmResponses.push({ items: [] });
  const first = await w.handlers['quotes:sweep']({});
  assert.equal(first.scanned, 2);
  assert.equal(first.remaining, 3);
  const cache1 = JSON.parse(readFileSync(join(w.dataDir, 'work-items.json'), 'utf-8'));
  assert.equal(Object.keys(cache1.seen).length, 2);

  w.llmResponses.push({ items: [] });
  const second = await w.handlers['quotes:sweep']({});
  assert.equal(second.scanned, 2);
  assert.equal(second.remaining, 1);
});

test('sweep writes the cache after each batch, so an interrupted pass only loses its own batch', async () => {
  const w = makeWorld({ sweepMaxNotes: 12 });
  seedNotes(w.vault, 12); // BATCH_SIZE=10 -> batch 1 = 10 notes, batch 2 = 2 notes

  // Only enough responses for the first batch; the second batch's llm call
  // (and its retry) find the queue empty and throw.
  w.llmResponses.push({ items: [] });
  await assert.rejects(w.handlers['quotes:sweep']({}), /unexpected llm call/);

  const cache = JSON.parse(readFileSync(join(w.dataDir, 'work-items.json'), 'utf-8'));
  assert.equal(Object.keys(cache.seen).length, 10, 'first batch must be persisted even though the pass overall rejected');

  // A fresh sweep, after re-stocking responses, must not re-scan the first 10.
  w.llmResponses.push({ items: [] });
  const res = await w.handlers['quotes:sweep']({});
  assert.equal(res.scanned, 2);
  assert.equal(res.remaining, 0);
});

test('concurrent quotes:sweep calls join into the same in-flight run, no doubled llm calls', async () => {
  const w = makeWorld();
  let calls = 0;
  let releaseGate;
  const gate = new Promise((resolve) => { releaseGate = resolve; });
  w.llmResponses.push(async () => {
    calls += 1;
    await gate;
    return {
      items: [{ title: 'Booking portal', client: 'ACME GmbH', ask: 'Build a small booking portal', sourceNote: '00-inbox/mail-acme.md', confidence: 0.9 }],
    };
  });

  const p1 = w.handlers['quotes:sweep']({});
  const p2 = w.handlers['quotes:sweep']({}); // invoked while p1 is parked mid-flight
  releaseGate();
  const [r1, r2] = await Promise.all([p1, p2]);

  assert.equal(calls, 1, 'llm must only be called once — the joiner must not re-run the sweep');
  assert.equal(r1, r2, 'both callers must resolve to the exact same result object');
  assert.equal(r1.items.length, 1);
});

test('a dismiss landing between two sweep batches survives — the dismissed item must not resurrect', async () => {
  const w = makeWorld({ sweepMaxNotes: 12 });
  seedNotes(w.vault, 12); // BATCH_SIZE=10 -> batch 1 = 10 notes, batch 2 = 2 notes

  let batch2Started;
  const batch2Started$ = new Promise((resolve) => { batch2Started = resolve; });
  let releaseGate;
  const gate = new Promise((resolve) => { releaseGate = resolve; });

  // Batch 1 resolves immediately and finds one item; batch 1's cache write
  // (items + seen mtimes) must land on disk before batch 2 is ever attempted.
  w.llmResponses.push({
    items: [{ title: 'Booking portal', client: 'ACME', ask: 'Build a small booking portal', sourceNote: '00-inbox/note-0.md', confidence: 0.9 }],
  });
  // Batch 2's llm call is gated: it signals batch2Started() (proving batch 1's
  // write already happened) then parks until the test releases it.
  w.llmResponses.push(async () => {
    batch2Started();
    await gate;
    return { items: [] };
  });

  const sweepPromise = w.handlers['quotes:sweep']({});
  await batch2Started$;

  const cacheAfterBatch1 = JSON.parse(readFileSync(join(w.dataDir, 'work-items.json'), 'utf-8'));
  assert.equal(cacheAfterBatch1.items.length, 1, 'batch 1 item must already be persisted');
  const dismissedId = cacheAfterBatch1.items[0].id;

  // A dismiss lands here — between batch 1's write and batch 2's write.
  await w.handlers['quotes:dismiss'](dismissedId);

  releaseGate();
  const result = await sweepPromise;

  assert.ok(!result.items.some((i) => i.id === dismissedId), 'dismissed item must not resurrect in the sweep result');
  const finalCache = JSON.parse(readFileSync(join(w.dataDir, 'work-items.json'), 'utf-8'));
  assert.ok(finalCache.dismissed.includes(dismissedId), 'dismissal must still be recorded after the final batch write');
  assert.ok(!finalCache.items.some((i) => i.id === dismissedId), 'dismissed item must not reappear in the persisted cache');
});

test('quotes:items reads the cache without sweeping (no llm call), reflects a prior sweep', async () => {
  const w = makeWorld();
  const fresh = await w.handlers['quotes:items']();
  assert.deepEqual(fresh, { items: [] });

  w.llmResponses.push({
    items: [{ title: 'Booking portal', client: 'ACME GmbH', ask: 'Build a small booking portal', sourceNote: '00-inbox/mail-acme.md', confidence: 0.9 }],
  });
  await w.handlers['quotes:sweep']({});

  // no llm response queued — quotes:items must not call the llm at all
  const after = await w.handlers['quotes:items']();
  assert.equal(after.items.length, 1);
  assert.equal(after.items[0].client, 'ACME GmbH');
});

test('files:open rejects paths outside the vault and delegates in-vault paths to the injected opener', async () => {
  const w = makeWorld();
  await assert.rejects(w.handlers['files:open']('/etc/passwd'), /vault/);
  assert.equal(w.openCalls.length, 0);

  const inVault = join(w.vault, '30-cross-context', 'quotes', 'x.pdf');
  const res = await w.handlers['files:open'](inVault);
  assert.equal(res.ok, true);
  assert.deepEqual(w.openCalls, [inVault]);
});

test('files:open rejects a sibling directory whose name merely shares the vault path as a string prefix', async () => {
  const w = makeWorld();
  // vault is <root>/vault; <root>/vault-evil is a sibling, NOT inside the vault,
  // but its path starts with the vault's path as a raw string — a naive
  // startsWith(vaultDir) containment check would wrongly let this through.
  const evilDir = `${w.vault}-evil`;
  mkdirSync(evilDir, { recursive: true });
  const evilFile = join(evilDir, 'secret.pdf');
  writeFileSync(evilFile, 'nope');
  await assert.rejects(w.handlers['files:open'](evilFile), /vault/);
  assert.equal(w.openCalls.length, 0);
});

test('files:open throws when the opener reports a non-empty error string', async () => {
  const w = makeWorld({ openPath: async () => 'no application found' });
  const inVault = join(w.vault, '30-cross-context', 'quotes', 'x.pdf');
  await assert.rejects(w.handlers['files:open'](inVault), /no application found/);
});

test('quotes:open resolves pdf/note siblings inside quotesDir and rejects basename traversal', async () => {
  const w = makeWorld();
  const quote = {
    client: 'ACME', project: 'P', scopeSummary: 's',
    lineItems: [{ description: 'dev', hours: 1, rate: 'default' }], assumptions: [], sourceNote: '00-inbox/mail-acme.md',
  };
  const { notePath } = await w.handlers['quotes:generate'](quote);
  const file = notePath.split('/').pop();

  await w.handlers['quotes:open']({ file, which: 'note' });
  assert.equal(w.openCalls[0], notePath);

  await w.handlers['quotes:open']({ file, which: 'pdf' });
  assert.equal(w.openCalls[1], notePath.replace(/\.md$/, '.pdf'));

  await assert.rejects(w.handlers['quotes:open']({ file: '../../evil.md', which: 'note' }), /basename|invalid/i);
});

test('quotes:open rejects an unrecognized which value instead of silently opening the note', async () => {
  const w = makeWorld();
  const quote = {
    client: 'ACME', project: 'P', scopeSummary: 's',
    lineItems: [{ description: 'dev', hours: 1, rate: 'default' }], assumptions: [], sourceNote: '00-inbox/mail-acme.md',
  };
  const { notePath } = await w.handlers['quotes:generate'](quote);
  const file = notePath.split('/').pop();

  await assert.rejects(w.handlers['quotes:open']({ file, which: 'exe' }), /which must be/i);
  assert.equal(w.openCalls.length, 0);
});

test('quotes:load round-trips a generated quote (client/project/scope/lineItems/assumptions)', async () => {
  const w = makeWorld();
  const quote = {
    client: 'ACME GmbH', project: 'Booking portal', scopeSummary: 'Build a small booking portal',
    lineItems: [{ description: 'backend', hours: 20, rate: 'development' }],
    assumptions: ['hosting provided'], sourceNote: '00-inbox/mail-acme.md',
  };
  const { notePath } = await w.handlers['quotes:generate'](quote);
  const file = notePath.split('/').pop();

  const loaded = await w.handlers['quotes:load']({ file });
  assert.equal(loaded.client, 'ACME GmbH');
  assert.equal(loaded.project, 'Booking portal');
  assert.equal(loaded.scopeSummary, 'Build a small booking portal');
  assert.deepEqual(loaded.lineItems, quote.lineItems);
  assert.deepEqual(loaded.assumptions, ['hosting provided']);
  assert.equal(loaded.sourceNote, '00-inbox/mail-acme.md');
  assert.equal(loaded.status, 'draft');
  assert.equal(loaded.invoiced, false);

  await assert.rejects(w.handlers['quotes:load']({ file: '../../evil.md' }), /basename|invalid/i);
});

test('quotes:load falls back to Scope/Assumptions markdown sections for old notes lacking the richer data comment', async () => {
  const w = makeWorld();
  const dir = join(w.vault, '30-cross-context', 'quotes');
  mkdirSync(dir, { recursive: true });
  const oldNote = `---
client: "Old Co"
project: "Legacy"
total: 100
currency: EUR
status: draft
source: "00-inbox/mail-acme.md"
generated: 2020-01-01T00:00:00.000Z
---

# Quote — Old Co

**Project:** Legacy

## Scope

Old scope text.

## Line items

| item | hours | rate | amount |
|------|-------|------|--------|
| dev | 1 | €80.00 | €80.00 |

**Total: €80.00**

## Assumptions

- assumption one
- assumption two

## Terms

net 14 — valid 14 days.

<!-- freelancer:data {"lineItems":[{"description":"dev","hours":1,"rate":"default"}]} -->
`;
  writeFileSync(join(dir, 'old-quote.md'), oldNote);

  const loaded = await w.handlers['quotes:load']({ file: 'old-quote.md' });
  assert.equal(loaded.scopeSummary, 'Old scope text.');
  assert.deepEqual(loaded.assumptions, ['assumption one', 'assumption two']);
  assert.deepEqual(loaded.lineItems, [{ description: 'dev', hours: 1, rate: 'default' }]);
});
