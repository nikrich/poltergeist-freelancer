var B=(t,n)=>()=>(n||t((n={exports:{}}).exports,n),n.exports);var K=B((fn,pt)=>{function Qt(t,n){let s=new Map((n.named??[]).map(o=>[o.name,o.hourly])),a=(t??[]).map(o=>{let p=s.get(o.rate)??n.default??0,I=Number.isFinite(Number(o.hours))?Number(o.hours):0;return{description:String(o.description??""),hours:I,rateName:s.has(o.rate)?o.rate:"default",hourly:p,amount:Math.round(I*p*100)/100}}),u=Math.round(a.reduce((o,p)=>o+p.amount,0)*100)/100;return{rows:a,total:u}}function Yt(t,n){try{return new Intl.NumberFormat("en-IE",{style:"currency",currency:n}).format(t)}catch{return`${n} ${t.toFixed(2)}`}}pt.exports={computeTotals:Qt,formatMoney:Yt}});var U=B((pn,wt)=>{var{createHash:Kt}=require("node:crypto"),{computeTotals:Xt,formatMoney:Gt}=K();function Zt(t,{items:n,scannedMtimes:s}){let a=new Set(t.dismissed??[]),u=new Map((t.items??[]).map(o=>[o.id,o]));for(let o of n??[])!a.has(o.id)&&!u.has(o.id)&&u.set(o.id,o);return{seen:{...t.seen??{},...s??{}},items:[...u.values()].filter(o=>!a.has(o.id)),dismissed:[...a]}}function te(t,n){return Kt("sha1").update(`${t}
${n}`).digest("hex").slice(0,12)}function ee(t){let n=String(t??"").trim(),s=n.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);s&&(n=s[1]);let a=n.indexOf("{"),u=n.lastIndexOf("}");if(a===-1||u===-1)throw new Error(`expected JSON object, got: ${n.slice(0,120)}`);try{return JSON.parse(n.slice(a,u+1))}catch(o){throw new Error(`invalid JSON (${o.message}): ${n.slice(0,120)}`)}}function ht(t){return String(t??"").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").trim().replace(/[\s_]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"client"}function ne(t,n){let s=n instanceof Date?n:new Date(n),a=`${s.getFullYear()}${String(s.getMonth()+1).padStart(2,"0")}${String(s.getDate()).padStart(2,"0")}`;return`quote-${ht(t)}-${a}`}wt.exports={computeTotals:Xt,formatMoney:Gt,mergeSweep:Zt,itemId:te,parseStrictJson:ee,slug:ht,quoteBasename:ne}});var G=B((hn,It)=>{var{createHash:re,randomBytes:yt}=require("node:crypto"),{slug:gt}=U(),$t=new Set(["prospect","active","inactive","archived"]),se=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;function J(){return{version:1,clients:[]}}function L(t){return String(t??"").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").trim().replace(/[\s_]+/g," ").replace(/\s+/g," ")}function X(t){return t?re("sha1").update(String(t)).digest("hex").slice(0,12):yt(6).toString("hex")}function ae(t){return X(t||yt(8).toString("hex"))}function R(t,n=500){if(t==null)return;let s=String(t).trim();if(s)return s.slice(0,n)}function vt(t,n){if(!t)return;let s=String(t).trim();if(s){if(!se.test(s))throw new Error(`${n} is not a valid email: ${s}`);return s.slice(0,200)}}function oe(t,n){if(!t||typeof t!="object")throw new Error(`contact ${n}: expected object`);let s=R(t.name,120);if(!s)throw new Error(`contact ${n}: name is required`);return{id:typeof t.id=="string"&&t.id?t.id:ae(`${s}-${n}`),name:s,email:vt(t.email,`contact ${n} email`),phone:R(t.phone,40),role:R(t.role,80),primary:!!t.primary}}function ie(t){if(!t||typeof t!="object")return{};let n=Array.isArray(t.addressLines)?t.addressLines.map(s=>R(s,120)).filter(Boolean).slice(0,4):void 0;return{email:vt(t.email,"billing email"),addressLines:n?.length?n:void 0,city:R(t.city,80),region:R(t.region,80),postalCode:R(t.postalCode,20),country:R(t.country,80),taxId:R(t.taxId,40)}}function ce(t){if(!t||typeof t!="object")return{};let n=R(t.currency,3),s;if(t.vatRate!==void 0&&t.vatRate!==null&&String(t.vatRate).trim()!==""){let a=Number(t.vatRate);if(Number.isFinite(a)){if(a<0||a>100)throw new Error(`vatRate must be 0-100, got ${a}`);s=a}}return{currency:n?n.toUpperCase():void 0,rateName:R(t.rateName,60),paymentTerms:R(t.paymentTerms,200),vatRate:s}}function bt(t,{now:n=()=>new Date}={}){if(!t||typeof t!="object")throw new Error("client payload required");let s=R(t.name,120);if(!s)throw new Error("client name is required");let a=t.status??"prospect";if(!$t.has(a))throw new Error(`invalid status: ${a}`);let u=Array.isArray(t.contacts)?t.contacts.map(($,j)=>oe($,j)):[],o=!1;for(let $ of u)$.primary&&(o?$.primary=!1:o=!0);u.length&&!o&&(u[0].primary=!0);let p=Array.isArray(t.tags)?[...new Set(t.tags.map($=>R($,40)).filter(Boolean))]:[],I=Array.isArray(t.sourceNotes)?[...new Set(t.sourceNotes.map($=>R($,500)).filter(Boolean))]:[],g=n().toISOString();return{id:typeof t.id=="string"&&/^[a-z0-9-]{6,32}$/i.test(t.id)?t.id:X(`${s}
${g}`),name:s,legalName:R(t.legalName,160),status:a,tags:p,website:R(t.website,300),contacts:u,billing:ie(t.billing),defaults:ce(t.defaults),notes:R(t.notes,8e3),sourceNotes:I,createdAt:typeof t.createdAt=="string"&&t.createdAt?t.createdAt:g,updatedAt:g}}function le(t,n){let s=String(n??"").trim().toLowerCase();return s?(t??[]).filter(a=>[a.name,a.legalName,...a.tags??[],...(a.contacts??[]).flatMap(o=>[o.name,o.email]),a.billing?.email,a.billing?.taxId].filter(Boolean).join(" ").toLowerCase().includes(s)):[...t??[]]}function ue(t,n){return!n||n==="all"?(t??[]).filter(s=>s.status!=="archived"):(t??[]).filter(s=>s.status===n)}function de(t,n){let s=t??[],a=L(n);if(!a)return{client:null,candidates:[]};let u=s.filter(p=>L(p.name)===a&&p.status!=="archived");if(u.length===1)return{client:u[0],candidates:u};if(u.length>1)return{client:null,candidates:u};let o=s.filter(p=>p.status!=="archived"&&L(p.name).includes(a));return o.length===1?{client:o[0],candidates:o}:{client:null,candidates:o}}function St(t,n,s=()=>new Date){let u=[...(t?.clients?t:J()).clients??[]],o=bt(n,{now:s}),p=u.findIndex(I=>I.id===o.id);return p>=0?(o.createdAt=u[p].createdAt,u[p]=o):u.push(o),{store:{version:1,clients:u},client:o}}function me(t,n){let s=t?.clients?t:J(),a=(s.clients??[]).map(u=>u.id===n?{...u,status:"archived",updatedAt:new Date().toISOString()}:u);if(!(s.clients??[]).some(u=>u.id===n))throw new Error(`unknown client: ${n}`);return{version:1,clients:a}}function fe(t,n,s=()=>new Date){let a=t?.clients?{version:1,clients:[...t.clients]}:J(),u=0,o=new Set(a.clients.map(p=>L(p.name)));for(let p of n??[]){let I=R(p,120);if(!I)continue;let g=L(I);if(!g||g==="unknown"||o.has(g))continue;let{store:E,client:$}=St(a,{name:I,status:"active",tags:["bootstrap"]},s);a=E,o.add(g),u+=1}return{store:a,created:u}}function pe(t){let n=t?.contacts??[];return n.find(s=>s.primary)||n[0]||null}function he(t){let n=`client-${gt(t.name)}`,s=(t.contacts??[]).map(g=>`- ${[g.name,g.role,g.email,g.phone].filter(Boolean).join(" \xB7 ")}${g.primary?" (primary)":""}`).join(`
`),a=t.billing??{},u=[...a.addressLines??[],[a.city,a.postalCode].filter(Boolean).join(" "),a.region,a.country].filter(Boolean).join(`
`),o=(t.tags??[]).map(g=>JSON.stringify(g)).join(", "),p=g=>String(g??"").replace(/"/g,'\\"'),I=`---
type: client
id: "${t.id}"
name: "${p(t.name)}"
legalName: "${p(t.legalName??"")}"
status: ${t.status}
tags: [${o}]
taxId: "${p(a.taxId??"")}"
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

${u||"_no address_"}
${a.email?`
Email: ${a.email}`:""}
${a.taxId?`
Tax ID: ${a.taxId}`:""}

## Notes

${t.notes??""}
`;return{basename:n,markdown:I}}It.exports={STATUSES:$t,emptyStore:J,normalizeClientName:L,newId:X,validateClient:bt,matchClients:le,filterByStatus:ue,resolveClient:de,mergeUpsert:St,archiveClient:me,bootstrapFromNames:fe,primaryContact:pe,clientVaultNote:he,slug:gt}});var Z=B((wn,jt)=>{var{computeTotals:we}=K(),{slug:ye}=U();function ge(t){return String(t).padStart(3,"0")}function Nt(t,n){return t.yearReset&&n!==t.year?{...t,year:n,next:1}:t}function xt({prefix:t,year:n,next:s}){return`${t}-${n}-${ge(s)}`}function $e(t,n){return xt(Nt(t,n))}function ve(t,n){let s=Nt(t,n);return{...s,next:s.next+1}}function be(t,n,s){let{rows:a,total:u}=we(t,n),o=Number.isFinite(Number(s))?Number(s):0,p=Math.round(u*(o/100)*100)/100,I=Math.round((u+p)*100)/100;return{rows:a,subtotal:u,vatRate:o,vatAmount:p,total:I}}function Se(t,n){return`invoice-${ye(t)}-${n}`}var Ie=/<!-- freelancer:data (\{[\s\S]*?\}) -->/;function Ne(t){return`<!-- freelancer:data ${JSON.stringify(t)} -->`}function xe(t){let n=String(t??"").match(Ie);if(!n)return null;try{return JSON.parse(n[1])}catch{return null}}function je({invoiceVat:t,clientVat:n,settingsVat:s}={}){for(let a of[t,n,s])if(a!=null&&Number.isFinite(Number(a)))return Number(a);return 0}jt.exports={formatInvoiceNumber:xt,advanceCounter:ve,currentNumber:$e,computeInvoiceTotals:be,invoiceBasename:Se,dataComment:Ne,parseDataComment:xe,resolveVatRate:je}});var Ct=B((yn,At)=>{var{computeTotals:Et,formatMoney:T}=U(),{primaryContact:Ee}=G(),{computeInvoiceTotals:kt,dataComment:Rt}=Z();function S(t){return String(t??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function tt(t,n){let s=n?.legalName||n?.name||t.client,a=[`    <h2>${S(s)}</h2>`];n?.legalName&&n.name&&n.legalName!==n.name&&a.push(`    <div class="sub">${S(n.name)}</div>`);let u=Ee(n);if(u){let g=[u.name,u.role,u.email,u.phone].filter(Boolean).join(" \xB7 ");a.push(`    <div class="sub">${S(g)}</div>`)}let o=n?.billing??{};for(let g of o.addressLines??[])a.push(`    <div class="sub">${S(g)}</div>`);let I=[[o.postalCode,o.city].filter(Boolean).join(" "),o.region,o.country].filter(Boolean).join(", ");return I&&a.push(`    <div class="sub">${S(I)}</div>`),o.email&&(!u||u.email!==o.email)&&a.push(`    <div class="sub">${S(o.email)}</div>`),o.taxId&&a.push(`    <div class="sub">Tax ID: ${S(o.taxId)}</div>`),t.project&&a.push(`    <div style="margin-top:6px">${S(t.project)}</div>`),a.join(`
`)}function Ft(t){return`
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
`}function ke(t,n,s,a){let{rows:u,total:o}=Et(t.lineItems,s),p=/^#[0-9a-fA-F]{3,8}$/.test(n.accentColor??"")?n.accentColor:"#C5FF3D",I=b=>S(T(b,s.currency??"EUR")),g=new Date,E=new Date(g.getTime()+(Number(n.validityDays)||14)*864e5),$=b=>b.toISOString().slice(0,10),j=a?.defaults?.paymentTerms||n.paymentTerms||"",F=u.map(b=>`      <tr>
        <td>${S(b.description)}</td>
        <td class="num">${S(String(b.hours))}</td>
        <td class="num">${I(b.hourly)}</td>
        <td class="num">${I(b.amount)}</td>
      </tr>`).join(`
`),C=(t.assumptions??[]).map(b=>`      <li>${S(b)}</li>`).join(`
`);return`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${Ft(p)}</style>
</head>
<body>
  <header>
    <div class="brand">
      ${n.logoDataUri?`<img src="${S(n.logoDataUri)}" alt="">`:""}
      <div>
        <div class="name">${S(n.businessName||"Quote")}</div>
        <div class="contact">${S(n.contactLine??"")}</div>
      </div>
    </div>
    <div class="doc">
      <div class="title">QUOTE</div>
      <div class="meta">date ${$(g)}<br>valid until ${$(E)}</div>
    </div>
  </header>

  <div class="block">
    <div class="label">prepared for</div>
${tt(t,a)}
  </div>

  <div class="block">
    <div class="label">scope</div>
    <div>${S(t.scopeSummary??"")}</div>
  </div>

  <div class="block">
    <table>
      <thead><tr><th>item</th><th class="num">hours</th><th class="num">rate</th><th class="num">amount</th></tr></thead>
      <tbody>
${F}
        <tr class="total-row"><td colspan="3">total</td><td class="num amount">${I(o)}</td></tr>
      </tbody>
    </table>
  </div>

${C?`  <div class="block">
    <div class="label">assumptions</div>
    <ul>
${C}
    </ul>
  </div>
`:""}
  <footer>
    <span>${S(j)}</span>
    <span>${S(n.businessName??"")}</span>
  </footer>
</body>
</html>`}function Re(t,n,s,a){let{rows:u,total:o}=Et(t.lineItems,s),p=s.currency??"EUR",I=a?.defaults?.paymentTerms||n.paymentTerms||"",g=a?.legalName||a?.name||t.client,E=u.map(F=>`| ${F.description.replace(/\|/g,"\\|")} | ${F.hours} | ${T(F.hourly,p)} | ${T(F.amount,p)} |`).join(`
`),$=F=>String(F??"").replace(/"/g,'\\"'),j=t.clientId||a?.id?`clientId: "${$(t.clientId||a?.id)}"
`:"";return`---
client: "${$(g)}"
${j}project: "${$(t.project)}"
total: ${o}
currency: ${p}
status: draft
source: "${$(t.sourceNote)}"
generated: ${new Date().toISOString()}
---

# Quote \u2014 ${g}

**Project:** ${t.project??""}

## Scope

${t.scopeSummary??""}

## Line items

| item | hours | rate | amount |
|------|-------|------|--------|
${E}

**Total: ${T(o,p)}**

## Assumptions

${(t.assumptions??[]).map(F=>`- ${F}`).join(`
`)}

## Terms

${I} \u2014 valid ${Number(n.validityDays)||14} days.

${Rt({lineItems:t.lineItems??[],scopeSummary:t.scopeSummary??"",assumptions:t.assumptions??[]})}
`}function Fe(t,n,s,a){let{rows:u,subtotal:o,vatRate:p,vatAmount:I,total:g}=kt(t.lineItems,s,t.vatRate),E=/^#[0-9a-fA-F]{3,8}$/.test(n.accentColor??"")?n.accentColor:"#C5FF3D",$=b=>S(T(b,s.currency??"EUR")),j=a?.defaults?.paymentTerms||n.paymentTerms||"",F=u.map(b=>`      <tr>
        <td>${S(b.description)}</td>
        <td class="num">${S(String(b.hours))}</td>
        <td class="num">${$(b.hourly)}</td>
        <td class="num">${$(b.amount)}</td>
      </tr>`).join(`
`),C=p>0?`        <tr><td colspan="3" class="sub">vat ${S(String(p))}%</td><td class="num">${$(I)}</td></tr>
`:"";return`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${Ft(E)}</style>
</head>
<body>
  <header>
    <div class="brand">
      ${n.logoDataUri?`<img src="${S(n.logoDataUri)}" alt="">`:""}
      <div>
        <div class="name">${S(n.businessName||"Invoice")}</div>
        <div class="contact">${S(n.contactLine??"")}</div>
      </div>
    </div>
    <div class="doc">
      <div class="title">INVOICE</div>
      <div class="meta">${S(t.number)}<br>issued ${S(t.issued)}<br>due ${S(t.due)}</div>
    </div>
  </header>

  <div class="block">
    <div class="label">billed to</div>
${tt(t,a)}
  </div>

  <div class="block">
    <table>
      <thead><tr><th>item</th><th class="num">hours</th><th class="num">rate</th><th class="num">amount</th></tr></thead>
      <tbody>
${F}
        <tr><td colspan="3" class="sub">subtotal</td><td class="num">${$(o)}</td></tr>
${C}        <tr class="total-row"><td colspan="3">total due</td><td class="num amount">${$(g)}</td></tr>
      </tbody>
    </table>
  </div>

  <footer>
    <span>${S(j)}${j?" \xB7 ":""}payable to ${S(n.contactLine??n.businessName??"")}</span>
    <span>${S(t.number)}</span>
  </footer>
</body>
</html>`}function Ae(t,n,s,a){let{rows:u,subtotal:o,vatRate:p,vatAmount:I,total:g}=kt(t.lineItems,s,t.vatRate),E=s.currency??"EUR",$=a?.legalName||a?.name||t.client,j=b=>String(b??"").replace(/"/g,'\\"'),F=(b,q)=>q?`${b}: "${j(q)}"
`:"",C=u.map(b=>`| ${b.description.replace(/\|/g,"\\|")} | ${b.hours} | ${T(b.hourly,E)} | ${T(b.amount,E)} |`).join(`
`);return`---
number: "${j(t.number)}"
client: "${j($)}"
${F("clientId",t.clientId||a?.id)}${F("quoteRef",t.quoteRef)}${F("project",t.project)}issued: ${t.issued}
due: ${t.due}
subtotal: ${o}
vatRate: ${p}
vatAmount: ${I}
total: ${g}
currency: ${E}
status: draft
generated: ${new Date().toISOString()}
---

# Invoice ${t.number} \u2014 ${$}

| item | hours | rate | amount |
|------|-------|------|--------|
${C}

subtotal ${T(o,E)}${p>0?`
vat ${p}% ${T(I,E)}`:""}
**Total due: ${T(g,E)}** \u2014 due ${t.due}

${Rt({lineItems:t.lineItems??[]})}
`}At.exports={esc:S,billToHtml:tt,renderQuoteHtml:ke,quoteMarkdown:Re,renderInvoiceHtml:Fe,invoiceMarkdown:Ae}});var Dt=B((gn,Tt)=>{var Ot=/^---\n([\s\S]*?)\n---/;function Ce(t){let n=String(t??"").match(Ot),s={};if(n)for(let a of n[1].split(`
`)){let u=a.match(/^(\w[\w-]*):\s*"?(.*?)"?\s*$/);u&&(s[u[1]]=u[2])}return{fields:s,body:n?t.slice(n[0].length):String(t??"")}}function Oe(t,n,s){let a=String(t??"").match(Ot);if(!a)throw new Error("note has no frontmatter block");let u=a[1].split(`
`),o=u.findIndex(p=>p.startsWith(`${n}:`));return o>=0?u[o]=`${n}: ${s}`:u.push(`${n}: ${s}`),`---
${u.join(`
`)}
---`+t.slice(a[0].length)}var Te={draft:["sent"],sent:["accepted","declined"],declined:["sent"],accepted:[]},De={draft:["sent"],sent:["paid"],paid:[]};function qe(t,n,s){if(!t[n]||!t[n].includes(s))throw new Error(`invalid transition: ${n} -> ${s}`)}function Me(t,n){return t.status!=="sent"||!t.due?!1:t.due<n.toISOString().slice(0,10)}Tt.exports={parseFrontmatter:Ce,setFrontmatterField:Oe,QUOTE_TRANSITIONS:Te,INVOICE_TRANSITIONS:De,assertTransition:qe,isOverdue:Me}});var w=require("node:fs/promises"),h=require("node:path"),Be=require("node:os"),{mergeSweep:Le,itemId:qt,parseStrictJson:Ue,quoteBasename:Mt,formatMoney:_e}=U(),{renderQuoteHtml:Pe,quoteMarkdown:We,renderInvoiceHtml:ze,invoiceMarkdown:Je}=Ct(),{currentNumber:et,advanceCounter:Bt,invoiceBasename:Lt,parseDataComment:Ut,resolveVatRate:nt}=Z(),{parseFrontmatter:V,setFrontmatterField:rt,QUOTE_TRANSITIONS:Ve,INVOICE_TRANSITIONS:He,assertTransition:Qe,isOverdue:Ye}=Dt(),{emptyStore:_t,matchClients:Ke,filterByStatus:Xe,resolveClient:_,mergeUpsert:Ge,archiveClient:Ze,bootstrapFromNames:tn,clientVaultNote:en}=G(),nn=14,rn=2e3,st=10,sn=100,an={vaultPath:"~/ghostbrain/vault",brand:{businessName:"",logoDataUri:"",accentColor:"#C5FF3D",contactLine:"",paymentTerms:"50% upfront, balance on delivery",validityDays:14},rates:{currency:"EUR",default:0,named:[]},invoicing:{prefix:"INV",vatRate:0,netDays:14,yearReset:!0}},on={type:"object",properties:{items:{type:"array",items:{type:"object",properties:{title:{type:"string"},client:{type:"string"},ask:{type:"string"},sourceNote:{type:"string"},confidence:{type:"number"}},required:["title","client","ask","sourceNote","confidence"]}}},required:["items"]},cn={type:"object",properties:{client:{type:"string"},project:{type:"string"},scopeSummary:{type:"string"},lineItems:{type:"array",items:{type:"object",properties:{description:{type:"string"},hours:{type:"number"},rate:{type:"string"}},required:["description","hours","rate"]}},assumptions:{type:"array",items:{type:"string"}}},required:["client","project","scopeSummary","lineItems","assumptions"]};function ln(t){return t.startsWith("~")?h.join(Be.homedir(),t.slice(1)):t}function zt(t,n){if(n==null)return t;if(typeof t!="object"||Array.isArray(t)||t===null)return n;let s={...t};for(let a of Object.keys(n))s[a]=zt(t[a],n[a]);return s}async function un(t){let{BrowserWindow:n}=require("electron"),s=new n({show:!1,webPreferences:{sandbox:!0,javascript:!1}});try{return await s.loadURL("data:text/html;charset=utf-8,"+encodeURIComponent(t)),await s.webContents.printToPDF({pageSize:"A4",printBackground:!0})}finally{s.destroy()}}async function dn(t){let{shell:n}=require("electron");return n.openPath(t)}function Pt(t,n={}){function s(e,r){let i=h.resolve(r),c=h.resolve(e);if(i!==c&&!i.startsWith(c+h.sep))throw new Error("path escapes the vault");return i}let a=n.renderPdf??un,u=n.openPath??dn,o=n.now??(()=>new Date),p=n.sweepMaxNotes??sn,I=h.join(t.dataDir,"work-items.json"),g=h.join(t.dataDir,"clients.json"),E=()=>zt(an,t.settings.get("config")??{}),$=()=>ln(E().vaultPath),j=()=>h.join($(),"30-cross-context","quotes"),F=()=>h.join($(),"30-cross-context","clients"),C=h.join(t.dataDir,"counter.json"),b=()=>h.join($(),"30-cross-context","invoices");async function q(){let{invoicing:e}=E();try{return{...JSON.parse(await w.readFile(C,"utf-8")),prefix:e.prefix,yearReset:e.yearReset}}catch(r){return t.log("counter.json unreadable, reseeding:",r.message),{prefix:e.prefix,year:o().getFullYear(),next:1,yearReset:e.yearReset}}}async function at(e){await w.mkdir(t.dataDir,{recursive:!0});let r=`${C}.tmp`;await w.writeFile(r,JSON.stringify(e,null,2)),await w.rename(r,C)}function P(e){return e.toISOString().slice(0,10)}async function M(){try{return JSON.parse(await w.readFile(I,"utf-8"))}catch{return{seen:{},items:[],dismissed:[]}}}async function ot(e){await w.mkdir(t.dataDir,{recursive:!0}),await w.writeFile(I,JSON.stringify(e,null,2))}async function O(){try{let e=JSON.parse(await w.readFile(g,"utf-8"));return!e||!Array.isArray(e.clients)?_t():{version:1,clients:e.clients}}catch{return _t()}}async function H(e){await w.mkdir(t.dataDir,{recursive:!0});let r=`${g}.tmp`;await w.writeFile(r,JSON.stringify(e,null,2)),await w.rename(r,g)}async function Q(e){try{let r=F();await w.mkdir(r,{recursive:!0});let{basename:i,markdown:c}=en(e);await w.writeFile(h.join(r,`${i}.md`),c)}catch(r){t.log("client vault mirror failed:",r.message)}}async function W(e){return(await O()).clients.find(i=>i.id===e)??null}async function it(e,r){let i;try{i=await w.readdir(e,{withFileTypes:!0})}catch{return}for(let c of i){let l=h.join(e,c.name);c.isDirectory()?await it(l,r):c.isFile()&&c.name.endsWith(".md")&&r.push(l)}}async function ct(){let e=$(),r=[];for(let l of["00-inbox","20-contexts"])await it(h.join(e,l),r);let i=o().getTime()-nn*864e5,c=[];for(let l of r){let d=await w.stat(l).catch(()=>null);d&&d.mtimeMs>=i&&c.push({path:l,rel:h.relative(e,l),mtimeMs:d.mtimeMs,modified:d.mtime.toISOString()})}return c.sort((l,d)=>d.mtimeMs-l.mtimeMs)}async function lt(e,r){let i=async c=>{let l=await t.api.fetch("POST","/v1/llm/run",{prompt:c,system:"You extract structured data for a freelancing tool. Respond with STRICT JSON matching the requested shape. No prose.",jsonSchema:r});if(!l.ok)throw new Error(`llm call failed: ${l.error}`);if(l.data.error)throw new Error(`llm error: ${l.data.error}`);return l.data.structured?l.data.structured:Ue(l.data.text)};try{return await i(e)}catch(c){return t.log("llm json retry:",c.message),i(`${e}

Your previous reply was not valid JSON (${c.message}). Reply with ONLY the JSON object.`)}}async function Jt(e){let r=e.map(c=>`--- note: ${c.rel} ---
${c.excerpt}`).join(`

`);return((await lt(`Below are recent notes from a personal knowledge vault (emails, chat threads, meeting notes).
Find INCOMING WORK REQUESTS a freelancer could quote: someone asking for work to be done, a project inquiry, a "can you build/fix/design X" ask.
Ignore: the vault owner's own todos, newsletters, receipts, status updates, anything already quoted.
For each request return title (short), client (person/company asking), ask (1-2 sentence summary of the work), sourceNote (the exact note path shown above), confidence (0-1).
Return {"items": [...]}. Empty array if none.

${r}`,on)).items??[]).filter(c=>c&&c.title&&c.ask&&c.sourceNote).map(c=>({id:qt(c.sourceNote,c.title),title:String(c.title),client:String(c.client??"unknown"),ask:String(c.ask),sourceNote:String(c.sourceNote),confidence:Math.max(0,Math.min(1,Number(c.confidence)||0)),foundAt:o().toISOString()}))}let ut=Promise.resolve(),dt=e=>(...r)=>{let i=ut.then(()=>e(...r));return ut=i.catch(()=>{}),i};async function mt(e,r,i,c,l={}){if(typeof r!="string"||r!==h.basename(r)||!r.endsWith(".md"))throw new Error("file must be a note basename");let d=h.join(e,r),N=await w.readFile(d,"utf-8"),y=V(N).fields.status||"draft";Qe(c,y,i);let f=rt(N,"status",i);for(let[k,x]of Object.entries(l))f=rt(f,k,x);let v=`${d}.tmp`;return await w.writeFile(v,f),await w.rename(v,d),{ok:!0,status:i}}let z=null,Y={"quotes:set-status":async({file:e,status:r}={})=>mt(j(),e,r,Ve),"quotes:sweep":async(e={})=>{if(z)return z;let r=(async()=>{try{let i=await M(),l=(await ct()).filter(y=>e.force||i.seen[y.rel]!==y.mtimeMs),d=l.slice(0,p),N=l.length-d.length;for(let y=0;y<d.length;y+=st){let f=d.slice(y,y+st);for(let x of f)x.excerpt=(await w.readFile(x.path,"utf-8").catch(()=>"")).slice(0,rn);t.ipc.send("quotes:sweep-progress",{done:Math.min(y+st,d.length),total:d.length});let v=f.length?await Jt(f):[],k={};for(let x of f)k[x.rel]=x.mtimeMs;i=Le(await M(),{items:v,scannedMtimes:k}),await ot(i)}return{items:i.items,sweptAt:o().toISOString(),scanned:d.length,remaining:N}}finally{z=null}})();return z=r,r},"quotes:items":async()=>({items:(await M()).items}),"quotes:dismiss":async e=>{if(typeof e!="string"||!e)throw new Error("dismiss needs an item id");let r=await M();return r.dismissed.includes(e)||r.dismissed.push(e),r.items=r.items.filter(i=>i.id!==e),await ot(r),{ok:!0}},"quotes:recent-notes":async()=>{let e=await ct(),r=[];for(let i of e.slice(0,50)){let l=(await w.readFile(i.path,"utf-8").catch(()=>"")).slice(0,400).match(/^#\s+(.+)$/m)?.[1]??h.basename(i.rel,".md");r.push({path:i.rel,title:l,modified:i.modified})}return r},"quotes:manual":async e=>{if(typeof e!="string"||!e)throw new Error("manual needs a note path");let r=s($(),h.join($(),e));await w.access(r);let i=h.basename(e,".md");return{id:qt(e,i),title:i,client:"unknown",ask:"manually selected note",sourceNote:e,confidence:1,foundAt:o().toISOString()}},"quotes:draft":async(e={})=>{let r=e.notePath;if(e.itemId){let k=(await M()).items.find(x=>x.id===e.itemId);if(!k)throw new Error(`unknown work item: ${e.itemId}`);r=k.sourceNote}if(!r)throw new Error("draft needs an itemId or notePath");let i=h.join($(),r),c=(await w.readFile(i,"utf-8")).slice(0,8e3),{rates:l}=E(),d=["default",...l.named.map(v=>v.name)],N=await lt(`A freelancer needs a quote draft for the work request in this note.

--- note: ${r} ---
${c}
---

Rate names available (pick the best fit per line item): ${d.join(", ")}.
Break the work into 2-8 concrete line items with realistic hour estimates.
Return {"client", "project", "scopeSummary", "lineItems": [{"description", "hours", "rate"}], "assumptions": [...]}.`,cn),y=await O(),{client:f}=_(y.clients,N.client);return{...N,sourceNote:r,clientId:f?.id}},"quotes:generate":async e=>{if(!e||typeof e!="object")throw new Error("generate needs a quote");if(!e.client||!Array.isArray(e.lineItems)||e.lineItems.length===0)throw new Error("quote needs a client and at least one line item");let{brand:r,rates:i}=E(),c=null;if(e.clientId){if(c=await W(e.clientId),!c)throw new Error(`unknown client: ${e.clientId}`)}else{let m=await O();c=_(m.clients,e.client).client}let l={...i,currency:c?.defaults?.currency||i.currency};c&&!e.clientId&&(e={...e,clientId:c.id});let d=Pe(e,r,l,c||void 0),N=await a(d),y=j();await w.mkdir(y,{recursive:!0});let f=c?.name||e.client,v=Mt(f,o());for(let m=2;;m++)try{await w.access(h.join(y,`${v}.md`)),v=`${Mt(f,o())}-${m}`}catch{break}let k=h.join(y,`${v}.md`),x=h.join(y,`${v}.pdf`);return await w.writeFile(x,N),await w.writeFile(k,We(e,r,l,c||void 0)),t.log("quote generated:",x),{pdfPath:x,notePath:k,clientId:e.clientId||c?.id||null}},"quotes:list":async()=>{let e;try{e=await w.readdir(j())}catch{return[]}let r=[];for(let i of e.filter(c=>c.endsWith(".md")).sort().reverse()){let l=(await w.readFile(h.join(j(),i),"utf-8").catch(()=>"")).match(/^---\n([\s\S]*?)\n---/)?.[1]??"",d=N=>l.match(new RegExp(`^${N}: "?(.*?)"?$`,"m"))?.[1]??"";r.push({file:i,client:d("client"),clientId:d("clientId")||null,project:d("project"),total:Number(d("total"))||0,currency:d("currency"),generated:d("generated"),pdf:e.includes(i.replace(/\.md$/,".pdf")),status:d("status")||"draft",invoiced:d("invoiced")==="true"})}return r},"quotes:open":async({file:e,which:r}={})=>{if(typeof e!="string"||e!==h.basename(e)||!e.endsWith(".md"))throw new Error("file must be a note basename");if(r!=="pdf"&&r!=="note")throw new Error("which must be 'pdf' or 'note'");let i=r==="pdf"?e.replace(/\.md$/,".pdf"):e,c=s(j(),h.join(j(),i)),l=await u(c);if(l)throw new Error(l);return{ok:!0}},"quotes:load":async({file:e}={})=>{if(typeof e!="string"||e!==h.basename(e)||!e.endsWith(".md"))throw new Error("file must be a note basename");let r=s(j(),h.join(j(),e)),i=await w.readFile(r,"utf-8"),{fields:c}=V(i),l=Ut(i),d=l?.lineItems??[],N=l?.scopeSummary;N===void 0&&(N=i.match(/## Scope\n\n([\s\S]*?)\n\n## /)?.[1]??"");let y=l?.assumptions;return y===void 0&&(y=(i.match(/## Assumptions\n\n([\s\S]*?)\n\n## /)?.[1]??"").split(`
`).map(v=>v.replace(/^-\s*/,"").trim()).filter(Boolean)),{client:c.client??"",clientId:c.clientId||null,project:c.project??"",status:c.status||"draft",invoiced:c.invoiced==="true",sourceNote:c.source??"",lineItems:d,scopeSummary:N,assumptions:y}},"files:open":async e=>{if(typeof e!="string"||!e)throw new Error("open needs an absolute path");let r=s($(),e),i=await u(r);if(i)throw new Error(i);return{ok:!0}},"invoices:counter":async()=>q(),"invoices:set-counter":dt(async({next:e}={})=>{let r=Number(e);if(!Number.isInteger(r)||r<1)throw new Error("next must be a positive integer");let i=await q();return await at({...i,next:r}),{ok:!0}}),"invoices:draft":async(e={})=>{let{invoicing:r,rates:i}=E(),c=await q(),l=et(c,o().getFullYear()),d=P(o()),N=P(new Date(o().getTime()+(Number(r.netDays)||14)*864e5)),y={number:l,issued:d,due:N,client:"",lineItems:[],vatRate:r.vatRate??0,currency:i.currency};if(e.quoteFile){if(e.quoteFile!==h.basename(e.quoteFile))throw new Error("quoteFile must be a basename");let f=await w.readFile(h.join(j(),e.quoteFile),"utf-8"),{fields:v}=V(f),k=Ut(f),x=await O(),m=v.clientId?x.clients.find(D=>D.id===v.clientId):_(x.clients,v.client).client;y={...y,client:v.client,clientId:m?.id,project:v.project,quoteRef:e.quoteFile,lineItems:k?.lineItems??[],vatRate:nt({clientVat:m?.defaults?.vatRate,settingsVat:r.vatRate}),currency:m?.defaults?.currency||i.currency}}else if(e.clientId){let f=await W(e.clientId);if(!f)throw new Error(`unknown client: ${e.clientId}`);y={...y,client:f.name,clientId:f.id,vatRate:nt({clientVat:f.defaults?.vatRate,settingsVat:r.vatRate}),currency:f.defaults?.currency||i.currency}}return y},"invoices:generate":dt(async e=>{if(!e||typeof e!="object")throw new Error("generate needs an invoice");if(!e.client||!Array.isArray(e.lineItems)||e.lineItems.length===0)throw new Error("invoice needs a client and at least one line item");let{brand:r,rates:i,invoicing:c}=E(),l=null;if(e.clientId){if(l=await W(e.clientId),!l)throw new Error(`unknown client: ${e.clientId}`)}else{let A=await O();l=_(A.clients,e.client).client}let d={...i,currency:e.currency||l?.defaults?.currency||i.currency},N=await q(),y=o().getFullYear(),f={...e,number:et(N,y),issued:e.issued||P(o()),due:e.due||P(new Date(o().getTime()+(Number(c.netDays)||14)*864e5)),vatRate:nt({invoiceVat:e.vatRate,clientVat:l?.defaults?.vatRate,settingsVat:c.vatRate})},v=b();await w.mkdir(v,{recursive:!0});let k=N,x=Lt(l?.name||f.client,f.number);for(;;)try{await w.access(h.join(v,`${x}.md`)),k=Bt(k,y),f.number=et(k,y),x=Lt(l?.name||f.client,f.number)}catch{break}let m=ze(f,r,d,l||void 0),D=await a(m);if(await w.writeFile(h.join(v,`${x}.pdf`),D),await w.writeFile(h.join(v,`${x}.md`),Je(f,r,d,l||void 0)),await at(Bt(k,y)),f.quoteRef)if(f.quoteRef!==h.basename(f.quoteRef)||!f.quoteRef.endsWith(".md"))t.log("quote invoiced-stamp skipped: quoteRef is not a safe basename:",f.quoteRef);else try{let A=h.join(j(),f.quoteRef),Vt=await w.readFile(A,"utf-8"),Ht=rt(Vt,"invoiced","true"),ft=`${A}.tmp`;await w.writeFile(ft,Ht),await w.rename(ft,A)}catch(A){t.log("quote invoiced-stamp failed:",A.message)}return t.log("invoice generated:",h.join(v,`${x}.pdf`)),{pdfPath:h.join(v,`${x}.pdf`),notePath:h.join(v,`${x}.md`),number:f.number}}),"invoices:list":async()=>{let e;try{e=await w.readdir(b())}catch{return[]}let r=[],i=o();for(let c of e.filter(l=>l.endsWith(".md")).sort().reverse()){let l=await w.readFile(h.join(b(),c),"utf-8").catch(()=>""),{fields:d}=V(l),N=d.status||"draft",y={status:N,due:d.due},f=Ye(y,i);r.push({file:c,number:d.number??"",client:d.client??"",clientId:d.clientId||null,project:d.project??"",quoteRef:d.quoteRef||null,total:Number(d.total)||0,currency:d.currency??"",issued:d.issued??"",due:d.due??"",status:N,paidAt:d.paidAt||null,overdue:f,daysOverdue:f?Math.floor((i.getTime()-new Date(d.due).getTime())/864e5):0,pdf:e.includes(c.replace(/\.md$/,".pdf"))})}return r},"invoices:set-status":async({file:e,status:r}={})=>{let i=r==="paid"?{paidAt:o().toISOString()}:{};return mt(b(),e,r,He,i)},"invoices:open":async({file:e,which:r}={})=>{if(typeof e!="string"||e!==h.basename(e)||!e.endsWith(".md"))throw new Error("file must be a note basename");if(r!=="pdf"&&r!=="note")throw new Error("which must be 'pdf' or 'note'");let i=r==="pdf"?e.replace(/\.md$/,".pdf"):e,c=s(b(),h.join(b(),i)),l=await u(c);if(l)throw new Error(l);return{ok:!0}},"clients:list":async(e={})=>{let r=await O(),i=Xe(r.clients,e.status??"all");return e.q&&(i=Ke(i,e.q)),i.sort((c,l)=>c.name.localeCompare(l.name))},"clients:get":async e=>{if(typeof e!="string"||!e)throw new Error("get needs a client id");let r=await W(e);if(!r)throw new Error(`unknown client: ${e}`);return r},"clients:upsert":async e=>{let r=await O(),{store:i,client:c}=Ge(r,e,o);return await H(i),await Q(c),c},"clients:archive":async e=>{if(typeof e!="string"||!e)throw new Error("archive needs a client id");let r=await O(),i=Ze(r,e);await H(i);let c=i.clients.find(l=>l.id===e);return c&&await Q(c),{ok:!0}},"clients:resolve":async e=>{if(typeof e!="string")throw new Error("resolve needs a name string");let r=await O();return _(r.clients,e)},"clients:bootstrap":async()=>{let e=await O(),r=[];try{let d=await w.readdir(j());for(let N of d.filter(y=>y.endsWith(".md"))){let v=((await w.readFile(h.join(j(),N),"utf-8").catch(()=>"")).match(/^---\n([\s\S]*?)\n---/)?.[1]??"").match(/^client: "?(.*?)"?$/m)?.[1];v&&r.push(v)}}catch{}let i=await M();for(let d of i.items??[])d.client&&r.push(d.client);let{store:c,created:l}=tn(e,r,o);await H(c);for(let d of c.clients)(d.tags??[]).includes("bootstrap")&&await Q(d);return{created:l,linked:r.length}},"dashboard:summary":async()=>{let e=await M(),r=await Y["quotes:list"](),i=await Y["invoices:list"](),{rates:c}=E(),l=(m,D)=>m.filter(A=>A.status===D).length,d=m=>String(m??"").slice(0,7),N=d(o().toISOString()),y=d(new Date(o().getFullYear(),o().getMonth()-1,15).toISOString()),f=i.filter(m=>m.status==="paid"),v=m=>Math.round(m.reduce((D,A)=>D+A.total,0)*100)/100,k=[...e.items.map(m=>({kind:"workItem",label:`${m.client} \u2014 ${m.title}`,ref:m.id})),...r.filter(m=>m.status==="accepted"&&!m.invoiced).map(m=>({kind:"acceptedQuote",label:`${m.client} \u2014 ${m.project}`,ref:m.file})),...i.filter(m=>m.overdue).map(m=>({kind:"overdueInvoice",label:`${m.number} \u2014 ${m.client} \u2014 ${m.daysOverdue}d overdue`,ref:m.file}))],x=[...r.map(m=>({kind:"quote",label:`quote ${m.status} \u2014 ${m.client}`,when:m.generated})),...i.map(m=>({kind:"invoice",label:`invoice ${m.status} \u2014 ${m.number}`,when:m.issued})),...f.map(m=>({kind:"paid",label:`paid \u2014 ${m.number} \u2014 ${_e(m.total,m.currency||c.currency)}`,when:m.paidAt}))].filter(m=>m.when).sort((m,D)=>m.when<D.when?1:-1).slice(0,10);return{workItems:e.items.length,quotes:{draft:l(r,"draft"),sent:l(r,"sent"),accepted:l(r,"accepted"),declined:l(r,"declined")},invoices:{draft:l(i,"draft"),sent:l(i,"sent"),paid:f.length,overdue:i.filter(m=>m.overdue).length,unpaidTotal:v(i.filter(m=>m.status==="sent")),currency:c.currency},revenue:{thisMonth:v(f.filter(m=>d(m.paidAt)===N)),lastMonth:v(f.filter(m=>d(m.paidAt)===y)),currency:c.currency},attention:k,activity:x}}};return Y}var Wt=null;module.exports={activate(t){let n=Pt(t);for(let[s,a]of Object.entries(n))t.ipc.handle(s,a);Wt=t,t.log("freelancer activated")},deactivate(){Wt=null},createHandlers:Pt};
