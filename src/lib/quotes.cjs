// Pure quote logic: rate math, sweep cache, strict-JSON parsing, naming.
// CommonJS so both main.cjs (bundled) and node --test can require it.

const { createHash } = require('node:crypto');
const { computeTotals, formatMoney } = require('./money.cjs');

/**
 * Merge a sweep result into the cache. Dismissed ids never resurface; existing
 * items keep their first-seen entry; seen mtimes accumulate (drive incremental sweeps).
 */
function mergeSweep(cache, { items, scannedMtimes }) {
  const dismissed = new Set(cache.dismissed ?? []);
  const byId = new Map((cache.items ?? []).map((i) => [i.id, i]));
  for (const item of items ?? []) {
    if (!dismissed.has(item.id) && !byId.has(item.id)) byId.set(item.id, item);
  }
  return {
    seen: { ...(cache.seen ?? {}), ...(scannedMtimes ?? {}) },
    items: [...byId.values()].filter((i) => !dismissed.has(i.id)),
    dismissed: [...dismissed],
  };
}

function itemId(sourceNote, title) {
  return createHash('sha1').update(`${sourceNote}\n${title}`).digest('hex').slice(0, 12);
}

/** Parse model output that must be JSON; tolerate ``` fences; throw with context. */
function parseStrictJson(text) {
  let t = String(text ?? '').trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) t = fence[1];
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`expected JSON object, got: ${t.slice(0, 120)}`);
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch (err) {
    throw new Error(`invalid JSON (${err.message}): ${t.slice(0, 120)}`);
  }
}

function slug(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'client';
}

function quoteBasename(client, date) {
  const d = date instanceof Date ? date : new Date(date);
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `quote-${slug(client)}-${ymd}`;
}

module.exports = { computeTotals, formatMoney, mergeSweep, itemId, parseStrictJson, slug, quoteBasename };
