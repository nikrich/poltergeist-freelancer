var M=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var Q=M((un,mt)=>{function Wt(t,e){let s=new Map((e.named??[]).map(o=>[o.name,o.hourly])),r=(t??[]).map(o=>{let f=s.get(o.rate)??e.default??0,y=Number.isFinite(Number(o.hours))?Number(o.hours):0;return{description:String(o.description??""),hours:y,rateName:s.has(o.rate)?o.rate:"default",hourly:f,amount:Math.round(y*f*100)/100}}),l=Math.round(r.reduce((o,f)=>o+f.amount,0)*100)/100;return{rows:r,total:l}}function Vt(t,e){try{return new Intl.NumberFormat("en-IE",{style:"currency",currency:e}).format(t)}catch{return`${e} ${t.toFixed(2)}`}}mt.exports={computeTotals:Wt,formatMoney:Vt}});var U=M((dn,pt)=>{var{createHash:Ht}=require("node:crypto"),{computeTotals:Qt,formatMoney:Yt}=Q();function Kt(t,{items:e,scannedMtimes:s}){let r=new Set(t.dismissed??[]),l=new Map((t.items??[]).map(o=>[o.id,o]));for(let o of e??[])!r.has(o.id)&&!l.has(o.id)&&l.set(o.id,o);return{seen:{...t.seen??{},...s??{}},items:[...l.values()].filter(o=>!r.has(o.id)),dismissed:[...r]}}function Xt(t,e){return Ht("sha1").update(`${t}
${e}`).digest("hex").slice(0,12)}function Gt(t){let e=String(t??"").trim(),s=e.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);s&&(e=s[1]);let r=e.indexOf("{"),l=e.lastIndexOf("}");if(r===-1||l===-1)throw new Error(`expected JSON object, got: ${e.slice(0,120)}`);try{return JSON.parse(e.slice(r,l+1))}catch(o){throw new Error(`invalid JSON (${o.message}): ${e.slice(0,120)}`)}}function ft(t){return String(t??"").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").trim().replace(/[\s_]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"client"}function Zt(t,e){let s=e instanceof Date?e:new Date(e),r=`${s.getFullYear()}${String(s.getMonth()+1).padStart(2,"0")}${String(s.getDate()).padStart(2,"0")}`;return`quote-${ft(t)}-${r}`}pt.exports={computeTotals:Qt,formatMoney:Yt,mergeSweep:Kt,itemId:Xt,parseStrictJson:Gt,slug:ft,quoteBasename:Zt}});var K=M((mn,bt)=>{var{createHash:te,randomBytes:ht}=require("node:crypto"),{slug:wt}=U(),yt=new Set(["prospect","active","inactive","archived"]),ee=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;function P(){return{version:1,clients:[]}}function B(t){return String(t??"").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").trim().replace(/[\s_]+/g," ").replace(/\s+/g," ")}function Y(t){return t?te("sha1").update(String(t)).digest("hex").slice(0,12):ht(6).toString("hex")}function ne(t){return Y(t||ht(8).toString("hex"))}function F(t,e=500){if(t==null)return;let s=String(t).trim();if(s)return s.slice(0,e)}function gt(t,e){if(!t)return;let s=String(t).trim();if(s){if(!ee.test(s))throw new Error(`${e} is not a valid email: ${s}`);return s.slice(0,200)}}function re(t,e){if(!t||typeof t!="object")throw new Error(`contact ${e}: expected object`);let s=F(t.name,120);if(!s)throw new Error(`contact ${e}: name is required`);return{id:typeof t.id=="string"&&t.id?t.id:ne(`${s}-${e}`),name:s,email:gt(t.email,`contact ${e} email`),phone:F(t.phone,40),role:F(t.role,80),primary:!!t.primary}}function ae(t){if(!t||typeof t!="object")return{};let e=Array.isArray(t.addressLines)?t.addressLines.map(s=>F(s,120)).filter(Boolean).slice(0,4):void 0;return{email:gt(t.email,"billing email"),addressLines:e?.length?e:void 0,city:F(t.city,80),region:F(t.region,80),postalCode:F(t.postalCode,20),country:F(t.country,80),taxId:F(t.taxId,40)}}function se(t){if(!t||typeof t!="object")return{};let e=F(t.currency,3),s;if(t.vatRate!==void 0&&t.vatRate!==null&&String(t.vatRate).trim()!==""){let r=Number(t.vatRate);if(Number.isFinite(r)){if(r<0||r>100)throw new Error(`vatRate must be 0-100, got ${r}`);s=r}}return{currency:e?e.toUpperCase():void 0,rateName:F(t.rateName,60),paymentTerms:F(t.paymentTerms,200),vatRate:s}}function $t(t,{now:e=()=>new Date}={}){if(!t||typeof t!="object")throw new Error("client payload required");let s=F(t.name,120);if(!s)throw new Error("client name is required");let r=t.status??"prospect";if(!yt.has(r))throw new Error(`invalid status: ${r}`);let l=Array.isArray(t.contacts)?t.contacts.map((S,E)=>re(S,E)):[],o=!1;for(let S of l)S.primary&&(o?S.primary=!1:o=!0);l.length&&!o&&(l[0].primary=!0);let f=Array.isArray(t.tags)?[...new Set(t.tags.map(S=>F(S,40)).filter(Boolean))]:[],y=Array.isArray(t.sourceNotes)?[...new Set(t.sourceNotes.map(S=>F(S,500)).filter(Boolean))]:[],h=e().toISOString();return{id:typeof t.id=="string"&&/^[a-z0-9-]{6,32}$/i.test(t.id)?t.id:Y(`${s}
${h}`),name:s,legalName:F(t.legalName,160),status:r,tags:f,website:F(t.website,300),contacts:l,billing:ae(t.billing),defaults:se(t.defaults),notes:F(t.notes,8e3),sourceNotes:y,createdAt:typeof t.createdAt=="string"&&t.createdAt?t.createdAt:h,updatedAt:h}}function ie(t,e){let s=String(e??"").trim().toLowerCase();return s?(t??[]).filter(r=>[r.name,r.legalName,...r.tags??[],...(r.contacts??[]).flatMap(o=>[o.name,o.email]),r.billing?.email,r.billing?.taxId].filter(Boolean).join(" ").toLowerCase().includes(s)):[...t??[]]}function oe(t,e){return!e||e==="all"?(t??[]).filter(s=>s.status!=="archived"):(t??[]).filter(s=>s.status===e)}function ce(t,e){let s=t??[],r=B(e);if(!r)return{client:null,candidates:[]};let l=s.filter(f=>B(f.name)===r&&f.status!=="archived");if(l.length===1)return{client:l[0],candidates:l};if(l.length>1)return{client:null,candidates:l};let o=s.filter(f=>f.status!=="archived"&&B(f.name).includes(r));return o.length===1?{client:o[0],candidates:o}:{client:null,candidates:o}}function vt(t,e,s=()=>new Date){let l=[...(t?.clients?t:P()).clients??[]],o=$t(e,{now:s}),f=l.findIndex(y=>y.id===o.id);return f>=0?(o.createdAt=l[f].createdAt,l[f]=o):l.push(o),{store:{version:1,clients:l},client:o}}function le(t,e){let s=t?.clients?t:P(),r=(s.clients??[]).map(l=>l.id===e?{...l,status:"archived",updatedAt:new Date().toISOString()}:l);if(!(s.clients??[]).some(l=>l.id===e))throw new Error(`unknown client: ${e}`);return{version:1,clients:r}}function ue(t,e,s=()=>new Date){let r=t?.clients?{version:1,clients:[...t.clients]}:P(),l=0,o=new Set(r.clients.map(f=>B(f.name)));for(let f of e??[]){let y=F(f,120);if(!y)continue;let h=B(y);if(!h||h==="unknown"||o.has(h))continue;let{store:x,client:S}=vt(r,{name:y,status:"active",tags:["bootstrap"]},s);r=x,o.add(h),l+=1}return{store:r,created:l}}function de(t){let e=t?.contacts??[];return e.find(s=>s.primary)||e[0]||null}function me(t){let e=`client-${wt(t.name)}`,s=(t.contacts??[]).map(h=>`- ${[h.name,h.role,h.email,h.phone].filter(Boolean).join(" \xB7 ")}${h.primary?" (primary)":""}`).join(`
`),r=t.billing??{},l=[...r.addressLines??[],[r.city,r.postalCode].filter(Boolean).join(" "),r.region,r.country].filter(Boolean).join(`
`),o=(t.tags??[]).map(h=>JSON.stringify(h)).join(", "),f=h=>String(h??"").replace(/"/g,'\\"'),y=`---
type: client
id: "${t.id}"
name: "${f(t.name)}"
legalName: "${f(t.legalName??"")}"
status: ${t.status}
tags: [${o}]
taxId: "${f(r.taxId??"")}"
created: ${t.createdAt}
updated: ${t.updatedAt}
---

# ${t.name}

${t.legalName&&t.legalName!==t.name?`**Legal name:** ${t.legalName}
`:""}
${t.website?`**Website:** ${t.website}
`:""}

## Contacts

${s||"_none_"}

## Billing

${l||"_no address_"}
${r.email?`
Email: ${r.email}`:""}
${r.taxId?`
Tax ID: ${r.taxId}`:""}

## Notes

${t.notes??""}
`;return{basename:e,markdown:y}}bt.exports={STATUSES:yt,emptyStore:P,normalizeClientName:B,newId:Y,validateClient:$t,matchClients:ie,filterByStatus:oe,resolveClient:ce,mergeUpsert:vt,archiveClient:le,bootstrapFromNames:ue,primaryContact:de,clientVaultNote:me,slug:wt}});var X=M((fn,Nt)=>{var{computeTotals:fe}=Q(),{slug:pe}=U();function he(t){return String(t).padStart(3,"0")}function St(t,e){return t.yearReset&&e!==t.year?{...t,year:e,next:1}:t}function It({prefix:t,year:e,next:s}){return`${t}-${e}-${he(s)}`}function we(t,e){return It(St(t,e))}function ye(t,e){let s=St(t,e);return{...s,next:s.next+1}}function ge(t,e,s){let{rows:r,total:l}=fe(t,e),o=Number.isFinite(Number(s))?Number(s):0,f=Math.round(l*(o/100)*100)/100,y=Math.round((l+f)*100)/100;return{rows:r,subtotal:l,vatRate:o,vatAmount:f,total:y}}function $e(t,e){return`invoice-${pe(t)}-${e}`}var ve=/<!-- freelancer:data (\{[\s\S]*?\}) -->/;function be(t){return`<!-- freelancer:data ${JSON.stringify(t)} -->`}function Se(t){let e=String(t??"").match(ve);if(!e)return null;try{return JSON.parse(e[1])}catch{return null}}function Ie({invoiceVat:t,clientVat:e,settingsVat:s}={}){for(let r of[t,e,s])if(r!=null&&Number.isFinite(Number(r)))return Number(r);return 0}Nt.exports={formatInvoiceNumber:It,advanceCounter:ye,currentNumber:we,computeInvoiceTotals:ge,invoiceBasename:$e,dataComment:be,parseDataComment:Se,resolveVatRate:Ie}});var Et=M((pn,Ft)=>{var{computeTotals:xt,formatMoney:T}=U(),{primaryContact:Ne}=K(),{computeInvoiceTotals:jt,dataComment:Rt}=X();function b(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function G(t,e){let s=e?.legalName||e?.name||t.client,r=[`    <h2>${b(s)}</h2>`];e?.legalName&&e.name&&e.legalName!==e.name&&r.push(`    <div class="sub">${b(e.name)}</div>`);let l=Ne(e);if(l){let h=[l.name,l.role,l.email,l.phone].filter(Boolean).join(" \xB7 ");r.push(`    <div class="sub">${b(h)}</div>`)}let o=e?.billing??{};for(let h of o.addressLines??[])r.push(`    <div class="sub">${b(h)}</div>`);let y=[[o.postalCode,o.city].filter(Boolean).join(" "),o.region,o.country].filter(Boolean).join(", ");return y&&r.push(`    <div class="sub">${b(y)}</div>`),o.email&&(!l||l.email!==o.email)&&r.push(`    <div class="sub">${b(o.email)}</div>`),o.taxId&&r.push(`    <div class="sub">Tax ID: ${b(o.taxId)}</div>`),t.project&&r.push(`    <div style="margin-top:6px">${b(t.project)}</div>`),r.join(`
`)}function kt(t){return`
  * { box-sizing: border-box; margin: 0; }
  body { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1a1c20; font-size: 13px; line-height: 1.5; padding: 48px 56px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand img { height: 44px; }
  .brand .name { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
  .brand .contact { font-size: 11px; color: #6a6e78; }
  .doc { text-align: right; }
  .doc .title { font-size: 26px; font-weight: 700; color: ${t}; -webkit-print-color-adjust: exact; }
  .doc .meta { font-size: 11px; color: #6a6e78; }
  .block { margin-bottom: 28px; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #9a9ea8; margin-bottom: 4px; }
  h2 { font-size: 15px; font-weight: 600; }
  .sub { font-size: 12px; color: #4a4e58; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 4px; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #9a9ea8; text-align: left; padding: 8px 10px; border-bottom: 2px solid ${t}; }
  td { padding: 9px 10px; border-bottom: 1px solid #e7e9ee; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  th.num { text-align: right; }
  .total-row td { border-bottom: none; font-weight: 700; font-size: 15px; padding-top: 14px; }
  .total-row .amount { color: ${t}; -webkit-print-color-adjust: exact; }
  ul { padding-left: 18px; }
  li { margin-bottom: 3px; }
  footer { margin-top: 44px; padding-top: 16px; border-top: 1px solid #e7e9ee; font-size: 11px; color: #6a6e78; display: flex; justify-content: space-between; gap: 24px; }
`}function xe(t,e,s,r){let{rows:l,total:o}=xt(t.lineItems,s),f=/^#[0-9a-fA-F]{3,8}$/.test(e.accentColor??"")?e.accentColor:"#C5FF3D",y=I=>b(T(I,s.currency??"EUR")),h=new Date,x=new Date(h.getTime()+(Number(e.validityDays)||14)*864e5),S=I=>I.toISOString().slice(0,10),E=r?.defaults?.paymentTerms||e.paymentTerms||"",R=l.map(I=>`      <tr>
        <td>${b(I.description)}</td>
        <td class="num">${b(String(I.hours))}</td>
        <td class="num">${y(I.hourly)}</td>
        <td class="num">${y(I.amount)}</td>
      </tr>`).join(`
`),A=(t.assumptions??[]).map(I=>`      <li>${b(I)}</li>`).join(`
`);return`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${kt(f)}</style>
</head>
<body>
  <header>
    <div class="brand">
      ${e.logoDataUri?`<img src="${b(e.logoDataUri)}" alt="">`:""}
      <div>
        <div class="name">${b(e.businessName||"Quote")}</div>
        <div class="contact">${b(e.contactLine??"")}</div>
      </div>
    </div>
    <div class="doc">
      <div class="title">QUOTE</div>
      <div class="meta">date ${S(h)}<br>valid until ${S(x)}</div>
    </div>
  </header>

  <div class="block">
    <div class="label">prepared for</div>
${G(t,r)}
  </div>

  <div class="block">
    <div class="label">scope</div>
    <div>${b(t.scopeSummary??"")}</div>
  </div>

  <div class="block">
    <table>
      <thead><tr><th>item</th><th class="num">hours</th><th class="num">rate</th><th class="num">amount</th></tr></thead>
      <tbody>
${R}
        <tr class="total-row"><td colspan="3">total</td><td class="num amount">${y(o)}</td></tr>
      </tbody>
    </table>
  </div>

${A?`  <div class="block">
    <div class="label">assumptions</div>
    <ul>
${A}
    </ul>
  </div>
`:""}
  <footer>
    <span>${b(E)}</span>
    <span>${b(e.businessName??"")}</span>
  </footer>
</body>
</html>`}function je(t,e,s,r){let{rows:l,total:o}=xt(t.lineItems,s),f=s.currency??"EUR",y=r?.defaults?.paymentTerms||e.paymentTerms||"",h=r?.legalName||r?.name||t.client,x=l.map(R=>`| ${R.description.replace(/\|/g,"\\|")} | ${R.hours} | ${T(R.hourly,f)} | ${T(R.amount,f)} |`).join(`
`),S=R=>String(R??"").replace(/"/g,'\\"'),E=t.clientId||r?.id?`clientId: "${S(t.clientId||r?.id)}"
`:"";return`---
client: "${S(h)}"
${E}project: "${S(t.project)}"
total: ${o}
currency: ${f}
status: draft
source: "${S(t.sourceNote)}"
generated: ${new Date().toISOString()}
---

# Quote \u2014 ${h}

**Project:** ${t.project??""}

## Scope

${t.scopeSummary??""}

## Line items

| item | hours | rate | amount |
|------|-------|------|--------|
${x}

**Total: ${T(o,f)}**

## Assumptions

${(t.assumptions??[]).map(R=>`- ${R}`).join(`
`)}

## Terms

${y} \u2014 valid ${Number(e.validityDays)||14} days.

${Rt({lineItems:t.lineItems??[]})}
`}function Re(t,e,s,r){let{rows:l,subtotal:o,vatRate:f,vatAmount:y,total:h}=jt(t.lineItems,s,t.vatRate),x=/^#[0-9a-fA-F]{3,8}$/.test(e.accentColor??"")?e.accentColor:"#C5FF3D",S=I=>b(T(I,s.currency??"EUR")),E=r?.defaults?.paymentTerms||e.paymentTerms||"",R=l.map(I=>`      <tr>
        <td>${b(I.description)}</td>
        <td class="num">${b(String(I.hours))}</td>
        <td class="num">${S(I.hourly)}</td>
        <td class="num">${S(I.amount)}</td>
      </tr>`).join(`
`),A=f>0?`        <tr><td colspan="3" class="sub">vat ${b(String(f))}%</td><td class="num">${S(y)}</td></tr>
`:"";return`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${kt(x)}</style>
</head>
<body>
  <header>
    <div class="brand">
      ${e.logoDataUri?`<img src="${b(e.logoDataUri)}" alt="">`:""}
      <div>
        <div class="name">${b(e.businessName||"Invoice")}</div>
        <div class="contact">${b(e.contactLine??"")}</div>
      </div>
    </div>
    <div class="doc">
      <div class="title">INVOICE</div>
      <div class="meta">${b(t.number)}<br>issued ${b(t.issued)}<br>due ${b(t.due)}</div>
    </div>
  </header>

  <div class="block">
    <div class="label">billed to</div>
${G(t,r)}
  </div>

  <div class="block">
    <table>
      <thead><tr><th>item</th><th class="num">hours</th><th class="num">rate</th><th class="num">amount</th></tr></thead>
      <tbody>
${R}
        <tr><td colspan="3" class="sub">subtotal</td><td class="num">${S(o)}</td></tr>
${A}        <tr class="total-row"><td colspan="3">total due</td><td class="num amount">${S(h)}</td></tr>
      </tbody>
    </table>
  </div>

  <footer>
    <span>${b(E)}${E?" \xB7 ":""}payable to ${b(e.contactLine??e.businessName??"")}</span>
    <span>${b(t.number)}</span>
  </footer>
</body>
</html>`}function ke(t,e,s,r){let{rows:l,subtotal:o,vatRate:f,vatAmount:y,total:h}=jt(t.lineItems,s,t.vatRate),x=s.currency??"EUR",S=r?.legalName||r?.name||t.client,E=I=>String(I??"").replace(/"/g,'\\"'),R=(I,q)=>q?`${I}: "${E(q)}"
`:"",A=l.map(I=>`| ${I.description.replace(/\|/g,"\\|")} | ${I.hours} | ${T(I.hourly,x)} | ${T(I.amount,x)} |`).join(`
`);return`---
number: "${E(t.number)}"
client: "${E(S)}"
${R("clientId",t.clientId||r?.id)}${R("quoteRef",t.quoteRef)}${R("project",t.project)}issued: ${t.issued}
due: ${t.due}
subtotal: ${o}
vatRate: ${f}
vatAmount: ${y}
total: ${h}
currency: ${x}
status: draft
generated: ${new Date().toISOString()}
---

# Invoice ${t.number} \u2014 ${S}

| item | hours | rate | amount |
|------|-------|------|--------|
${A}

subtotal ${T(o,x)}${f>0?`
vat ${f}% ${T(y,x)}`:""}
**Total due: ${T(h,x)}** \u2014 due ${t.due}

${Rt({lineItems:t.lineItems??[]})}
`}Ft.exports={esc:b,billToHtml:G,renderQuoteHtml:xe,quoteMarkdown:je,renderInvoiceHtml:Re,invoiceMarkdown:ke}});var Ot=M((hn,Ct)=>{var At=/^---\n([\s\S]*?)\n---/;function Fe(t){let e=String(t??"").match(At),s={};if(e)for(let r of e[1].split(`
`)){let l=r.match(/^(\w[\w-]*):\s*"?(.*?)"?\s*$/);l&&(s[l[1]]=l[2])}return{fields:s,body:e?t.slice(e[0].length):String(t??"")}}function Ee(t,e,s){let r=String(t??"").match(At);if(!r)throw new Error("note has no frontmatter block");let l=r[1].split(`
`),o=l.findIndex(f=>f.startsWith(`${e}:`));return o>=0?l[o]=`${e}: ${s}`:l.push(`${e}: ${s}`),`---
${l.join(`
`)}
---`+t.slice(r[0].length)}var Ae={draft:["sent"],sent:["accepted","declined"],declined:["sent"],accepted:[]},Ce={draft:["sent"],sent:["paid"],paid:[]};function Oe(t,e,s){if(!t[e]||!t[e].includes(s))throw new Error(`invalid transition: ${e} -> ${s}`)}function Te(t,e){return t.status!=="sent"||!t.due?!1:t.due<e.toISOString().slice(0,10)}Ct.exports={parseFrontmatter:Fe,setFrontmatterField:Ee,QUOTE_TRANSITIONS:Ae,INVOICE_TRANSITIONS:Ce,assertTransition:Oe,isOverdue:Te}});var w=require("node:fs/promises"),$=require("node:path"),De=require("node:os"),{mergeSweep:qe,itemId:Tt,parseStrictJson:Me,quoteBasename:Dt,formatMoney:Be}=U(),{renderQuoteHtml:Le,quoteMarkdown:Ue,renderInvoiceHtml:_e,invoiceMarkdown:ze}=Et(),{currentNumber:Z,advanceCounter:qt,invoiceBasename:Mt,parseDataComment:Je,resolveVatRate:tt}=X(),{parseFrontmatter:et,setFrontmatterField:nt,QUOTE_TRANSITIONS:Pe,INVOICE_TRANSITIONS:We,assertTransition:Ve,isOverdue:He}=Ot(),{emptyStore:Bt,matchClients:Qe,filterByStatus:Ye,resolveClient:_,mergeUpsert:Ke,archiveClient:Xe,bootstrapFromNames:Ge,clientVaultNote:Ze}=K(),tn=14,en=2e3,rt=10,nn=100,rn={vaultPath:"~/ghostbrain/vault",brand:{businessName:"",logoDataUri:"",accentColor:"#C5FF3D",contactLine:"",paymentTerms:"50% upfront, balance on delivery",validityDays:14},rates:{currency:"EUR",default:0,named:[]},invoicing:{prefix:"INV",vatRate:0,netDays:14,yearReset:!0}},an={type:"object",properties:{items:{type:"array",items:{type:"object",properties:{title:{type:"string"},client:{type:"string"},ask:{type:"string"},sourceNote:{type:"string"},confidence:{type:"number"}},required:["title","client","ask","sourceNote","confidence"]}}},required:["items"]},sn={type:"object",properties:{client:{type:"string"},project:{type:"string"},scopeSummary:{type:"string"},lineItems:{type:"array",items:{type:"object",properties:{description:{type:"string"},hours:{type:"number"},rate:{type:"string"}},required:["description","hours","rate"]}},assumptions:{type:"array",items:{type:"string"}}},required:["client","project","scopeSummary","lineItems","assumptions"]};function on(t){return t.startsWith("~")?$.join(De.homedir(),t.slice(1)):t}function _t(t,e){if(e==null)return t;if(typeof t!="object"||Array.isArray(t)||t===null)return e;let s={...t};for(let r of Object.keys(e))s[r]=_t(t[r],e[r]);return s}async function cn(t){let{BrowserWindow:e}=require("electron"),s=new e({show:!1,webPreferences:{sandbox:!0,javascript:!1}});try{return await s.loadURL("data:text/html;charset=utf-8,"+encodeURIComponent(t)),await s.webContents.printToPDF({pageSize:"A4",printBackground:!0})}finally{s.destroy()}}function Lt(t,e={}){let s=e.renderPdf??cn,r=e.now??(()=>new Date),l=e.sweepMaxNotes??nn,o=$.join(t.dataDir,"work-items.json"),f=$.join(t.dataDir,"clients.json"),y=()=>_t(rn,t.settings.get("config")??{}),h=()=>on(y().vaultPath),x=()=>$.join(h(),"30-cross-context","quotes"),S=()=>$.join(h(),"30-cross-context","clients"),E=$.join(t.dataDir,"counter.json"),R=()=>$.join(h(),"30-cross-context","invoices");async function A(){let{invoicing:n}=y();try{return{...JSON.parse(await w.readFile(E,"utf-8")),prefix:n.prefix,yearReset:n.yearReset}}catch(a){return t.log("counter.json unreadable, reseeding:",a.message),{prefix:n.prefix,year:r().getFullYear(),next:1,yearReset:n.yearReset}}}async function I(n){await w.mkdir(t.dataDir,{recursive:!0});let a=`${E}.tmp`;await w.writeFile(a,JSON.stringify(n,null,2)),await w.rename(a,E)}function q(n){return n.toISOString().slice(0,10)}async function L(){try{return JSON.parse(await w.readFile(o,"utf-8"))}catch{return{seen:{},items:[],dismissed:[]}}}async function at(n){await w.mkdir(t.dataDir,{recursive:!0}),await w.writeFile(o,JSON.stringify(n,null,2))}async function O(){try{let n=JSON.parse(await w.readFile(f,"utf-8"));return!n||!Array.isArray(n.clients)?Bt():{version:1,clients:n.clients}}catch{return Bt()}}async function W(n){await w.mkdir(t.dataDir,{recursive:!0});let a=`${f}.tmp`;await w.writeFile(a,JSON.stringify(n,null,2)),await w.rename(a,f)}async function V(n){try{let a=S();await w.mkdir(a,{recursive:!0});let{basename:i,markdown:c}=Ze(n);await w.writeFile($.join(a,`${i}.md`),c)}catch(a){t.log("client vault mirror failed:",a.message)}}async function z(n){return(await O()).clients.find(i=>i.id===n)??null}async function st(n,a){let i;try{i=await w.readdir(n,{withFileTypes:!0})}catch{return}for(let c of i){let d=$.join(n,c.name);c.isDirectory()?await st(d,a):c.isFile()&&c.name.endsWith(".md")&&a.push(d)}}async function it(){let n=h(),a=[];for(let d of["00-inbox","20-contexts"])await st($.join(n,d),a);let i=r().getTime()-tn*864e5,c=[];for(let d of a){let u=await w.stat(d).catch(()=>null);u&&u.mtimeMs>=i&&c.push({path:d,rel:$.relative(n,d),mtimeMs:u.mtimeMs,modified:u.mtime.toISOString()})}return c.sort((d,u)=>u.mtimeMs-d.mtimeMs)}async function ot(n,a){let i=async c=>{let d=await t.api.fetch("POST","/v1/llm/run",{prompt:c,system:"You extract structured data for a freelancing tool. Respond with STRICT JSON matching the requested shape. No prose.",jsonSchema:a});if(!d.ok)throw new Error(`llm call failed: ${d.error}`);if(d.data.error)throw new Error(`llm error: ${d.data.error}`);return d.data.structured?d.data.structured:Me(d.data.text)};try{return await i(n)}catch(c){return t.log("llm json retry:",c.message),i(`${n}

Your previous reply was not valid JSON (${c.message}). Reply with ONLY the JSON object.`)}}async function zt(n){let a=n.map(c=>`--- note: ${c.rel} ---
${c.excerpt}`).join(`

`);return((await ot(`Below are recent notes from a personal knowledge vault (emails, chat threads, meeting notes).
Find INCOMING WORK REQUESTS a freelancer could quote: someone asking for work to be done, a project inquiry, a "can you build/fix/design X" ask.
Ignore: the vault owner's own todos, newsletters, receipts, status updates, anything already quoted.
For each request return title (short), client (person/company asking), ask (1-2 sentence summary of the work), sourceNote (the exact note path shown above), confidence (0-1).
Return {"items": [...]}. Empty array if none.

${a}`,an)).items??[]).filter(c=>c&&c.title&&c.ask&&c.sourceNote).map(c=>({id:Tt(c.sourceNote,c.title),title:String(c.title),client:String(c.client??"unknown"),ask:String(c.ask),sourceNote:String(c.sourceNote),confidence:Math.max(0,Math.min(1,Number(c.confidence)||0)),foundAt:r().toISOString()}))}let ct=Promise.resolve(),lt=n=>(...a)=>{let i=ct.then(()=>n(...a));return ct=i.catch(()=>{}),i};async function ut(n,a,i,c,d={}){if(typeof a!="string"||a!==$.basename(a)||!a.endsWith(".md"))throw new Error("file must be a note basename");let u=$.join(n,a),j=await w.readFile(u,"utf-8"),g=et(j).fields.status||"draft";Ve(c,g,i);let p=nt(j,"status",i);for(let[k,N]of Object.entries(d))p=nt(p,k,N);let v=`${u}.tmp`;return await w.writeFile(v,p),await w.rename(v,u),{ok:!0,status:i}}let J=null,H={"quotes:set-status":async({file:n,status:a}={})=>ut(x(),n,a,Pe),"quotes:sweep":async(n={})=>{if(J)return J;let a=(async()=>{try{let i=await L(),d=(await it()).filter(g=>n.force||i.seen[g.rel]!==g.mtimeMs),u=d.slice(0,l),j=d.length-u.length;for(let g=0;g<u.length;g+=rt){let p=u.slice(g,g+rt);for(let N of p)N.excerpt=(await w.readFile(N.path,"utf-8").catch(()=>"")).slice(0,en);t.ipc.send("quotes:sweep-progress",{done:Math.min(g+rt,u.length),total:u.length});let v=p.length?await zt(p):[],k={};for(let N of p)k[N.rel]=N.mtimeMs;i=qe(i,{items:v,scannedMtimes:k}),await at(i)}return{items:i.items,sweptAt:r().toISOString(),scanned:u.length,remaining:j}}finally{J=null}})();return J=a,a},"quotes:dismiss":async n=>{if(typeof n!="string"||!n)throw new Error("dismiss needs an item id");let a=await L();return a.dismissed.includes(n)||a.dismissed.push(n),a.items=a.items.filter(i=>i.id!==n),await at(a),{ok:!0}},"quotes:recent-notes":async()=>{let n=await it(),a=[];for(let i of n.slice(0,50)){let d=(await w.readFile(i.path,"utf-8").catch(()=>"")).slice(0,400).match(/^#\s+(.+)$/m)?.[1]??$.basename(i.rel,".md");a.push({path:i.rel,title:d,modified:i.modified})}return a},"quotes:manual":async n=>{if(typeof n!="string"||!n)throw new Error("manual needs a note path");let a=$.join(h(),n);if(!$.resolve(a).startsWith($.resolve(h())))throw new Error("note path escapes the vault");await w.access(a);let i=$.basename(n,".md");return{id:Tt(n,i),title:i,client:"unknown",ask:"manually selected note",sourceNote:n,confidence:1,foundAt:r().toISOString()}},"quotes:draft":async(n={})=>{let a=n.notePath;if(n.itemId){let k=(await L()).items.find(N=>N.id===n.itemId);if(!k)throw new Error(`unknown work item: ${n.itemId}`);a=k.sourceNote}if(!a)throw new Error("draft needs an itemId or notePath");let i=$.join(h(),a),c=(await w.readFile(i,"utf-8")).slice(0,8e3),{rates:d}=y(),u=["default",...d.named.map(v=>v.name)],j=await ot(`A freelancer needs a quote draft for the work request in this note.

--- note: ${a} ---
${c}
---

Rate names available (pick the best fit per line item): ${u.join(", ")}.
Break the work into 2-8 concrete line items with realistic hour estimates.
Return {"client", "project", "scopeSummary", "lineItems": [{"description", "hours", "rate"}], "assumptions": [...]}.`,sn),g=await O(),{client:p}=_(g.clients,j.client);return{...j,sourceNote:a,clientId:p?.id}},"quotes:generate":async n=>{if(!n||typeof n!="object")throw new Error("generate needs a quote");if(!n.client||!Array.isArray(n.lineItems)||n.lineItems.length===0)throw new Error("quote needs a client and at least one line item");let{brand:a,rates:i}=y(),c=null;if(n.clientId){if(c=await z(n.clientId),!c)throw new Error(`unknown client: ${n.clientId}`)}else{let m=await O();c=_(m.clients,n.client).client}let d={...i,currency:c?.defaults?.currency||i.currency};c&&!n.clientId&&(n={...n,clientId:c.id});let u=Le(n,a,d,c||void 0),j=await s(u),g=x();await w.mkdir(g,{recursive:!0});let p=c?.name||n.client,v=Dt(p,r());for(let m=2;;m++)try{await w.access($.join(g,`${v}.md`)),v=`${Dt(p,r())}-${m}`}catch{break}let k=$.join(g,`${v}.md`),N=$.join(g,`${v}.pdf`);return await w.writeFile(N,j),await w.writeFile(k,Ue(n,a,d,c||void 0)),t.log("quote generated:",N),{pdfPath:N,notePath:k,clientId:n.clientId||c?.id||null}},"quotes:list":async()=>{let n;try{n=await w.readdir(x())}catch{return[]}let a=[];for(let i of n.filter(c=>c.endsWith(".md")).sort().reverse()){let d=(await w.readFile($.join(x(),i),"utf-8").catch(()=>"")).match(/^---\n([\s\S]*?)\n---/)?.[1]??"",u=j=>d.match(new RegExp(`^${j}: "?(.*?)"?$`,"m"))?.[1]??"";a.push({file:i,client:u("client"),clientId:u("clientId")||null,project:u("project"),total:Number(u("total"))||0,currency:u("currency"),generated:u("generated"),pdf:n.includes(i.replace(/\.md$/,".pdf")),status:u("status")||"draft",invoiced:u("invoiced")==="true"})}return a},"invoices:counter":async()=>A(),"invoices:set-counter":lt(async({next:n}={})=>{let a=Number(n);if(!Number.isInteger(a)||a<1)throw new Error("next must be a positive integer");let i=await A();return await I({...i,next:a}),{ok:!0}}),"invoices:draft":async(n={})=>{let{invoicing:a,rates:i}=y(),c=await A(),d=Z(c,r().getFullYear()),u=q(r()),j=q(new Date(r().getTime()+(Number(a.netDays)||14)*864e5)),g={number:d,issued:u,due:j,client:"",lineItems:[],vatRate:a.vatRate??0,currency:i.currency};if(n.quoteFile){if(n.quoteFile!==$.basename(n.quoteFile))throw new Error("quoteFile must be a basename");let p=await w.readFile($.join(x(),n.quoteFile),"utf-8"),{fields:v}=et(p),k=Je(p),N=await O(),m=v.clientId?N.clients.find(D=>D.id===v.clientId):_(N.clients,v.client).client;g={...g,client:v.client,clientId:m?.id,project:v.project,quoteRef:n.quoteFile,lineItems:k?.lineItems??[],vatRate:tt({clientVat:m?.defaults?.vatRate,settingsVat:a.vatRate}),currency:m?.defaults?.currency||i.currency}}else if(n.clientId){let p=await z(n.clientId);if(!p)throw new Error(`unknown client: ${n.clientId}`);g={...g,client:p.name,clientId:p.id,vatRate:tt({clientVat:p.defaults?.vatRate,settingsVat:a.vatRate}),currency:p.defaults?.currency||i.currency}}return g},"invoices:generate":lt(async n=>{if(!n||typeof n!="object")throw new Error("generate needs an invoice");if(!n.client||!Array.isArray(n.lineItems)||n.lineItems.length===0)throw new Error("invoice needs a client and at least one line item");let{brand:a,rates:i,invoicing:c}=y(),d=null;if(n.clientId){if(d=await z(n.clientId),!d)throw new Error(`unknown client: ${n.clientId}`)}else{let C=await O();d=_(C.clients,n.client).client}let u={...i,currency:n.currency||d?.defaults?.currency||i.currency},j=await A(),g=r().getFullYear(),p={...n,number:Z(j,g),issued:n.issued||q(r()),due:n.due||q(new Date(r().getTime()+(Number(c.netDays)||14)*864e5)),vatRate:tt({invoiceVat:n.vatRate,clientVat:d?.defaults?.vatRate,settingsVat:c.vatRate})},v=R();await w.mkdir(v,{recursive:!0});let k=j,N=Mt(d?.name||p.client,p.number);for(;;)try{await w.access($.join(v,`${N}.md`)),k=qt(k,g),p.number=Z(k,g),N=Mt(d?.name||p.client,p.number)}catch{break}let m=_e(p,a,u,d||void 0),D=await s(m);if(await w.writeFile($.join(v,`${N}.pdf`),D),await w.writeFile($.join(v,`${N}.md`),ze(p,a,u,d||void 0)),await I(qt(k,g)),p.quoteRef)if(p.quoteRef!==$.basename(p.quoteRef)||!p.quoteRef.endsWith(".md"))t.log("quote invoiced-stamp skipped: quoteRef is not a safe basename:",p.quoteRef);else try{let C=$.join(x(),p.quoteRef),Jt=await w.readFile(C,"utf-8"),Pt=nt(Jt,"invoiced","true"),dt=`${C}.tmp`;await w.writeFile(dt,Pt),await w.rename(dt,C)}catch(C){t.log("quote invoiced-stamp failed:",C.message)}return t.log("invoice generated:",$.join(v,`${N}.pdf`)),{pdfPath:$.join(v,`${N}.pdf`),notePath:$.join(v,`${N}.md`),number:p.number}}),"invoices:list":async()=>{let n;try{n=await w.readdir(R())}catch{return[]}let a=[],i=r();for(let c of n.filter(d=>d.endsWith(".md")).sort().reverse()){let d=await w.readFile($.join(R(),c),"utf-8").catch(()=>""),{fields:u}=et(d),j=u.status||"draft",g={status:j,due:u.due},p=He(g,i);a.push({file:c,number:u.number??"",client:u.client??"",clientId:u.clientId||null,project:u.project??"",quoteRef:u.quoteRef||null,total:Number(u.total)||0,currency:u.currency??"",issued:u.issued??"",due:u.due??"",status:j,paidAt:u.paidAt||null,overdue:p,daysOverdue:p?Math.floor((i.getTime()-new Date(u.due).getTime())/864e5):0,pdf:n.includes(c.replace(/\.md$/,".pdf"))})}return a},"invoices:set-status":async({file:n,status:a}={})=>{let i=a==="paid"?{paidAt:r().toISOString()}:{};return ut(R(),n,a,We,i)},"clients:list":async(n={})=>{let a=await O(),i=Ye(a.clients,n.status??"all");return n.q&&(i=Qe(i,n.q)),i.sort((c,d)=>c.name.localeCompare(d.name))},"clients:get":async n=>{if(typeof n!="string"||!n)throw new Error("get needs a client id");let a=await z(n);if(!a)throw new Error(`unknown client: ${n}`);return a},"clients:upsert":async n=>{let a=await O(),{store:i,client:c}=Ke(a,n,r);return await W(i),await V(c),c},"clients:archive":async n=>{if(typeof n!="string"||!n)throw new Error("archive needs a client id");let a=await O(),i=Xe(a,n);await W(i);let c=i.clients.find(d=>d.id===n);return c&&await V(c),{ok:!0}},"clients:resolve":async n=>{if(typeof n!="string")throw new Error("resolve needs a name string");let a=await O();return _(a.clients,n)},"clients:bootstrap":async()=>{let n=await O(),a=[];try{let u=await w.readdir(x());for(let j of u.filter(g=>g.endsWith(".md"))){let v=((await w.readFile($.join(x(),j),"utf-8").catch(()=>"")).match(/^---\n([\s\S]*?)\n---/)?.[1]??"").match(/^client: "?(.*?)"?$/m)?.[1];v&&a.push(v)}}catch{}let i=await L();for(let u of i.items??[])u.client&&a.push(u.client);let{store:c,created:d}=Ge(n,a,r);await W(c);for(let u of c.clients)(u.tags??[]).includes("bootstrap")&&await V(u);return{created:d,linked:a.length}},"dashboard:summary":async()=>{let n=await L(),a=await H["quotes:list"](),i=await H["invoices:list"](),{rates:c}=y(),d=(m,D)=>m.filter(C=>C.status===D).length,u=m=>String(m??"").slice(0,7),j=u(r().toISOString()),g=u(new Date(r().getFullYear(),r().getMonth()-1,15).toISOString()),p=i.filter(m=>m.status==="paid"),v=m=>Math.round(m.reduce((D,C)=>D+C.total,0)*100)/100,k=[...n.items.map(m=>({kind:"workItem",label:`${m.client} \u2014 ${m.title}`,ref:m.id})),...a.filter(m=>m.status==="accepted"&&!m.invoiced).map(m=>({kind:"acceptedQuote",label:`${m.client} \u2014 ${m.project}`,ref:m.file})),...i.filter(m=>m.overdue).map(m=>({kind:"overdueInvoice",label:`${m.number} \u2014 ${m.client} \u2014 ${m.daysOverdue}d overdue`,ref:m.file}))],N=[...a.map(m=>({kind:"quote",label:`quote ${m.status} \u2014 ${m.client}`,when:m.generated})),...i.map(m=>({kind:"invoice",label:`invoice ${m.status} \u2014 ${m.number}`,when:m.issued})),...p.map(m=>({kind:"paid",label:`paid \u2014 ${m.number} \u2014 ${Be(m.total,m.currency||c.currency)}`,when:m.paidAt}))].filter(m=>m.when).sort((m,D)=>m.when<D.when?1:-1).slice(0,10);return{workItems:n.items.length,quotes:{draft:d(a,"draft"),sent:d(a,"sent"),accepted:d(a,"accepted"),declined:d(a,"declined")},invoices:{draft:d(i,"draft"),sent:d(i,"sent"),paid:p.length,overdue:i.filter(m=>m.overdue).length,unpaidTotal:v(i.filter(m=>m.status==="sent")),currency:c.currency},revenue:{thisMonth:v(p.filter(m=>u(m.paidAt)===j)),lastMonth:v(p.filter(m=>u(m.paidAt)===g)),currency:c.currency},attention:k,activity:N}}};return H}var Ut=null;module.exports={activate(t){let e=Lt(t);for(let[s,r]of Object.entries(e))t.ipc.handle(s,r);Ut=t,t.log("freelancer activated")},deactivate(){Ut=null},createHandlers:Lt};
