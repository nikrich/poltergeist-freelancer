// Freelancer main process: vault sweep → work items → quote drafts → branded
// PDF + vault note. All handlers throw on bad input/failed calls — the host
// rejects only that call, never the plugin.

const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { mergeSweep, itemId, parseStrictJson, quoteBasename } = require('./lib/quotes.cjs');
const { renderQuoteHtml, quoteMarkdown, renderInvoiceHtml, invoiceMarkdown } = require('./lib/template.cjs');
const { currentNumber, advanceCounter, invoiceBasename, parseDataComment, resolveVatRate } = require('./lib/invoices.cjs');
const { parseFrontmatter, setFrontmatterField, QUOTE_TRANSITIONS, INVOICE_TRANSITIONS, assertTransition, isOverdue } = require('./lib/lifecycle.cjs');
const {
  emptyStore,
  matchClients,
  filterByStatus,
  resolveClient,
  mergeUpsert,
  archiveClient,
  bootstrapFromNames,
  clientVaultNote,
} = require('./lib/clients.cjs');

const SWEEP_WINDOW_DAYS = 14;
const EXCERPT_CHARS = 2000;
const BATCH_SIZE = 10;

const DEFAULT_CONFIG = {
  vaultPath: '~/ghostbrain/vault',
  brand: {
    businessName: '',
    logoDataUri: '',
    accentColor: '#C5FF3D',
    contactLine: '',
    paymentTerms: '50% upfront, balance on delivery',
    validityDays: 14,
  },
  rates: { currency: 'EUR', default: 0, named: [] },
  invoicing: { prefix: 'INV', vatRate: 0, netDays: 14, yearReset: true },
};

const WORK_ITEMS_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          client: { type: 'string' },
          ask: { type: 'string' },
          sourceNote: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['title', 'client', 'ask', 'sourceNote', 'confidence'],
      },
    },
  },
  required: ['items'],
};

const QUOTE_DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    client: { type: 'string' },
    project: { type: 'string' },
    scopeSummary: { type: 'string' },
    lineItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          hours: { type: 'number' },
          rate: { type: 'string' },
        },
        required: ['description', 'hours', 'rate'],
      },
    },
    assumptions: { type: 'array', items: { type: 'string' } },
  },
  required: ['client', 'project', 'scopeSummary', 'lineItems', 'assumptions'],
};

function expandHome(p) {
  return p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p;
}

function deepMerge(base, over) {
  if (over === undefined || over === null) return base;
  if (typeof base !== 'object' || Array.isArray(base) || base === null) return over;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = deepMerge(base[k], over[k]);
  return out;
}

async function renderPdfElectron(html) {
  const { BrowserWindow } = require('electron');
  const win = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true, javascript: false },
  });
  try {
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    return await win.webContents.printToPDF({ pageSize: 'A4', printBackground: true });
  } finally {
    win.destroy();
  }
}

/** Exported for tests: build the handler map from a ctx + injectable deps. */
function createHandlers(ctx, deps = {}) {
  const renderPdf = deps.renderPdf ?? renderPdfElectron;
  const now = deps.now ?? (() => new Date());
  const cachePath = path.join(ctx.dataDir, 'work-items.json');
  const clientsPath = path.join(ctx.dataDir, 'clients.json');

  const config = () => deepMerge(DEFAULT_CONFIG, ctx.settings.get('config') ?? {});
  const vaultDir = () => expandHome(config().vaultPath);
  const quotesDir = () => path.join(vaultDir(), '30-cross-context', 'quotes');
  const clientsVaultDir = () => path.join(vaultDir(), '30-cross-context', 'clients');
  const counterPath = path.join(ctx.dataDir, 'counter.json');
  const invoicesDir = () => path.join(vaultDir(), '30-cross-context', 'invoices');

  async function readCounter() {
    const { invoicing } = config();
    try {
      return JSON.parse(await fsp.readFile(counterPath, 'utf-8'));
    } catch {
      return { prefix: invoicing.prefix, year: now().getFullYear(), next: 1, yearReset: invoicing.yearReset };
    }
  }
  async function writeCounter(c) {
    await fsp.mkdir(ctx.dataDir, { recursive: true });
    const tmp = `${counterPath}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(c, null, 2));
    await fsp.rename(tmp, counterPath);
  }
  function fmtDate(d) { return d.toISOString().slice(0, 10); }

  async function readCache() {
    try {
      return JSON.parse(await fsp.readFile(cachePath, 'utf-8'));
    } catch {
      return { seen: {}, items: [], dismissed: [] };
    }
  }
  async function writeCache(cache) {
    await fsp.mkdir(ctx.dataDir, { recursive: true });
    await fsp.writeFile(cachePath, JSON.stringify(cache, null, 2));
  }

  async function readClients() {
    try {
      const raw = JSON.parse(await fsp.readFile(clientsPath, 'utf-8'));
      if (!raw || !Array.isArray(raw.clients)) return emptyStore();
      return { version: 1, clients: raw.clients };
    } catch {
      return emptyStore();
    }
  }
  async function writeClients(store) {
    await fsp.mkdir(ctx.dataDir, { recursive: true });
    const tmp = `${clientsPath}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(store, null, 2));
    await fsp.rename(tmp, clientsPath);
  }

  /** Best-effort vault card mirror; never fails the CRM write. */
  async function mirrorClientNote(client) {
    try {
      const dir = clientsVaultDir();
      await fsp.mkdir(dir, { recursive: true });
      const { basename, markdown } = clientVaultNote(client);
      await fsp.writeFile(path.join(dir, `${basename}.md`), markdown);
    } catch (err) {
      ctx.log('client vault mirror failed:', err.message);
    }
  }

  async function findClient(id) {
    const store = await readClients();
    return store.clients.find((c) => c.id === id) ?? null;
  }

  async function walkMd(dir, out) {
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      return; // missing dir is fine
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walkMd(full, out);
      else if (e.isFile() && e.name.endsWith('.md')) out.push(full);
    }
  }

  async function candidateNotes() {
    const vault = vaultDir();
    const files = [];
    for (const sub of ['00-inbox', '20-contexts']) await walkMd(path.join(vault, sub), files);
    const cutoff = now().getTime() - SWEEP_WINDOW_DAYS * 86400000;
    const withStat = [];
    for (const f of files) {
      const st = await fsp.stat(f).catch(() => null);
      if (st && st.mtimeMs >= cutoff) {
        withStat.push({ path: f, rel: path.relative(vault, f), mtimeMs: st.mtimeMs, modified: st.mtime.toISOString() });
      }
    }
    return withStat.sort((a, b) => b.mtimeMs - a.mtimeMs);
  }

  async function llmJson(prompt, schema) {
    const call = async (p) => {
      const res = await ctx.api.fetch('POST', '/v1/llm/run', {
        prompt: p,
        system:
          'You extract structured data for a freelancing tool. Respond with STRICT JSON matching the requested shape. No prose.',
        jsonSchema: schema,
      });
      if (!res.ok) throw new Error(`llm call failed: ${res.error}`);
      if (res.data.error) throw new Error(`llm error: ${res.data.error}`);
      if (res.data.structured) return res.data.structured;
      return parseStrictJson(res.data.text);
    };
    try {
      return await call(prompt);
    } catch (err) {
      // one repair retry with the parse error appended
      ctx.log('llm json retry:', err.message);
      return call(`${prompt}\n\nYour previous reply was not valid JSON (${err.message}). Reply with ONLY the JSON object.`);
    }
  }

  async function extractItems(notes) {
    const blocks = notes
      .map((n) => `--- note: ${n.rel} ---\n${n.excerpt}`)
      .join('\n\n');
    const out = await llmJson(
      `Below are recent notes from a personal knowledge vault (emails, chat threads, meeting notes).
Find INCOMING WORK REQUESTS a freelancer could quote: someone asking for work to be done, a project inquiry, a "can you build/fix/design X" ask.
Ignore: the vault owner's own todos, newsletters, receipts, status updates, anything already quoted.
For each request return title (short), client (person/company asking), ask (1-2 sentence summary of the work), sourceNote (the exact note path shown above), confidence (0-1).
Return {"items": [...]}. Empty array if none.

${blocks}`,
      WORK_ITEMS_SCHEMA,
    );
    return (out.items ?? [])
      .filter((i) => i && i.title && i.ask && i.sourceNote)
      .map((i) => ({
        id: itemId(i.sourceNote, i.title),
        title: String(i.title),
        client: String(i.client ?? 'unknown'),
        ask: String(i.ask),
        sourceNote: String(i.sourceNote),
        confidence: Math.max(0, Math.min(1, Number(i.confidence) || 0)),
        foundAt: now().toISOString(),
      }));
  }

  // serialize so concurrent generates can't mint the same invoice number
  let generateChain = Promise.resolve();
  const serialized = (fn) => (...args) => {
    const run = generateChain.then(() => fn(...args));
    generateChain = run.catch(() => {});
    return run;
  };

  async function rewriteStatus(dir, file, status, table, extraFields = {}) {
    if (typeof file !== 'string' || file !== path.basename(file) || !file.endsWith('.md')) {
      throw new Error('file must be a note basename');
    }
    const full = path.join(dir, file);
    const text = await fsp.readFile(full, 'utf-8');
    const from = parseFrontmatter(text).fields.status || 'draft';
    assertTransition(table, from, status);
    let next = setFrontmatterField(text, 'status', status);
    for (const [k, v] of Object.entries(extraFields)) next = setFrontmatterField(next, k, v);
    const tmp = `${full}.tmp`;
    await fsp.writeFile(tmp, next);
    await fsp.rename(tmp, full);
    return { ok: true, status };
  }

  return {
    'quotes:set-status': async ({ file, status } = {}) => rewriteStatus(quotesDir(), file, status, QUOTE_TRANSITIONS),

    'quotes:sweep': async (opts = {}) => {
      const cache = await readCache();
      const notes = await candidateNotes();
      const fresh = notes.filter((n) => opts.force || cache.seen[n.rel] !== n.mtimeMs);

      const scannedMtimes = {};
      const found = [];
      for (let i = 0; i < fresh.length; i += BATCH_SIZE) {
        const batch = fresh.slice(i, i + BATCH_SIZE);
        for (const n of batch) {
          n.excerpt = (await fsp.readFile(n.path, 'utf-8').catch(() => '')).slice(0, EXCERPT_CHARS);
          scannedMtimes[n.rel] = n.mtimeMs;
        }
        ctx.ipc.send('quotes:sweep-progress', { done: Math.min(i + BATCH_SIZE, fresh.length), total: fresh.length });
        if (batch.length) found.push(...(await extractItems(batch)));
      }

      const next = mergeSweep(cache, { items: found, scannedMtimes });
      await writeCache(next);
      return { items: next.items, sweptAt: now().toISOString(), scanned: fresh.length };
    },

    'quotes:dismiss': async (id) => {
      if (typeof id !== 'string' || !id) throw new Error('dismiss needs an item id');
      const cache = await readCache();
      if (!cache.dismissed.includes(id)) cache.dismissed.push(id);
      cache.items = cache.items.filter((i) => i.id !== id);
      await writeCache(cache);
      return { ok: true };
    },

    'quotes:recent-notes': async () => {
      const notes = await candidateNotes();
      const out = [];
      for (const n of notes.slice(0, 50)) {
        const head = (await fsp.readFile(n.path, 'utf-8').catch(() => '')).slice(0, 400);
        const title = head.match(/^#\s+(.+)$/m)?.[1] ?? path.basename(n.rel, '.md');
        out.push({ path: n.rel, title, modified: n.modified });
      }
      return out;
    },

    'quotes:manual': async (notePath) => {
      if (typeof notePath !== 'string' || !notePath) throw new Error('manual needs a note path');
      const full = path.join(vaultDir(), notePath);
      if (!path.resolve(full).startsWith(path.resolve(vaultDir()))) throw new Error('note path escapes the vault');
      await fsp.access(full);
      const title = path.basename(notePath, '.md');
      return {
        id: itemId(notePath, title),
        title,
        client: 'unknown',
        ask: 'manually selected note',
        sourceNote: notePath,
        confidence: 1,
        foundAt: now().toISOString(),
      };
    },

    'quotes:draft': async (ref = {}) => {
      let sourceNote = ref.notePath;
      if (ref.itemId) {
        const cache = await readCache();
        const item = cache.items.find((i) => i.id === ref.itemId);
        if (!item) throw new Error(`unknown work item: ${ref.itemId}`);
        sourceNote = item.sourceNote;
      }
      if (!sourceNote) throw new Error('draft needs an itemId or notePath');
      const full = path.join(vaultDir(), sourceNote);
      const content = (await fsp.readFile(full, 'utf-8')).slice(0, 8000);
      const { rates } = config();
      const rateNames = ['default', ...rates.named.map((r) => r.name)];
      const draft = await llmJson(
        `A freelancer needs a quote draft for the work request in this note.

--- note: ${sourceNote} ---
${content}
---

Rate names available (pick the best fit per line item): ${rateNames.join(', ')}.
Break the work into 2-8 concrete line items with realistic hour estimates.
Return {"client", "project", "scopeSummary", "lineItems": [{"description", "hours", "rate"}], "assumptions": [...]}.`,
        QUOTE_DRAFT_SCHEMA,
      );
      const store = await readClients();
      const { client: matched } = resolveClient(store.clients, draft.client);
      return {
        ...draft,
        sourceNote,
        clientId: matched?.id,
      };
    },

    'quotes:generate': async (quote) => {
      if (!quote || typeof quote !== 'object') throw new Error('generate needs a quote');
      if (!quote.client || !Array.isArray(quote.lineItems) || quote.lineItems.length === 0) {
        throw new Error('quote needs a client and at least one line item');
      }
      const { brand, rates: baseRates } = config();
      let client = null;
      if (quote.clientId) {
        client = await findClient(quote.clientId);
        if (!client) throw new Error(`unknown client: ${quote.clientId}`);
      } else {
        const store = await readClients();
        client = resolveClient(store.clients, quote.client).client;
      }
      const rates = {
        ...baseRates,
        currency: client?.defaults?.currency || baseRates.currency,
      };
      if (client && !quote.clientId) quote = { ...quote, clientId: client.id };
      const html = renderQuoteHtml(quote, brand, rates, client || undefined);
      const pdf = await renderPdf(html);

      const dir = quotesDir();
      await fsp.mkdir(dir, { recursive: true });
      const nameForFile = client?.name || quote.client;
      let base = quoteBasename(nameForFile, now());
      for (let n = 2; ; n++) {
        try {
          await fsp.access(path.join(dir, `${base}.md`));
          base = `${quoteBasename(nameForFile, now())}-${n}`;
        } catch {
          break;
        }
      }
      const notePath = path.join(dir, `${base}.md`);
      const pdfPath = path.join(dir, `${base}.pdf`);
      await fsp.writeFile(pdfPath, pdf);
      await fsp.writeFile(notePath, quoteMarkdown(quote, brand, rates, client || undefined));
      ctx.log('quote generated:', pdfPath);
      return { pdfPath, notePath, clientId: quote.clientId || client?.id || null };
    },

    'quotes:list': async () => {
      let files;
      try {
        files = await fsp.readdir(quotesDir());
      } catch {
        return [];
      }
      const out = [];
      for (const f of files.filter((f) => f.endsWith('.md')).sort().reverse()) {
        const text = await fsp.readFile(path.join(quotesDir(), f), 'utf-8').catch(() => '');
        const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
        const get = (k) => fm.match(new RegExp(`^${k}: "?(.*?)"?$`, 'm'))?.[1] ?? '';
        out.push({
          file: f,
          client: get('client'),
          clientId: get('clientId') || null,
          project: get('project'),
          total: Number(get('total')) || 0,
          currency: get('currency'),
          generated: get('generated'),
          pdf: files.includes(f.replace(/\.md$/, '.pdf')),
          status: get('status') || 'draft',
          invoiced: get('invoiced') === 'true',
        });
      }
      return out;
    },

    /* ---------- invoices ---------- */

    'invoices:counter': async () => readCounter(),

    'invoices:set-counter': async ({ next } = {}) => {
      const n = Number(next);
      if (!Number.isInteger(n) || n < 1) throw new Error('next must be a positive integer');
      const c = await readCounter();
      await writeCounter({ ...c, next: n });
      return { ok: true };
    },

    'invoices:draft': async (from = {}) => {
      const { invoicing, rates } = config();
      const counter = await readCounter();
      const number = currentNumber(counter, now().getFullYear());
      const issued = fmtDate(now());
      const due = fmtDate(new Date(now().getTime() + (Number(invoicing.netDays) || 14) * 86400000));
      let base = { number, issued, due, client: '', lineItems: [], vatRate: invoicing.vatRate ?? 0, currency: rates.currency };

      if (from.quoteFile) {
        if (from.quoteFile !== path.basename(from.quoteFile)) throw new Error('quoteFile must be a basename');
        const text = await fsp.readFile(path.join(quotesDir(), from.quoteFile), 'utf-8');
        const { fields } = parseFrontmatter(text);
        const data = parseDataComment(text);
        const store = await readClients();
        const client = fields.clientId ? store.clients.find((c) => c.id === fields.clientId) : resolveClient(store.clients, fields.client).client;
        base = {
          ...base,
          client: fields.client, clientId: client?.id, project: fields.project, quoteRef: from.quoteFile,
          lineItems: data?.lineItems ?? [],
          vatRate: resolveVatRate({ clientVat: client?.defaults?.vatRate, settingsVat: invoicing.vatRate }),
          currency: client?.defaults?.currency || rates.currency,
        };
      } else if (from.clientId) {
        const client = await findClient(from.clientId);
        if (!client) throw new Error(`unknown client: ${from.clientId}`);
        base = {
          ...base, client: client.name, clientId: client.id,
          vatRate: resolveVatRate({ clientVat: client.defaults?.vatRate, settingsVat: invoicing.vatRate }),
          currency: client.defaults?.currency || rates.currency,
        };
      }
      return base;
    },

    'invoices:generate': serialized(async (invoice) => {
      if (!invoice || typeof invoice !== 'object') throw new Error('generate needs an invoice');
      if (!invoice.client || !Array.isArray(invoice.lineItems) || invoice.lineItems.length === 0) {
        throw new Error('invoice needs a client and at least one line item');
      }
      const { brand, rates: baseRates, invoicing } = config();
      let client = null;
      if (invoice.clientId) {
        client = await findClient(invoice.clientId);
        if (!client) throw new Error(`unknown client: ${invoice.clientId}`);
      } else {
        const store = await readClients();
        client = resolveClient(store.clients, invoice.client).client;
      }
      const rates = { ...baseRates, currency: invoice.currency || client?.defaults?.currency || baseRates.currency };
      const counter = await readCounter();
      const year = now().getFullYear();
      const inv = {
        ...invoice,
        number: currentNumber(counter, year),
        issued: invoice.issued || fmtDate(now()),
        due: invoice.due || fmtDate(new Date(now().getTime() + (Number(invoicing.netDays) || 14) * 86400000)),
        vatRate: resolveVatRate({ invoiceVat: invoice.vatRate, clientVat: client?.defaults?.vatRate, settingsVat: invoicing.vatRate }),
      };
      const html = renderInvoiceHtml(inv, brand, rates, client || undefined);
      const pdf = await renderPdf(html);

      const dir = invoicesDir();
      await fsp.mkdir(dir, { recursive: true });
      let c = counter;
      let base = invoiceBasename(client?.name || inv.client, inv.number);
      for (;;) {
        try {
          await fsp.access(path.join(dir, `${base}.md`));
          c = advanceCounter(c, year);
          inv.number = currentNumber(c, year);
          base = invoiceBasename(client?.name || inv.client, inv.number);
        } catch {
          break;
        }
      }
      await fsp.writeFile(path.join(dir, `${base}.pdf`), pdf);
      await fsp.writeFile(path.join(dir, `${base}.md`), invoiceMarkdown(inv, brand, rates, client || undefined));
      await writeCounter(advanceCounter(c, year));

      if (inv.quoteRef) {
        try {
          const qFull = path.join(quotesDir(), inv.quoteRef);
          const qText = await fsp.readFile(qFull, 'utf-8');
          const next = setFrontmatterField(qText, 'invoiced', 'true');
          const tmp = `${qFull}.tmp`;
          await fsp.writeFile(tmp, next);
          await fsp.rename(tmp, qFull);
        } catch (err) {
          ctx.log('quote invoiced-stamp failed:', err.message);
        }
      }
      ctx.log('invoice generated:', path.join(dir, `${base}.pdf`));
      return { pdfPath: path.join(dir, `${base}.pdf`), notePath: path.join(dir, `${base}.md`), number: inv.number };
    }),

    'invoices:list': async () => {
      let files;
      try {
        files = await fsp.readdir(invoicesDir());
      } catch {
        return [];
      }
      const out = [];
      const today = now();
      for (const f of files.filter((x) => x.endsWith('.md')).sort().reverse()) {
        const text = await fsp.readFile(path.join(invoicesDir(), f), 'utf-8').catch(() => '');
        const { fields } = parseFrontmatter(text);
        const status = fields.status || 'draft';
        const doc = { status, due: fields.due };
        const overdue = isOverdue(doc, today);
        out.push({
          file: f,
          number: fields.number ?? '',
          client: fields.client ?? '',
          clientId: fields.clientId || null,
          project: fields.project ?? '',
          quoteRef: fields.quoteRef || null,
          total: Number(fields.total) || 0,
          currency: fields.currency ?? '',
          issued: fields.issued ?? '',
          due: fields.due ?? '',
          status,
          paidAt: fields.paidAt || null,
          overdue,
          daysOverdue: overdue ? Math.floor((today.getTime() - new Date(fields.due).getTime()) / 86400000) : 0,
          pdf: files.includes(f.replace(/\.md$/, '.pdf')),
        });
      }
      return out;
    },

    'invoices:set-status': async ({ file, status } = {}) => {
      const extra = status === 'paid' ? { paidAt: now().toISOString() } : {};
      return rewriteStatus(invoicesDir(), file, status, INVOICE_TRANSITIONS, extra);
    },

    /* ---------- clients CRM ---------- */

    'clients:list': async (opts = {}) => {
      const store = await readClients();
      let list = filterByStatus(store.clients, opts.status ?? 'all');
      if (opts.q) list = matchClients(list, opts.q);
      return list.sort((a, b) => a.name.localeCompare(b.name));
    },

    'clients:get': async (id) => {
      if (typeof id !== 'string' || !id) throw new Error('get needs a client id');
      const client = await findClient(id);
      if (!client) throw new Error(`unknown client: ${id}`);
      return client;
    },

    'clients:upsert': async (payload) => {
      const store = await readClients();
      const { store: next, client } = mergeUpsert(store, payload, now);
      await writeClients(next);
      await mirrorClientNote(client);
      return client;
    },

    'clients:archive': async (id) => {
      if (typeof id !== 'string' || !id) throw new Error('archive needs a client id');
      const store = await readClients();
      const next = archiveClient(store, id);
      await writeClients(next);
      const client = next.clients.find((c) => c.id === id);
      if (client) await mirrorClientNote(client);
      return { ok: true };
    },

    'clients:resolve': async (name) => {
      if (typeof name !== 'string') throw new Error('resolve needs a name string');
      const store = await readClients();
      return resolveClient(store.clients, name);
    },

    'clients:bootstrap': async () => {
      const store = await readClients();
      const names = [];
      // from existing quotes
      try {
        const files = await fsp.readdir(quotesDir());
        for (const f of files.filter((x) => x.endsWith('.md'))) {
          const text = await fsp.readFile(path.join(quotesDir(), f), 'utf-8').catch(() => '');
          const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
          const client = fm.match(/^client: "?(.*?)"?$/m)?.[1];
          if (client) names.push(client);
        }
      } catch {
        /* no quotes dir yet */
      }
      // from open work items
      const cache = await readCache();
      for (const item of cache.items ?? []) {
        if (item.client) names.push(item.client);
      }
      const { store: next, created } = bootstrapFromNames(store, names, now);
      await writeClients(next);
      for (const c of next.clients) {
        if ((c.tags ?? []).includes('bootstrap')) await mirrorClientNote(c);
      }
      return { created, linked: names.length };
    },
  };
}

let active = null;

module.exports = {
  activate(ctx) {
    const handlers = createHandlers(ctx);
    for (const [channel, fn] of Object.entries(handlers)) ctx.ipc.handle(channel, fn);
    active = ctx;
    ctx.log('freelancer activated');
  },
  deactivate() {
    active = null; // no timers; PDF windows are destroyed per-call in finally
  },
  createHandlers, // exported for tests
};
