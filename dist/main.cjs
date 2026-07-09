var M=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var W=M((on,lt)=>{function Jt(t,e){let s=new Map((e.named??[]).map(o=>[o.name,o.hourly])),r=(t??[]).map(o=>{let f=s.get(o.rate)??e.default??0,y=Number.isFinite(Number(o.hours))?Number(o.hours):0;return{description:String(o.description??""),hours:y,rateName:s.has(o.rate)?o.rate:"default",hourly:f,amount:Math.round(y*f*100)/100}}),l=Math.round(r.reduce((o,f)=>o+f.amount,0)*100)/100;return{rows:r,total:l}}function Pt(t,e){try{return new Intl.NumberFormat("en-IE",{style:"currency",currency:e}).format(t)}catch{return`${e} ${t.toFixed(2)}`}}lt.exports={computeTotals:Jt,formatMoney:Pt}});var L=M((cn,ut)=>{var{createHash:Vt}=require("node:crypto"),{computeTotals:Wt,formatMoney:Ht}=W();function Qt(t,{items:e,scannedMtimes:s}){let r=new Set(t.dismissed??[]),l=new Map((t.items??[]).map(o=>[o.id,o]));for(let o of e??[])!r.has(o.id)&&!l.has(o.id)&&l.set(o.id,o);return{seen:{...t.seen??{},...s??{}},items:[...l.values()].filter(o=>!r.has(o.id)),dismissed:[...r]}}function Yt(t,e){return Vt("sha1").update(`${t}
${e}`).digest("hex").slice(0,12)}function Kt(t){let e=String(t??"").trim(),s=e.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);s&&(e=s[1]);let r=e.indexOf("{"),l=e.lastIndexOf("}");if(r===-1||l===-1)throw new Error(`expected JSON object, got: ${e.slice(0,120)}`);try{return JSON.parse(e.slice(r,l+1))}catch(o){throw new Error(`invalid JSON (${o.message}): ${e.slice(0,120)}`)}}function dt(t){return String(t??"").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").trim().replace(/[\s_]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"client"}function Gt(t,e){let s=e instanceof Date?e:new Date(e),r=`${s.getFullYear()}${String(s.getMonth()+1).padStart(2,"0")}${String(s.getDate()).padStart(2,"0")}`;return`quote-${dt(t)}-${r}`}ut.exports={computeTotals:Wt,formatMoney:Ht,mergeSweep:Qt,itemId:Yt,parseStrictJson:Kt,slug:dt,quoteBasename:Gt}});var Q=M((ln,gt)=>{var{createHash:Xt,randomBytes:mt}=require("node:crypto"),{slug:ft}=L(),pt=new Set(["prospect","active","inactive","archived"]),Zt=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;function z(){return{version:1,clients:[]}}function B(t){return String(t??"").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").trim().replace(/[\s_]+/g," ").replace(/\s+/g," ")}function H(t){return t?Xt("sha1").update(String(t)).digest("hex").slice(0,12):mt(6).toString("hex")}function te(t){return H(t||mt(8).toString("hex"))}function k(t,e=500){if(t==null)return;let s=String(t).trim();if(s)return s.slice(0,e)}function ht(t,e){if(!t)return;let s=String(t).trim();if(s){if(!Zt.test(s))throw new Error(`${e} is not a valid email: ${s}`);return s.slice(0,200)}}function ee(t,e){if(!t||typeof t!="object")throw new Error(`contact ${e}: expected object`);let s=k(t.name,120);if(!s)throw new Error(`contact ${e}: name is required`);return{id:typeof t.id=="string"&&t.id?t.id:te(`${s}-${e}`),name:s,email:ht(t.email,`contact ${e} email`),phone:k(t.phone,40),role:k(t.role,80),primary:!!t.primary}}function ne(t){if(!t||typeof t!="object")return{};let e=Array.isArray(t.addressLines)?t.addressLines.map(s=>k(s,120)).filter(Boolean).slice(0,4):void 0;return{email:ht(t.email,"billing email"),addressLines:e?.length?e:void 0,city:k(t.city,80),region:k(t.region,80),postalCode:k(t.postalCode,20),country:k(t.country,80),taxId:k(t.taxId,40)}}function re(t){if(!t||typeof t!="object")return{};let e=k(t.currency,3),s;if(t.vatRate!==void 0&&t.vatRate!==null&&String(t.vatRate).trim()!==""){let r=Number(t.vatRate);if(Number.isFinite(r)){if(r<0||r>100)throw new Error(`vatRate must be 0-100, got ${r}`);s=r}}return{currency:e?e.toUpperCase():void 0,rateName:k(t.rateName,60),paymentTerms:k(t.paymentTerms,200),vatRate:s}}function wt(t,{now:e=()=>new Date}={}){if(!t||typeof t!="object")throw new Error("client payload required");let s=k(t.name,120);if(!s)throw new Error("client name is required");let r=t.status??"prospect";if(!pt.has(r))throw new Error(`invalid status: ${r}`);let l=Array.isArray(t.contacts)?t.contacts.map((b,R)=>ee(b,R)):[],o=!1;for(let b of l)b.primary&&(o?b.primary=!1:o=!0);l.length&&!o&&(l[0].primary=!0);let f=Array.isArray(t.tags)?[...new Set(t.tags.map(b=>k(b,40)).filter(Boolean))]:[],y=Array.isArray(t.sourceNotes)?[...new Set(t.sourceNotes.map(b=>k(b,500)).filter(Boolean))]:[],p=e().toISOString();return{id:typeof t.id=="string"&&/^[a-z0-9-]{6,32}$/i.test(t.id)?t.id:H(`${s}
${p}`),name:s,legalName:k(t.legalName,160),status:r,tags:f,website:k(t.website,300),contacts:l,billing:ne(t.billing),defaults:re(t.defaults),notes:k(t.notes,8e3),sourceNotes:y,createdAt:typeof t.createdAt=="string"&&t.createdAt?t.createdAt:p,updatedAt:p}}function ae(t,e){let s=String(e??"").trim().toLowerCase();return s?(t??[]).filter(r=>[r.name,r.legalName,...r.tags??[],...(r.contacts??[]).flatMap(o=>[o.name,o.email]),r.billing?.email,r.billing?.taxId].filter(Boolean).join(" ").toLowerCase().includes(s)):[...t??[]]}function se(t,e){return!e||e==="all"?(t??[]).filter(s=>s.status!=="archived"):(t??[]).filter(s=>s.status===e)}function ie(t,e){let s=t??[],r=B(e);if(!r)return{client:null,candidates:[]};let l=s.filter(f=>B(f.name)===r&&f.status!=="archived");if(l.length===1)return{client:l[0],candidates:l};if(l.length>1)return{client:null,candidates:l};let o=s.filter(f=>f.status!=="archived"&&B(f.name).includes(r));return o.length===1?{client:o[0],candidates:o}:{client:null,candidates:o}}function yt(t,e,s=()=>new Date){let l=[...(t?.clients?t:z()).clients??[]],o=wt(e,{now:s}),f=l.findIndex(y=>y.id===o.id);return f>=0?(o.createdAt=l[f].createdAt,l[f]=o):l.push(o),{store:{version:1,clients:l},client:o}}function oe(t,e){let s=t?.clients?t:z(),r=(s.clients??[]).map(l=>l.id===e?{...l,status:"archived",updatedAt:new Date().toISOString()}:l);if(!(s.clients??[]).some(l=>l.id===e))throw new Error(`unknown client: ${e}`);return{version:1,clients:r}}function ce(t,e,s=()=>new Date){let r=t?.clients?{version:1,clients:[...t.clients]}:z(),l=0,o=new Set(r.clients.map(f=>B(f.name)));for(let f of e??[]){let y=k(f,120);if(!y)continue;let p=B(y);if(!p||p==="unknown"||o.has(p))continue;let{store:F,client:b}=yt(r,{name:y,status:"active",tags:["bootstrap"]},s);r=F,o.add(p),l+=1}return{store:r,created:l}}function le(t){let e=t?.contacts??[];return e.find(s=>s.primary)||e[0]||null}function de(t){let e=`client-${ft(t.name)}`,s=(t.contacts??[]).map(p=>`- ${[p.name,p.role,p.email,p.phone].filter(Boolean).join(" \xB7 ")}${p.primary?" (primary)":""}`).join(`
`),r=t.billing??{},l=[...r.addressLines??[],[r.city,r.postalCode].filter(Boolean).join(" "),r.region,r.country].filter(Boolean).join(`
`),o=(t.tags??[]).map(p=>JSON.stringify(p)).join(", "),f=p=>String(p??"").replace(/"/g,'\\"'),y=`---
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
`;return{basename:e,markdown:y}}gt.exports={STATUSES:pt,emptyStore:z,normalizeClientName:B,newId:H,validateClient:wt,matchClients:ae,filterByStatus:se,resolveClient:ie,mergeUpsert:yt,archiveClient:oe,bootstrapFromNames:ce,primaryContact:le,clientVaultNote:de,slug:ft}});var Y=M((dn,bt)=>{var{computeTotals:ue}=W(),{slug:me}=L();function fe(t){return String(t).padStart(3,"0")}function $t(t,e){return t.yearReset&&e!==t.year?{...t,year:e,next:1}:t}function vt({prefix:t,year:e,next:s}){return`${t}-${e}-${fe(s)}`}function pe(t,e){return vt($t(t,e))}function he(t,e){let s=$t(t,e);return{...s,next:s.next+1}}function we(t,e,s){let{rows:r,total:l}=ue(t,e),o=Number.isFinite(Number(s))?Number(s):0,f=Math.round(l*(o/100)*100)/100,y=Math.round((l+f)*100)/100;return{rows:r,subtotal:l,vatRate:o,vatAmount:f,total:y}}function ye(t,e){return`invoice-${me(t)}-${e}`}var ge=/<!-- freelancer:data (\{[\s\S]*?\}) -->/;function $e(t){return`<!-- freelancer:data ${JSON.stringify(t)} -->`}function ve(t){let e=String(t??"").match(ge);if(!e)return null;try{return JSON.parse(e[1])}catch{return null}}function be({invoiceVat:t,clientVat:e,settingsVat:s}={}){for(let r of[t,e,s])if(r!=null&&Number.isFinite(Number(r)))return Number(r);return 0}bt.exports={formatInvoiceNumber:vt,advanceCounter:he,currentNumber:pe,computeInvoiceTotals:we,invoiceBasename:ye,dataComment:$e,parseDataComment:ve,resolveVatRate:be}});var kt=M((un,jt)=>{var{computeTotals:St,formatMoney:T}=L(),{primaryContact:Se}=Q(),{computeInvoiceTotals:It,dataComment:Nt}=Y();function v(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function K(t,e){let s=e?.legalName||e?.name||t.client,r=[`    <h2>${v(s)}</h2>`];e?.legalName&&e.name&&e.legalName!==e.name&&r.push(`    <div class="sub">${v(e.name)}</div>`);let l=Se(e);if(l){let p=[l.name,l.role,l.email,l.phone].filter(Boolean).join(" \xB7 ");r.push(`    <div class="sub">${v(p)}</div>`)}let o=e?.billing??{};for(let p of o.addressLines??[])r.push(`    <div class="sub">${v(p)}</div>`);let y=[[o.postalCode,o.city].filter(Boolean).join(" "),o.region,o.country].filter(Boolean).join(", ");return y&&r.push(`    <div class="sub">${v(y)}</div>`),o.email&&(!l||l.email!==o.email)&&r.push(`    <div class="sub">${v(o.email)}</div>`),o.taxId&&r.push(`    <div class="sub">Tax ID: ${v(o.taxId)}</div>`),t.project&&r.push(`    <div style="margin-top:6px">${v(t.project)}</div>`),r.join(`
`)}function xt(t){return`
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
`}function Ie(t,e,s,r){let{rows:l,total:o}=St(t.lineItems,s),f=/^#[0-9a-fA-F]{3,8}$/.test(e.accentColor??"")?e.accentColor:"#C5FF3D",y=S=>v(T(S,s.currency??"EUR")),p=new Date,F=new Date(p.getTime()+(Number(e.validityDays)||14)*864e5),b=S=>S.toISOString().slice(0,10),R=r?.defaults?.paymentTerms||e.paymentTerms||"",x=l.map(S=>`      <tr>
        <td>${v(S.description)}</td>
        <td class="num">${v(String(S.hours))}</td>
        <td class="num">${y(S.hourly)}</td>
        <td class="num">${y(S.amount)}</td>
      </tr>`).join(`
`),D=(t.assumptions??[]).map(S=>`      <li>${v(S)}</li>`).join(`
`);return`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${xt(f)}</style>
</head>
<body>
  <header>
    <div class="brand">
      ${e.logoDataUri?`<img src="${v(e.logoDataUri)}" alt="">`:""}
      <div>
        <div class="name">${v(e.businessName||"Quote")}</div>
        <div class="contact">${v(e.contactLine??"")}</div>
      </div>
    </div>
    <div class="doc">
      <div class="title">QUOTE</div>
      <div class="meta">date ${b(p)}<br>valid until ${b(F)}</div>
    </div>
  </header>

  <div class="block">
    <div class="label">prepared for</div>
${K(t,r)}
  </div>

  <div class="block">
    <div class="label">scope</div>
    <div>${v(t.scopeSummary??"")}</div>
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

${D?`  <div class="block">
    <div class="label">assumptions</div>
    <ul>
${D}
    </ul>
  </div>
`:""}
  <footer>
    <span>${v(R)}</span>
    <span>${v(e.businessName??"")}</span>
  </footer>
</body>
</html>`}function Ne(t,e,s,r){let{rows:l,total:o}=St(t.lineItems,s),f=s.currency??"EUR",y=r?.defaults?.paymentTerms||e.paymentTerms||"",p=r?.legalName||r?.name||t.client,F=l.map(x=>`| ${x.description.replace(/\|/g,"\\|")} | ${x.hours} | ${T(x.hourly,f)} | ${T(x.amount,f)} |`).join(`
`),b=x=>String(x??"").replace(/"/g,'\\"'),R=t.clientId||r?.id?`clientId: "${b(t.clientId||r?.id)}"
`:"";return`---
client: "${b(p)}"
${R}project: "${b(t.project)}"
total: ${o}
currency: ${f}
status: draft
source: "${b(t.sourceNote)}"
generated: ${new Date().toISOString()}
---

# Quote \u2014 ${p}

**Project:** ${t.project??""}

## Scope

${t.scopeSummary??""}

## Line items

| item | hours | rate | amount |
|------|-------|------|--------|
${F}

**Total: ${T(o,f)}**

## Assumptions

${(t.assumptions??[]).map(x=>`- ${x}`).join(`
`)}

## Terms

${y} \u2014 valid ${Number(e.validityDays)||14} days.

${Nt({lineItems:t.lineItems??[]})}
`}function xe(t,e,s,r){let{rows:l,subtotal:o,vatRate:f,vatAmount:y,total:p}=It(t.lineItems,s,t.vatRate),F=/^#[0-9a-fA-F]{3,8}$/.test(e.accentColor??"")?e.accentColor:"#C5FF3D",b=S=>v(T(S,s.currency??"EUR")),R=r?.defaults?.paymentTerms||e.paymentTerms||"",x=l.map(S=>`      <tr>
        <td>${v(S.description)}</td>
        <td class="num">${v(String(S.hours))}</td>
        <td class="num">${b(S.hourly)}</td>
        <td class="num">${b(S.amount)}</td>
      </tr>`).join(`
`),D=f>0?`        <tr><td colspan="3" class="sub">vat ${v(String(f))}%</td><td class="num">${b(y)}</td></tr>
`:"";return`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${xt(F)}</style>
</head>
<body>
  <header>
    <div class="brand">
      ${e.logoDataUri?`<img src="${v(e.logoDataUri)}" alt="">`:""}
      <div>
        <div class="name">${v(e.businessName||"Invoice")}</div>
        <div class="contact">${v(e.contactLine??"")}</div>
      </div>
    </div>
    <div class="doc">
      <div class="title">INVOICE</div>
      <div class="meta">${v(t.number)}<br>issued ${v(t.issued)}<br>due ${v(t.due)}</div>
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
        <tr><td colspan="3" class="sub">subtotal</td><td class="num">${b(o)}</td></tr>
${D}        <tr class="total-row"><td colspan="3">total due</td><td class="num amount">${b(p)}</td></tr>
      </tbody>
    </table>
  </div>

  <footer>
    <span>${v(R)}${R?" \xB7 ":""}payable to ${v(e.contactLine??e.businessName??"")}</span>
    <span>${v(t.number)}</span>
  </footer>
</body>
</html>`}function je(t,e,s,r){let{rows:l,subtotal:o,vatRate:f,vatAmount:y,total:p}=It(t.lineItems,s,t.vatRate),F=s.currency??"EUR",b=r?.legalName||r?.name||t.client,R=S=>String(S??"").replace(/"/g,'\\"'),x=(S,q)=>q?`${S}: "${R(q)}"
`:"",D=l.map(S=>`| ${S.description.replace(/\|/g,"\\|")} | ${S.hours} | ${T(S.hourly,F)} | ${T(S.amount,F)} |`).join(`
`);return`---
number: "${R(t.number)}"
client: "${R(b)}"
${x("clientId",t.clientId||r?.id)}${x("quoteRef",t.quoteRef)}${x("project",t.project)}issued: ${t.issued}
due: ${t.due}
subtotal: ${o}
vatRate: ${f}
vatAmount: ${y}
total: ${p}
currency: ${F}
status: draft
generated: ${new Date().toISOString()}
---

# Invoice ${t.number} \u2014 ${b}

| item | hours | rate | amount |
|------|-------|------|--------|
${D}

subtotal ${T(o,F)}${f>0?`
vat ${f}% ${T(y,F)}`:""}
**Total due: ${T(p,F)}** \u2014 due ${t.due}

${Nt({lineItems:t.lineItems??[]})}
`}jt.exports={esc:v,billToHtml:K,renderQuoteHtml:Ie,quoteMarkdown:Ne,renderInvoiceHtml:xe,invoiceMarkdown:je}});var Et=M((mn,Rt)=>{var Ft=/^---\n([\s\S]*?)\n---/;function ke(t){let e=String(t??"").match(Ft),s={};if(e)for(let r of e[1].split(`
`)){let l=r.match(/^(\w[\w-]*):\s*"?(.*?)"?\s*$/);l&&(s[l[1]]=l[2])}return{fields:s,body:e?t.slice(e[0].length):String(t??"")}}function Fe(t,e,s){let r=String(t??"").match(Ft);if(!r)throw new Error("note has no frontmatter block");let l=r[1].split(`
`),o=l.findIndex(f=>f.startsWith(`${e}:`));return o>=0?l[o]=`${e}: ${s}`:l.push(`${e}: ${s}`),`---
${l.join(`
`)}
---`+t.slice(r[0].length)}var Re={draft:["sent"],sent:["accepted","declined"],declined:["sent"],accepted:[]},Ee={draft:["sent"],sent:["paid"],paid:[]};function Ae(t,e,s){if(!t[e]||!t[e].includes(s))throw new Error(`invalid transition: ${e} -> ${s}`)}function Ce(t,e){return t.status!=="sent"||!t.due?!1:t.due<e.toISOString().slice(0,10)}Rt.exports={parseFrontmatter:ke,setFrontmatterField:Fe,QUOTE_TRANSITIONS:Re,INVOICE_TRANSITIONS:Ee,assertTransition:Ae,isOverdue:Ce}});var w=require("node:fs/promises"),$=require("node:path"),Oe=require("node:os"),{mergeSweep:Te,itemId:At,parseStrictJson:De,quoteBasename:Ct,formatMoney:qe}=L(),{renderQuoteHtml:Me,quoteMarkdown:Be,renderInvoiceHtml:Le,invoiceMarkdown:Ue}=kt(),{currentNumber:G,advanceCounter:Ot,invoiceBasename:Tt,parseDataComment:_e,resolveVatRate:X}=Y(),{parseFrontmatter:Z,setFrontmatterField:tt,QUOTE_TRANSITIONS:ze,INVOICE_TRANSITIONS:Je,assertTransition:Pe,isOverdue:Ve}=Et(),{emptyStore:Dt,matchClients:We,filterByStatus:He,resolveClient:U,mergeUpsert:Qe,archiveClient:Ye,bootstrapFromNames:Ke,clientVaultNote:Ge}=Q(),Xe=14,Ze=2e3,et=10,tn={vaultPath:"~/ghostbrain/vault",brand:{businessName:"",logoDataUri:"",accentColor:"#C5FF3D",contactLine:"",paymentTerms:"50% upfront, balance on delivery",validityDays:14},rates:{currency:"EUR",default:0,named:[]},invoicing:{prefix:"INV",vatRate:0,netDays:14,yearReset:!0}},en={type:"object",properties:{items:{type:"array",items:{type:"object",properties:{title:{type:"string"},client:{type:"string"},ask:{type:"string"},sourceNote:{type:"string"},confidence:{type:"number"}},required:["title","client","ask","sourceNote","confidence"]}}},required:["items"]},nn={type:"object",properties:{client:{type:"string"},project:{type:"string"},scopeSummary:{type:"string"},lineItems:{type:"array",items:{type:"object",properties:{description:{type:"string"},hours:{type:"number"},rate:{type:"string"}},required:["description","hours","rate"]}},assumptions:{type:"array",items:{type:"string"}}},required:["client","project","scopeSummary","lineItems","assumptions"]};function rn(t){return t.startsWith("~")?$.join(Oe.homedir(),t.slice(1)):t}function Bt(t,e){if(e==null)return t;if(typeof t!="object"||Array.isArray(t)||t===null)return e;let s={...t};for(let r of Object.keys(e))s[r]=Bt(t[r],e[r]);return s}async function an(t){let{BrowserWindow:e}=require("electron"),s=new e({show:!1,webPreferences:{sandbox:!0,javascript:!1}});try{return await s.loadURL("data:text/html;charset=utf-8,"+encodeURIComponent(t)),await s.webContents.printToPDF({pageSize:"A4",printBackground:!0})}finally{s.destroy()}}function qt(t,e={}){let s=e.renderPdf??an,r=e.now??(()=>new Date),l=$.join(t.dataDir,"work-items.json"),o=$.join(t.dataDir,"clients.json"),f=()=>Bt(tn,t.settings.get("config")??{}),y=()=>rn(f().vaultPath),p=()=>$.join(y(),"30-cross-context","quotes"),F=()=>$.join(y(),"30-cross-context","clients"),b=$.join(t.dataDir,"counter.json"),R=()=>$.join(y(),"30-cross-context","invoices");async function x(){let{invoicing:n}=f();try{return JSON.parse(await w.readFile(b,"utf-8"))}catch{return{prefix:n.prefix,year:r().getFullYear(),next:1,yearReset:n.yearReset}}}async function D(n){await w.mkdir(t.dataDir,{recursive:!0});let a=`${b}.tmp`;await w.writeFile(a,JSON.stringify(n,null,2)),await w.rename(a,b)}function S(n){return n.toISOString().slice(0,10)}async function q(){try{return JSON.parse(await w.readFile(l,"utf-8"))}catch{return{seen:{},items:[],dismissed:[]}}}async function nt(n){await w.mkdir(t.dataDir,{recursive:!0}),await w.writeFile(l,JSON.stringify(n,null,2))}async function O(){try{let n=JSON.parse(await w.readFile(o,"utf-8"));return!n||!Array.isArray(n.clients)?Dt():{version:1,clients:n.clients}}catch{return Dt()}}async function J(n){await w.mkdir(t.dataDir,{recursive:!0});let a=`${o}.tmp`;await w.writeFile(a,JSON.stringify(n,null,2)),await w.rename(a,o)}async function P(n){try{let a=F();await w.mkdir(a,{recursive:!0});let{basename:c,markdown:i}=Ge(n);await w.writeFile($.join(a,`${c}.md`),i)}catch(a){t.log("client vault mirror failed:",a.message)}}async function _(n){return(await O()).clients.find(c=>c.id===n)??null}async function rt(n,a){let c;try{c=await w.readdir(n,{withFileTypes:!0})}catch{return}for(let i of c){let u=$.join(n,i.name);i.isDirectory()?await rt(u,a):i.isFile()&&i.name.endsWith(".md")&&a.push(u)}}async function at(){let n=y(),a=[];for(let u of["00-inbox","20-contexts"])await rt($.join(n,u),a);let c=r().getTime()-Xe*864e5,i=[];for(let u of a){let m=await w.stat(u).catch(()=>null);m&&m.mtimeMs>=c&&i.push({path:u,rel:$.relative(n,u),mtimeMs:m.mtimeMs,modified:m.mtime.toISOString()})}return i.sort((u,m)=>m.mtimeMs-u.mtimeMs)}async function st(n,a){let c=async i=>{let u=await t.api.fetch("POST","/v1/llm/run",{prompt:i,system:"You extract structured data for a freelancing tool. Respond with STRICT JSON matching the requested shape. No prose.",jsonSchema:a});if(!u.ok)throw new Error(`llm call failed: ${u.error}`);if(u.data.error)throw new Error(`llm error: ${u.data.error}`);return u.data.structured?u.data.structured:De(u.data.text)};try{return await c(n)}catch(i){return t.log("llm json retry:",i.message),c(`${n}

Your previous reply was not valid JSON (${i.message}). Reply with ONLY the JSON object.`)}}async function Lt(n){let a=n.map(i=>`--- note: ${i.rel} ---
${i.excerpt}`).join(`

`);return((await st(`Below are recent notes from a personal knowledge vault (emails, chat threads, meeting notes).
Find INCOMING WORK REQUESTS a freelancer could quote: someone asking for work to be done, a project inquiry, a "can you build/fix/design X" ask.
Ignore: the vault owner's own todos, newsletters, receipts, status updates, anything already quoted.
For each request return title (short), client (person/company asking), ask (1-2 sentence summary of the work), sourceNote (the exact note path shown above), confidence (0-1).
Return {"items": [...]}. Empty array if none.

${a}`,en)).items??[]).filter(i=>i&&i.title&&i.ask&&i.sourceNote).map(i=>({id:At(i.sourceNote,i.title),title:String(i.title),client:String(i.client??"unknown"),ask:String(i.ask),sourceNote:String(i.sourceNote),confidence:Math.max(0,Math.min(1,Number(i.confidence)||0)),foundAt:r().toISOString()}))}let it=Promise.resolve(),Ut=n=>(...a)=>{let c=it.then(()=>n(...a));return it=c.catch(()=>{}),c};async function ot(n,a,c,i,u={}){if(typeof a!="string"||a!==$.basename(a)||!a.endsWith(".md"))throw new Error("file must be a note basename");let m=$.join(n,a),N=await w.readFile(m,"utf-8"),g=Z(N).fields.status||"draft";Pe(i,g,c);let h=tt(N,"status",c);for(let[A,j]of Object.entries(u))h=tt(h,A,j);let I=`${m}.tmp`;return await w.writeFile(I,h),await w.rename(I,m),{ok:!0,status:c}}let V={"quotes:set-status":async({file:n,status:a}={})=>ot(p(),n,a,ze),"quotes:sweep":async(n={})=>{let a=await q(),i=(await at()).filter(g=>n.force||a.seen[g.rel]!==g.mtimeMs),u={},m=[];for(let g=0;g<i.length;g+=et){let h=i.slice(g,g+et);for(let I of h)I.excerpt=(await w.readFile(I.path,"utf-8").catch(()=>"")).slice(0,Ze),u[I.rel]=I.mtimeMs;t.ipc.send("quotes:sweep-progress",{done:Math.min(g+et,i.length),total:i.length}),h.length&&m.push(...await Lt(h))}let N=Te(a,{items:m,scannedMtimes:u});return await nt(N),{items:N.items,sweptAt:r().toISOString(),scanned:i.length}},"quotes:dismiss":async n=>{if(typeof n!="string"||!n)throw new Error("dismiss needs an item id");let a=await q();return a.dismissed.includes(n)||a.dismissed.push(n),a.items=a.items.filter(c=>c.id!==n),await nt(a),{ok:!0}},"quotes:recent-notes":async()=>{let n=await at(),a=[];for(let c of n.slice(0,50)){let u=(await w.readFile(c.path,"utf-8").catch(()=>"")).slice(0,400).match(/^#\s+(.+)$/m)?.[1]??$.basename(c.rel,".md");a.push({path:c.rel,title:u,modified:c.modified})}return a},"quotes:manual":async n=>{if(typeof n!="string"||!n)throw new Error("manual needs a note path");let a=$.join(y(),n);if(!$.resolve(a).startsWith($.resolve(y())))throw new Error("note path escapes the vault");await w.access(a);let c=$.basename(n,".md");return{id:At(n,c),title:c,client:"unknown",ask:"manually selected note",sourceNote:n,confidence:1,foundAt:r().toISOString()}},"quotes:draft":async(n={})=>{let a=n.notePath;if(n.itemId){let A=(await q()).items.find(j=>j.id===n.itemId);if(!A)throw new Error(`unknown work item: ${n.itemId}`);a=A.sourceNote}if(!a)throw new Error("draft needs an itemId or notePath");let c=$.join(y(),a),i=(await w.readFile(c,"utf-8")).slice(0,8e3),{rates:u}=f(),m=["default",...u.named.map(I=>I.name)],N=await st(`A freelancer needs a quote draft for the work request in this note.

--- note: ${a} ---
${i}
---

Rate names available (pick the best fit per line item): ${m.join(", ")}.
Break the work into 2-8 concrete line items with realistic hour estimates.
Return {"client", "project", "scopeSummary", "lineItems": [{"description", "hours", "rate"}], "assumptions": [...]}.`,nn),g=await O(),{client:h}=U(g.clients,N.client);return{...N,sourceNote:a,clientId:h?.id}},"quotes:generate":async n=>{if(!n||typeof n!="object")throw new Error("generate needs a quote");if(!n.client||!Array.isArray(n.lineItems)||n.lineItems.length===0)throw new Error("quote needs a client and at least one line item");let{brand:a,rates:c}=f(),i=null;if(n.clientId){if(i=await _(n.clientId),!i)throw new Error(`unknown client: ${n.clientId}`)}else{let d=await O();i=U(d.clients,n.client).client}let u={...c,currency:i?.defaults?.currency||c.currency};i&&!n.clientId&&(n={...n,clientId:i.id});let m=Me(n,a,u,i||void 0),N=await s(m),g=p();await w.mkdir(g,{recursive:!0});let h=i?.name||n.client,I=Ct(h,r());for(let d=2;;d++)try{await w.access($.join(g,`${I}.md`)),I=`${Ct(h,r())}-${d}`}catch{break}let A=$.join(g,`${I}.md`),j=$.join(g,`${I}.pdf`);return await w.writeFile(j,N),await w.writeFile(A,Be(n,a,u,i||void 0)),t.log("quote generated:",j),{pdfPath:j,notePath:A,clientId:n.clientId||i?.id||null}},"quotes:list":async()=>{let n;try{n=await w.readdir(p())}catch{return[]}let a=[];for(let c of n.filter(i=>i.endsWith(".md")).sort().reverse()){let u=(await w.readFile($.join(p(),c),"utf-8").catch(()=>"")).match(/^---\n([\s\S]*?)\n---/)?.[1]??"",m=N=>u.match(new RegExp(`^${N}: "?(.*?)"?$`,"m"))?.[1]??"";a.push({file:c,client:m("client"),clientId:m("clientId")||null,project:m("project"),total:Number(m("total"))||0,currency:m("currency"),generated:m("generated"),pdf:n.includes(c.replace(/\.md$/,".pdf")),status:m("status")||"draft",invoiced:m("invoiced")==="true"})}return a},"invoices:counter":async()=>x(),"invoices:set-counter":async({next:n}={})=>{let a=Number(n);if(!Number.isInteger(a)||a<1)throw new Error("next must be a positive integer");let c=await x();return await D({...c,next:a}),{ok:!0}},"invoices:draft":async(n={})=>{let{invoicing:a,rates:c}=f(),i=await x(),u=G(i,r().getFullYear()),m=S(r()),N=S(new Date(r().getTime()+(Number(a.netDays)||14)*864e5)),g={number:u,issued:m,due:N,client:"",lineItems:[],vatRate:a.vatRate??0,currency:c.currency};if(n.quoteFile){if(n.quoteFile!==$.basename(n.quoteFile))throw new Error("quoteFile must be a basename");let h=await w.readFile($.join(p(),n.quoteFile),"utf-8"),{fields:I}=Z(h),A=_e(h),j=await O(),d=I.clientId?j.clients.find(E=>E.id===I.clientId):U(j.clients,I.client).client;g={...g,client:I.client,clientId:d?.id,project:I.project,quoteRef:n.quoteFile,lineItems:A?.lineItems??[],vatRate:X({clientVat:d?.defaults?.vatRate,settingsVat:a.vatRate}),currency:d?.defaults?.currency||c.currency}}else if(n.clientId){let h=await _(n.clientId);if(!h)throw new Error(`unknown client: ${n.clientId}`);g={...g,client:h.name,clientId:h.id,vatRate:X({clientVat:h.defaults?.vatRate,settingsVat:a.vatRate}),currency:h.defaults?.currency||c.currency}}return g},"invoices:generate":Ut(async n=>{if(!n||typeof n!="object")throw new Error("generate needs an invoice");if(!n.client||!Array.isArray(n.lineItems)||n.lineItems.length===0)throw new Error("invoice needs a client and at least one line item");let{brand:a,rates:c,invoicing:i}=f(),u=null;if(n.clientId){if(u=await _(n.clientId),!u)throw new Error(`unknown client: ${n.clientId}`)}else{let C=await O();u=U(C.clients,n.client).client}let m={...c,currency:n.currency||u?.defaults?.currency||c.currency},N=await x(),g=r().getFullYear(),h={...n,number:G(N,g),issued:n.issued||S(r()),due:n.due||S(new Date(r().getTime()+(Number(i.netDays)||14)*864e5)),vatRate:X({invoiceVat:n.vatRate,clientVat:u?.defaults?.vatRate,settingsVat:i.vatRate})},I=Le(h,a,m,u||void 0),A=await s(I),j=R();await w.mkdir(j,{recursive:!0});let d=N,E=Tt(u?.name||h.client,h.number);for(;;)try{await w.access($.join(j,`${E}.md`)),d=Ot(d,g),h.number=G(d,g),E=Tt(u?.name||h.client,h.number)}catch{break}if(await w.writeFile($.join(j,`${E}.pdf`),A),await w.writeFile($.join(j,`${E}.md`),Ue(h,a,m,u||void 0)),await D(Ot(d,g)),h.quoteRef)try{let C=$.join(p(),h.quoteRef),_t=await w.readFile(C,"utf-8"),zt=tt(_t,"invoiced","true"),ct=`${C}.tmp`;await w.writeFile(ct,zt),await w.rename(ct,C)}catch(C){t.log("quote invoiced-stamp failed:",C.message)}return t.log("invoice generated:",$.join(j,`${E}.pdf`)),{pdfPath:$.join(j,`${E}.pdf`),notePath:$.join(j,`${E}.md`),number:h.number}}),"invoices:list":async()=>{let n;try{n=await w.readdir(R())}catch{return[]}let a=[],c=r();for(let i of n.filter(u=>u.endsWith(".md")).sort().reverse()){let u=await w.readFile($.join(R(),i),"utf-8").catch(()=>""),{fields:m}=Z(u),N=m.status||"draft",g={status:N,due:m.due},h=Ve(g,c);a.push({file:i,number:m.number??"",client:m.client??"",clientId:m.clientId||null,project:m.project??"",quoteRef:m.quoteRef||null,total:Number(m.total)||0,currency:m.currency??"",issued:m.issued??"",due:m.due??"",status:N,paidAt:m.paidAt||null,overdue:h,daysOverdue:h?Math.floor((c.getTime()-new Date(m.due).getTime())/864e5):0,pdf:n.includes(i.replace(/\.md$/,".pdf"))})}return a},"invoices:set-status":async({file:n,status:a}={})=>{let c=a==="paid"?{paidAt:r().toISOString()}:{};return ot(R(),n,a,Je,c)},"clients:list":async(n={})=>{let a=await O(),c=He(a.clients,n.status??"all");return n.q&&(c=We(c,n.q)),c.sort((i,u)=>i.name.localeCompare(u.name))},"clients:get":async n=>{if(typeof n!="string"||!n)throw new Error("get needs a client id");let a=await _(n);if(!a)throw new Error(`unknown client: ${n}`);return a},"clients:upsert":async n=>{let a=await O(),{store:c,client:i}=Qe(a,n,r);return await J(c),await P(i),i},"clients:archive":async n=>{if(typeof n!="string"||!n)throw new Error("archive needs a client id");let a=await O(),c=Ye(a,n);await J(c);let i=c.clients.find(u=>u.id===n);return i&&await P(i),{ok:!0}},"clients:resolve":async n=>{if(typeof n!="string")throw new Error("resolve needs a name string");let a=await O();return U(a.clients,n)},"clients:bootstrap":async()=>{let n=await O(),a=[];try{let m=await w.readdir(p());for(let N of m.filter(g=>g.endsWith(".md"))){let I=((await w.readFile($.join(p(),N),"utf-8").catch(()=>"")).match(/^---\n([\s\S]*?)\n---/)?.[1]??"").match(/^client: "?(.*?)"?$/m)?.[1];I&&a.push(I)}}catch{}let c=await q();for(let m of c.items??[])m.client&&a.push(m.client);let{store:i,created:u}=Ke(n,a,r);await J(i);for(let m of i.clients)(m.tags??[]).includes("bootstrap")&&await P(m);return{created:u,linked:a.length}},"dashboard:summary":async()=>{let n=await q(),a=await V["quotes:list"](),c=await V["invoices:list"](),{rates:i}=f(),u=(d,E)=>d.filter(C=>C.status===E).length,m=d=>String(d??"").slice(0,7),N=m(r().toISOString()),g=m(new Date(r().getFullYear(),r().getMonth()-1,15).toISOString()),h=c.filter(d=>d.status==="paid"),I=d=>Math.round(d.reduce((E,C)=>E+C.total,0)*100)/100,A=[...n.items.map(d=>({kind:"workItem",label:`${d.client} \u2014 ${d.title}`,ref:d.id})),...a.filter(d=>d.status==="accepted"&&!d.invoiced).map(d=>({kind:"acceptedQuote",label:`${d.client} \u2014 ${d.project}`,ref:d.file})),...c.filter(d=>d.overdue).map(d=>({kind:"overdueInvoice",label:`${d.number} \u2014 ${d.client} \u2014 ${d.daysOverdue}d overdue`,ref:d.file}))],j=[...a.map(d=>({kind:"quote",label:`quote ${d.status} \u2014 ${d.client}`,when:d.generated})),...c.map(d=>({kind:"invoice",label:`invoice ${d.status} \u2014 ${d.number}`,when:d.issued})),...h.map(d=>({kind:"paid",label:`paid \u2014 ${d.number} \u2014 ${qe(d.total,d.currency||i.currency)}`,when:d.paidAt}))].filter(d=>d.when).sort((d,E)=>d.when<E.when?1:-1).slice(0,10);return{workItems:n.items.length,quotes:{draft:u(a,"draft"),sent:u(a,"sent"),accepted:u(a,"accepted"),declined:u(a,"declined")},invoices:{draft:u(c,"draft"),sent:u(c,"sent"),paid:h.length,overdue:c.filter(d=>d.overdue).length,unpaidTotal:I(c.filter(d=>d.status==="sent")),currency:i.currency},revenue:{thisMonth:I(h.filter(d=>m(d.paidAt)===N)),lastMonth:I(h.filter(d=>m(d.paidAt)===g)),currency:i.currency},attention:A,activity:j}}};return V}var Mt=null;module.exports={activate(t){let e=qt(t);for(let[s,r]of Object.entries(e))t.ipc.handle(s,r);Mt=t,t.log("freelancer activated")},deactivate(){Mt=null},createHandlers:qt};
