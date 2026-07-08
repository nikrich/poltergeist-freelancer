var I=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var O=I((pt,M)=>{function W(t,e){let i=new Map((e.named??[]).map(o=>[o.name,o.hourly])),c=(t??[]).map(o=>{let m=i.get(o.rate)??e.default??0,p=Number.isFinite(Number(o.hours))?Number(o.hours):0;return{description:String(o.description??""),hours:p,rateName:i.has(o.rate)?o.rate:"default",hourly:m,amount:Math.round(p*m*100)/100}}),u=Math.round(c.reduce((o,m)=>o+m.amount,0)*100)/100;return{rows:c,total:u}}function _(t,e){try{return new Intl.NumberFormat("en-IE",{style:"currency",currency:e}).format(t)}catch{return`${e} ${t.toFixed(2)}`}}M.exports={computeTotals:W,formatMoney:_}});var E=I((ft,T)=>{var{createHash:B}=require("node:crypto"),{computeTotals:L,formatMoney:Q}=O();function Y(t,{items:e,scannedMtimes:i}){let c=new Set(t.dismissed??[]),u=new Map((t.items??[]).map(o=>[o.id,o]));for(let o of e??[])!c.has(o.id)&&!u.has(o.id)&&u.set(o.id,o);return{seen:{...t.seen??{},...i??{}},items:[...u.values()].filter(o=>!c.has(o.id)),dismissed:[...c]}}function K(t,e){return B("sha1").update(`${t}
${e}`).digest("hex").slice(0,12)}function G(t){let e=String(t??"").trim(),i=e.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);i&&(e=i[1]);let c=e.indexOf("{"),u=e.lastIndexOf("}");if(c===-1||u===-1)throw new Error(`expected JSON object, got: ${e.slice(0,120)}`);try{return JSON.parse(e.slice(c,u+1))}catch(o){throw new Error(`invalid JSON (${o.message}): ${e.slice(0,120)}`)}}function F(t){return String(t??"").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g,"").trim().replace(/[\s_]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")||"client"}function X(t,e){let i=e instanceof Date?e:new Date(e),c=`${i.getFullYear()}${String(i.getMonth()+1).padStart(2,"0")}${String(i.getDate()).padStart(2,"0")}`;return`quote-${F(t)}-${c}`}T.exports={computeTotals:L,formatMoney:Q,mergeSweep:Y,itemId:K,parseStrictJson:G,slug:F,quoteBasename:X}});var R=I((ht,A)=>{var{computeTotals:q,formatMoney:N}=E();function y(t){return String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function Z(t,e,i){let{rows:c,total:u}=q(t.lineItems,i),o=/^#[0-9a-fA-F]{3,8}$/.test(e.accentColor??"")?e.accentColor:"#C5FF3D",m=w=>y(N(w,i.currency??"EUR")),p=new Date,S=new Date(p.getTime()+(Number(e.validityDays)||14)*864e5),v=w=>w.toISOString().slice(0,10),k=c.map(w=>`      <tr>
        <td>${y(w.description)}</td>
        <td class="num">${y(String(w.hours))}</td>
        <td class="num">${m(w.hourly)}</td>
        <td class="num">${m(w.amount)}</td>
      </tr>`).join(`
`),j=(t.assumptions??[]).map(w=>`      <li>${y(w)}</li>`).join(`
`);return`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1a1c20; font-size: 13px; line-height: 1.5; padding: 48px 56px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand img { height: 44px; }
  .brand .name { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
  .brand .contact { font-size: 11px; color: #6a6e78; }
  .doc { text-align: right; }
  .doc .title { font-size: 26px; font-weight: 700; color: ${o}; -webkit-print-color-adjust: exact; }
  .doc .meta { font-size: 11px; color: #6a6e78; }
  .block { margin-bottom: 28px; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #9a9ea8; margin-bottom: 4px; }
  h2 { font-size: 15px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 4px; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #9a9ea8; text-align: left; padding: 8px 10px; border-bottom: 2px solid ${o}; }
  td { padding: 9px 10px; border-bottom: 1px solid #e7e9ee; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  th.num { text-align: right; }
  .total-row td { border-bottom: none; font-weight: 700; font-size: 15px; padding-top: 14px; }
  .total-row .amount { color: ${o}; -webkit-print-color-adjust: exact; }
  ul { padding-left: 18px; }
  li { margin-bottom: 3px; }
  footer { margin-top: 44px; padding-top: 16px; border-top: 1px solid #e7e9ee; font-size: 11px; color: #6a6e78; display: flex; justify-content: space-between; gap: 24px; }
</style>
</head>
<body>
  <header>
    <div class="brand">
      ${e.logoDataUri?`<img src="${y(e.logoDataUri)}" alt="">`:""}
      <div>
        <div class="name">${y(e.businessName||"Quote")}</div>
        <div class="contact">${y(e.contactLine??"")}</div>
      </div>
    </div>
    <div class="doc">
      <div class="title">QUOTE</div>
      <div class="meta">date ${v(p)}<br>valid until ${v(S)}</div>
    </div>
  </header>

  <div class="block">
    <div class="label">prepared for</div>
    <h2>${y(t.client)}</h2>
    <div>${y(t.project??"")}</div>
  </div>

  <div class="block">
    <div class="label">scope</div>
    <div>${y(t.scopeSummary??"")}</div>
  </div>

  <div class="block">
    <table>
      <thead><tr><th>item</th><th class="num">hours</th><th class="num">rate</th><th class="num">amount</th></tr></thead>
      <tbody>
${k}
        <tr class="total-row"><td colspan="3">total</td><td class="num amount">${m(u)}</td></tr>
      </tbody>
    </table>
  </div>

${j?`  <div class="block">
    <div class="label">assumptions</div>
    <ul>
${j}
    </ul>
  </div>
`:""}
  <footer>
    <span>${y(e.paymentTerms??"")}</span>
    <span>${y(e.businessName??"")}</span>
  </footer>
</body>
</html>`}function V(t,e,i){let{rows:c,total:u}=q(t.lineItems,i),o=i.currency??"EUR",m=c.map(p=>`| ${p.description.replace(/\|/g,"\\|")} | ${p.hours} | ${N(p.hourly,o)} | ${N(p.amount,o)} |`).join(`
`);return`---
client: "${String(t.client??"").replace(/"/g,'\\"')}"
project: "${String(t.project??"").replace(/"/g,'\\"')}"
total: ${u}
currency: ${o}
status: draft
source: "${String(t.sourceNote??"").replace(/"/g,'\\"')}"
generated: ${new Date().toISOString()}
---

# Quote \u2014 ${t.client}

**Project:** ${t.project??""}

## Scope

${t.scopeSummary??""}

## Line items

| item | hours | rate | amount |
|------|-------|------|--------|
${m}

**Total: ${N(u,o)}**

## Assumptions

${(t.assumptions??[]).map(p=>`- ${p}`).join(`
`)}

## Terms

${e.paymentTerms??""} \u2014 valid ${Number(e.validityDays)||14} days.
`}A.exports={esc:y,renderQuoteHtml:Z,quoteMarkdown:V}});var h=require("node:fs/promises"),f=require("node:path"),tt=require("node:os"),{mergeSweep:et,itemId:C,parseStrictJson:nt,quoteBasename:U}=E(),{renderQuoteHtml:rt,quoteMarkdown:ot}=R(),st=14,at=2e3,D=10,it={vaultPath:"~/ghostbrain/vault",brand:{businessName:"",logoDataUri:"",accentColor:"#C5FF3D",contactLine:"",paymentTerms:"50% upfront, balance on delivery",validityDays:14},rates:{currency:"EUR",default:0,named:[]}},ct={type:"object",properties:{items:{type:"array",items:{type:"object",properties:{title:{type:"string"},client:{type:"string"},ask:{type:"string"},sourceNote:{type:"string"},confidence:{type:"number"}},required:["title","client","ask","sourceNote","confidence"]}}},required:["items"]},lt={type:"object",properties:{client:{type:"string"},project:{type:"string"},scopeSummary:{type:"string"},lineItems:{type:"array",items:{type:"object",properties:{description:{type:"string"},hours:{type:"number"},rate:{type:"string"}},required:["description","hours","rate"]}},assumptions:{type:"array",items:{type:"string"}}},required:["client","project","scopeSummary","lineItems","assumptions"]};function dt(t){return t.startsWith("~")?f.join(tt.homedir(),t.slice(1)):t}function P(t,e){if(e==null)return t;if(typeof t!="object"||Array.isArray(t)||t===null)return e;let i={...t};for(let c of Object.keys(e))i[c]=P(t[c],e[c]);return i}async function ut(t){let{BrowserWindow:e}=require("electron"),i=new e({show:!1,webPreferences:{sandbox:!0,javascript:!1}});try{return await i.loadURL("data:text/html;charset=utf-8,"+encodeURIComponent(t)),await i.webContents.printToPDF({pageSize:"A4",printBackground:!0})}finally{i.destroy()}}function z(t,e={}){let i=e.renderPdf??ut,c=e.now??(()=>new Date),u=f.join(t.dataDir,"work-items.json"),o=()=>P(it,t.settings.get("config")??{}),m=()=>dt(o().vaultPath),p=()=>f.join(m(),"30-cross-context","quotes");async function S(){try{return JSON.parse(await h.readFile(u,"utf-8"))}catch{return{seen:{},items:[],dismissed:[]}}}async function v(n){await h.mkdir(t.dataDir,{recursive:!0}),await h.writeFile(u,JSON.stringify(n,null,2))}async function k(n,s){let l;try{l=await h.readdir(n,{withFileTypes:!0})}catch{return}for(let r of l){let a=f.join(n,r.name);r.isDirectory()?await k(a,s):r.isFile()&&r.name.endsWith(".md")&&s.push(a)}}async function j(){let n=m(),s=[];for(let a of["00-inbox","20-contexts"])await k(f.join(n,a),s);let l=c().getTime()-st*864e5,r=[];for(let a of s){let d=await h.stat(a).catch(()=>null);d&&d.mtimeMs>=l&&r.push({path:a,rel:f.relative(n,a),mtimeMs:d.mtimeMs,modified:d.mtime.toISOString()})}return r.sort((a,d)=>d.mtimeMs-a.mtimeMs)}async function w(n,s){let l=async r=>{let a=await t.api.fetch("POST","/v1/llm/run",{prompt:r,system:"You extract structured data for a freelancing tool. Respond with STRICT JSON matching the requested shape. No prose.",jsonSchema:s});if(!a.ok)throw new Error(`llm call failed: ${a.error}`);if(a.data.error)throw new Error(`llm error: ${a.data.error}`);return a.data.structured?a.data.structured:nt(a.data.text)};try{return await l(n)}catch(r){return t.log("llm json retry:",r.message),l(`${n}

Your previous reply was not valid JSON (${r.message}). Reply with ONLY the JSON object.`)}}async function H(n){let s=n.map(r=>`--- note: ${r.rel} ---
${r.excerpt}`).join(`

`);return((await w(`Below are recent notes from a personal knowledge vault (emails, chat threads, meeting notes).
Find INCOMING WORK REQUESTS a freelancer could quote: someone asking for work to be done, a project inquiry, a "can you build/fix/design X" ask.
Ignore: the vault owner's own todos, newsletters, receipts, status updates, anything already quoted.
For each request return title (short), client (person/company asking), ask (1-2 sentence summary of the work), sourceNote (the exact note path shown above), confidence (0-1).
Return {"items": [...]}. Empty array if none.

${s}`,ct)).items??[]).filter(r=>r&&r.title&&r.ask&&r.sourceNote).map(r=>({id:C(r.sourceNote,r.title),title:String(r.title),client:String(r.client??"unknown"),ask:String(r.ask),sourceNote:String(r.sourceNote),confidence:Math.max(0,Math.min(1,Number(r.confidence)||0)),foundAt:c().toISOString()}))}return{"quotes:sweep":async(n={})=>{let s=await S(),r=(await j()).filter(g=>n.force||s.seen[g.rel]!==g.mtimeMs),a={},d=[];for(let g=0;g<r.length;g+=D){let b=r.slice(g,g+D);for(let x of b)x.excerpt=(await h.readFile(x.path,"utf-8").catch(()=>"")).slice(0,at),a[x.rel]=x.mtimeMs;t.ipc.send("quotes:sweep-progress",{done:Math.min(g+D,r.length),total:r.length}),b.length&&d.push(...await H(b))}let $=et(s,{items:d,scannedMtimes:a});return await v($),{items:$.items,sweptAt:c().toISOString(),scanned:r.length}},"quotes:dismiss":async n=>{if(typeof n!="string"||!n)throw new Error("dismiss needs an item id");let s=await S();return s.dismissed.includes(n)||s.dismissed.push(n),s.items=s.items.filter(l=>l.id!==n),await v(s),{ok:!0}},"quotes:recent-notes":async()=>{let n=await j(),s=[];for(let l of n.slice(0,50)){let a=(await h.readFile(l.path,"utf-8").catch(()=>"")).slice(0,400).match(/^#\s+(.+)$/m)?.[1]??f.basename(l.rel,".md");s.push({path:l.rel,title:a,modified:l.modified})}return s},"quotes:manual":async n=>{if(typeof n!="string"||!n)throw new Error("manual needs a note path");let s=f.join(m(),n);if(!f.resolve(s).startsWith(f.resolve(m())))throw new Error("note path escapes the vault");await h.access(s);let l=f.basename(n,".md");return{id:C(n,l),title:l,client:"unknown",ask:"manually selected note",sourceNote:n,confidence:1,foundAt:c().toISOString()}},"quotes:draft":async(n={})=>{let s=n.notePath;if(n.itemId){let b=(await S()).items.find(x=>x.id===n.itemId);if(!b)throw new Error(`unknown work item: ${n.itemId}`);s=b.sourceNote}if(!s)throw new Error("draft needs an itemId or notePath");let l=f.join(m(),s),r=(await h.readFile(l,"utf-8")).slice(0,8e3),{rates:a}=o(),d=["default",...a.named.map(g=>g.name)];return{...await w(`A freelancer needs a quote draft for the work request in this note.

--- note: ${s} ---
${r}
---

Rate names available (pick the best fit per line item): ${d.join(", ")}.
Break the work into 2-8 concrete line items with realistic hour estimates.
Return {"client", "project", "scopeSummary", "lineItems": [{"description", "hours", "rate"}], "assumptions": [...]}.`,lt),sourceNote:s}},"quotes:generate":async n=>{if(!n||typeof n!="object")throw new Error("generate needs a quote");if(!n.client||!Array.isArray(n.lineItems)||n.lineItems.length===0)throw new Error("quote needs a client and at least one line item");let{brand:s,rates:l}=o(),r=rt(n,s,l),a=await i(r),d=p();await h.mkdir(d,{recursive:!0});let $=U(n.client,c());for(let x=2;;x++)try{await h.access(f.join(d,`${$}.md`)),$=`${U(n.client,c())}-${x}`}catch{break}let g=f.join(d,`${$}.md`),b=f.join(d,`${$}.pdf`);return await h.writeFile(b,a),await h.writeFile(g,ot(n,s,l)),t.log("quote generated:",b),{pdfPath:b,notePath:g}},"quotes:list":async()=>{let n;try{n=await h.readdir(p())}catch{return[]}let s=[];for(let l of n.filter(r=>r.endsWith(".md")).sort().reverse()){let a=(await h.readFile(f.join(p(),l),"utf-8").catch(()=>"")).match(/^---\n([\s\S]*?)\n---/)?.[1]??"",d=$=>a.match(new RegExp(`^${$}: "?(.*?)"?$`,"m"))?.[1]??"";s.push({file:l,client:d("client"),project:d("project"),total:Number(d("total"))||0,currency:d("currency"),generated:d("generated"),pdf:n.includes(l.replace(/\.md$/,".pdf"))})}return s}}}var J=null;module.exports={activate(t){let e=z(t);for(let[i,c]of Object.entries(e))t.ipc.handle(i,c);J=t,t.log("freelancer activated")},deactivate(){J=null},createHandlers:z};
