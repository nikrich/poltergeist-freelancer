// Invoices tab — placeholder. Invoice list + quote-to-invoice conversion
// (using pendingInvoiceDraft) lands in a later task.

import { Panel } from '../kit.jsx';

export function InvoicesTab({ s }) {
  return (
    <Panel title="invoices" s={s}>
      <div style={{ fontSize: 12, color: s.ink2 }}>coming in the next task.</div>
    </Panel>
  );
}
