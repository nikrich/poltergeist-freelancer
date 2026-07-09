// Pure invoice logic: sequential numbering, VAT-on-top totals, filenames,
// and the machine-readable data comment that carries line items in notes.

const { computeTotals } = require('./money.cjs');
const { slug } = require('./quotes.cjs');

function pad3(n) {
  return String(n).padStart(3, '0');
}

function effectiveCounter(counter, nowYear) {
  if (counter.yearReset && nowYear !== counter.year) {
    return { ...counter, year: nowYear, next: 1 };
  }
  return counter;
}

function formatInvoiceNumber({ prefix, year, next }) {
  return `${prefix}-${year}-${pad3(next)}`;
}

function currentNumber(counter, nowYear) {
  return formatInvoiceNumber(effectiveCounter(counter, nowYear));
}

function advanceCounter(counter, nowYear) {
  const eff = effectiveCounter(counter, nowYear);
  return { ...eff, next: eff.next + 1 };
}

function computeInvoiceTotals(lineItems, rates, vatRate) {
  const { rows, total: subtotal } = computeTotals(lineItems, rates);
  const rate = Number.isFinite(Number(vatRate)) ? Number(vatRate) : 0;
  const vatAmount = Math.round(subtotal * (rate / 100) * 100) / 100;
  const total = Math.round((subtotal + vatAmount) * 100) / 100;
  return { rows, subtotal, vatRate: rate, vatAmount, total };
}

function invoiceBasename(client, number) {
  return `invoice-${slug(client)}-${number}`;
}

const DATA_RE = /<!-- freelancer:data (\{[\s\S]*?\}) -->/;

function dataComment(obj) {
  return `<!-- freelancer:data ${JSON.stringify(obj)} -->`;
}

function parseDataComment(text) {
  const m = String(text ?? '').match(DATA_RE);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

function resolveVatRate({ invoiceVat, clientVat, settingsVat } = {}) {
  for (const v of [invoiceVat, clientVat, settingsVat]) {
    if (v !== undefined && v !== null && Number.isFinite(Number(v))) return Number(v);
  }
  return 0;
}

module.exports = {
  formatInvoiceNumber, advanceCounter, currentNumber,
  computeInvoiceTotals, invoiceBasename, dataComment, parseDataComment, resolveVatRate,
};
