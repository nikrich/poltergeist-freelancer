// Lifecycle state for vault documents: tolerant frontmatter read, surgical
// single-field rewrite, and the status transition tables from the spec.

const FM_RE = /^---\n([\s\S]*?)\n---/;

function parseFrontmatter(text) {
  const m = String(text ?? '').match(FM_RE);
  const fields = {};
  if (m) {
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^(\w[\w-]*):\s*"?(.*?)"?\s*$/);
      if (kv) fields[kv[1]] = kv[2];
    }
  }
  return { fields, body: m ? text.slice(m[0].length) : String(text ?? '') };
}

function setFrontmatterField(text, key, value) {
  const m = String(text ?? '').match(FM_RE);
  if (!m) throw new Error('note has no frontmatter block');
  const lines = m[1].split('\n');
  const idx = lines.findIndex((l) => l.startsWith(`${key}:`));
  if (idx >= 0) lines[idx] = `${key}: ${value}`;
  else lines.push(`${key}: ${value}`);
  return `---\n${lines.join('\n')}\n---` + text.slice(m[0].length);
}

const QUOTE_TRANSITIONS = { draft: ['sent'], sent: ['accepted', 'declined'], declined: ['sent'], accepted: [] };
const INVOICE_TRANSITIONS = { draft: ['sent'], sent: ['paid'], paid: [] };

function assertTransition(table, from, to) {
  if (!table[from] || !table[from].includes(to)) {
    throw new Error(`invalid transition: ${from} -> ${to}`);
  }
}

function isOverdue(doc, today) {
  if (doc.status !== 'sent' || !doc.due) return false;
  return doc.due < today.toISOString().slice(0, 10);
}

module.exports = { parseFrontmatter, setFrontmatterField, QUOTE_TRANSITIONS, INVOICE_TRANSITIONS, assertTransition, isOverdue };
