// Real printToPDF smoke — run with an electron binary, not plain node:
//   npx electron test/pdf.electron.mjs   (or the host app's electron)
// Asserts the branded template renders to a real PDF buffer.

import { app, BrowserWindow } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { renderQuoteHtml } = require(resolve(fileURLToPath(import.meta.url), '../../src/lib/template.cjs'));

const html = renderQuoteHtml(
  {
    client: 'ACME GmbH',
    project: 'Booking portal',
    scopeSummary: 'Build a small booking portal',
    lineItems: [{ description: 'backend', hours: 20, rate: 'development' }],
    assumptions: ['hosting provided'],
  },
  { businessName: 'Richter Digital', logoDataUri: '', accentColor: '#C5FF3D', contactLine: 'x@y.z', paymentTerms: 'net 14', validityDays: 14 },
  { currency: 'EUR', default: 80, named: [{ name: 'development', hourly: 95 }] },
);

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true, javascript: false } });
  try {
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const pdf = await win.webContents.printToPDF({ pageSize: 'A4', printBackground: true });
    if (!pdf.subarray(0, 4).toString().startsWith('%PDF')) throw new Error('not a PDF');
    if (pdf.length < 5000) throw new Error(`suspiciously small PDF: ${pdf.length}B`);
    console.log(`PDF OK: ${pdf.length} bytes`);
    app.exit(0);
  } catch (err) {
    console.error('PDF smoke failed:', err.message);
    app.exit(1);
  }
});
