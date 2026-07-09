var M=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var W=M((on,dt)=>{function Jt(t,e){let s=new Map((e.named??[]).map(o=>[o.name,o.hourly])),r=(t??[]).map(o=>{let f=s.get(o.rate)??e.default??0,y=Number.isFinite(Number(o.hours))?Number(o.hours):0;return{description:String(o.description??""),hours:y,rateName:s.has(o.rate)?o.rate:"default",hourly:f,amount:Math.round(y*f*100)/100}}),l=Math.round(r.reduce((o,f)=>o+f.amount,0)*100)/100;return{rows:r,total:l}}function Pt(t,e){try{return new Intl.NumberFormat("en-IE",{style:"currency",currency:e}).format(t)}catch{return`${e} ${t.toFixed(2)}`}}dt.exports={computeTotals:Jt,formatMoney:Pt}});var L=M((cn,mt)=>{var{createHash:Vt}=require("node:crypto"),{computeTotals:Wt,formatMoney:Ht}=W();function Qt(t,{items:e,scannedMtimes:s}){let r=new Set(t.dismissed??[]),l=new Map((t.items??[]).map(o=>[o.id,o]));for(let o of e??[])!r.has(o.id)&&!l.has(o.id)&&l.set(o.id,o);return{seen:{...t.seen??{},...s??{}},items:[...l.values()].filter(o=>!r.has(o.id)),dismissed:[...r]}}function Yt(t,e){return Vt("sha1").update(`${t}
${e}`).digest("hex").slice(0,12)}function Kt(t){let e=String(t??"").trim(),s=e.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);s&&(e=s[1]);let r=e.indexOf("{"),l=e.lastIndexOf("}");if(r===-1||l===-1)throw new Error(`expected JSON object, got: ${e.slice(0,120)}`);try{return JSON.parse(e.slice(r,l+1))}catch(o){throw new Error(`invalid JSON (${o.message}): ${e.slice(0,120)}`)}}function ut(t){return String(t??"").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").trim().replace(/[\s_]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"client"}function Gt(t,e){let s=e instanceof Date?e:new Date(e),r=`${s.getFullYear()}${String(s.getMonth()+1).padStart(2,"0")}${String(s.getDate()).padStart(2,"0")}`;return`quote-${ut(t)}-${r}`}mt.exports={computeTotals:Wt,formatMoney:Ht,mergeSweep:Qt,itemId:Yt,parseStrictJson:Kt,slug:ut,quoteBasename:Gt}});var Q=M((ln,$t)=>{var{createHash:Xt,randomBytes:ft}=require("node:crypto"),{slug:pt}=L(),ht=new Set(["prospect","active","inactive","archived"]),Zt=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;function z(){return{version:1,clients:[]}}function B(t){return String(t??"").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").trim().replace(/[\s_]+/g," ").replace(/\s+/g," ")}function H(t){return t?Xt("sha1").update(String(t)).digest("hex").slice(0,12):ft(6).toString("hex")}function te(t){return H(t||ft(8).toString("hex"))}function R(t,e=500){if(t==null)return;let s=String(t).trim();if(s)return s.slice(0,e)}function wt(t,e){if(!t)return;let s=String(t).trim();if(s){if(!Zt.test(s))throw new Error(`${e} is not a valid email: ${s}`);return s.slice(0,200)}}function ee(t,e){if(!t||typeof t!="object")throw new Error(`contact ${e}: expected object`);let s=R(t.name,120);if(!s)throw new Error(`contact ${e}: name is required`);return{id:typeof t.id=="string"&&t.id?t.id:te(`${s}-${e}`),name:s,email:wt(t.email,`contact ${e} email`),phone:R(t.phone,40),role:R(t.role,80),primary:!!t.primary}}function ne(t){if(!t||typeof t!="object")return{};let e=Array.isArray(t.addressLines)?t.addressLines.map(s=>R(s,120)).filter(Boolean).slice(0,4):void 0;return{email:wt(t.email,"billing email"),addressLines:e?.length?e:void 0,city:R(t.city,80),region:R(t.region,80),postalCode:R(t.postalCode,20),country:R(t.country,80),taxId:R(t.taxId,40)}}function re(t){if(!t||typeof t!="object")return{};let e=R(t.currency,3),s;if(t.vatRate!==void 0&&t.vatRate!==null&&String(t.vatRate).trim()!==""){let r=Number(t.vatRate);if(Number.isFinite(r)){if(r<0||r>100)throw new Error(`vatRate must be 0-100, got ${r}`);s=r}}return{currency:e?e.toUpperCase():void 0,rateName:R(t.rateName,60),paymentTerms:R(t.paymentTerms,200),vatRate:s}}function yt(t,{now:e=()=>new Date}={}){if(!t||typeof t!="object")throw new Error("client payload required");let s=R(t.name,120);if(!s)throw new Error("client name is required");let r=t.status??"prospect";if(!ht.has(r))throw new Error(`invalid status: ${r}`);let l=Array.isArray(t.contacts)?t.contacts.map((S,F)=>ee(S,F)):[],o=!1;for(let S of l)S.primary&&(o?S.primary=!1:o=!0);l.length&&!o&&(l[0].primary=!0);let f=Array.isArray(t.tags)?[...new Set(t.tags.map(S=>R(S,40)).filter(Boolean))]:[],y=Array.isArray(t.sourceNotes)?[...new Set(t.sourceNotes.map(S=>R(S,500)).filter(Boolean))]:[],h=e().toISOString();return{id:typeof t.id=="string"&&/^[a-z0-9-]{6,32}$/i.test(t.id)?t.id:H(`${s}
${h}`),name:s,legalName:R(t.legalName,160),status:r,tags:f,website:R(t.website,300),contacts:l,billing:ne(t.billing),defaults:re(t.defaults),notes:R(t.notes,8e3),sourceNotes:y,createdAt:typeof t.createdAt=="string"&&t.createdAt?t.createdAt:h,updatedAt:h}}function ae(t,e){let s=String(e??"").trim().toLowerCase();return s?(t??[]).filter(r=>[r.name,r.legalName,...r.tags??[],...(r.contacts??[]).flatMap(o=>[o.name,o.email]),r.billing?.email,r.billing?.taxId].filter(Boolean).join(" ").toLowerCase().includes(s)):[...t??[]]}function se(t,e){return!e||e==="all"?(t??[]).filter(s=>s.status!=="archived"):(t??[]).filter(s=>s.status===e)}function ie(t,e){let s=t??[],r=B(e);if(!r)return{client:null,candidates:[]};let l=s.filter(f=>B(f.name)===r&&f.status!=="archived");if(l.length===1)return{client:l[0],candidates:l};if(l.length>1)return{client:null,candidates:l};let o=s.filter(f=>f.status!=="archived"&&B(f.name).includes(r));return o.length===1?{client:o[0],candidates:o}:{client:null,candidates:o}}function gt(t,e,s=()=>new Date){let l=[...(t?.clients?t:z()).clients??[]],o=yt(e,{now:s}),f=l.findIndex(y=>y.id===o.id);return f>=0?(o.createdAt=l[f].createdAt,l[f]=o):l.push(o),{store:{version:1,clients:l},client:o}}function oe(t,e){let s=t?.clients?t:z(),r=(s.clients??[]).map(l=>l.id===e?{...l,status:"archived",updatedAt:new Date().toISOString()}:l);if(!(s.clients??[]).some(l=>l.id===e))throw new Error(`unknown client: ${e}`);return{version:1,clients:r}}function ce(t,e,s=()=>new Date){let r=t?.clients?{version:1,clients:[...t.clients]}:z(),l=0,o=new Set(r.clients.map(f=>B(f.name)));for(let f of e??[]){let y=R(f,120);if(!y)continue;let h=B(y);if(!h||h==="unknown"||o.has(h))continue;let{store:k,client:S}=gt(r,{name:y,status:"active",tags:["bootstrap"]},s);r=k,o.add(h),l+=1}return{store:r,created:l}}function le(t){let e=t?.contacts??[];return e.find(s=>s.primary)||e[0]||null}function de(t){let e=`client-${pt(t.name)}`,s=(t.contacts??[]).map(h=>`- ${[h.name,h.role,h.email,h.phone].filter(Boolean).join(" \xB7 ")}${h.primary?" (primary)":""}`).join(`
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
`;return{basename:e,markdown:y}}$t.exports={STATUSES:ht,emptyStore:z,normalizeClientName:B,newId:H,validateClient:yt,matchClients:ae,filterByStatus:se,resolveClient:ie,mergeUpsert:gt,archiveClient:oe,bootstrapFromNames:ce,primaryContact:le,clientVaultNote:de,slug:pt}});var Y=M((dn,St)=>{var{computeTotals:ue}=W(),{slug:me}=L();function fe(t){return String(t).padStart(3,"0")}function vt(t,e){return t.yearReset&&e!==t.year?{...t,year:e,next:1}:t}function bt({prefix:t,year:e,next:s}){return`${t}-${e}-${fe(s)}`}function pe(t,e){return bt(vt(t,e))}function he(t,e){let s=vt(t,e);return{...s,next:s.next+1}}function we(t,e,s){let{rows:r,total:l}=ue(t,e),o=Number.isFinite(Number(s))?Number(s):0,f=Math.round(l*(o/100)*100)/100,y=Math.round((l+f)*100)/100;return{rows:r,subtotal:l,vatRate:o,vatAmount:f,total:y}}function ye(t,e){return`invoice-${me(t)}-${e}`}var ge=/<!-- freelancer:data (\{[\s\S]*?\}) -->/;function $e(t){return`<!-- freelancer:data ${JSON.stringify(t)} -->`}function ve(t){let e=String(t??"").match(ge);if(!e)return null;try{return JSON.parse(e[1])}catch{return null}}function be({invoiceVat:t,clientVat:e,settingsVat:s}={}){for(let r of[t,e,s])if(r!=null&&Number.isFinite(Number(r)))return Number(r);return 0}St.exports={formatInvoiceNumber:bt,advanceCounter:he,currentNumber:pe,computeInvoiceTotals:we,invoiceBasename:ye,dataComment:$e,parseDataComment:ve,resolveVatRate:be}});var kt=M((un,Rt)=>{var{computeTotals:It,formatMoney:O}=L(),{primaryContact:Se}=Q(),{computeInvoiceTotals:Nt,dataComment:xt}=Y();function b(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function K(t,e){let s=e?.legalName||e?.name||t.client,r=[`    <h2>${b(s)}</h2>`];e?.legalName&&e.name&&e.legalName!==e.name&&r.push(`    <div class="sub">${b(e.name)}</div>`);let l=Se(e);if(l){let h=[l.name,l.role,l.email,l.phone].filter(Boolean).join(" \xB7 ");r.push(`    <div class="sub">${b(h)}</div>`)}let o=e?.billing??{};for(let h of o.addressLines??[])r.push(`    <div class="sub">${b(h)}</div>`);let y=[[o.postalCode,o.city].filter(Boolean).join(" "),o.region,o.country].filter(Boolean).join(", ");return y&&r.push(`    <div class="sub">${b(y)}</div>`),o.email&&(!l||l.email!==o.email)&&r.push(`    <div class="sub">${b(o.email)}</div>`),o.taxId&&r.push(`    <div class="sub">Tax ID: ${b(o.taxId)}</div>`),t.project&&r.push(`    <div style="margin-top:6px">${b(t.project)}</div>`),r.join(`
`)}function jt(t){return`
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
`}function Ie(t,e,s,r){let{rows:l,total:o}=It(t.lineItems,s),f=/^#[0-9a-fA-F]{3,8}$/.test(e.accentColor??"")?e.accentColor:"#C5FF3D",y=I=>b(O(I,s.currency??"EUR")),h=new Date,k=new Date(h.getTime()+(Number(e.validityDays)||14)*864e5),S=I=>I.toISOString().slice(0,10),F=r?.defaults?.paymentTerms||e.paymentTerms||"",x=l.map(I=>`      <tr>
        <td>${b(I.description)}</td>
        <td class="num">${b(String(I.hours))}</td>
        <td class="num">${y(I.hourly)}</td>
        <td class="num">${y(I.amount)}</td>
      </tr>`).join(`
`),T=(t.assumptions??[]).map(I=>`      <li>${b(I)}</li>`).join(`
`);return`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${jt(f)}</style>
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
      <div class="meta">date ${S(h)}<br>valid until ${S(k)}</div>
    </div>
  </header>

  <div class="block">
    <div class="label">prepared for</div>
${K(t,r)}
  </div>

  <div class="block">
    <div class="label">scope</div>
    <div>${b(t.scopeSummary??"")}</div>
  </div>

  <div class="block">
    <table>
      <thead><tr><th>item</th><th class="num">hours</th><th class="num">rate</th><th class="num">amount</th></tr></thead>
      <tbody>
${x}
        <tr class="total-row"><td colspan="3">total</td><td class="num amount">${y(o)}</td></tr>
      </tbody>
    </table>
  </div>

${T?`  <div class="block">
    <div class="label">assumptions</div>
    <ul>
${T}
    </ul>
  </div>
`:""}
  <footer>
    <span>${b(F)}</span>
    <span>${b(e.businessName??"")}</span>
  </footer>
</body>
</html>`}function Ne(t,e,s,r){let{rows:l,total:o}=It(t.lineItems,s),f=s.currency??"EUR",y=r?.defaults?.paymentTerms||e.paymentTerms||"",h=r?.legalName||r?.name||t.client,k=l.map(x=>`| ${x.description.replace(/\|/g,"\\|")} | ${x.hours} | ${O(x.hourly,f)} | ${O(x.amount,f)} |`).join(`
`),S=x=>String(x??"").replace(/"/g,'\\"'),F=t.clientId||r?.id?`clientId: "${S(t.clientId||r?.id)}"
`:"";return`---
client: "${S(h)}"
${F}project: "${S(t.project)}"
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
${k}

**Total: ${O(o,f)}**

## Assumptions

${(t.assumptions??[]).map(x=>`- ${x}`).join(`
`)}

## Terms

${y} \u2014 valid ${Number(e.validityDays)||14} days.

${xt({lineItems:t.lineItems??[]})}
`}function xe(t,e,s,r){let{rows:l,subtotal:o,vatRate:f,vatAmount:y,total:h}=Nt(t.lineItems,s,t.vatRate),k=/^#[0-9a-fA-F]{3,8}$/.test(e.accentColor??"")?e.accentColor:"#C5FF3D",S=I=>b(O(I,s.currency??"EUR")),F=r?.defaults?.paymentTerms||e.paymentTerms||"",x=l.map(I=>`      <tr>
        <td>${b(I.description)}</td>
        <td class="num">${b(String(I.hours))}</td>
        <td class="num">${S(I.hourly)}</td>
        <td class="num">${S(I.amount)}</td>
      </tr>`).join(`
`),T=f>0?`        <tr><td colspan="3" class="sub">vat ${b(String(f))}%</td><td class="num">${S(y)}</td></tr>
`:"";return`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${jt(k)}</style>
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
${K(t,r)}
  </div>

  <div class="block">
    <table>
      <thead><tr><th>item</th><th class="num">hours</th><th class="num">rate</th><th class="num">amount</th></tr></thead>
      <tbody>
${x}
        <tr><td colspan="3" class="sub">subtotal</td><td class="num">${S(o)}</td></tr>
${T}        <tr class="total-row"><td colspan="3">total due</td><td class="num amount">${S(h)}</td></tr>
      </tbody>
    </table>
  </div>

  <footer>
    <span>${b(F)}${F?" \xB7 ":""}payable to ${b(e.contactLine??e.businessName??"")}</span>
    <span>${b(t.number)}</span>
  </footer>
</body>
</html>`}function je(t,e,s,r){let{rows:l,subtotal:o,vatRate:f,vatAmount:y,total:h}=Nt(t.lineItems,s,t.vatRate),k=s.currency??"EUR",S=r?.legalName||r?.name||t.client,F=I=>String(I??"").replace(/"/g,'\\"'),x=(I,q)=>q?`${I}: "${F(q)}"
`:"",T=l.map(I=>`| ${I.description.replace(/\|/g,"\\|")} | ${I.hours} | ${O(I.hourly,k)} | ${O(I.amount,k)} |`).join(`
`);return`---
number: "${F(t.number)}"
client: "${F(S)}"
${x("clientId",t.clientId||r?.id)}${x("quoteRef",t.quoteRef)}${x("project",t.project)}issued: ${t.issued}
due: ${t.due}
subtotal: ${o}
vatRate: ${f}
vatAmount: ${y}
total: ${h}
currency: ${k}
status: draft
generated: ${new Date().toISOString()}
---

# Invoice ${t.number} \u2014 ${S}

| item | hours | rate | amount |
|------|-------|------|--------|
${T}

subtotal ${O(o,k)}${f>0?`
vat ${f}% ${O(y,k)}`:""}
**Total due: ${O(h,k)}** \u2014 due ${t.due}

${xt({lineItems:t.lineItems??[]})}
`}Rt.exports={esc:b,billToHtml:K,renderQuoteHtml:Ie,quoteMarkdown:Ne,renderInvoiceHtml:xe,invoiceMarkdown:je}});var At=M((mn,Et)=>{var Ft=/^---\n([\s\S]*?)\n---/;function Re(t){let e=String(t??"").match(Ft),s={};if(e)for(let r of e[1].split(`
`)){let l=r.match(/^(\w[\w-]*):\s*"?(.*?)"?\s*$/);l&&(s[l[1]]=l[2])}return{fields:s,body:e?t.slice(e[0].length):String(t??"")}}function ke(t,e,s){let r=String(t??"").match(Ft);if(!r)throw new Error("note has no frontmatter block");let l=r[1].split(`
`),o=l.findIndex(f=>f.startsWith(`${e}:`));return o>=0?l[o]=`${e}: ${s}`:l.push(`${e}: ${s}`),`---
${l.join(`
`)}
---`+t.slice(r[0].length)}var Fe={draft:["sent"],sent:["accepted","declined"],declined:["sent"],accepted:[]},Ee={draft:["sent"],sent:["paid"],paid:[]};function Ae(t,e,s){if(!t[e]||!t[e].includes(s))throw new Error(`invalid transition: ${e} -> ${s}`)}function Ce(t,e){return t.status!=="sent"||!t.due?!1:t.due<e.toISOString().slice(0,10)}Et.exports={parseFrontmatter:Re,setFrontmatterField:ke,QUOTE_TRANSITIONS:Fe,INVOICE_TRANSITIONS:Ee,assertTransition:Ae,isOverdue:Ce}});var w=require("node:fs/promises"),v=require("node:path"),Oe=require("node:os"),{mergeSweep:Te,itemId:Ct,parseStrictJson:De,quoteBasename:Ot,formatMoney:qe}=L(),{renderQuoteHtml:Me,quoteMarkdown:Be,renderInvoiceHtml:Le,invoiceMarkdown:Ue}=kt(),{currentNumber:G,advanceCounter:Tt,invoiceBasename:Dt,parseDataComment:_e,resolveVatRate:X}=Y(),{parseFrontmatter:Z,setFrontmatterField:tt,QUOTE_TRANSITIONS:ze,INVOICE_TRANSITIONS:Je,assertTransition:Pe,isOverdue:Ve}=At(),{emptyStore:qt,matchClients:We,filterByStatus:He,resolveClient:U,mergeUpsert:Qe,archiveClient:Ye,bootstrapFromNames:Ke,clientVaultNote:Ge}=Q(),Xe=14,Ze=2e3,et=10,tn={vaultPath:"~/ghostbrain/vault",brand:{businessName:"",logoDataUri:"",accentColor:"#C5FF3D",contactLine:"",paymentTerms:"50% upfront, balance on delivery",validityDays:14},rates:{currency:"EUR",default:0,named:[]},invoicing:{prefix:"INV",vatRate:0,netDays:14,yearReset:!0}},en={type:"object",properties:{items:{type:"array",items:{type:"object",properties:{title:{type:"string"},client:{type:"string"},ask:{type:"string"},sourceNote:{type:"string"},confidence:{type:"number"}},required:["title","client","ask","sourceNote","confidence"]}}},required:["items"]},nn={type:"object",properties:{client:{type:"string"},project:{type:"string"},scopeSummary:{type:"string"},lineItems:{type:"array",items:{type:"object",properties:{description:{type:"string"},hours:{type:"number"},rate:{type:"string"}},required:["description","hours","rate"]}},assumptions:{type:"array",items:{type:"string"}}},required:["client","project","scopeSummary","lineItems","assumptions"]};function rn(t){return t.startsWith("~")?v.join(Oe.homedir(),t.slice(1)):t}function Lt(t,e){if(e==null)return t;if(typeof t!="object"||Array.isArray(t)||t===null)return e;let s={...t};for(let r of Object.keys(e))s[r]=Lt(t[r],e[r]);return s}async function an(t){let{BrowserWindow:e}=require("electron"),s=new e({show:!1,webPreferences:{sandbox:!0,javascript:!1}});try{return await s.loadURL("data:text/html;charset=utf-8,"+encodeURIComponent(t)),await s.webContents.printToPDF({pageSize:"A4",printBackground:!0})}finally{s.destroy()}}function Mt(t,e={}){let s=e.renderPdf??an,r=e.now??(()=>new Date),l=v.join(t.dataDir,"work-items.json"),o=v.join(t.dataDir,"clients.json"),f=()=>Lt(tn,t.settings.get("config")??{}),y=()=>rn(f().vaultPath),h=()=>v.join(y(),"30-cross-context","quotes"),k=()=>v.join(y(),"30-cross-context","clients"),S=v.join(t.dataDir,"counter.json"),F=()=>v.join(y(),"30-cross-context","invoices");async function x(){let{invoicing:n}=f();try{return{...JSON.parse(await w.readFile(S,"utf-8")),prefix:n.prefix,yearReset:n.yearReset}}catch(a){return t.log("counter.json unreadable, reseeding:",a.message),{prefix:n.prefix,year:r().getFullYear(),next:1,yearReset:n.yearReset}}}async function T(n){await w.mkdir(t.dataDir,{recursive:!0});let a=`${S}.tmp`;await w.writeFile(a,JSON.stringify(n,null,2)),await w.rename(a,S)}function I(n){return n.toISOString().slice(0,10)}async function q(){try{return JSON.parse(await w.readFile(l,"utf-8"))}catch{return{seen:{},items:[],dismissed:[]}}}async function nt(n){await w.mkdir(t.dataDir,{recursive:!0}),await w.writeFile(l,JSON.stringify(n,null,2))}async function C(){try{let n=JSON.parse(await w.readFile(o,"utf-8"));return!n||!Array.isArray(n.clients)?qt():{version:1,clients:n.clients}}catch{return qt()}}async function J(n){await w.mkdir(t.dataDir,{recursive:!0});let a=`${o}.tmp`;await w.writeFile(a,JSON.stringify(n,null,2)),await w.rename(a,o)}async function P(n){try{let a=k();await w.mkdir(a,{recursive:!0});let{basename:c,markdown:i}=Ge(n);await w.writeFile(v.join(a,`${c}.md`),i)}catch(a){t.log("client vault mirror failed:",a.message)}}async function _(n){return(await C()).clients.find(c=>c.id===n)??null}async function rt(n,a){let c;try{c=await w.readdir(n,{withFileTypes:!0})}catch{return}for(let i of c){let d=v.join(n,i.name);i.isDirectory()?await rt(d,a):i.isFile()&&i.name.endsWith(".md")&&a.push(d)}}async function at(){let n=y(),a=[];for(let d of["00-inbox","20-contexts"])await rt(v.join(n,d),a);let c=r().getTime()-Xe*864e5,i=[];for(let d of a){let m=await w.stat(d).catch(()=>null);m&&m.mtimeMs>=c&&i.push({path:d,rel:v.relative(n,d),mtimeMs:m.mtimeMs,modified:m.mtime.toISOString()})}return i.sort((d,m)=>m.mtimeMs-d.mtimeMs)}async function st(n,a){let c=async i=>{let d=await t.api.fetch("POST","/v1/llm/run",{prompt:i,system:"You extract structured data for a freelancing tool. Respond with STRICT JSON matching the requested shape. No prose.",jsonSchema:a});if(!d.ok)throw new Error(`llm call failed: ${d.error}`);if(d.data.error)throw new Error(`llm error: ${d.data.error}`);return d.data.structured?d.data.structured:De(d.data.text)};try{return await c(n)}catch(i){return t.log("llm json retry:",i.message),c(`${n}

Your previous reply was not valid JSON (${i.message}). Reply with ONLY the JSON object.`)}}async function Ut(n){let a=n.map(i=>`--- note: ${i.rel} ---
${i.excerpt}`).join(`

`);return((await st(`Below are recent notes from a personal knowledge vault (emails, chat threads, meeting notes).
Find INCOMING WORK REQUESTS a freelancer could quote: someone asking for work to be done, a project inquiry, a "can you build/fix/design X" ask.
Ignore: the vault owner's own todos, newsletters, receipts, status updates, anything already quoted.
For each request return title (short), client (person/company asking), ask (1-2 sentence summary of the work), sourceNote (the exact note path shown above), confidence (0-1).
Return {"items": [...]}. Empty array if none.

${a}`,en)).items??[]).filter(i=>i&&i.title&&i.ask&&i.sourceNote).map(i=>({id:Ct(i.sourceNote,i.title),title:String(i.title),client:String(i.client??"unknown"),ask:String(i.ask),sourceNote:String(i.sourceNote),confidence:Math.max(0,Math.min(1,Number(i.confidence)||0)),foundAt:r().toISOString()}))}let it=Promise.resolve(),ot=n=>(...a)=>{let c=it.then(()=>n(...a));return it=c.catch(()=>{}),c};async function ct(n,a,c,i,d={}){if(typeof a!="string"||a!==v.basename(a)||!a.endsWith(".md"))throw new Error("file must be a note basename");let m=v.join(n,a),N=await w.readFile(m,"utf-8"),$=Z(N).fields.status||"draft";Pe(i,$,c);let p=tt(N,"status",c);for(let[E,j]of Object.entries(d))p=tt(p,E,j);let g=`${m}.tmp`;return await w.writeFile(g,p),await w.rename(g,m),{ok:!0,status:c}}let V={"quotes:set-status":async({file:n,status:a}={})=>ct(h(),n,a,ze),"quotes:sweep":async(n={})=>{let a=await q(),i=(await at()).filter($=>n.force||a.seen[$.rel]!==$.mtimeMs),d={},m=[];for(let $=0;$<i.length;$+=et){let p=i.slice($,$+et);for(let g of p)g.excerpt=(await w.readFile(g.path,"utf-8").catch(()=>"")).slice(0,Ze),d[g.rel]=g.mtimeMs;t.ipc.send("quotes:sweep-progress",{done:Math.min($+et,i.length),total:i.length}),p.length&&m.push(...await Ut(p))}let N=Te(a,{items:m,scannedMtimes:d});return await nt(N),{items:N.items,sweptAt:r().toISOString(),scanned:i.length}},"quotes:dismiss":async n=>{if(typeof n!="string"||!n)throw new Error("dismiss needs an item id");let a=await q();return a.dismissed.includes(n)||a.dismissed.push(n),a.items=a.items.filter(c=>c.id!==n),await nt(a),{ok:!0}},"quotes:recent-notes":async()=>{let n=await at(),a=[];for(let c of n.slice(0,50)){let d=(await w.readFile(c.path,"utf-8").catch(()=>"")).slice(0,400).match(/^#\s+(.+)$/m)?.[1]??v.basename(c.rel,".md");a.push({path:c.rel,title:d,modified:c.modified})}return a},"quotes:manual":async n=>{if(typeof n!="string"||!n)throw new Error("manual needs a note path");let a=v.join(y(),n);if(!v.resolve(a).startsWith(v.resolve(y())))throw new Error("note path escapes the vault");await w.access(a);let c=v.basename(n,".md");return{id:Ct(n,c),title:c,client:"unknown",ask:"manually selected note",sourceNote:n,confidence:1,foundAt:r().toISOString()}},"quotes:draft":async(n={})=>{let a=n.notePath;if(n.itemId){let E=(await q()).items.find(j=>j.id===n.itemId);if(!E)throw new Error(`unknown work item: ${n.itemId}`);a=E.sourceNote}if(!a)throw new Error("draft needs an itemId or notePath");let c=v.join(y(),a),i=(await w.readFile(c,"utf-8")).slice(0,8e3),{rates:d}=f(),m=["default",...d.named.map(g=>g.name)],N=await st(`A freelancer needs a quote draft for the work request in this note.

--- note: ${a} ---
${i}
---

Rate names available (pick the best fit per line item): ${m.join(", ")}.
Break the work into 2-8 concrete line items with realistic hour estimates.
Return {"client", "project", "scopeSummary", "lineItems": [{"description", "hours", "rate"}], "assumptions": [...]}.`,nn),$=await C(),{client:p}=U($.clients,N.client);return{...N,sourceNote:a,clientId:p?.id}},"quotes:generate":async n=>{if(!n||typeof n!="object")throw new Error("generate needs a quote");if(!n.client||!Array.isArray(n.lineItems)||n.lineItems.length===0)throw new Error("quote needs a client and at least one line item");let{brand:a,rates:c}=f(),i=null;if(n.clientId){if(i=await _(n.clientId),!i)throw new Error(`unknown client: ${n.clientId}`)}else{let u=await C();i=U(u.clients,n.client).client}let d={...c,currency:i?.defaults?.currency||c.currency};i&&!n.clientId&&(n={...n,clientId:i.id});let m=Me(n,a,d,i||void 0),N=await s(m),$=h();await w.mkdir($,{recursive:!0});let p=i?.name||n.client,g=Ot(p,r());for(let u=2;;u++)try{await w.access(v.join($,`${g}.md`)),g=`${Ot(p,r())}-${u}`}catch{break}let E=v.join($,`${g}.md`),j=v.join($,`${g}.pdf`);return await w.writeFile(j,N),await w.writeFile(E,Be(n,a,d,i||void 0)),t.log("quote generated:",j),{pdfPath:j,notePath:E,clientId:n.clientId||i?.id||null}},"quotes:list":async()=>{let n;try{n=await w.readdir(h())}catch{return[]}let a=[];for(let c of n.filter(i=>i.endsWith(".md")).sort().reverse()){let d=(await w.readFile(v.join(h(),c),"utf-8").catch(()=>"")).match(/^---\n([\s\S]*?)\n---/)?.[1]??"",m=N=>d.match(new RegExp(`^${N}: "?(.*?)"?$`,"m"))?.[1]??"";a.push({file:c,client:m("client"),clientId:m("clientId")||null,project:m("project"),total:Number(m("total"))||0,currency:m("currency"),generated:m("generated"),pdf:n.includes(c.replace(/\.md$/,".pdf")),status:m("status")||"draft",invoiced:m("invoiced")==="true"})}return a},"invoices:counter":async()=>x(),"invoices:set-counter":ot(async({next:n}={})=>{let a=Number(n);if(!Number.isInteger(a)||a<1)throw new Error("next must be a positive integer");let c=await x();return await T({...c,next:a}),{ok:!0}}),"invoices:draft":async(n={})=>{let{invoicing:a,rates:c}=f(),i=await x(),d=G(i,r().getFullYear()),m=I(r()),N=I(new Date(r().getTime()+(Number(a.netDays)||14)*864e5)),$={number:d,issued:m,due:N,client:"",lineItems:[],vatRate:a.vatRate??0,currency:c.currency};if(n.quoteFile){if(n.quoteFile!==v.basename(n.quoteFile))throw new Error("quoteFile must be a basename");let p=await w.readFile(v.join(h(),n.quoteFile),"utf-8"),{fields:g}=Z(p),E=_e(p),j=await C(),u=g.clientId?j.clients.find(D=>D.id===g.clientId):U(j.clients,g.client).client;$={...$,client:g.client,clientId:u?.id,project:g.project,quoteRef:n.quoteFile,lineItems:E?.lineItems??[],vatRate:X({clientVat:u?.defaults?.vatRate,settingsVat:a.vatRate}),currency:u?.defaults?.currency||c.currency}}else if(n.clientId){let p=await _(n.clientId);if(!p)throw new Error(`unknown client: ${n.clientId}`);$={...$,client:p.name,clientId:p.id,vatRate:X({clientVat:p.defaults?.vatRate,settingsVat:a.vatRate}),currency:p.defaults?.currency||c.currency}}return $},"invoices:generate":ot(async n=>{if(!n||typeof n!="object")throw new Error("generate needs an invoice");if(!n.client||!Array.isArray(n.lineItems)||n.lineItems.length===0)throw new Error("invoice needs a client and at least one line item");let{brand:a,rates:c,invoicing:i}=f(),d=null;if(n.clientId){if(d=await _(n.clientId),!d)throw new Error(`unknown client: ${n.clientId}`)}else{let A=await C();d=U(A.clients,n.client).client}let m={...c,currency:n.currency||d?.defaults?.currency||c.currency},N=await x(),$=r().getFullYear(),p={...n,number:G(N,$),issued:n.issued||I(r()),due:n.due||I(new Date(r().getTime()+(Number(i.netDays)||14)*864e5)),vatRate:X({invoiceVat:n.vatRate,clientVat:d?.defaults?.vatRate,settingsVat:i.vatRate})},g=F();await w.mkdir(g,{recursive:!0});let E=N,j=Dt(d?.name||p.client,p.number);for(;;)try{await w.access(v.join(g,`${j}.md`)),E=Tt(E,$),p.number=G(E,$),j=Dt(d?.name||p.client,p.number)}catch{break}let u=Le(p,a,m,d||void 0),D=await s(u);if(await w.writeFile(v.join(g,`${j}.pdf`),D),await w.writeFile(v.join(g,`${j}.md`),Ue(p,a,m,d||void 0)),await T(Tt(E,$)),p.quoteRef)if(p.quoteRef!==v.basename(p.quoteRef)||!p.quoteRef.endsWith(".md"))t.log("quote invoiced-stamp skipped: quoteRef is not a safe basename:",p.quoteRef);else try{let A=v.join(h(),p.quoteRef),_t=await w.readFile(A,"utf-8"),zt=tt(_t,"invoiced","true"),lt=`${A}.tmp`;await w.writeFile(lt,zt),await w.rename(lt,A)}catch(A){t.log("quote invoiced-stamp failed:",A.message)}return t.log("invoice generated:",v.join(g,`${j}.pdf`)),{pdfPath:v.join(g,`${j}.pdf`),notePath:v.join(g,`${j}.md`),number:p.number}}),"invoices:list":async()=>{let n;try{n=await w.readdir(F())}catch{return[]}let a=[],c=r();for(let i of n.filter(d=>d.endsWith(".md")).sort().reverse()){let d=await w.readFile(v.join(F(),i),"utf-8").catch(()=>""),{fields:m}=Z(d),N=m.status||"draft",$={status:N,due:m.due},p=Ve($,c);a.push({file:i,number:m.number??"",client:m.client??"",clientId:m.clientId||null,project:m.project??"",quoteRef:m.quoteRef||null,total:Number(m.total)||0,currency:m.currency??"",issued:m.issued??"",due:m.due??"",status:N,paidAt:m.paidAt||null,overdue:p,daysOverdue:p?Math.floor((c.getTime()-new Date(m.due).getTime())/864e5):0,pdf:n.includes(i.replace(/\.md$/,".pdf"))})}return a},"invoices:set-status":async({file:n,status:a}={})=>{let c=a==="paid"?{paidAt:r().toISOString()}:{};return ct(F(),n,a,Je,c)},"clients:list":async(n={})=>{let a=await C(),c=He(a.clients,n.status??"all");return n.q&&(c=We(c,n.q)),c.sort((i,d)=>i.name.localeCompare(d.name))},"clients:get":async n=>{if(typeof n!="string"||!n)throw new Error("get needs a client id");let a=await _(n);if(!a)throw new Error(`unknown client: ${n}`);return a},"clients:upsert":async n=>{let a=await C(),{store:c,client:i}=Qe(a,n,r);return await J(c),await P(i),i},"clients:archive":async n=>{if(typeof n!="string"||!n)throw new Error("archive needs a client id");let a=await C(),c=Ye(a,n);await J(c);let i=c.clients.find(d=>d.id===n);return i&&await P(i),{ok:!0}},"clients:resolve":async n=>{if(typeof n!="string")throw new Error("resolve needs a name string");let a=await C();return U(a.clients,n)},"clients:bootstrap":async()=>{let n=await C(),a=[];try{let m=await w.readdir(h());for(let N of m.filter($=>$.endsWith(".md"))){let g=((await w.readFile(v.join(h(),N),"utf-8").catch(()=>"")).match(/^---\n([\s\S]*?)\n---/)?.[1]??"").match(/^client: "?(.*?)"?$/m)?.[1];g&&a.push(g)}}catch{}let c=await q();for(let m of c.items??[])m.client&&a.push(m.client);let{store:i,created:d}=Ke(n,a,r);await J(i);for(let m of i.clients)(m.tags??[]).includes("bootstrap")&&await P(m);return{created:d,linked:a.length}},"dashboard:summary":async()=>{let n=await q(),a=await V["quotes:list"](),c=await V["invoices:list"](),{rates:i}=f(),d=(u,D)=>u.filter(A=>A.status===D).length,m=u=>String(u??"").slice(0,7),N=m(r().toISOString()),$=m(new Date(r().getFullYear(),r().getMonth()-1,15).toISOString()),p=c.filter(u=>u.status==="paid"),g=u=>Math.round(u.reduce((D,A)=>D+A.total,0)*100)/100,E=[...n.items.map(u=>({kind:"workItem",label:`${u.client} \u2014 ${u.title}`,ref:u.id})),...a.filter(u=>u.status==="accepted"&&!u.invoiced).map(u=>({kind:"acceptedQuote",label:`${u.client} \u2014 ${u.project}`,ref:u.file})),...c.filter(u=>u.overdue).map(u=>({kind:"overdueInvoice",label:`${u.number} \u2014 ${u.client} \u2014 ${u.daysOverdue}d overdue`,ref:u.file}))],j=[...a.map(u=>({kind:"quote",label:`quote ${u.status} \u2014 ${u.client}`,when:u.generated})),...c.map(u=>({kind:"invoice",label:`invoice ${u.status} \u2014 ${u.number}`,when:u.issued})),...p.map(u=>({kind:"paid",label:`paid \u2014 ${u.number} \u2014 ${qe(u.total,u.currency||i.currency)}`,when:u.paidAt}))].filter(u=>u.when).sort((u,D)=>u.when<D.when?1:-1).slice(0,10);return{workItems:n.items.length,quotes:{draft:d(a,"draft"),sent:d(a,"sent"),accepted:d(a,"accepted"),declined:d(a,"declined")},invoices:{draft:d(c,"draft"),sent:d(c,"sent"),paid:p.length,overdue:c.filter(u=>u.overdue).length,unpaidTotal:g(c.filter(u=>u.status==="sent")),currency:i.currency},revenue:{thisMonth:g(p.filter(u=>m(u.paidAt)===N)),lastMonth:g(p.filter(u=>m(u.paidAt)===$)),currency:i.currency},attention:E,activity:j}}};return V}var Bt=null;module.exports={activate(t){let e=Mt(t);for(let[s,r]of Object.entries(e))t.ipc.handle(s,r);Bt=t,t.log("freelancer activated")},deactivate(){Bt=null},createHandlers:Mt};
