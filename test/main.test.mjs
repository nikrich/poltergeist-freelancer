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
