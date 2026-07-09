// Settings tab: branding, rates, vault path. Moved from renderer.jsx verbatim
// (pre-redesign); imports now come from the shared kit.

import { useState } from 'react';
import { Panel, ErrorBanner, btnStyle, inputStyle } from '../kit.jsx';

export function SettingsTab({ api, s, config, setConfig }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const brand = config.brand;
  const rates = config.rates;

  const save = async (next) => {
    setConfig(next);
    setSaved(false);
    try {
      await api.settings.set('config', next);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError(e.message);
    }
  };
  const upBrand = (patch) => save({ ...config, brand: { ...brand, ...patch } });
  const upRates = (patch) => save({ ...config, rates: { ...rates, ...patch } });

  const pickLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => upBrand({ logoDataUri: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const field = (label, value, onChange, extra = {}) => (
    <label style={{ fontSize: 11, color: s.ink2, display: 'block', marginBottom: 8 }}>
      {label}
      <input style={inputStyle(s)} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...extra} />
    </label>
  );

  return (
    <>
      <Panel title="branding" s={s} action={saved && <span style={{ fontSize: 11, color: s.moss }}>saved</span>}>
        <ErrorBanner error={error} s={s} />
        {field('business name', brand.businessName, (v) => upBrand({ businessName: v }))}
        {field('contact line', brand.contactLine, (v) => upBrand({ contactLine: v }))}
        {field('accent color', brand.accentColor, (v) => upBrand({ accentColor: v }))}
        {field('payment terms', brand.paymentTerms, (v) => upBrand({ paymentTerms: v }))}
        {field('quote validity (days)', brand.validityDays, (v) => upBrand({ validityDays: Number(v) || 14 }), { type: 'number' })}
        <label style={{ fontSize: 11, color: s.ink2, display: 'block' }}>
          logo
          <input type="file" accept="image/*" onChange={pickLogo} style={{ display: 'block', marginTop: 4, color: s.ink1, fontSize: 11 }} />
        </label>
        {brand.logoDataUri && <img src={brand.logoDataUri} alt="logo" style={{ height: 36, marginTop: 8 }} />}
      </Panel>

      <Panel title="rates" s={s}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {field('currency', rates.currency, (v) => upRates({ currency: v.toUpperCase().slice(0, 3) }))}
          {field('default hourly rate', rates.default, (v) => upRates({ default: Number(v) || 0 }), { type: 'number' })}
        </div>
        {rates.named.map((r, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input style={{ ...inputStyle(s), flex: 2 }} placeholder="name (e.g. development)" value={r.name} onChange={(e) => upRates({ named: rates.named.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)) })} />
            <input style={{ ...inputStyle(s), flex: 1 }} type="number" value={r.hourly} onChange={(e) => upRates({ named: rates.named.map((x, i) => (i === idx ? { ...x, hourly: Number(e.target.value) || 0 } : x)) })} />
            <button style={btnStyle(s, false)} onClick={() => upRates({ named: rates.named.filter((_, i) => i !== idx) })}>✕</button>
          </div>
        ))}
        <button style={btnStyle(s, false)} onClick={() => upRates({ named: [...rates.named, { name: '', hourly: 0 }] })}>+ named rate</button>
      </Panel>

      <Panel title="vault" s={s}>
        {field('vault path', config.vaultPath, (v) => save({ ...config, vaultPath: v }))}
      </Panel>
    </>
  );
}
