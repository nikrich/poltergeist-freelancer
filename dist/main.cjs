var B=(t,n)=>()=>(n||t((n={exports:{}}).exports,n),n.exports);var K=B((fn,pt)=>{function Qt(t,n){let s=new Map((n.named??[]).map(i=>[i.name,i.hourly])),a=(t??[]).map(i=>{let p=s.get(i.rate)??n.default??0,S=Number.isFinite(Number(i.hours))?Number(i.hours):0;return{description:String(i.description??""),hours:S,rateName:s.has(i.rate)?i.rate:"default",hourly:p,amount:Math.round(S*p*100)/100}}),l=Math.round(a.reduce((i,p)=>i+p.amount,0)*100)/100;return{rows:a,total:l}}function Yt(t,n){try{return new Intl.NumberFormat("en-IE",{style:"currency",currency:n}).format(t)}catch{return`${n} ${t.toFixed(2)}`}}pt.exports={computeTotals:Qt,formatMoney:Yt}});var U=B((pn,wt)=>{var{createHash:Kt}=require("node:crypto"),{computeTotals:Xt,formatMoney:Gt}=K();function Zt(t,{items:n,scannedMtimes:s}){let a=new Set(t.dismissed??[]),l=new Map((t.items??[]).map(i=>[i.id,i]));for(let i of n??[])!a.has(i.id)&&!l.has(i.id)&&l.set(i.id,i);return{seen:{...t.seen??{},...s??{}},items:[...l.values()].filter(i=>!a.has(i.id)),dismissed:[...a]}}function te(t,n){return Kt("sha1").update(`${t}
${n}`).digest("hex").slice(0,12)}function ee(t){let n=String(t??"").trim(),s=n.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);s&&(n=s[1]);let a=n.indexOf("{"),l=n.lastIndexOf("}");if(a===-1||l===-1)throw new Error(`expected JSON object, got: ${n.slice(0,120)}`);try{return JSON.parse(n.slice(a,l+1))}catch(i){throw new Error(`invalid JSON (${i.message}): ${n.slice(0,120)}`)}}function ht(t){return String(t??"").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").trim().replace(/[\s_]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"client"}function ne(t,n){let s=n instanceof Date?n:new Date(n),a=`${s.getFullYear()}${String(s.getMonth()+1).padStart(2,"0")}${String(s.getDate()).padStart(2,"0")}`;return`quote-${ht(t)}-${a}`}wt.exports={computeTotals:Xt,formatMoney:Gt,mergeSweep:Zt,itemId:te,parseStrictJson:ee,slug:ht,quoteBasename:ne}});var G=B((hn,It)=>{var{createHash:re,randomBytes:yt}=require("node:crypto"),{slug:gt}=U(),$t=new Set(["prospect","active","inactive","archived"]),se=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;function J(){return{version:1,clients:[]}}function L(t){return String(t??"").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").trim().replace(/[\s_]+/g," ").replace(/\s+/g," ")}function X(t){return t?re("sha1").update(String(t)).digest("hex").slice(0,12):yt(6).toString("hex")}function ae(t){return X(t||yt(8).toString("hex"))}function R(t,n=500){if(t==null)return;let s=String(t).trim();if(s)return s.slice(0,n)}function vt(t,n){if(!t)return;let s=String(t).trim();if(s){if(!se.test(s))throw new Error(`${n} is not a valid email: ${s}`);return s.slice(0,200)}}function ie(t,n){if(!t||typeof t!="object")throw new Error(`contact ${n}: expected object`);let s=R(t.name,120);if(!s)throw new Error(`contact ${n}: name is required`);return{id:typeof t.id=="string"&&t.id?t.id:ae(`${s}-${n}`),name:s,email:vt(t.email,`contact ${n} email`),phone:R(t.phone,40),role:R(t.role,80),primary:!!t.primary}}function oe(t){if(!t||typeof t!="object")return{};let n=Array.isArray(t.addressLines)?t.addressLines.map(s=>R(s,120)).filter(Boolean).slice(0,4):void 0;return{email:vt(t.email,"billing email"),addressLines:n?.length?n:void 0,city:R(t.city,80),region:R(t.region,80),postalCode:R(t.postalCode,20),country:R(t.country,80),taxId:R(t.taxId,40)}}function ce(t){if(!t||typeof t!="object")return{};let n=R(t.currency,3),s;if(t.vatRate!==void 0&&t.vatRate!==null&&String(t.vatRate).trim()!==""){let a=Number(t.vatRate);if(Number.isFinite(a)){if(a<0||a>100)throw new Error(`vatRate must be 0-100, got ${a}`);s=a}}return{currency:n?n.toUpperCase():void 0,rateName:R(t.rateName,60),paymentTerms:R(t.paymentTerms,200),vatRate:s}}function bt(t,{now:n=()=>new Date}={}){if(!t||typeof t!="object")throw new Error("client payload required");let s=R(t.name,120);if(!s)throw new Error("client name is required");let a=t.status??"prospect";if(!$t.has(a))throw new Error(`invalid status: ${a}`);let l=Array.isArray(t.contacts)?t.contacts.map(($,j)=>ie($,j)):[],i=!1;for(let $ of l)$.primary&&(i?$.primary=!1:i=!0);l.length&&!i&&(l[0].primary=!0);let p=Array.isArray(t.tags)?[...new Set(t.tags.map($=>R($,40)).filter(Boolean))]:[],S=Array.isArray(t.sourceNotes)?[...new Set(t.sourceNotes.map($=>R($,500)).filter(Boolean))]:[],g=n().toISOString();return{id:typeof t.id=="string"&&/^[a-z0-9-]{6,32}$/i.test(t.id)?t.id:X(`${s}
${g}`),name:s,legalName:R(t.legalName,160),status:a,tags:p,website:R(t.website,300),contacts:l,billing:oe(t.billing),defaults:ce(t.defaults),notes:R(t.notes,8e3),sourceNotes:S,createdAt:typeof t.createdAt=="string"&&t.createdAt?t.createdAt:g,updatedAt:g}}function le(t,n){let s=String(n??"").trim().toLowerCase();return s?(t??[]).filter(a=>[a.name,a.legalName,...a.tags??[],...(a.contacts??[]).flatMap(i=>[i.name,i.email]),a.billing?.email,a.billing?.taxId].filter(Boolean).join(" ").toLowerCase().includes(s)):[...t??[]]}function ue(t,n){return!n||n==="all"?(t??[]).filter(s=>s.status!=="archived"):(t??[]).filter(s=>s.status===n)}function de(t,n){let s=t??[],a=L(n);if(!a)return{client:null,candidates:[]};let l=s.filter(p=>L(p.name)===a&&p.status!=="archived");if(l.length===1)return{client:l[0],candidates:l};if(l.length>1)return{client:null,candidates:l};let i=s.filter(p=>p.status!=="archived"&&L(p.name).includes(a));return i.length===1?{client:i[0],candidates:i}:{client:null,candidates:i}}function St(t,n,s=()=>new Date){let l=[...(t?.clients?t:J()).clients??[]],i=bt(n,{now:s}),p=l.findIndex(S=>S.id===i.id);return p>=0?(i.createdAt=l[p].createdAt,l[p]=i):l.push(i),{store:{version:1,clients:l},client:i}}function me(t,n){let s=t?.clients?t:J(),a=(s.clients??[]).map(l=>l.id===n?{...l,status:"archived",updatedAt:new Date().toISOString()}:l);if(!(s.clients??[]).some(l=>l.id===n))throw new Error(`unknown client: ${n}`);return{version:1,clients:a}}function fe(t,n,s=()=>new Date){let a=t?.clients?{version:1,clients:[...t.clients]}:J(),l=0,i=new Set(a.clients.map(p=>L(p.name)));for(let p of n??[]){let S=R(p,120);if(!S)continue;let g=L(S);if(!g||g==="unknown"||i.has(g))continue;let{store:k,client:$}=St(a,{name:S,status:"active",tags:["bootstrap"]},s);a=k,i.add(g),l+=1}return{store:a,created:l}}function pe(t){let n=t?.contacts??[];return n.find(s=>s.primary)||n[0]||null}function he(t){let n=`client-${gt(t.name)}`,s=(t.contacts??[]).map(g=>`- ${[g.name,g.role,g.email,g.phone].filter(Boolean).join(" \xB7 ")}${g.primary?" (primary)":""}`).join(`
`),a=t.billing??{},l=[...a.addressLines??[],[a.city,a.postalCode].filter(Boolean).join(" "),a.region,a.country].filter(Boolean).join(`
`),i=(t.tags??[]).map(g=>JSON.stringify(g)).join(", "),p=g=>String(g??"").replace(/"/g,'\\"'),S=`---
type: client
id: "${t.id}"
name: "${p(t.name)}"
legalName: "${p(t.legalName??"")}"
status: ${t.status}
tags: [${i}]
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

${l||"_no address_"}
${a.email?`
Email: ${a.email}`:""}
${a.taxId?`
Tax ID: ${a.taxId}`:""}

## Notes

${t.notes??""}
`;return{basename:n,markdown:S}}It.exports={STATUSES:$t,emptyStore:J,normalizeClientName:L,newId:X,validateClient:bt,matchClients:le,filterByStatus:ue,resolveClient:de,mergeUpsert:St,archiveClient:me,bootstrapFromNames:fe,primaryContact:pe,clientVaultNote:he,slug:gt}});var Z=B((wn,jt)=>{var{computeTotals:we}=K(),{slug:ye}=U();function ge(t){return String(t).padStart(3,"0")}function Nt(t,n){return t.yearReset&&n!==t.year?{...t,year:n,next:1}:t}function xt({prefix:t,year:n,next:s}){return`${t}-${n}-${ge(s)}`}function $e(t,n){return xt(Nt(t,n))}function ve(t,n){let s=Nt(t,n);return{...s,next:s.next+1}}function be(t,n,s){let{rows:a,total:l}=we(t,n),i=Number.isFinite(Number(s))?Number(s):0,p=Math.round(l*(i/100)*100)/100,S=Math.round((l+p)*100)/100;return{rows:a,subtotal:l,vatRate:i,vatAmount:p,total:S}}function Se(t,n){return`invoice-${ye(t)}-${n}`}var Ie=/<!-- freelancer:data (\{[\s\S]*?\}) -->/;function Ne(t){return`<!-- freelancer:data ${JSON.stringify(t)} -->`}function xe(t){let n=String(t??"").match(Ie);if(!n)return null;try{return JSON.parse(n[1])}catch{return null}}function je({invoiceVat:t,clientVat:n,settingsVat:s}={}){for(let a of[t,n,s])if(a!=null&&Number.isFinite(Number(a)))return Number(a);return 0}jt.exports={formatInvoiceNumber:xt,advanceCounter:ve,currentNumber:$e,computeInvoiceTotals:be,invoiceBasename:Se,dataComment:Ne,parseDataComment:xe,resolveVatRate:je}});var Ct=B((yn,At)=>{var{computeTotals:kt,formatMoney:T}=U(),{primaryContact:ke}=G(),{computeInvoiceTotals:Et,dataComment:Rt}=Z();function b(t){return String(t??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function tt(t,n){let s=n?.legalName||n?.name||t.client,a=[`    <h2>${b(s)}</h2>`];n?.legalName&&n.name&&n.legalName!==n.name&&a.push(`    <div class="sub">${b(n.name)}</div>`);let l=ke(n);if(l){let g=[l.name,l.role,l.email,l.phone].filter(Boolean).join(" \xB7 ");a.push(`    <div class="sub">${b(g)}</div>`)}let i=n?.billing??{};for(let g of i.addressLines??[])a.push(`    <div class="sub">${b(g)}</div>`);let S=[[i.postalCode,i.city].filter(Boolean).join(" "),i.region,i.country].filter(Boolean).join(", ");return S&&a.push(`    <div class="sub">${b(S)}</div>`),i.email&&(!l||l.email!==i.email)&&a.push(`    <div class="sub">${b(i.email)}</div>`),i.taxId&&a.push(`    <div class="sub">Tax ID: ${b(i.taxId)}</div>`),t.project&&a.push(`    <div style="margin-top:6px">${b(t.project)}</div>`),a.join(`
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
`}function Ee(t,n,s,a){let{rows:l,total:i}=kt(t.lineItems,s),p=/^#[0-9a-fA-F]{3,8}$/.test(n.accentColor??"")?n.accentColor:"#C5FF3D",S=I=>b(T(I,s.currency??"EUR")),g=new Date,k=new Date(g.getTime()+(Number(n.validityDays)||14)*864e5),$=I=>I.toISOString().slice(0,10),j=a?.defaults?.paymentTerms||n.paymentTerms||"",F=l.map(I=>`      <tr>
        <td>${b(I.description)}</td>
        <td class="num">${b(String(I.hours))}</td>
        <td class="num">${S(I.hourly)}</td>
        <td class="num">${S(I.amount)}</td>
      </tr>`).join(`
`),C=(t.assumptions??[]).map(I=>`      <li>${b(I)}</li>`).join(`
`);return`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${Ft(p)}</style>
</head>
<body>
  <header>
    <div class="brand">
      ${n.logoDataUri?`<img src="${b(n.logoDataUri)}" alt="">`:""}
      <div>
        <div class="name">${b(n.businessName||"Quote")}</div>
        <div class="contact">${b(n.contactLine??"")}</div>
      </div>
    </div>
    <div class="doc">
      <div class="title">QUOTE</div>
      <div class="meta">date ${$(g)}<br>valid until ${$(k)}</div>
    </div>
  </header>

  <div class="block">
    <div class="label">prepared for</div>
${tt(t,a)}
  </div>

  <div class="block">
    <div class="label">scope</div>
    <div>${b(t.scopeSummary??"")}</div>
  </div>

  <div class="block">
    <table>
      <thead><tr><th>item</th><th class="num">hours</th><th class="num">rate</th><th class="num">amount</th></tr></thead>
      <tbody>
${F}
        <tr class="total-row"><td colspan="3">total</td><td class="num amount">${S(i)}</td></tr>
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
    <span>${b(j)}</span>
    <span>${b(n.businessName??"")}</span>
  </footer>
</body>
</html>`}function Re(t,n,s,a){let{rows:l,total:i}=kt(t.lineItems,s),p=s.currency??"EUR",S=a?.defaults?.paymentTerms||n.paymentTerms||"",g=a?.legalName||a?.name||t.client,k=l.map(F=>`| ${F.description.replace(/\|/g,"\\|")} | ${F.hours} | ${T(F.hourly,p)} | ${T(F.amount,p)} |`).join(`
`),$=F=>String(F??"").replace(/"/g,'\\"'),j=t.clientId||a?.id?`clientId: "${$(t.clientId||a?.id)}"
`:"";return`---
client: "${$(g)}"
${j}project: "${$(t.project)}"
total: ${i}
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
${k}

**Total: ${T(i,p)}**

## Assumptions

${(t.assumptions??[]).map(F=>`- ${F}`).join(`
`)}

## Terms

${S} \u2014 valid ${Number(n.validityDays)||14} days.

${Rt({lineItems:t.lineItems??[],scopeSummary:t.scopeSummary??"",assumptions:t.assumptions??[]})}
`}function Fe(t,n,s,a){let{rows:l,subtotal:i,vatRate:p,vatAmount:S,total:g}=Et(t.lineItems,s,t.vatRate),k=/^#[0-9a-fA-F]{3,8}$/.test(n.accentColor??"")?n.accentColor:"#C5FF3D",$=I=>b(T(I,s.currency??"EUR")),j=a?.defaults?.paymentTerms||n.paymentTerms||"",F=l.map(I=>`      <tr>
        <td>${b(I.description)}</td>
        <td class="num">${b(String(I.hours))}</td>
        <td class="num">${$(I.hourly)}</td>
        <td class="num">${$(I.amount)}</td>
      </tr>`).join(`
`),C=p>0?`        <tr><td colspan="3" class="sub">vat ${b(String(p))}%</td><td class="num">${$(S)}</td></tr>
`:"";return`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${Ft(k)}</style>
</head>
<body>
  <header>
    <div class="brand">
      ${n.logoDataUri?`<img src="${b(n.logoDataUri)}" alt="">`:""}
      <div>
        <div class="name">${b(n.businessName||"Invoice")}</div>
        <div class="contact">${b(n.contactLine??"")}</div>
      </div>
    </div>
    <div class="doc">
      <div class="title">INVOICE</div>
      <div class="meta">${b(t.number)}<br>issued ${b(t.issued)}<br>due ${b(t.due)}</div>
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
        <tr><td colspan="3" class="sub">subtotal</td><td class="num">${$(i)}</td></tr>
${C}        <tr class="total-row"><td colspan="3">total due</td><td class="num amount">${$(g)}</td></tr>
      </tbody>
    </table>
  </div>

  <footer>
    <span>${b(j)}${j?" \xB7 ":""}payable to ${b(n.contactLine??n.businessName??"")}</span>
    <span>${b(t.number)}</span>
  </footer>
</body>
</html>`}function Ae(t,n,s,a){let{rows:l,subtotal:i,vatRate:p,vatAmount:S,total:g}=Et(t.lineItems,s,t.vatRate),k=s.currency??"EUR",$=a?.legalName||a?.name||t.client,j=I=>String(I??"").replace(/"/g,'\\"'),F=(I,q)=>q?`${I}: "${j(q)}"
`:"",C=l.map(I=>`| ${I.description.replace(/\|/g,"\\|")} | ${I.hours} | ${T(I.hourly,k)} | ${T(I.amount,k)} |`).join(`
`);return`---
number: "${j(t.number)}"
client: "${j($)}"
${F("clientId",t.clientId||a?.id)}${F("quoteRef",t.quoteRef)}${F("project",t.project)}issued: ${t.issued}
due: ${t.due}
subtotal: ${i}
vatRate: ${p}
vatAmount: ${S}
total: ${g}
currency: ${k}
status: draft
generated: ${new Date().toISOString()}
---

# Invoice ${t.number} \u2014 ${$}

| item | hours | rate | amount |
|------|-------|------|--------|
${C}

subtotal ${T(i,k)}${p>0?`
vat ${p}% ${T(S,k)}`:""}
**Total due: ${T(g,k)}** \u2014 due ${t.due}

${Rt({lineItems:t.lineItems??[]})}
`}At.exports={esc:b,billToHtml:tt,renderQuoteHtml:Ee,quoteMarkdown:Re,renderInvoiceHtml:Fe,invoiceMarkdown:Ae}});var Dt=B((gn,Tt)=>{var Ot=/^---\n([\s\S]*?)\n---/;function Ce(t){let n=String(t??"").match(Ot),s={};if(n)for(let a of n[1].split(`
`)){let l=a.match(/^(\w[\w-]*):\s*"?(.*?)"?\s*$/);l&&(s[l[1]]=l[2])}return{fields:s,body:n?t.slice(n[0].length):String(t??"")}}function Oe(t,n,s){let a=String(t??"").match(Ot);if(!a)throw new Error("note has no frontmatter block");let l=a[1].split(`
`),i=l.findIndex(p=>p.startsWith(`${n}:`));return i>=0?l[i]=`${n}: ${s}`:l.push(`${n}: ${s}`),`---
${l.join(`
`)}
---`+t.slice(a[0].length)}var Te={draft:["sent"],sent:["accepted","declined"],declined:["sent"],accepted:[]},De={draft:["sent"],sent:["paid"],paid:[]};function qe(t,n,s){if(!t[n]||!t[n].includes(s))throw new Error(`invalid transition: ${n} -> ${s}`)}function Me(t,n){return t.status!=="sent"||!t.due?!1:t.due<n.toISOString().slice(0,10)}Tt.exports={parseFrontmatter:Ce,setFrontmatterField:Oe,QUOTE_TRANSITIONS:Te,INVOICE_TRANSITIONS:De,assertTransition:qe,isOverdue:Me}});var h=require("node:fs/promises"),w=require("node:path"),Be=require("node:os"),{mergeSweep:Le,itemId:qt,parseStrictJson:Ue,quoteBasename:Mt,formatMoney:_e}=U(),{renderQuoteHtml:Pe,quoteMarkdown:We,renderInvoiceHtml:ze,invoiceMarkdown:Je}=Ct(),{currentNumber:et,advanceCounter:Bt,invoiceBasename:Lt,parseDataComment:Ut,resolveVatRate:nt}=Z(),{parseFrontmatter:V,setFrontmatterField:rt,QUOTE_TRANSITIONS:Ve,INVOICE_TRANSITIONS:He,assertTransition:Qe,isOverdue:Ye}=Dt(),{emptyStore:_t,matchClients:Ke,filterByStatus:Xe,resolveClient:_,mergeUpsert:Ge,archiveClient:Ze,bootstrapFromNames:tn,clientVaultNote:en}=G(),nn=14,rn=2e3,st=10,sn=100,an={vaultPath:"~/ghostbrain/vault",brand:{businessName:"",logoDataUri:"",accentColor:"#C5FF3D",contactLine:"",paymentTerms:"50% upfront, balance on delivery",validityDays:14},rates:{currency:"EUR",default:0,named:[]},invoicing:{prefix:"INV",vatRate:0,netDays:14,yearReset:!0}},on={type:"object",properties:{items:{type:"array",items:{type:"object",properties:{title:{type:"string"},client:{type:"string"},ask:{type:"string"},sourceNote:{type:"string"},confidence:{type:"number"}},required:["title","client","ask","sourceNote","confidence"]}}},required:["items"]},cn={type:"object",properties:{client:{type:"string"},project:{type:"string"},scopeSummary:{type:"string"},lineItems:{type:"array",items:{type:"object",properties:{description:{type:"string"},hours:{type:"number"},rate:{type:"string"}},required:["description","hours","rate"]}},assumptions:{type:"array",items:{type:"string"}}},required:["client","project","scopeSummary","lineItems","assumptions"]};function ln(t){return t.startsWith("~")?w.join(Be.homedir(),t.slice(1)):t}function zt(t,n){if(n==null)return t;if(typeof t!="object"||Array.isArray(t)||t===null)return n;let s={...t};for(let a of Object.keys(n))s[a]=zt(t[a],n[a]);return s}async function un(t){let{BrowserWindow:n}=require("electron"),s=new n({show:!1,webPreferences:{sandbox:!0,javascript:!1}});try{return await s.loadURL("data:text/html;charset=utf-8,"+encodeURIComponent(t)),await s.webContents.printToPDF({pageSize:"A4",printBackground:!0})}finally{s.destroy()}}async function dn(t){let{shell:n}=require("electron");return n.openPath(t)}function Pt(t,n={}){function s(e,r){let o=w.resolve(r),c=w.resolve(e);if(o!==c&&!o.startsWith(c+w.sep))throw new Error("path escapes the vault");return o}let a=n.renderPdf??un,l=n.openPath??dn,i=n.now??(()=>new Date),p=n.sweepMaxNotes??sn,S=w.join(t.dataDir,"work-items.json"),g=w.join(t.dataDir,"clients.json"),k=()=>zt(an,t.settings.get("config")??{}),$=()=>ln(k().vaultPath),j=()=>w.join($(),"30-cross-context","quotes"),F=()=>w.join($(),"30-cross-context","clients"),C=w.join(t.dataDir,"counter.json"),I=()=>w.join($(),"30-cross-context","invoices");async function q(){let{invoicing:e}=k();try{return{...JSON.parse(await h.readFile(C,"utf-8")),prefix:e.prefix,yearReset:e.yearReset}}catch(r){return t.log("counter.json unreadable, reseeding:",r.message),{prefix:e.prefix,year:i().getFullYear(),next:1,yearReset:e.yearReset}}}async function at(e){await h.mkdir(t.dataDir,{recursive:!0});let r=`${C}.tmp`;await h.writeFile(r,JSON.stringify(e,null,2)),await h.rename(r,C)}function P(e){return e.toISOString().slice(0,10)}async function M(){try{return JSON.parse(await h.readFile(S,"utf-8"))}catch{return{seen:{},items:[],dismissed:[]}}}async function it(e){await h.mkdir(t.dataDir,{recursive:!0}),await h.writeFile(S,JSON.stringify(e,null,2))}async function O(){try{let e=JSON.parse(await h.readFile(g,"utf-8"));return!e||!Array.isArray(e.clients)?_t():{version:1,clients:e.clients}}catch{return _t()}}async function H(e){await h.mkdir(t.dataDir,{recursive:!0});let r=`${g}.tmp`;await h.writeFile(r,JSON.stringify(e,null,2)),await h.rename(r,g)}async function Q(e){try{let r=F();await h.mkdir(r,{recursive:!0});let{basename:o,markdown:c}=en(e);await h.writeFile(w.join(r,`${o}.md`),c)}catch(r){t.log("client vault mirror failed:",r.message)}}async function W(e){return(await O()).clients.find(o=>o.id===e)??null}async function ot(e,r){let o;try{o=await h.readdir(e,{withFileTypes:!0})}catch{return}for(let c of o){let u=w.join(e,c.name);c.isDirectory()?await ot(u,r):c.isFile()&&c.name.endsWith(".md")&&r.push(u)}}async function ct(){let e=$(),r=[];for(let u of["00-inbox","20-contexts"])await ot(w.join(e,u),r);let o=i().getTime()-nn*864e5,c=[];for(let u of r){let d=await h.stat(u).catch(()=>null);d&&d.mtimeMs>=o&&c.push({path:u,rel:w.relative(e,u),mtimeMs:d.mtimeMs,modified:d.mtime.toISOString()})}return c.sort((u,d)=>d.mtimeMs-u.mtimeMs)}async function lt(e,r){let o=async c=>{let u=await t.api.fetch("POST","/v1/llm/run",{prompt:c,system:"You extract structured data for a freelancing tool. Respond with STRICT JSON matching the requested shape. No prose.",jsonSchema:r});if(!u.ok)throw new Error(`llm call failed: ${u.error}`);if(u.data.error)throw new Error(`llm error: ${u.data.error}`);return u.data.structured?u.data.structured:Ue(u.data.text)};try{return await o(e)}catch(c){return t.log("llm json retry:",c.message),o(`${e}

Your previous reply was not valid JSON (${c.message}). Reply with ONLY the JSON object.`)}}async function Jt(e){let r=e.map(c=>`--- note: ${c.rel} ---
${c.excerpt}`).join(`

`);return((await lt(`Below are recent notes from a personal knowledge vault (emails, chat threads, meeting notes).
Find INCOMING WORK REQUESTS a freelancer could quote: someone asking for work to be done, a project inquiry, a "can you build/fix/design X" ask.
Ignore: the vault owner's own todos, newsletters, receipts, status updates, anything already quoted.
For each request return title (short), client (person/company asking), ask (1-2 sentence summary of the work), sourceNote (the exact note path shown above), confidence (0-1).
Return {"items": [...]}. Empty array if none.

${r}`,on)).items??[]).filter(c=>c&&c.title&&c.ask&&c.sourceNote).map(c=>({id:qt(c.sourceNote,c.title),title:String(c.title),client:String(c.client??"unknown"),ask:String(c.ask),sourceNote:String(c.sourceNote),confidence:Math.max(0,Math.min(1,Number(c.confidence)||0)),foundAt:i().toISOString()}))}let ut=Promise.resolve(),dt=e=>(...r)=>{let o=ut.then(()=>e(...r));return ut=o.catch(()=>{}),o};async function mt(e,r,o,c,u={}){if(typeof r!="string"||r!==w.basename(r)||!r.endsWith(".md"))throw new Error("file must be a note basename");let d=w.join(e,r),N=await h.readFile(d,"utf-8"),y=V(N).fields.status||"draft";Qe(c,y,o);let f=rt(N,"status",o);for(let[E,x]of Object.entries(u))f=rt(f,E,x);let v=`${d}.tmp`;return await h.writeFile(v,f),await h.rename(v,d),{ok:!0,status:o}}let z=null,Y={"quotes:set-status":async({file:e,status:r}={})=>mt(j(),e,r,Ve),"quotes:sweep":async(e={})=>{if(z)return z;let r=(async()=>{try{let o=await M(),u=(await ct()).filter(y=>e.force||o.seen[y.rel]!==y.mtimeMs),d=u.slice(0,p),N=u.length-d.length;for(let y=0;y<d.length;y+=st){let f=d.slice(y,y+st);for(let x of f)x.excerpt=(await h.readFile(x.path,"utf-8").catch(()=>"")).slice(0,rn);t.ipc.send("quotes:sweep-progress",{done:Math.min(y+st,d.length),total:d.length});let v=f.length?await Jt(f):[],E={};for(let x of f)E[x.rel]=x.mtimeMs;o=Le(await M(),{items:v,scannedMtimes:E}),await it(o)}return{items:o.items,sweptAt:i().toISOString(),scanned:d.length,remaining:N}}finally{z=null}})();return z=r,r},"quotes:items":async()=>({items:(await M()).items}),"quotes:dismiss":async e=>{if(typeof e!="string"||!e)throw new Error("dismiss needs an item id");let r=await M();return r.dismissed.includes(e)||r.dismissed.push(e),r.items=r.items.filter(o=>o.id!==e),await it(r),{ok:!0}},"quotes:recent-notes":async()=>{let e=await ct(),r=[];for(let o of e.slice(0,50)){let u=(await h.readFile(o.path,"utf-8").catch(()=>"")).slice(0,400).match(/^#\s+(.+)$/m)?.[1]??w.basename(o.rel,".md");r.push({path:o.rel,title:u,modified:o.modified})}return r},"quotes:manual":async e=>{if(typeof e!="string"||!e)throw new Error("manual needs a note path");let r=s($(),w.join($(),e));await h.access(r);let o=w.basename(e,".md");return{id:qt(e,o),title:o,client:"unknown",ask:"manually selected note",sourceNote:e,confidence:1,foundAt:i().toISOString()}},"quotes:draft":async(e={})=>{let r=e.notePath;if(e.itemId){let E=(await M()).items.find(x=>x.id===e.itemId);if(!E)throw new Error(`unknown work item: ${e.itemId}`);r=E.sourceNote}if(!r)throw new Error("draft needs an itemId or notePath");let o=w.join($(),r),c=(await h.readFile(o,"utf-8")).slice(0,8e3),{rates:u}=k(),d=["default",...u.named.map(v=>v.name)],N=await lt(`A freelancer needs a quote draft for the work request in this note.

--- note: ${r} ---
${c}
---

Rate names available (pick the best fit per line item): ${d.join(", ")}.
Break the work into 2-8 concrete line items with realistic hour estimates.
Return {"client", "project", "scopeSummary", "lineItems": [{"description", "hours", "rate"}], "assumptions": [...]}.`,cn),y=await O(),{client:f}=_(y.clients,N.client);return{...N,sourceNote:r,clientId:f?.id}},"quotes:generate":async e=>{if(!e||typeof e!="object")throw new Error("generate needs a quote");if(!e.client||!Array.isArray(e.lineItems)||e.lineItems.length===0)throw new Error("quote needs a client and at least one line item");let{brand:r,rates:o}=k(),c=null;if(e.clientId){if(c=await W(e.clientId),!c)throw new Error(`unknown client: ${e.clientId}`)}else{let m=await O();c=_(m.clients,e.client).client}let u={...o,currency:c?.defaults?.currency||o.currency};c&&!e.clientId&&(e={...e,clientId:c.id});let d=Pe(e,r,u,c||void 0),N=await a(d),y=j();await h.mkdir(y,{recursive:!0});let f=c?.name||e.client,v=Mt(f,i());for(let m=2;;m++)try{await h.access(w.join(y,`${v}.md`)),v=`${Mt(f,i())}-${m}`}catch{break}let E=w.join(y,`${v}.md`),x=w.join(y,`${v}.pdf`);return await h.writeFile(x,N),await h.writeFile(E,We(e,r,u,c||void 0)),t.log("quote generated:",x),{pdfPath:x,notePath:E,clientId:e.clientId||c?.id||null}},"quotes:list":async()=>{let e;try{e=await h.readdir(j())}catch{return[]}let r=[];for(let o of e.filter(c=>c.endsWith(".md")).sort().reverse()){let u=(await h.readFile(w.join(j(),o),"utf-8").catch(()=>"")).match(/^---\n([\s\S]*?)\n---/)?.[1]??"",d=N=>u.match(new RegExp(`^${N}: "?(.*?)"?$`,"m"))?.[1]??"";r.push({file:o,client:d("client"),clientId:d("clientId")||null,project:d("project"),total:Number(d("total"))||0,currency:d("currency"),generated:d("generated"),pdf:e.includes(o.replace(/\.md$/,".pdf")),status:d("status")||"draft",invoiced:d("invoiced")==="true"})}return r},"quotes:open":async({file:e,which:r}={})=>{if(typeof e!="string"||e!==w.basename(e)||!e.endsWith(".md"))throw new Error("file must be a note basename");if(r!=="pdf"&&r!=="note")throw new Error("which must be 'pdf' or 'note'");let o=r==="pdf"?e.replace(/\.md$/,".pdf"):e,c=s(j(),w.join(j(),o)),u=await l(c);if(u)throw new Error(u);return{ok:!0}},"quotes:load":async({file:e}={})=>{if(typeof e!="string"||e!==w.basename(e)||!e.endsWith(".md"))throw new Error("file must be a note basename");let r=s(j(),w.join(j(),e)),o=await h.readFile(r,"utf-8"),{fields:c}=V(o),u=Ut(o),d=u?.lineItems??[],N=u?.scopeSummary;N===void 0&&(N=o.match(/## Scope\n\n([\s\S]*?)\n\n## /)?.[1]??"");let y=u?.assumptions;return y===void 0&&(y=(o.match(/## Assumptions\n\n([\s\S]*?)\n\n## /)?.[1]??"").split(`
`).map(v=>v.replace(/^-\s*/,"").trim()).filter(Boolean)),{client:c.client??"",clientId:c.clientId||null,project:c.project??"",status:c.status||"draft",invoiced:c.invoiced==="true",sourceNote:c.source??"",lineItems:d,scopeSummary:N,assumptions:y}},"files:open":async e=>{if(typeof e!="string"||!e)throw new Error("open needs an absolute path");let r=s($(),e),o=await l(r);if(o)throw new Error(o);return{ok:!0}},"invoices:counter":async()=>q(),"invoices:set-counter":dt(async({next:e}={})=>{let r=Number(e);if(!Number.isInteger(r)||r<1)throw new Error("next must be a positive integer");let o=await q();return await at({...o,next:r}),{ok:!0}}),"invoices:draft":async(e={})=>{let{invoicing:r,rates:o}=k(),c=await q(),u=et(c,i().getFullYear()),d=P(i()),N=P(new Date(i().getTime()+(Number(r.netDays)||14)*864e5)),y={number:u,issued:d,due:N,client:"",lineItems:[],vatRate:r.vatRate??0,currency:o.currency};if(e.quoteFile){if(e.quoteFile!==w.basename(e.quoteFile))throw new Error("quoteFile must be a basename");let f=await h.readFile(w.join(j(),e.quoteFile),"utf-8"),{fields:v}=V(f),E=Ut(f),x=await O(),m=v.clientId?x.clients.find(D=>D.id===v.clientId):_(x.clients,v.client).client;y={...y,client:v.client,clientId:m?.id,project:v.project,quoteRef:e.quoteFile,lineItems:E?.lineItems??[],vatRate:nt({clientVat:m?.defaults?.vatRate,settingsVat:r.vatRate}),currency:m?.defaults?.currency||o.currency}}else if(e.clientId){let f=await W(e.clientId);if(!f)throw new Error(`unknown client: ${e.clientId}`);y={...y,client:f.name,clientId:f.id,vatRate:nt({clientVat:f.defaults?.vatRate,settingsVat:r.vatRate}),currency:f.defaults?.currency||o.currency}}return y},"invoices:generate":dt(async e=>{if(!e||typeof e!="object")throw new Error("generate needs an invoice");if(!e.client||!Array.isArray(e.lineItems)||e.lineItems.length===0)throw new Error("invoice needs a client and at least one line item");let{brand:r,rates:o,invoicing:c}=k(),u=null;if(e.clientId){if(u=await W(e.clientId),!u)throw new Error(`unknown client: ${e.clientId}`)}else{let A=await O();u=_(A.clients,e.client).client}let d={...o,currency:e.currency||u?.defaults?.currency||o.currency},N=await q(),y=i().getFullYear(),f={...e,number:et(N,y),issued:e.issued||P(i()),due:e.due||P(new Date(i().getTime()+(Number(c.netDays)||14)*864e5)),vatRate:nt({invoiceVat:e.vatRate,clientVat:u?.defaults?.vatRate,settingsVat:c.vatRate})},v=I();await h.mkdir(v,{recursive:!0});let E=N,x=Lt(u?.name||f.client,f.number);for(;;)try{await h.access(w.join(v,`${x}.md`)),E=Bt(E,y),f.number=et(E,y),x=Lt(u?.name||f.client,f.number)}catch{break}let m=ze(f,r,d,u||void 0),D=await a(m);if(await h.writeFile(w.join(v,`${x}.pdf`),D),await h.writeFile(w.join(v,`${x}.md`),Je(f,r,d,u||void 0)),await at(Bt(E,y)),f.quoteRef)if(f.quoteRef!==w.basename(f.quoteRef)||!f.quoteRef.endsWith(".md"))t.log("quote invoiced-stamp skipped: quoteRef is not a safe basename:",f.quoteRef);else try{let A=w.join(j(),f.quoteRef),Vt=await h.readFile(A,"utf-8"),Ht=rt(Vt,"invoiced","true"),ft=`${A}.tmp`;await h.writeFile(ft,Ht),await h.rename(ft,A)}catch(A){t.log("quote invoiced-stamp failed:",A.message)}return t.log("invoice generated:",w.join(v,`${x}.pdf`)),{pdfPath:w.join(v,`${x}.pdf`),notePath:w.join(v,`${x}.md`),number:f.number}}),"invoices:list":async()=>{let e;try{e=await h.readdir(I())}catch{return[]}let r=[],o=i();for(let c of e.filter(u=>u.endsWith(".md")).sort().reverse()){let u=await h.readFile(w.join(I(),c),"utf-8").catch(()=>""),{fields:d}=V(u),N=d.status||"draft",y={status:N,due:d.due},f=Ye(y,o);r.push({file:c,number:d.number??"",client:d.client??"",clientId:d.clientId||null,project:d.project??"",quoteRef:d.quoteRef||null,total:Number(d.total)||0,currency:d.currency??"",issued:d.issued??"",due:d.due??"",status:N,paidAt:d.paidAt||null,overdue:f,daysOverdue:f?Math.floor((o.getTime()-new Date(d.due).getTime())/864e5):0,pdf:e.includes(c.replace(/\.md$/,".pdf"))})}return r},"invoices:set-status":async({file:e,status:r}={})=>{let o=r==="paid"?{paidAt:i().toISOString()}:{};return mt(I(),e,r,He,o)},"clients:list":async(e={})=>{let r=await O(),o=Xe(r.clients,e.status??"all");return e.q&&(o=Ke(o,e.q)),o.sort((c,u)=>c.name.localeCompare(u.name))},"clients:get":async e=>{if(typeof e!="string"||!e)throw new Error("get needs a client id");let r=await W(e);if(!r)throw new Error(`unknown client: ${e}`);return r},"clients:upsert":async e=>{let r=await O(),{store:o,client:c}=Ge(r,e,i);return await H(o),await Q(c),c},"clients:archive":async e=>{if(typeof e!="string"||!e)throw new Error("archive needs a client id");let r=await O(),o=Ze(r,e);await H(o);let c=o.clients.find(u=>u.id===e);return c&&await Q(c),{ok:!0}},"clients:resolve":async e=>{if(typeof e!="string")throw new Error("resolve needs a name string");let r=await O();return _(r.clients,e)},"clients:bootstrap":async()=>{let e=await O(),r=[];try{let d=await h.readdir(j());for(let N of d.filter(y=>y.endsWith(".md"))){let v=((await h.readFile(w.join(j(),N),"utf-8").catch(()=>"")).match(/^---\n([\s\S]*?)\n---/)?.[1]??"").match(/^client: "?(.*?)"?$/m)?.[1];v&&r.push(v)}}catch{}let o=await M();for(let d of o.items??[])d.client&&r.push(d.client);let{store:c,created:u}=tn(e,r,i);await H(c);for(let d of c.clients)(d.tags??[]).includes("bootstrap")&&await Q(d);return{created:u,linked:r.length}},"dashboard:summary":async()=>{let e=await M(),r=await Y["quotes:list"](),o=await Y["invoices:list"](),{rates:c}=k(),u=(m,D)=>m.filter(A=>A.status===D).length,d=m=>String(m??"").slice(0,7),N=d(i().toISOString()),y=d(new Date(i().getFullYear(),i().getMonth()-1,15).toISOString()),f=o.filter(m=>m.status==="paid"),v=m=>Math.round(m.reduce((D,A)=>D+A.total,0)*100)/100,E=[...e.items.map(m=>({kind:"workItem",label:`${m.client} \u2014 ${m.title}`,ref:m.id})),...r.filter(m=>m.status==="accepted"&&!m.invoiced).map(m=>({kind:"acceptedQuote",label:`${m.client} \u2014 ${m.project}`,ref:m.file})),...o.filter(m=>m.overdue).map(m=>({kind:"overdueInvoice",label:`${m.number} \u2014 ${m.client} \u2014 ${m.daysOverdue}d overdue`,ref:m.file}))],x=[...r.map(m=>({kind:"quote",label:`quote ${m.status} \u2014 ${m.client}`,when:m.generated})),...o.map(m=>({kind:"invoice",label:`invoice ${m.status} \u2014 ${m.number}`,when:m.issued})),...f.map(m=>({kind:"paid",label:`paid \u2014 ${m.number} \u2014 ${_e(m.total,m.currency||c.currency)}`,when:m.paidAt}))].filter(m=>m.when).sort((m,D)=>m.when<D.when?1:-1).slice(0,10);return{workItems:e.items.length,quotes:{draft:u(r,"draft"),sent:u(r,"sent"),accepted:u(r,"accepted"),declined:u(r,"declined")},invoices:{draft:u(o,"draft"),sent:u(o,"sent"),paid:f.length,overdue:o.filter(m=>m.overdue).length,unpaidTotal:v(o.filter(m=>m.status==="sent")),currency:c.currency},revenue:{thisMonth:v(f.filter(m=>d(m.paidAt)===N)),lastMonth:v(f.filter(m=>d(m.paidAt)===y)),currency:c.currency},attention:E,activity:x}}};return Y}var Wt=null;module.exports={activate(t){let n=Pt(t);for(let[s,a]of Object.entries(n))t.ipc.handle(s,a);Wt=t,t.log("freelancer activated")},deactivate(){Wt=null},createHandlers:Pt};
