var M=(t,n)=>()=>(n||t((n={exports:{}}).exports,n),n.exports);var K=M((mn,ft)=>{function Ht(t,n){let s=new Map((n.named??[]).map(l=>[l.name,l.hourly])),a=(t??[]).map(l=>{let f=s.get(l.rate)??n.default??0,b=Number.isFinite(Number(l.hours))?Number(l.hours):0;return{description:String(l.description??""),hours:b,rateName:s.has(l.rate)?l.rate:"default",hourly:f,amount:Math.round(b*f*100)/100}}),i=Math.round(a.reduce((l,f)=>l+f.amount,0)*100)/100;return{rows:a,total:i}}function Qt(t,n){try{return new Intl.NumberFormat("en-IE",{style:"currency",currency:n}).format(t)}catch{return`${n} ${t.toFixed(2)}`}}ft.exports={computeTotals:Ht,formatMoney:Qt}});var U=M((fn,ht)=>{var{createHash:Yt}=require("node:crypto"),{computeTotals:Kt,formatMoney:Xt}=K();function Gt(t,{items:n,scannedMtimes:s}){let a=new Set(t.dismissed??[]),i=new Map((t.items??[]).map(l=>[l.id,l]));for(let l of n??[])!a.has(l.id)&&!i.has(l.id)&&i.set(l.id,l);return{seen:{...t.seen??{},...s??{}},items:[...i.values()].filter(l=>!a.has(l.id)),dismissed:[...a]}}function Zt(t,n){return Yt("sha1").update(`${t}
${n}`).digest("hex").slice(0,12)}function te(t){let n=String(t??"").trim(),s=n.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);s&&(n=s[1]);let a=n.indexOf("{"),i=n.lastIndexOf("}");if(a===-1||i===-1)throw new Error(`expected JSON object, got: ${n.slice(0,120)}`);try{return JSON.parse(n.slice(a,i+1))}catch(l){throw new Error(`invalid JSON (${l.message}): ${n.slice(0,120)}`)}}function pt(t){return String(t??"").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").trim().replace(/[\s_]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"client"}function ee(t,n){let s=n instanceof Date?n:new Date(n),a=`${s.getFullYear()}${String(s.getMonth()+1).padStart(2,"0")}${String(s.getDate()).padStart(2,"0")}`;return`quote-${pt(t)}-${a}`}ht.exports={computeTotals:Kt,formatMoney:Xt,mergeSweep:Gt,itemId:Zt,parseStrictJson:te,slug:pt,quoteBasename:ee}});var G=M((pn,St)=>{var{createHash:ne,randomBytes:wt}=require("node:crypto"),{slug:yt}=U(),gt=new Set(["prospect","active","inactive","archived"]),re=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;function J(){return{version:1,clients:[]}}function B(t){return String(t??"").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").trim().replace(/[\s_]+/g," ").replace(/\s+/g," ")}function X(t){return t?ne("sha1").update(String(t)).digest("hex").slice(0,12):wt(6).toString("hex")}function se(t){return X(t||wt(8).toString("hex"))}function R(t,n=500){if(t==null)return;let s=String(t).trim();if(s)return s.slice(0,n)}function $t(t,n){if(!t)return;let s=String(t).trim();if(s){if(!re.test(s))throw new Error(`${n} is not a valid email: ${s}`);return s.slice(0,200)}}function ae(t,n){if(!t||typeof t!="object")throw new Error(`contact ${n}: expected object`);let s=R(t.name,120);if(!s)throw new Error(`contact ${n}: name is required`);return{id:typeof t.id=="string"&&t.id?t.id:se(`${s}-${n}`),name:s,email:$t(t.email,`contact ${n} email`),phone:R(t.phone,40),role:R(t.role,80),primary:!!t.primary}}function ie(t){if(!t||typeof t!="object")return{};let n=Array.isArray(t.addressLines)?t.addressLines.map(s=>R(s,120)).filter(Boolean).slice(0,4):void 0;return{email:$t(t.email,"billing email"),addressLines:n?.length?n:void 0,city:R(t.city,80),region:R(t.region,80),postalCode:R(t.postalCode,20),country:R(t.country,80),taxId:R(t.taxId,40)}}function oe(t){if(!t||typeof t!="object")return{};let n=R(t.currency,3),s;if(t.vatRate!==void 0&&t.vatRate!==null&&String(t.vatRate).trim()!==""){let a=Number(t.vatRate);if(Number.isFinite(a)){if(a<0||a>100)throw new Error(`vatRate must be 0-100, got ${a}`);s=a}}return{currency:n?n.toUpperCase():void 0,rateName:R(t.rateName,60),paymentTerms:R(t.paymentTerms,200),vatRate:s}}function vt(t,{now:n=()=>new Date}={}){if(!t||typeof t!="object")throw new Error("client payload required");let s=R(t.name,120);if(!s)throw new Error("client name is required");let a=t.status??"prospect";if(!gt.has(a))throw new Error(`invalid status: ${a}`);let i=Array.isArray(t.contacts)?t.contacts.map((g,F)=>ae(g,F)):[],l=!1;for(let g of i)g.primary&&(l?g.primary=!1:l=!0);i.length&&!l&&(i[0].primary=!0);let f=Array.isArray(t.tags)?[...new Set(t.tags.map(g=>R(g,40)).filter(Boolean))]:[],b=Array.isArray(t.sourceNotes)?[...new Set(t.sourceNotes.map(g=>R(g,500)).filter(Boolean))]:[],w=n().toISOString();return{id:typeof t.id=="string"&&/^[a-z0-9-]{6,32}$/i.test(t.id)?t.id:X(`${s}
${w}`),name:s,legalName:R(t.legalName,160),status:a,tags:f,website:R(t.website,300),contacts:i,billing:ie(t.billing),defaults:oe(t.defaults),notes:R(t.notes,8e3),sourceNotes:b,createdAt:typeof t.createdAt=="string"&&t.createdAt?t.createdAt:w,updatedAt:w}}function ce(t,n){let s=String(n??"").trim().toLowerCase();return s?(t??[]).filter(a=>[a.name,a.legalName,...a.tags??[],...(a.contacts??[]).flatMap(l=>[l.name,l.email]),a.billing?.email,a.billing?.taxId].filter(Boolean).join(" ").toLowerCase().includes(s)):[...t??[]]}function le(t,n){return!n||n==="all"?(t??[]).filter(s=>s.status!=="archived"):(t??[]).filter(s=>s.status===n)}function ue(t,n){let s=t??[],a=B(n);if(!a)return{client:null,candidates:[]};let i=s.filter(f=>B(f.name)===a&&f.status!=="archived");if(i.length===1)return{client:i[0],candidates:i};if(i.length>1)return{client:null,candidates:i};let l=s.filter(f=>f.status!=="archived"&&B(f.name).includes(a));return l.length===1?{client:l[0],candidates:l}:{client:null,candidates:l}}function bt(t,n,s=()=>new Date){let i=[...(t?.clients?t:J()).clients??[]],l=vt(n,{now:s}),f=i.findIndex(b=>b.id===l.id);return f>=0?(l.createdAt=i[f].createdAt,i[f]=l):i.push(l),{store:{version:1,clients:i},client:l}}function de(t,n){let s=t?.clients?t:J(),a=(s.clients??[]).map(i=>i.id===n?{...i,status:"archived",updatedAt:new Date().toISOString()}:i);if(!(s.clients??[]).some(i=>i.id===n))throw new Error(`unknown client: ${n}`);return{version:1,clients:a}}function me(t,n,s=()=>new Date){let a=t?.clients?{version:1,clients:[...t.clients]}:J(),i=0,l=new Set(a.clients.map(f=>B(f.name)));for(let f of n??[]){let b=R(f,120);if(!b)continue;let w=B(b);if(!w||w==="unknown"||l.has(w))continue;let{store:j,client:g}=bt(a,{name:b,status:"active",tags:["bootstrap"]},s);a=j,l.add(w),i+=1}return{store:a,created:i}}function fe(t){let n=t?.contacts??[];return n.find(s=>s.primary)||n[0]||null}function pe(t){let n=`client-${yt(t.name)}`,s=(t.contacts??[]).map(w=>`- ${[w.name,w.role,w.email,w.phone].filter(Boolean).join(" \xB7 ")}${w.primary?" (primary)":""}`).join(`
`),a=t.billing??{},i=[...a.addressLines??[],[a.city,a.postalCode].filter(Boolean).join(" "),a.region,a.country].filter(Boolean).join(`
`),l=(t.tags??[]).map(w=>JSON.stringify(w)).join(", "),f=w=>String(w??"").replace(/"/g,'\\"'),b=`---
type: client
id: "${t.id}"
name: "${f(t.name)}"
legalName: "${f(t.legalName??"")}"
status: ${t.status}
tags: [${l}]
taxId: "${f(a.taxId??"")}"
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

${i||"_no address_"}
${a.email?`
Email: ${a.email}`:""}
${a.taxId?`
Tax ID: ${a.taxId}`:""}

## Notes

${t.notes??""}
`;return{basename:n,markdown:b}}St.exports={STATUSES:gt,emptyStore:J,normalizeClientName:B,newId:X,validateClient:vt,matchClients:ce,filterByStatus:le,resolveClient:ue,mergeUpsert:bt,archiveClient:de,bootstrapFromNames:me,primaryContact:fe,clientVaultNote:pe,slug:yt}});var Z=M((hn,xt)=>{var{computeTotals:he}=K(),{slug:we}=U();function ye(t){return String(t).padStart(3,"0")}function It(t,n){return t.yearReset&&n!==t.year?{...t,year:n,next:1}:t}function Nt({prefix:t,year:n,next:s}){return`${t}-${n}-${ye(s)}`}function ge(t,n){return Nt(It(t,n))}function $e(t,n){let s=It(t,n);return{...s,next:s.next+1}}function ve(t,n,s){let{rows:a,total:i}=he(t,n),l=Number.isFinite(Number(s))?Number(s):0,f=Math.round(i*(l/100)*100)/100,b=Math.round((i+f)*100)/100;return{rows:a,subtotal:i,vatRate:l,vatAmount:f,total:b}}function be(t,n){return`invoice-${we(t)}-${n}`}var Se=/<!-- freelancer:data (\{[\s\S]*?\}) -->/;function Ie(t){return`<!-- freelancer:data ${JSON.stringify(t)} -->`}function Ne(t){let n=String(t??"").match(Se);if(!n)return null;try{return JSON.parse(n[1])}catch{return null}}function xe({invoiceVat:t,clientVat:n,settingsVat:s}={}){for(let a of[t,n,s])if(a!=null&&Number.isFinite(Number(a)))return Number(a);return 0}xt.exports={formatInvoiceNumber:Nt,advanceCounter:$e,currentNumber:ge,computeInvoiceTotals:ve,invoiceBasename:be,dataComment:Ie,parseDataComment:Ne,resolveVatRate:xe}});var At=M((wn,Ft)=>{var{computeTotals:jt,formatMoney:T}=U(),{primaryContact:je}=G(),{computeInvoiceTotals:Et,dataComment:kt}=Z();function S(t){return String(t??"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function tt(t,n){let s=n?.legalName||n?.name||t.client,a=[`    <h2>${S(s)}</h2>`];n?.legalName&&n.name&&n.legalName!==n.name&&a.push(`    <div class="sub">${S(n.name)}</div>`);let i=je(n);if(i){let w=[i.name,i.role,i.email,i.phone].filter(Boolean).join(" \xB7 ");a.push(`    <div class="sub">${S(w)}</div>`)}let l=n?.billing??{};for(let w of l.addressLines??[])a.push(`    <div class="sub">${S(w)}</div>`);let b=[[l.postalCode,l.city].filter(Boolean).join(" "),l.region,l.country].filter(Boolean).join(", ");return b&&a.push(`    <div class="sub">${S(b)}</div>`),l.email&&(!i||i.email!==l.email)&&a.push(`    <div class="sub">${S(l.email)}</div>`),l.taxId&&a.push(`    <div class="sub">Tax ID: ${S(l.taxId)}</div>`),t.project&&a.push(`    <div style="margin-top:6px">${S(t.project)}</div>`),a.join(`
`)}function Rt(t){return`
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
`}function Ee(t,n,s,a){let{rows:i,total:l}=jt(t.lineItems,s),f=/^#[0-9a-fA-F]{3,8}$/.test(n.accentColor??"")?n.accentColor:"#C5FF3D",b=I=>S(T(I,s.currency??"EUR")),w=new Date,j=new Date(w.getTime()+(Number(n.validityDays)||14)*864e5),g=I=>I.toISOString().slice(0,10),F=a?.defaults?.paymentTerms||n.paymentTerms||"",E=i.map(I=>`      <tr>
        <td>${S(I.description)}</td>
        <td class="num">${S(String(I.hours))}</td>
        <td class="num">${b(I.hourly)}</td>
        <td class="num">${b(I.amount)}</td>
      </tr>`).join(`
`),A=(t.assumptions??[]).map(I=>`      <li>${S(I)}</li>`).join(`
`);return`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${Rt(f)}</style>
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
      <div class="meta">date ${g(w)}<br>valid until ${g(j)}</div>
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
${E}
        <tr class="total-row"><td colspan="3">total</td><td class="num amount">${b(l)}</td></tr>
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
    <span>${S(F)}</span>
    <span>${S(n.businessName??"")}</span>
  </footer>
</body>
</html>`}function ke(t,n,s,a){let{rows:i,total:l}=jt(t.lineItems,s),f=s.currency??"EUR",b=a?.defaults?.paymentTerms||n.paymentTerms||"",w=a?.legalName||a?.name||t.client,j=i.map(E=>`| ${E.description.replace(/\|/g,"\\|")} | ${E.hours} | ${T(E.hourly,f)} | ${T(E.amount,f)} |`).join(`
`),g=E=>String(E??"").replace(/"/g,'\\"'),F=t.clientId||a?.id?`clientId: "${g(t.clientId||a?.id)}"
`:"";return`---
client: "${g(w)}"
${F}project: "${g(t.project)}"
total: ${l}
currency: ${f}
status: draft
source: "${g(t.sourceNote)}"
generated: ${new Date().toISOString()}
---

# Quote \u2014 ${w}

**Project:** ${t.project??""}

## Scope

${t.scopeSummary??""}

## Line items

| item | hours | rate | amount |
|------|-------|------|--------|
${j}

**Total: ${T(l,f)}**

## Assumptions

${(t.assumptions??[]).map(E=>`- ${E}`).join(`
`)}

## Terms

${b} \u2014 valid ${Number(n.validityDays)||14} days.

${kt({lineItems:t.lineItems??[],scopeSummary:t.scopeSummary??"",assumptions:t.assumptions??[]})}
`}function Re(t,n,s,a){let{rows:i,subtotal:l,vatRate:f,vatAmount:b,total:w}=Et(t.lineItems,s,t.vatRate),j=/^#[0-9a-fA-F]{3,8}$/.test(n.accentColor??"")?n.accentColor:"#C5FF3D",g=I=>S(T(I,s.currency??"EUR")),F=a?.defaults?.paymentTerms||n.paymentTerms||"",E=i.map(I=>`      <tr>
        <td>${S(I.description)}</td>
        <td class="num">${S(String(I.hours))}</td>
        <td class="num">${g(I.hourly)}</td>
        <td class="num">${g(I.amount)}</td>
      </tr>`).join(`
`),A=f>0?`        <tr><td colspan="3" class="sub">vat ${S(String(f))}%</td><td class="num">${g(b)}</td></tr>
`:"";return`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${Rt(j)}</style>
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
${E}
        <tr><td colspan="3" class="sub">subtotal</td><td class="num">${g(l)}</td></tr>
${A}        <tr class="total-row"><td colspan="3">total due</td><td class="num amount">${g(w)}</td></tr>
      </tbody>
    </table>
  </div>

  <footer>
    <span>${S(F)}${F?" \xB7 ":""}payable to ${S(n.contactLine??n.businessName??"")}</span>
    <span>${S(t.number)}</span>
  </footer>
</body>
</html>`}function Fe(t,n,s,a){let{rows:i,subtotal:l,vatRate:f,vatAmount:b,total:w}=Et(t.lineItems,s,t.vatRate),j=s.currency??"EUR",g=a?.legalName||a?.name||t.client,F=I=>String(I??"").replace(/"/g,'\\"'),E=(I,L)=>L?`${I}: "${F(L)}"
`:"",A=i.map(I=>`| ${I.description.replace(/\|/g,"\\|")} | ${I.hours} | ${T(I.hourly,j)} | ${T(I.amount,j)} |`).join(`
`);return`---
number: "${F(t.number)}"
client: "${F(g)}"
${E("clientId",t.clientId||a?.id)}${E("quoteRef",t.quoteRef)}${E("project",t.project)}issued: ${t.issued}
due: ${t.due}
subtotal: ${l}
vatRate: ${f}
vatAmount: ${b}
total: ${w}
currency: ${j}
status: draft
generated: ${new Date().toISOString()}
---

# Invoice ${t.number} \u2014 ${g}

| item | hours | rate | amount |
|------|-------|------|--------|
${A}

subtotal ${T(l,j)}${f>0?`
vat ${f}% ${T(b,j)}`:""}
**Total due: ${T(w,j)}** \u2014 due ${t.due}

${kt({lineItems:t.lineItems??[]})}
`}Ft.exports={esc:S,billToHtml:tt,renderQuoteHtml:Ee,quoteMarkdown:ke,renderInvoiceHtml:Re,invoiceMarkdown:Fe}});var Tt=M((yn,Ot)=>{var Ct=/^---\n([\s\S]*?)\n---/;function Ae(t){let n=String(t??"").match(Ct),s={};if(n)for(let a of n[1].split(`
`)){let i=a.match(/^(\w[\w-]*):\s*"?(.*?)"?\s*$/);i&&(s[i[1]]=i[2])}return{fields:s,body:n?t.slice(n[0].length):String(t??"")}}function Ce(t,n,s){let a=String(t??"").match(Ct);if(!a)throw new Error("note has no frontmatter block");let i=a[1].split(`
`),l=i.findIndex(f=>f.startsWith(`${n}:`));return l>=0?i[l]=`${n}: ${s}`:i.push(`${n}: ${s}`),`---
${i.join(`
`)}
---`+t.slice(a[0].length)}var Oe={draft:["sent"],sent:["accepted","declined"],declined:["sent"],accepted:[]},Te={draft:["sent"],sent:["paid"],paid:[]};function De(t,n,s){if(!t[n]||!t[n].includes(s))throw new Error(`invalid transition: ${n} -> ${s}`)}function qe(t,n){return t.status!=="sent"||!t.due?!1:t.due<n.toISOString().slice(0,10)}Ot.exports={parseFrontmatter:Ae,setFrontmatterField:Ce,QUOTE_TRANSITIONS:Oe,INVOICE_TRANSITIONS:Te,assertTransition:De,isOverdue:qe}});var y=require("node:fs/promises"),h=require("node:path"),Me=require("node:os"),{mergeSweep:Be,itemId:Dt,parseStrictJson:Le,quoteBasename:qt,formatMoney:Ue}=U(),{renderQuoteHtml:_e,quoteMarkdown:We,renderInvoiceHtml:Pe,invoiceMarkdown:ze}=At(),{currentNumber:et,advanceCounter:Mt,invoiceBasename:Bt,parseDataComment:Lt,resolveVatRate:nt}=Z(),{parseFrontmatter:V,setFrontmatterField:rt,QUOTE_TRANSITIONS:Je,INVOICE_TRANSITIONS:Ve,assertTransition:He,isOverdue:Qe}=Tt(),{emptyStore:Ut,matchClients:Ye,filterByStatus:Ke,resolveClient:_,mergeUpsert:Xe,archiveClient:Ge,bootstrapFromNames:Ze,clientVaultNote:tn}=G(),en=14,nn=2e3,st=10,rn=100,sn={vaultPath:"~/ghostbrain/vault",brand:{businessName:"",logoDataUri:"",accentColor:"#C5FF3D",contactLine:"",paymentTerms:"50% upfront, balance on delivery",validityDays:14},rates:{currency:"EUR",default:0,named:[]},invoicing:{prefix:"INV",vatRate:0,netDays:14,yearReset:!0}},an={type:"object",properties:{items:{type:"array",items:{type:"object",properties:{title:{type:"string"},client:{type:"string"},ask:{type:"string"},sourceNote:{type:"string"},confidence:{type:"number"}},required:["title","client","ask","sourceNote","confidence"]}}},required:["items"]},on={type:"object",properties:{client:{type:"string"},project:{type:"string"},scopeSummary:{type:"string"},lineItems:{type:"array",items:{type:"object",properties:{description:{type:"string"},hours:{type:"number"},rate:{type:"string"}},required:["description","hours","rate"]}},assumptions:{type:"array",items:{type:"string"}}},required:["client","project","scopeSummary","lineItems","assumptions"]};function cn(t){return t.startsWith("~")?h.join(Me.homedir(),t.slice(1)):t}function Pt(t,n){if(n==null)return t;if(typeof t!="object"||Array.isArray(t)||t===null)return n;let s={...t};for(let a of Object.keys(n))s[a]=Pt(t[a],n[a]);return s}async function ln(t){let{BrowserWindow:n}=require("electron"),s=new n({show:!1,webPreferences:{sandbox:!0,javascript:!1}});try{return await s.loadURL("data:text/html;charset=utf-8,"+encodeURIComponent(t)),await s.webContents.printToPDF({pageSize:"A4",printBackground:!0})}finally{s.destroy()}}async function un(t){let{shell:n}=require("electron");return n.openPath(t)}function _t(t,n={}){let s=n.renderPdf??ln,a=n.openPath??un,i=n.now??(()=>new Date),l=n.sweepMaxNotes??rn,f=h.join(t.dataDir,"work-items.json"),b=h.join(t.dataDir,"clients.json"),w=()=>Pt(sn,t.settings.get("config")??{}),j=()=>cn(w().vaultPath),g=()=>h.join(j(),"30-cross-context","quotes"),F=()=>h.join(j(),"30-cross-context","clients"),E=h.join(t.dataDir,"counter.json"),A=()=>h.join(j(),"30-cross-context","invoices");async function I(){let{invoicing:e}=w();try{return{...JSON.parse(await y.readFile(E,"utf-8")),prefix:e.prefix,yearReset:e.yearReset}}catch(r){return t.log("counter.json unreadable, reseeding:",r.message),{prefix:e.prefix,year:i().getFullYear(),next:1,yearReset:e.yearReset}}}async function L(e){await y.mkdir(t.dataDir,{recursive:!0});let r=`${E}.tmp`;await y.writeFile(r,JSON.stringify(e,null,2)),await y.rename(r,E)}function W(e){return e.toISOString().slice(0,10)}async function q(){try{return JSON.parse(await y.readFile(f,"utf-8"))}catch{return{seen:{},items:[],dismissed:[]}}}async function at(e){await y.mkdir(t.dataDir,{recursive:!0}),await y.writeFile(f,JSON.stringify(e,null,2))}async function O(){try{let e=JSON.parse(await y.readFile(b,"utf-8"));return!e||!Array.isArray(e.clients)?Ut():{version:1,clients:e.clients}}catch{return Ut()}}async function H(e){await y.mkdir(t.dataDir,{recursive:!0});let r=`${b}.tmp`;await y.writeFile(r,JSON.stringify(e,null,2)),await y.rename(r,b)}async function Q(e){try{let r=F();await y.mkdir(r,{recursive:!0});let{basename:o,markdown:c}=tn(e);await y.writeFile(h.join(r,`${o}.md`),c)}catch(r){t.log("client vault mirror failed:",r.message)}}async function P(e){return(await O()).clients.find(o=>o.id===e)??null}async function it(e,r){let o;try{o=await y.readdir(e,{withFileTypes:!0})}catch{return}for(let c of o){let u=h.join(e,c.name);c.isDirectory()?await it(u,r):c.isFile()&&c.name.endsWith(".md")&&r.push(u)}}async function ot(){let e=j(),r=[];for(let u of["00-inbox","20-contexts"])await it(h.join(e,u),r);let o=i().getTime()-en*864e5,c=[];for(let u of r){let d=await y.stat(u).catch(()=>null);d&&d.mtimeMs>=o&&c.push({path:u,rel:h.relative(e,u),mtimeMs:d.mtimeMs,modified:d.mtime.toISOString()})}return c.sort((u,d)=>d.mtimeMs-u.mtimeMs)}async function ct(e,r){let o=async c=>{let u=await t.api.fetch("POST","/v1/llm/run",{prompt:c,system:"You extract structured data for a freelancing tool. Respond with STRICT JSON matching the requested shape. No prose.",jsonSchema:r});if(!u.ok)throw new Error(`llm call failed: ${u.error}`);if(u.data.error)throw new Error(`llm error: ${u.data.error}`);return u.data.structured?u.data.structured:Le(u.data.text)};try{return await o(e)}catch(c){return t.log("llm json retry:",c.message),o(`${e}

Your previous reply was not valid JSON (${c.message}). Reply with ONLY the JSON object.`)}}async function zt(e){let r=e.map(c=>`--- note: ${c.rel} ---
${c.excerpt}`).join(`

`);return((await ct(`Below are recent notes from a personal knowledge vault (emails, chat threads, meeting notes).
Find INCOMING WORK REQUESTS a freelancer could quote: someone asking for work to be done, a project inquiry, a "can you build/fix/design X" ask.
Ignore: the vault owner's own todos, newsletters, receipts, status updates, anything already quoted.
For each request return title (short), client (person/company asking), ask (1-2 sentence summary of the work), sourceNote (the exact note path shown above), confidence (0-1).
Return {"items": [...]}. Empty array if none.

${r}`,an)).items??[]).filter(c=>c&&c.title&&c.ask&&c.sourceNote).map(c=>({id:Dt(c.sourceNote,c.title),title:String(c.title),client:String(c.client??"unknown"),ask:String(c.ask),sourceNote:String(c.sourceNote),confidence:Math.max(0,Math.min(1,Number(c.confidence)||0)),foundAt:i().toISOString()}))}let lt=Promise.resolve(),ut=e=>(...r)=>{let o=lt.then(()=>e(...r));return lt=o.catch(()=>{}),o};async function dt(e,r,o,c,u={}){if(typeof r!="string"||r!==h.basename(r)||!r.endsWith(".md"))throw new Error("file must be a note basename");let d=h.join(e,r),N=await y.readFile(d,"utf-8"),$=V(N).fields.status||"draft";He(c,$,o);let p=rt(N,"status",o);for(let[k,x]of Object.entries(u))p=rt(p,k,x);let v=`${d}.tmp`;return await y.writeFile(v,p),await y.rename(v,d),{ok:!0,status:o}}let z=null,Y={"quotes:set-status":async({file:e,status:r}={})=>dt(g(),e,r,Je),"quotes:sweep":async(e={})=>{if(z)return z;let r=(async()=>{try{let o=await q(),u=(await ot()).filter($=>e.force||o.seen[$.rel]!==$.mtimeMs),d=u.slice(0,l),N=u.length-d.length;for(let $=0;$<d.length;$+=st){let p=d.slice($,$+st);for(let x of p)x.excerpt=(await y.readFile(x.path,"utf-8").catch(()=>"")).slice(0,nn);t.ipc.send("quotes:sweep-progress",{done:Math.min($+st,d.length),total:d.length});let v=p.length?await zt(p):[],k={};for(let x of p)k[x.rel]=x.mtimeMs;o=Be(await q(),{items:v,scannedMtimes:k}),await at(o)}return{items:o.items,sweptAt:i().toISOString(),scanned:d.length,remaining:N}}finally{z=null}})();return z=r,r},"quotes:items":async()=>({items:(await q()).items}),"quotes:dismiss":async e=>{if(typeof e!="string"||!e)throw new Error("dismiss needs an item id");let r=await q();return r.dismissed.includes(e)||r.dismissed.push(e),r.items=r.items.filter(o=>o.id!==e),await at(r),{ok:!0}},"quotes:recent-notes":async()=>{let e=await ot(),r=[];for(let o of e.slice(0,50)){let u=(await y.readFile(o.path,"utf-8").catch(()=>"")).slice(0,400).match(/^#\s+(.+)$/m)?.[1]??h.basename(o.rel,".md");r.push({path:o.rel,title:u,modified:o.modified})}return r},"quotes:manual":async e=>{if(typeof e!="string"||!e)throw new Error("manual needs a note path");let r=h.join(j(),e);if(!h.resolve(r).startsWith(h.resolve(j())))throw new Error("note path escapes the vault");await y.access(r);let o=h.basename(e,".md");return{id:Dt(e,o),title:o,client:"unknown",ask:"manually selected note",sourceNote:e,confidence:1,foundAt:i().toISOString()}},"quotes:draft":async(e={})=>{let r=e.notePath;if(e.itemId){let k=(await q()).items.find(x=>x.id===e.itemId);if(!k)throw new Error(`unknown work item: ${e.itemId}`);r=k.sourceNote}if(!r)throw new Error("draft needs an itemId or notePath");let o=h.join(j(),r),c=(await y.readFile(o,"utf-8")).slice(0,8e3),{rates:u}=w(),d=["default",...u.named.map(v=>v.name)],N=await ct(`A freelancer needs a quote draft for the work request in this note.

--- note: ${r} ---
${c}
---

Rate names available (pick the best fit per line item): ${d.join(", ")}.
Break the work into 2-8 concrete line items with realistic hour estimates.
Return {"client", "project", "scopeSummary", "lineItems": [{"description", "hours", "rate"}], "assumptions": [...]}.`,on),$=await O(),{client:p}=_($.clients,N.client);return{...N,sourceNote:r,clientId:p?.id}},"quotes:generate":async e=>{if(!e||typeof e!="object")throw new Error("generate needs a quote");if(!e.client||!Array.isArray(e.lineItems)||e.lineItems.length===0)throw new Error("quote needs a client and at least one line item");let{brand:r,rates:o}=w(),c=null;if(e.clientId){if(c=await P(e.clientId),!c)throw new Error(`unknown client: ${e.clientId}`)}else{let m=await O();c=_(m.clients,e.client).client}let u={...o,currency:c?.defaults?.currency||o.currency};c&&!e.clientId&&(e={...e,clientId:c.id});let d=_e(e,r,u,c||void 0),N=await s(d),$=g();await y.mkdir($,{recursive:!0});let p=c?.name||e.client,v=qt(p,i());for(let m=2;;m++)try{await y.access(h.join($,`${v}.md`)),v=`${qt(p,i())}-${m}`}catch{break}let k=h.join($,`${v}.md`),x=h.join($,`${v}.pdf`);return await y.writeFile(x,N),await y.writeFile(k,We(e,r,u,c||void 0)),t.log("quote generated:",x),{pdfPath:x,notePath:k,clientId:e.clientId||c?.id||null}},"quotes:list":async()=>{let e;try{e=await y.readdir(g())}catch{return[]}let r=[];for(let o of e.filter(c=>c.endsWith(".md")).sort().reverse()){let u=(await y.readFile(h.join(g(),o),"utf-8").catch(()=>"")).match(/^---\n([\s\S]*?)\n---/)?.[1]??"",d=N=>u.match(new RegExp(`^${N}: "?(.*?)"?$`,"m"))?.[1]??"";r.push({file:o,client:d("client"),clientId:d("clientId")||null,project:d("project"),total:Number(d("total"))||0,currency:d("currency"),generated:d("generated"),pdf:e.includes(o.replace(/\.md$/,".pdf")),status:d("status")||"draft",invoiced:d("invoiced")==="true"})}return r},"quotes:open":async({file:e,which:r}={})=>{if(typeof e!="string"||e!==h.basename(e)||!e.endsWith(".md"))throw new Error("file must be a note basename");let o=r==="pdf"?e.replace(/\.md$/,".pdf"):e,c=h.join(g(),o);if(!h.resolve(c).startsWith(h.resolve(g())))throw new Error("path escapes the vault");let u=await a(c);if(u)throw new Error(u);return{ok:!0}},"quotes:load":async({file:e}={})=>{if(typeof e!="string"||e!==h.basename(e)||!e.endsWith(".md"))throw new Error("file must be a note basename");let r=h.join(g(),e);if(!h.resolve(r).startsWith(h.resolve(g())))throw new Error("path escapes the vault");let o=await y.readFile(r,"utf-8"),{fields:c}=V(o),u=Lt(o),d=u?.lineItems??[],N=u?.scopeSummary;N===void 0&&(N=o.match(/## Scope\n\n([\s\S]*?)\n\n## /)?.[1]??"");let $=u?.assumptions;return $===void 0&&($=(o.match(/## Assumptions\n\n([\s\S]*?)\n\n## /)?.[1]??"").split(`
`).map(v=>v.replace(/^-\s*/,"").trim()).filter(Boolean)),{client:c.client??"",clientId:c.clientId||null,project:c.project??"",status:c.status||"draft",invoiced:c.invoiced==="true",sourceNote:c.source??"",lineItems:d,scopeSummary:N,assumptions:$}},"files:open":async e=>{if(typeof e!="string"||!e)throw new Error("open needs an absolute path");let r=h.resolve(e);if(!r.startsWith(h.resolve(j())))throw new Error("path escapes the vault");let o=await a(r);if(o)throw new Error(o);return{ok:!0}},"invoices:counter":async()=>I(),"invoices:set-counter":ut(async({next:e}={})=>{let r=Number(e);if(!Number.isInteger(r)||r<1)throw new Error("next must be a positive integer");let o=await I();return await L({...o,next:r}),{ok:!0}}),"invoices:draft":async(e={})=>{let{invoicing:r,rates:o}=w(),c=await I(),u=et(c,i().getFullYear()),d=W(i()),N=W(new Date(i().getTime()+(Number(r.netDays)||14)*864e5)),$={number:u,issued:d,due:N,client:"",lineItems:[],vatRate:r.vatRate??0,currency:o.currency};if(e.quoteFile){if(e.quoteFile!==h.basename(e.quoteFile))throw new Error("quoteFile must be a basename");let p=await y.readFile(h.join(g(),e.quoteFile),"utf-8"),{fields:v}=V(p),k=Lt(p),x=await O(),m=v.clientId?x.clients.find(D=>D.id===v.clientId):_(x.clients,v.client).client;$={...$,client:v.client,clientId:m?.id,project:v.project,quoteRef:e.quoteFile,lineItems:k?.lineItems??[],vatRate:nt({clientVat:m?.defaults?.vatRate,settingsVat:r.vatRate}),currency:m?.defaults?.currency||o.currency}}else if(e.clientId){let p=await P(e.clientId);if(!p)throw new Error(`unknown client: ${e.clientId}`);$={...$,client:p.name,clientId:p.id,vatRate:nt({clientVat:p.defaults?.vatRate,settingsVat:r.vatRate}),currency:p.defaults?.currency||o.currency}}return $},"invoices:generate":ut(async e=>{if(!e||typeof e!="object")throw new Error("generate needs an invoice");if(!e.client||!Array.isArray(e.lineItems)||e.lineItems.length===0)throw new Error("invoice needs a client and at least one line item");let{brand:r,rates:o,invoicing:c}=w(),u=null;if(e.clientId){if(u=await P(e.clientId),!u)throw new Error(`unknown client: ${e.clientId}`)}else{let C=await O();u=_(C.clients,e.client).client}let d={...o,currency:e.currency||u?.defaults?.currency||o.currency},N=await I(),$=i().getFullYear(),p={...e,number:et(N,$),issued:e.issued||W(i()),due:e.due||W(new Date(i().getTime()+(Number(c.netDays)||14)*864e5)),vatRate:nt({invoiceVat:e.vatRate,clientVat:u?.defaults?.vatRate,settingsVat:c.vatRate})},v=A();await y.mkdir(v,{recursive:!0});let k=N,x=Bt(u?.name||p.client,p.number);for(;;)try{await y.access(h.join(v,`${x}.md`)),k=Mt(k,$),p.number=et(k,$),x=Bt(u?.name||p.client,p.number)}catch{break}let m=Pe(p,r,d,u||void 0),D=await s(m);if(await y.writeFile(h.join(v,`${x}.pdf`),D),await y.writeFile(h.join(v,`${x}.md`),ze(p,r,d,u||void 0)),await L(Mt(k,$)),p.quoteRef)if(p.quoteRef!==h.basename(p.quoteRef)||!p.quoteRef.endsWith(".md"))t.log("quote invoiced-stamp skipped: quoteRef is not a safe basename:",p.quoteRef);else try{let C=h.join(g(),p.quoteRef),Jt=await y.readFile(C,"utf-8"),Vt=rt(Jt,"invoiced","true"),mt=`${C}.tmp`;await y.writeFile(mt,Vt),await y.rename(mt,C)}catch(C){t.log("quote invoiced-stamp failed:",C.message)}return t.log("invoice generated:",h.join(v,`${x}.pdf`)),{pdfPath:h.join(v,`${x}.pdf`),notePath:h.join(v,`${x}.md`),number:p.number}}),"invoices:list":async()=>{let e;try{e=await y.readdir(A())}catch{return[]}let r=[],o=i();for(let c of e.filter(u=>u.endsWith(".md")).sort().reverse()){let u=await y.readFile(h.join(A(),c),"utf-8").catch(()=>""),{fields:d}=V(u),N=d.status||"draft",$={status:N,due:d.due},p=Qe($,o);r.push({file:c,number:d.number??"",client:d.client??"",clientId:d.clientId||null,project:d.project??"",quoteRef:d.quoteRef||null,total:Number(d.total)||0,currency:d.currency??"",issued:d.issued??"",due:d.due??"",status:N,paidAt:d.paidAt||null,overdue:p,daysOverdue:p?Math.floor((o.getTime()-new Date(d.due).getTime())/864e5):0,pdf:e.includes(c.replace(/\.md$/,".pdf"))})}return r},"invoices:set-status":async({file:e,status:r}={})=>{let o=r==="paid"?{paidAt:i().toISOString()}:{};return dt(A(),e,r,Ve,o)},"clients:list":async(e={})=>{let r=await O(),o=Ke(r.clients,e.status??"all");return e.q&&(o=Ye(o,e.q)),o.sort((c,u)=>c.name.localeCompare(u.name))},"clients:get":async e=>{if(typeof e!="string"||!e)throw new Error("get needs a client id");let r=await P(e);if(!r)throw new Error(`unknown client: ${e}`);return r},"clients:upsert":async e=>{let r=await O(),{store:o,client:c}=Xe(r,e,i);return await H(o),await Q(c),c},"clients:archive":async e=>{if(typeof e!="string"||!e)throw new Error("archive needs a client id");let r=await O(),o=Ge(r,e);await H(o);let c=o.clients.find(u=>u.id===e);return c&&await Q(c),{ok:!0}},"clients:resolve":async e=>{if(typeof e!="string")throw new Error("resolve needs a name string");let r=await O();return _(r.clients,e)},"clients:bootstrap":async()=>{let e=await O(),r=[];try{let d=await y.readdir(g());for(let N of d.filter($=>$.endsWith(".md"))){let v=((await y.readFile(h.join(g(),N),"utf-8").catch(()=>"")).match(/^---\n([\s\S]*?)\n---/)?.[1]??"").match(/^client: "?(.*?)"?$/m)?.[1];v&&r.push(v)}}catch{}let o=await q();for(let d of o.items??[])d.client&&r.push(d.client);let{store:c,created:u}=Ze(e,r,i);await H(c);for(let d of c.clients)(d.tags??[]).includes("bootstrap")&&await Q(d);return{created:u,linked:r.length}},"dashboard:summary":async()=>{let e=await q(),r=await Y["quotes:list"](),o=await Y["invoices:list"](),{rates:c}=w(),u=(m,D)=>m.filter(C=>C.status===D).length,d=m=>String(m??"").slice(0,7),N=d(i().toISOString()),$=d(new Date(i().getFullYear(),i().getMonth()-1,15).toISOString()),p=o.filter(m=>m.status==="paid"),v=m=>Math.round(m.reduce((D,C)=>D+C.total,0)*100)/100,k=[...e.items.map(m=>({kind:"workItem",label:`${m.client} \u2014 ${m.title}`,ref:m.id})),...r.filter(m=>m.status==="accepted"&&!m.invoiced).map(m=>({kind:"acceptedQuote",label:`${m.client} \u2014 ${m.project}`,ref:m.file})),...o.filter(m=>m.overdue).map(m=>({kind:"overdueInvoice",label:`${m.number} \u2014 ${m.client} \u2014 ${m.daysOverdue}d overdue`,ref:m.file}))],x=[...r.map(m=>({kind:"quote",label:`quote ${m.status} \u2014 ${m.client}`,when:m.generated})),...o.map(m=>({kind:"invoice",label:`invoice ${m.status} \u2014 ${m.number}`,when:m.issued})),...p.map(m=>({kind:"paid",label:`paid \u2014 ${m.number} \u2014 ${Ue(m.total,m.currency||c.currency)}`,when:m.paidAt}))].filter(m=>m.when).sort((m,D)=>m.when<D.when?1:-1).slice(0,10);return{workItems:e.items.length,quotes:{draft:u(r,"draft"),sent:u(r,"sent"),accepted:u(r,"accepted"),declined:u(r,"declined")},invoices:{draft:u(o,"draft"),sent:u(o,"sent"),paid:p.length,overdue:o.filter(m=>m.overdue).length,unpaidTotal:v(o.filter(m=>m.status==="sent")),currency:c.currency},revenue:{thisMonth:v(p.filter(m=>d(m.paidAt)===N)),lastMonth:v(p.filter(m=>d(m.paidAt)===$)),currency:c.currency},attention:k,activity:x}}};return Y}var Wt=null;module.exports={activate(t){let n=_t(t);for(let[s,a]of Object.entries(n))t.ipc.handle(s,a);Wt=t,t.log("freelancer activated")},deactivate(){Wt=null},createHandlers:_t};
