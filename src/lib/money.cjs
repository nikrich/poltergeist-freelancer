// Browser-safe rate math (no node builtins) — shared by renderer and main.

/** Resolve each line item's rate name against the rate card; bad hours count 0. */
function computeTotals(lineItems, rates) {
  const named = new Map((rates.named ?? []).map((r) => [r.name, r.hourly]));
  const rows = (lineItems ?? []).map((li) => {
    const hourly = named.get(li.rate) ?? rates.default ?? 0;
    const hours = Number.isFinite(Number(li.hours)) ? Number(li.hours) : 0;
    return {
      description: String(li.description ?? ''),
      hours,
      rateName: named.has(li.rate) ? li.rate : 'default',
      hourly,
      amount: Math.round(hours * hourly * 100) / 100,
    };
  });
  const total = Math.round(rows.reduce((s, r) => s + r.amount, 0) * 100) / 100;
  return { rows, total };
}

function formatMoney(n, currency) {
  try {
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

module.exports = { computeTotals, formatMoney };
