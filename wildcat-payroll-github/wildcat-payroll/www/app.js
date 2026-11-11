"use strict";
const E=Engine, $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const ICON={
 dash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
 pay:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>',
 slip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
 users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M17 5a3 3 0 010 6M18 14c2.5.5 4 2.5 4 5"/></svg>',
 cash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg>',
 set:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',
 print:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a2 2 0 012-2h14a2 2 0 012 2v6a1 1 0 01-1 1h-2M6 14h12v7H6z"/></svg>',
 xl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6M9 13l4 5M13 13l-4 5"/></svg>',
 folder:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
 clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 016 0"/></svg>',
 report:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
 net:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
 cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4h2l2.2 11h10.6L20 8H6.5"/><circle cx="9" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/></svg>',
 safe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5V10M12 14v1.5M7 20v1.5M17 20v1.5"/></svg>',
 plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>'};
const PAGES=[["dash","لوحة المرتبات","dash"],["pay","كشف المرتبات","pay"],["att","استيراد البصمة والحضور","clock"],["repo","مستودع التقارير الشهرية","folder"],["slips","قسائم الرواتب","slip"],["workers","العمال","users"],["txns","السلف والخصومات","cash"],["exp","المصاريف الإضافية","bag"],["buy","المشتريات","cart"],["cash","الخزينة","safe"],["fin","التقرير المالي","report"],["dev","الأجهزة والتحكم","net"],["users","المستخدمون والصلاحيات","users"],["settings","الإعدادات والنسخ الاحتياطي","set"]];
let data,page="dash",saveTimer=null,filter={q:"",dept:""},txnAll=false,slipId=null,wfilt={q:"",depts:[]},slipOpts={exp:false,per:2,dept:"",skipSusp:true,dup:false,sel:{},q:""};
const NATIVE=window.native||null;
/* تكبير/تصغير بـ Ctrl + عجلة الماوس (وCtrl +/-/0) */
(()=>{let z=1;try{z=+localStorage.getItem("zoom")||1;}catch(e){}
  const apply=()=>{z=Math.min(2.5,Math.max(0.5,Math.round(z*100)/100));try{localStorage.setItem("zoom",z);}catch(e){}
    if(NATIVE&&NATIVE.zoom)NATIVE.zoom(z);else document.body.style.zoom=z;};
  window.addEventListener("wheel",e=>{if(!e.ctrlKey)return;e.preventDefault();z+=e.deltaY<0?0.1:-0.1;apply();},{passive:false});
  window.addEventListener("keydown",e=>{if(!e.ctrlKey)return;if(e.key==="+"||e.key==="="){e.preventDefault();z+=0.1;apply();}else if(e.key==="-"){e.preventDefault();z-=0.1;apply();}else if(e.key==="0"){e.preventDefault();z=1;apply();}});
  window.addEventListener("DOMContentLoaded",()=>{if(z!==1)apply();});window.__zoom=()=>z;})();

/* ---------- التخزين ---------- */
const blank=()=>({v:1,settings:{...E.DEFAULT_SETTINGS},workers:[],txns:[],entries:{},att:{},repo:{},expenses:[],purchases:[],cash:[],users:[]});
function normData(){
  data.settings={...E.DEFAULT_SETTINGS,...data.settings};data.settings.attRules={...Att.DEF_RULES,...(data.settings.attRules||{})};
  if(!Array.isArray(data.settings.expenseCats))data.settings.expenseCats=[...E.DEFAULT_SETTINGS.expenseCats];
  data.workers=data.workers||[];data.txns=data.txns||[];data.entries=data.entries||{};data.att=data.att||{};data.repo=data.repo||{};data.expenses=data.expenses||[];data.users=data.users||[];data.txns.forEach(t=>{if(!t.id)t.id=uid();});data.expenses.forEach(x=>{if(!x.id)x.id=uid();});modsNorm();data.control=data.control||{};data.control.logoutSeq=data.control.logoutSeq||{};data.control.blockedDevices=data.control.blockedDevices||{};}
async function loadData(){
  let raw=null;
  try{raw=NATIVE?await NATIVE.load():localStorage.getItem("payroll_data");}catch(e){}
  if(raw){try{data=typeof raw==="string"?JSON.parse(raw):raw;}catch(e){data=null;}}
  if(!data){data=blank();}
  normData();
  for(const p in data.entries)for(const id in data.entries[p]){const e=data.entries[p][id];if(e.otDayMin!==undefined||e.otNightMin!==undefined){e.otMin=(e.otMin||0)+(e.otDayMin||0)+(e.otNightMin||0);delete e.otDayMin;delete e.otNightMin;}delete e.holidays;delete e.leave;if(e.fridays!==undefined){e.fridayMin=(e.fridayMin||0)+Math.round(e.fridays*(E.num(data.settings.hoursDay)||8)*60);delete e.fridays;}}
  if(data.settings.fridayMult===2)data.settings.fridayMult=1.5;
  delete data.settings.otNight;delete data.settings.holMult;
}
function save(silent){
  clearTimeout(saveTimer);const el=$("#saved");if(el)el.textContent="جارٍ الحفظ…";
  saveTimer=setTimeout(async()=>{try{const s=JSON.stringify(data);if(NATIVE)await NATIVE.save(s);else localStorage.setItem("payroll_data",s);const el=$("#saved");if(el)el.textContent="✓ تم الحفظ تلقائياً";try{const ns=snapOf(data);if(ns!==snapStr){if(me&&!silent){const d=diffSummary(snapStr,ns);if(d)act("edit",d);}snapStr=ns;}}catch(x){}if(NATIVE&&NATIVE.sync)syncSoon();}catch(e){toast("تعذّر الحفظ: "+e.message);}},350);
}
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove("on"),2600);}
const nf=(n,d=2)=>E.fmt(n,d), dshow=iso=>iso?iso.split("-").reverse().join("/"):"";
const cur=()=>data.settings.periodStart;
const calc=()=>E.compute(data,cur());

/* ---------- الهيكل ---------- */
function shell(){
  $("#app").innerHTML=`<aside class="side"><div class="brand"><div class="logo">م</div><h1>${esc(data.settings.company)}</h1><small>نظام مرتبات المصنع</small></div>
  <nav class="nav">${PAGES.filter(p=>lvl(p[0])>0).map(p=>`<button data-p="${p[0]}" class="${p[0]===page?"on":""}">${ICON[p[2]]}<span>${p[1]}</span></button>`).join("")}</nav>
  <div class="foot">النسخة 1.12 — البيانات محفوظة على جهازك</div></aside>
  <div class="main"><header class="top"><h2 id="ptitle"></h2><div class="sp"></div>
   <div class="period"><button id="pn" title="الفترة التالية">›</button><span class="lbl" id="plbl" title="اضغط لتغيير بداية الفترة"></span><button id="pp" title="الفترة السابقة">‹</button></div>
   <span class="saved" id="syncb"></span><span class="saved" id="saved">✓ جاهز</span><button class="btn g" id="me" title="حسابي">👤 ${esc(me?me.name:"")}</button></header><main class="content" id="content"></main></div>`;
  document.querySelectorAll(".nav button").forEach(b=>b.onclick=()=>{page=b.dataset.p;render();});
  $("#me").onclick=meMenu;
  $("#pn").onclick=()=>setPeriod(E.shiftPeriod(cur(),1));$("#pp").onclick=()=>setPeriod(E.shiftPeriod(cur(),-1));
  $("#plbl").onclick=()=>openModal(`<h3>بداية فترة المرتبات</h3><p class="hint">اختر أول يوم في الفترة (مثلاً يوم 27). تنتهي الفترة تلقائياً قبل نفس اليوم من الشهر التالي.</p><input class="fld" type="date" id="pstart" value="${cur()}"><div class="bar" style="margin-top:16px"><button class="btn t" id="okp">حفظ</button><button class="btn g" data-close>إلغاء</button></div>`,m=>{m.querySelector("#okp").onclick=()=>{const v=m.querySelector("#pstart").value;if(v){setPeriod(v);closeModal();}};});
}
function periodHasData(p){const e=E.periodEnd(p);return hasEntries(p)||data.txns.some(t=>t.date>=p&&t.date<=e)||(data.expenses||[]).some(x=>x.date>=p&&x.date<=e);}
function autoKeep(p){try{if(p&&periodHasData(p)&&!(data.repo[p]&&data.repo[p].snap)){repoSave(p,{auto:true});toast("تم حفظ تقرير "+periodName(p)+" تلقائياً في المستودع");}}catch(e){}}
function setPeriod(s){if(s!==data.settings.periodStart)autoKeep(data.settings.periodStart);data.settings.periodStart=s;save();render();}
function render(){
  if(!me)return;
  if(!$("#app .side"))shell();
  if(lvl(page)<1){const ok=allowedPages();if(!ok.length){$("#content").innerHTML='<div class="card" style="max-width:520px;margin:40px auto;text-align:center"><h3>لا توجد صلاحيات</h3><p class="hint">لم يحدد لك المدير أي صفحة. تواصل مع المدير.</p></div>';return;}page=ok[0];}
  document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("on",b.dataset.p===page));
  $("#ptitle").textContent=PAGES.find(p=>p[0]===page)[1];
  const end=E.periodEnd(cur());$("#plbl").textContent=`${dshow(cur())}  ←  ${dshow(end)}`;
  ({dash:pDash,pay:pPay,att:pAtt,repo:pRepo,slips:pSlips,workers:pWorkers,txns:pTxns,exp:pExp,buy:pBuy,cash:pCash,fin:pFin,dev:pDev,users:pUsers,settings:pSettings})[page]($("#content"));
  applyRO($("#content"));
}
function openModal(html,init){closeModal();const m=document.createElement("div");m.className="modal";m.innerHTML=`<div class="box">${html}</div>`;document.body.appendChild(m);
  m.addEventListener("click",e=>{if(e.target===m||e.target.hasAttribute("data-close"))closeModal();});init&&init(m);}
function closeModal(){document.querySelectorAll(".modal").forEach(m=>m.remove());}

/* ---------- لوحة المرتبات ---------- */
function pDash(c){
  const R=calc(),t=R.tot,n=R.rows.length;
  if(!n){c.innerHTML=`<div class="card" style="max-width:640px;margin:40px auto;text-align:center;padding:36px"><h3 style="font-size:20px">أهلاً بك في برنامج مرتبات المصنع</h3><p class="hint" style="font-size:14px">ابدأ باستيراد بياناتك من ملف Excel القديم، أو أضف العمال يدوياً.</p><div class="bar" style="justify-content:center"><button class="btn t big" id="w1">${ICON.xl} استيراد من ملف Excel</button><button class="btn g big" id="w2">${ICON.plus} إضافة العمال يدوياً</button></div><input type="file" id="fx" accept=".xlsx,.xlsm" hidden></div>`;
    $("#w1").onclick=()=>$("#fx").click();$("#fx").onchange=async e=>{if(e.target.files[0])await importXlsx(e.target.files[0]);};$("#w2").onclick=()=>{page="workers";render();};return;}
  const depts=data.settings.departments.map(d=>{const rs=R.rows.filter(r=>r.dept===d);return{d,n:rs.length,g:rs.reduce((s,r)=>s+r.gross,0),net:rs.reduce((s,r)=>s+r.net,0)};});
  const other=R.rows.filter(r=>!data.settings.departments.includes(r.dept));if(other.length)depts.push({d:"بدون قسم",n:other.length,g:other.reduce((s,r)=>s+r.gross,0),net:other.reduce((s,r)=>s+r.net,0)});
  const mx=Math.max(1,...depts.map(x=>x.net)),X=E.expenses(data,cur());
  const top=[...R.rows].sort((a,b)=>b.net-a.net).slice(0,5);
  const alerts=R.rows.filter(r=>r.warns.length);
  c.innerHTML=`<div class="kpis">
   <div class="kpi"><small>عدد العمال</small><b>${n}</b></div>
   <div class="kpi t"><small>إجمالي المستحقات</small><b>${nf(t.gross)}</b></div>
   <div class="kpi r"><small>السلف والجزاءات والعجز</small><b>${nf(t.ded)}</b></div>
   <div class="kpi t"><small>صافي المرتبات</small><b>${nf(t.net)}</b></div>
   <div class="kpi"><small>المصاريف الإضافية</small><b>${nf(X.total)}</b></div>
   <div class="kpi g"><small>متوسط صافي العامل</small><b>${nf(n?t.net/n:0)}</b></div></div>
  <div class="bar"><button class="btn t big" id="goprint">${ICON.print} طباعة كل القسائم</button><button class="btn g" id="goxl">${ICON.xl} تصدير الكشف لـ Excel</button>
   <span class="hint">أيام العمل في الفترة: <b>${R.workDays}</b> (بدون ${R.fridays} جمعة)</span></div>
  <div class="grid2"><div class="card"><h3>الأقسام</h3><table><thead><tr><th class="l">القسم</th><th>العمال</th><th>الإجمالي</th><th>الصافي</th><th style="width:30%"></th></tr></thead><tbody>
   ${depts.map(x=>`<tr><td class="l">${esc(x.d)}</td><td>${x.n}</td><td class="n">${nf(x.g)}</td><td class="n"><b>${nf(x.net)}</b></td><td><div class="hbar" style="width:${Math.max(2,x.net/mx*100)}%"></div></td></tr>`).join("")}</tbody></table></div>
  <div><div class="card"><h3>أعلى 5 مرتبات</h3><table><tbody>${top.map((r,i)=>`<tr><td>${i+1}</td><td class="l">${esc(r.w.name)}</td><td class="n"><b>${nf(r.net)}</b></td></tr>`).join("")||'<tr><td class="hint">لا توجد بيانات</td></tr>'}</tbody></table></div>
  <div class="card"><h3>تنبيهات (${alerts.length})</h3>${alerts.slice(0,8).map(r=>`<div class="alert"><b>${esc(r.w.name)}</b> — ${r.warns.join("، ")}</div>`).join("")||'<span class="badge ok">لا توجد تنبيهات</span>'}${alerts.length>8?`<div class="hint">و ${alerts.length-8} تنبيهات أخرى في كشف المرتبات</div>`:""}</div></div></div>`;
  $("#goprint").onclick=()=>{page="slips";render();};$("#goxl").onclick=exportXlsx;modsDash(c);
}

/* ---------- كشف المرتبات ---------- */
const COLS=[ // key,label,kind
 ["idx","م"],["id","الكود"],["name","الاسم","l"],["dept","القسم"],["type","النوع"],["shiftIn","الحضور","t"],["shiftOut","الانصراف","t"],["netHours","ساعات الدوام (بعد الراحة)","a"],["wage","الأجر الأساسي","m"],["daily","اليومية","m"],["present","أيام الحضور","a"],
 ["absent","أيام الغياب","in"],["otMin","الإضافي (دقيقة)","in"],["deficitMin","العجز: تأخير وانصراف مبكر (دقيقة)","in"],["fridayMin","إضافي الجمعة (دقيقة)","in"],
 ["basic","الأجر المستحق","m"],["otAmt","الإضافي","m"],["friday","إضافي الجمعة","m"],["bonus","مكافآت وبدلات","m"],["gross","الإجمالي","m g"],
 ["adv","السلف","m"],["pen","جزاءات وخصومات","m"],["deficit","خصم العجز","m"],["ded","إجمالي الخصومات","m"],["net","صافي المرتب","m net"],["warn","تنبيه"]];
function rowCells(r){
  return COLS.map(([k,,kind])=>{
    if(kind==="in")return `<td><input class="cell" type="number" min="0" step="any" data-k="${k}" data-id="${esc(r.id)}" value="${r[k]||""}"></td>`;
    const cls=(kind||"").includes("net")?"n net":(kind||"").includes("m")?"n":(kind==="l"?"l":""),first=k==="name"?" sticky1":"";
    let v;if(k==="idx")v=r.idx;else if(k==="id")v=esc(r.id);else if(k==="name")v=esc(r.w.name);else if(k==="dept")v=esc(r.dept);else if(k==="type")v=r.type;
    else if(k==="present")v=r.present;else if(k==="warn")v=r.warns.map(w=>`<span class="badge">⚠ ${w}</span>`).join("");else if(k==="shiftIn"||k==="shiftOut")v=esc(r[k]);else if(k==="netHours")v=r[k]===""?"":nf(r[k]);else v=nf(r[k]);
    return `<td class="${cls}${first}" data-c="${k}">${v}</td>`;}).join("");
}
function pPay(c){
  const R=calc(),depts=data.settings.departments;
  c.innerHTML=`<div class="bar"><input class="fld" id="q" placeholder="بحث بالاسم أو الكود…" value="${esc(filter.q)}"><select class="fld" id="dp"><option value="">كل الأقسام</option>${depts.map(d=>`<option ${filter.dept===d?"selected":""}>${esc(d)}</option>`).join("")}</select>
   <button class="btn g" id="xl">${ICON.xl} تصدير لـ Excel</button><button class="btn g" id="em">✉ إرسال بالبريد</button><button class="btn t" id="kp">💾 حفظ تقرير هذا الشهر في المستودع</button><span class="hint">الخانات الصفراء للإدخال — اضغط Enter للنزول للعامل التالي</span></div>
   <div class="tablewrap"><table id="ptab"><thead><tr>${COLS.map(([k,l,kind],i)=>`<th class="${kind==="in"?"in":""}${k==="name"?" sticky1 l":""}${["basic","otAmt","friday","bonus","gross","adv","pen","deficit","ded","net"].includes(k)?" out":""}" ${kind==="in"?"style='min-width:88px;white-space:normal'":""}>${l}</th>`).join("")}</tr></thead><tbody id="pbody"></tbody><tfoot><tr class="tot" id="ptot"></tr></tfoot></table></div>`;
  const fill=()=>{
    const q=filter.q.trim().toLowerCase(),rows=R.rows.filter(r=>(!filter.dept||r.dept===filter.dept)&&(!q||String(r.w.name).toLowerCase().includes(q)||r.id.toLowerCase().includes(q)));
    $("#pbody").innerHTML=rows.map(r=>`<tr data-id="${esc(r.id)}">${rowCells(r)}</tr>`).join("")||`<tr><td colspan="${COLS.length}" class="hint" style="padding:30px">لا يوجد عمال. أضفهم من صفحة «العمال» أو استورد ملف Excel من «الإعدادات».</td></tr>`;
    tot();};
  const tot=()=>{const t=R.tot;$("#ptot").innerHTML=COLS.map(([k,,kind],i)=>{const sum=["present","absent","otMin","deficitMin","fridayMin","basic","otAmt","friday","bonus","gross","adv","pen","deficit","ded","net"];
    if(i===0)return `<td colspan="1">∑</td>`;if(k==="name")return `<td class="l sticky1" style="background:#fde68a">الإجمالي (${R.rows.length})</td>`;return `<td class="n">${sum.includes(k)?(["present","absent","otMin","deficitMin","fridayMin"].includes(k)?E.fmt0(t[k]):nf(t[k])):""}</td>`;}).join("");};
  fill();
  $("#q").oninput=e=>{filter.q=e.target.value;fill();};$("#dp").onchange=e=>{filter.dept=e.target.value;fill();};$("#xl").onclick=exportXlsx;$("#em").onclick=emailPay;$("#kp").onclick=()=>{repoSave(cur());act("edit","حفظ تقرير "+periodName(cur())+" في المستودع");save();toast("تم حفظ تقرير "+periodName(cur())+" — تجده في «مستودع التقارير الشهرية»");};
  const body=$("#pbody");
  body.addEventListener("input",e=>{
    const i=e.target;if(!i.dataset.k)return;const id=i.dataset.id;
    const en=(data.entries[cur()]=data.entries[cur()]||{});(en[id]=en[id]||{})[i.dataset.k]=E.num(i.value);
    const N=calc();R.tot=N.tot;R.rows=N.rows;const r=N.rows.find(x=>x.id===id),tr=i.closest("tr");
    tr.querySelectorAll("td[data-c]").forEach(td=>{const k=td.dataset.c;if(k==="present")td.textContent=r.present;else if(k==="warn")td.innerHTML=r.warns.map(w=>`<span class="badge">⚠ ${w}</span>`).join("");else if(r[k]!==undefined&&typeof r[k]==="number")td.textContent=nf(r[k]);});
    tot();save();});
  body.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.dataset.k){e.preventDefault();const tr=e.target.closest("tr"),nx=(e.shiftKey?tr.previousElementSibling:tr.nextElementSibling);const n=nx&&nx.querySelector(`[data-k="${e.target.dataset.k}"]`);if(n){n.focus();n.select();}}});
}

/* ---------- العمال ---------- */
function pWorkers(c){
  const S=data.settings;
  c.innerHTML=`<div class="bar"><button class="btn t" id="add">${ICON.plus} عامل جديد</button><input class="fld" id="wq" placeholder="بحث بالاسم أو الكود…" value="${esc(wfilt.q)}" style="min-width:200px"><span class="hint">المعروض: <b id="wn"></b></span><span class="hint">Ctrl + عجلة الماوس = تكبير/تصغير</span></div>
  <div class="bar" id="wd" style="flex-wrap:wrap;gap:6px 14px;position:sticky;top:0"></div>
  <div class="bar"><span class="hint">عدّل مباشرة في الخانات. «ساعات العمل اليومية» و«معامل الإضافي» اتركهما فارغين لاستخدام القيم العامة (${S.hoursDay} ساعات / ${S.otDay}). «صافي ساعات الدوام» = (الانصراف − الحضور) − مدة الراحة (${(S.attRules||{}).restMin??30} دقيقة)، وهو للعرض فقط ولا يغيّر سعر الساعة.</span></div>
  <div class="tablewrap wtw"><table class="wt"><thead><tr><th class="c1">الكود</th><th class="l c2">الاسم</th><th>القسم</th><th>الوظيفة</th><th>نوع الأجر</th><th>الأجر (شهري أو يومية)</th><th>بداية الدوام (الحضور)</th><th>نهاية الدوام (الانصراف)</th><th>صافي ساعات الدوام</th><th>ساعات العمل اليومية (لسعر الساعة)</th><th>معامل ساعة الإضافي</th><th>تاريخ التعيين</th><th>التليفون</th><th>الحالة</th><th></th></tr></thead><tbody id="wb"></tbody></table></div>`;
  const shown=w=>{const q=wfilt.q.trim().toLowerCase();return(!wfilt.depts.length||wfilt.depts.includes(w.dept||"")) &&(!q||String(w.name).toLowerCase().includes(q)||String(w.id).toLowerCase().includes(q));};
  const drawD=()=>{const ds=[...S.departments,...(data.workers.some(w=>!w.dept||!S.departments.includes(w.dept))?[""]:[])];
    $("#wd").innerHTML=`<b class="hint">الأقسام:</b><label class="chk" style="display:flex;gap:5px;align-items:center"><input type="checkbox" data-all ${wfilt.depts.length?"":"checked"}> <b>الكل</b></label>`+ds.map(d=>{const n=data.workers.filter(w=>(S.departments.includes(w.dept)?w.dept:"")===d).length;return `<label class="chk" style="display:flex;gap:5px;align-items:center"><input type="checkbox" data-d="${esc(d)}" ${wfilt.depts.includes(d)?"checked":""}> ${esc(d||"بدون قسم")} <small class="hint">(${n})</small></label>`;}).join("");};
  const fill=()=>{drawD();const vis=data.workers.map((w,i)=>({w,i})).filter(({w})=>shown(w));$("#wn").textContent=vis.length+" من "+data.workers.length;
   $("#wb").innerHTML=vis.map(({w,i})=>`<tr data-i="${i}"><td class="c1"><input class="cell m" data-f="id" value="${esc(w.id)}"></td><td class="c2"><input class="cell w" data-f="name" value="${esc(w.name)}"></td>
   <td><select class="cell m" data-f="dept">${["",...S.departments].map(d=>`<option ${w.dept===d?"selected":""}>${esc(d)}</option>`).join("")}</select></td><td><input class="cell m" data-f="job" value="${esc(w.job||"")}"></td>
   <td><select class="cell m" data-f="type"><option ${w.type!=="يومي"?"selected":""}>شهري</option><option ${w.type==="يومي"?"selected":""}>يومي</option></select></td>
   <td><input class="cell m" type="number" step="any" data-f="wage" value="${w.wage??""}"></td>
   <td><input class="cell m" type="time" data-f="shiftIn" value="${esc(w.shiftIn||"")}"></td><td><input class="cell m" type="time" data-f="shiftOut" value="${esc(w.shiftOut||"")}"></td><td class="n" data-net>${E.netHours(w,S)}</td><td><input class="cell" type="number" step="any" data-f="hours" value="${w.hours||""}" placeholder="${S.hoursDay}"></td><td><input class="cell" type="number" step="any" data-f="otMult" value="${w.otMult||""}" placeholder="${S.otDay}"></td>
   <td><input class="cell m" type="date" data-f="hire" value="${esc(w.hire||"")}"></td><td><input class="cell m" data-f="phone" value="${esc(w.phone||"")}"></td>
   <td><select class="cell m" data-f="status"><option ${w.status!=="موقوف"?"selected":""}>نشط</option><option ${w.status==="موقوف"?"selected":""}>موقوف</option></select></td><td><button class="btn r" data-del="${i}">حذف</button></td></tr>`).join("")||'<tr><td colspan="15" class="hint" style="padding:24px">لا يوجد عمال مطابقون للفلتر</td></tr>';};
  fill();
  $("#wq").oninput=e=>{wfilt.q=e.target.value;fill();};
  $("#wd").onchange=e=>{const t=e.target;if(t.dataset.all!==undefined){wfilt.depts=[];}else if(t.dataset.d!==undefined){const d=t.dataset.d;wfilt.depts=t.checked?[...wfilt.depts,d]:wfilt.depts.filter(x=>x!==d);}fill();};
  $("#add").onclick=()=>{const ids=data.workers.map(w=>E.num(w.id));wfilt.q="";$("#wq").value="";data.workers.push({id:String((ids.length?Math.max(...ids):0)+1),name:"",dept:wfilt.depts.length===1?wfilt.depts[0]:"",job:"",type:"شهري",wage:0,status:"نشط"});save();fill();const l=document.querySelectorAll("#wb tr");l[l.length-1].querySelector('[data-f="name"]').focus();$(".tablewrap").scrollTop=1e6;};
  $("#wb").addEventListener("change",e=>{const t=e.target,tr=t.closest("tr");if(!t.dataset.f)return;const w=data.workers[+tr.dataset.i];let v=t.value;
    if(["wage","hours","otMult"].includes(t.dataset.f))v=t.value===""?"":E.num(t.value);
    if(t.dataset.f==="id"){v=v.trim();if(!v||data.workers.some((x,j)=>j!==+tr.dataset.i&&String(x.id)===v)){toast("الكود فارغ أو مكرر");t.value=w.id;return;}
      for(const k in data.entries){if(data.entries[k][w.id]){data.entries[k][v]=data.entries[k][w.id];delete data.entries[k][w.id];}}data.txns.forEach(x=>{if(String(x.workerId)===String(w.id))x.workerId=v;});}
    w[t.dataset.f]=v;if(t.dataset.f==="shiftIn"||t.dataset.f==="shiftOut"){const c=tr.querySelector("[data-net]");if(c)c.textContent=E.netHours(w,S);}save();});
  $("#wb").addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(!b)return;const w=data.workers[+b.dataset.del];
    openModal(`<h3>حذف عامل</h3><p>هل تريد حذف «${esc(w.name||w.id)}» نهائياً؟ سيُحذف معه سجل إدخالاته. (لإيقافه مؤقتاً غيّر الحالة إلى «موقوف».)</p><div class="bar"><button class="btn r" id="yes">نعم، احذف</button><button class="btn g" data-close>إلغاء</button></div>`,m=>m.querySelector("#yes").onclick=()=>{
      const id=String(w.id);data.workers.splice(+b.dataset.del,1);for(const k in data.entries)delete data.entries[k][id];data.txns=data.txns.filter(x=>String(x.workerId)!==id);save();closeModal();fill();});});
}

/* ---------- السلف والخصومات ---------- */
function pTxns(c){
  const R=calc(),opts=data.workers.map(w=>`<option value="${esc(w.id)}">${esc(w.id)} — ${esc(w.name)}</option>`).join("");
  c.innerHTML=`<div class="card"><h3>إضافة حركة</h3><div class="form"><label>التاريخ<input class="fld" type="date" id="td" value="${E.iso(new Date())>R.end||E.iso(new Date())<R.start?R.start:E.iso(new Date())}"></label>
   <label>العامل<select class="fld" id="tw">${opts}</select></label><label>النوع<select class="fld" id="tt">${E.TXN_TYPES.map(t=>`<option>${t}</option>`).join("")}</select></label>
   <label>طريقة الإدخال<select class="fld" id="tm"><option value="amt">مبلغ</option><option value="days">أيام</option></select></label><label><span id="tal">المبلغ</span><input class="fld" type="number" step="any" id="ta"></label><label class="hint" id="tcalc" style="align-self:end"></label><label>ملاحظة<input class="fld" id="tn"></label></div>
   <div class="bar" style="margin-top:14px"><button class="btn t" id="tadd">${ICON.plus} إضافة</button><span class="hint">السلفة والجزاء والخصم تُخصم — المكافأة والبدل تُضاف. بخيار «أيام» يُحسب المبلغ = عدد الأيام × أجر يوم العامل (شهري: الراتب ÷ أيام الشهر).</span></div></div>
  <div class="bar"><label class="hint"><input type="checkbox" id="all" ${txnAll?"checked":""}> عرض كل الفترات</label><span class="hint">إجمالي الحركات المعروضة: <b id="tsum"></b></span></div>
  <div class="tablewrap"><table><thead><tr><th>التاريخ</th><th>الكود</th><th class="l">الاسم</th><th>النوع</th><th>المبلغ</th><th class="l">ملاحظة</th><th></th></tr></thead><tbody id="tb"></tbody></table></div>`;
  const name=id=>(data.workers.find(w=>String(w.id)===String(id))||{}).name;
  const dailyOf=id=>{const r=R.rows.find(x=>x.id===String(id));return r?r.daily:0;};
  const txAmt=t=>t.days?E.r2?E.r2(E.num(t.days)*dailyOf(t.workerId)):E.num(t.days)*dailyOf(t.workerId):E.num(t.amount);
  const mode=()=>$("#tm").value==="days";
  const calcUi=()=>{$("#tal").textContent=mode()?"عدد الأيام":"المبلغ";const d=dailyOf($("#tw").value),n=E.num($("#ta").value);$("#tcalc").textContent=mode()?`أجر اليوم ${nf(d)} ← المبلغ ${nf(Math.round(n*d*100)/100)}`:"";};
  const fill=()=>{const list=data.txns.map((t,i)=>({t,i})).filter(({t})=>txnAll||(t.date>=R.start&&t.date<=R.end)).sort((a,b)=>b.t.date.localeCompare(a.t.date));
    $("#tsum").textContent=nf(list.reduce((s,{t})=>s+txAmt(t),0));
    $("#tb").innerHTML=list.map(({t,i})=>`<tr><td>${dshow(t.date)}</td><td>${esc(t.workerId)}</td><td class="l">${esc(name(t.workerId)||"⚠ كود غير موجود")}</td><td>${esc(t.type)}${t.days?` <small class="hint">(${E.num(t.days)} يوم)</small>`:""}</td><td class="n">${nf(txAmt(t))}</td><td class="l">${esc(t.note||"")}</td><td><button class="btn r" data-del="${i}">حذف</button></td></tr>`).join("")||'<tr><td colspan="7" class="hint" style="padding:24px">لا توجد حركات في هذه الفترة</td></tr>';};
  fill();calcUi();$("#tm").onchange=$("#tw").onchange=$("#ta").oninput=calcUi;
  $("#all").onchange=e=>{txnAll=e.target.checked;fill();};
  $("#tadd").onclick=()=>{const a=E.num($("#ta").value);if(!$("#tw").value||!a||!$("#td").value){toast("أكمل التاريخ والعامل والمبلغ");return;}
    const t={id:uid(),date:$("#td").value,workerId:$("#tw").value,type:$("#tt").value,amount:a,note:$("#tn").value};
    if(mode()){t.days=a;t.amount=Math.round(a*dailyOf(t.workerId)*100)/100;}
    data.txns.push(t);save();$("#ta").value="";calcUi();$("#tn").value="";fill();toast("تمت الإضافة");};
  $("#tb").onclick=e=>{const b=e.target.closest("[data-del]");if(!b)return;data.txns.splice(+b.dataset.del,1);save();fill();};
}

/* ---------- القسائم ---------- */
function slipHTML(r,R,tag){
  const S=data.settings,m=(lbl,v,extra)=>`<tr><td>${lbl}${extra?` <small style="color:#64748b">(${extra})</small>`:""}</td><td class="v">${nf(v)}</td></tr>`;
  return `<div class="slip"><div class="sh"><b>${esc(S.company)} — قسيمة راتب</b><span>الفترة: ${dshow(R.start)} إلى ${dshow(R.end)}${tag?` <em class="tag">${tag}</em>`:""}</span></div>
  <div class="info"><div><small>الكود</small><b>${esc(r.id)}</b></div><div><small>الاسم</small><b>${esc(r.w.name)}</b></div><div><small>القسم</small><b>${esc(r.dept||"-")}</b></div><div><small>الوظيفة</small><b>${esc(r.w.job||"-")}</b></div>
   <div><small>نوع الأجر</small><b>${r.type}</b></div><div><small>${r.type==="شهري"?"الراتب الشهري":"أجر اليوم"}</small><b>${nf(r.wage)}</b></div><div><small>أيام الحضور (شامل ${R.fridays} جمعة)</small><b>${r.present+(R.fridays||0)}</b></div><div><small>أيام الغياب</small><b>${r.absent}</b></div></div>
  <div class="cols"><div><table><thead><tr><th class="l" style="text-align:right">المستحقات</th><th>المبلغ</th></tr></thead><tbody>${m("الأجر المستحق",r.basic)}${m("الإضافي",r.otAmt,r.otMin?r.otMin+" دقيقة":"")}${m("إضافي الجمعة",r.friday,r.fridayMin?r.fridayMin+" دقيقة":"")}${m("مكافآت وبدلات",r.bonus,r.bonusDays?r.bonusDays+" يوم":"")}<tr class="s"><td>إجمالي المستحقات</td><td class="v">${nf(r.gross)}</td></tr></tbody></table></div>
  <div><table><thead><tr><th class="l" style="text-align:right">الاستقطاعات</th><th>المبلغ</th></tr></thead><tbody>${m("السلف",r.adv)}${m("جزاءات وخصومات",r.pen,r.penDays?r.penDays+" يوم":"")}${m("خصم العجز",r.deficit,r.deficitMin?r.deficitMin+" دقيقة":"")}<tr class="fill"><td>&nbsp;</td><td></td></tr><tr class="fill"><td>&nbsp;</td><td></td></tr><tr class="fill"><td>&nbsp;</td><td></td></tr><tr class="s"><td>إجمالي الاستقطاعات</td><td class="v">${nf(r.ded)}</td></tr></tbody></table></div></div>
  <div class="netrow"><span>صافي المرتب المستحق</span><span>${nf(r.net)} ج.م</span></div>
  <div class="sig"><span>توقيع العامل: ______________</span><span>توقيع المحاسب: ______________</span></div></div>`;
}
/* تخطيط الصفحة: عدد القسائم في A4 (1/2/4/6/8) أو نسختين جنب بعض لكل قسيمة (صف لكل قسيمة) */
function slipPageClass(per,dup){const cols=dup?2:(per>=4?2:1),rows=dup?per:Math.ceil(per/cols);return `pg c${cols} r${rows}${cols===2?" narrow":""}${rows>=4?" tight":""}${dup?" dup":""}`;}
function expPage(R){const X=E.expenses(data,R.start),rows=X.list.slice().sort((a,b)=>a.date.localeCompare(b.date));
  return `<div class="pg c1 r1"><div class="slip"><div class="sh"><b>${esc(data.settings.company)} — كشف المصاريف</b><span>الفترة: ${dshow(R.start)} إلى ${dshow(R.end)}</span></div>
  <div class="cols"><div style="grid-column:1/-1"><table><thead><tr><th>التاريخ</th><th class="l" style="text-align:right">البند</th><th class="l" style="text-align:right">ملاحظة</th><th>المبلغ</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${dshow(x.date)}</td><td class="l">${esc(x.cat||"")}</td><td class="l">${esc(x.note||"")}</td><td class="v">${nf(x.amount)}</td></tr>`).join("")||'<tr><td colspan="4">لا توجد مصاريف في هذه الفترة</td></tr>'}</tbody></table></div></div>
  ${Object.entries(X.byCat).length?`<div class="cols"><div style="grid-column:1/-1"><table><thead><tr><th class="l" style="text-align:right">ملخص حسب البند</th><th>المبلغ</th></tr></thead><tbody>${Object.entries(X.byCat).map(([k,v])=>`<tr><td class="l">${esc(k)}</td><td class="v">${nf(v)}</td></tr>`).join("")}</tbody></table></div></div>`:""}
  <div class="netrow"><span>إجمالي المصاريف</span><span>${nf(X.total)} ج.م</span></div></div></div>`;}
const withExp=(h,R)=>slipOpts.exp?h+expPage(R):h;
function slipPages(list,R,per,dup){per=dup?Math.min(per,4):per;const pages=[];for(let i=0;i<list.length;i+=per)pages.push(list.slice(i,i+per));
  return pages.map(p=>`<div class="${slipPageClass(per,dup)}">${p.map(r=>dup?slipHTML(r,R,"نسخة العامل")+slipHTML(r,R,"نسخة المصنع"):slipHTML(r,R)).join("")}</div>`).join("");}
function printSlips(rows,R,per,dup,noExp){act("print","طباعة "+rows.length+" قسيمة"+(dup?" (نسختين)":""));
  $("#printArea").innerHTML=noExp?slipPages(rows,R,per,dup):withExp(slipPages(rows,R,per,dup),R);
  setTimeout(()=>window.print(),150);
}
function pSlips(c){
  const R=calc(),S=data.settings;if(!slipId||!R.rows.some(r=>r.id===slipId))slipId=R.rows[0]&&R.rows[0].id;
  c.innerHTML=`<div class="card"><h3>طباعة كل القسائم دفعة واحدة</h3><div class="bar"><label class="hint">عدد القسائم في الصفحة
   <select class="fld" id="per" style="min-width:90px"><option value="1">1</option><option value="2">2</option><option value="4">4</option><option value="6">6</option><option value="8">8</option></select></label>
   <label class="hint"><input type="checkbox" id="sdup" ${slipOpts.dup?"checked":""}> نسختين جنب بعض لكل قسيمة (للعامل وللمصنع)</label>
   <label class="hint"><input type="checkbox" id="sx" ${slipOpts.exp?"checked":""}> طباعة كشف المصاريف مع القسائم</label>
   <label class="hint"><input type="checkbox" id="sk" ${slipOpts.skipSusp?"checked":""}> استبعاد العمال الموقوفين</label></div>
   <div class="bar"><button class="btn t big" id="pall">${ICON.print} طباعة كل القسائم (<span id="cnt"></span>)</button><button class="btn g big" id="ppdf">حفظ الكل كملف PDF</button><button class="btn g big" id="pem">✉ إرسال بالبريد</button></div>
   <div class="hint" id="sdh"></div><div class="hint">ستظهر نافذة الطباعة بكل القسائم مرتبة، اختر الطابعة أو «Microsoft Print to PDF».</div></div>
  <div class="card" id="pick"><h3>اختيار الأقسام والعمال المطلوب طباعتهم</h3>
   <div class="bar" id="pk_d" style="flex-wrap:wrap;gap:6px 14px"></div>
   <div class="bar"><input class="fld" id="pk_q" placeholder="بحث بالاسم أو الكود…" value="${esc(slipOpts.q)}" style="min-width:220px"><button class="btn g" id="pk_all">تحديد الكل</button><button class="btn g" id="pk_none">إلغاء الكل</button><button class="btn g" id="pk_vis">تحديد الظاهر</button><button class="btn g" id="pk_unv">إلغاء الظاهر</button><span class="hint">المحدد للطباعة: <b id="pk_n"></b></span></div>
   <div id="pk_w" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:2px 12px;max-height:280px;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:8px"></div></div>
  <div class="card"><h3>معاينة / طباعة قسيمة واحدة</h3><div class="bar"><select class="fld" id="one" style="min-width:260px">${R.rows.map(r=>`<option value="${esc(r.id)}" ${r.id===slipId?"selected":""}>${esc(r.id)} — ${esc(r.w.name)}</option>`).join("")}</select><button class="btn" id="p1">${ICON.print} طباعة هذه القسيمة</button></div><div class="slipprev" id="prev"></div></div>`;
  const dupUi=()=>{const o=[...$("#per").options];o.forEach(x=>x.disabled=slipOpts.dup&&+x.value>4);if(slipOpts.dup&&slipOpts.per>4){slipOpts.per=4;}$("#per").value=slipOpts.per;$("#sdh").textContent=slipOpts.dup?`كل قسيمة تُطبع مرتين جنب بعض، وحد أقصى 4 قسائم في الصفحة (${Math.min(slipOpts.per,4)*2} نسخة).`:`${slipOpts.per} ${slipOpts.per===1?"قسيمة":"قسائم"} في الصفحة الواحدة (A4).`;};
  $("#per").value=slipOpts.per;$("#sx").onchange=e=>{slipOpts.exp=e.target.checked;};
  const isSel=r=>{const v=slipOpts.sel[r.id];return v===undefined?!(slipOpts.skipSusp&&r.w.status==="موقوف"):v;};
  const list=()=>R.rows.filter(isSel);
  const dnames=()=>[...S.departments.filter(d=>R.rows.some(r=>r.dept===d)),...(R.rows.some(r=>!S.departments.includes(r.dept))?["بدون قسم"]:[])];
  const inDept=d=>R.rows.filter(r=>d==="بدون قسم"?!S.departments.includes(r.dept):r.dept===d);
  const visible=()=>{const q=slipOpts.q.trim().toLowerCase();return R.rows.filter(r=>!q||String(r.w.name).toLowerCase().includes(q)||r.id.toLowerCase().includes(q));};
  const drawPick=()=>{
    $("#pk_d").innerHTML=dnames().map(d=>{const rs=inDept(d),n=rs.filter(isSel).length;return `<label class="chk" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-dp="${esc(d)}" ${n===rs.length?"checked":""}> <b>${esc(d)}</b> <small class="hint">(${n}/${rs.length})</small></label>`;}).join("");
    $("#pk_d").querySelectorAll("[data-dp]").forEach(cb=>{const rs=inDept(cb.dataset.dp),n=rs.filter(isSel).length;cb.indeterminate=n>0&&n<rs.length;});
    $("#pk_w").innerHTML=visible().map(r=>`<label class="chk" style="display:flex;gap:6px;align-items:center;padding:3px 2px"><input type="checkbox" data-w="${esc(r.id)}" ${isSel(r)?"checked":""}> ${esc(r.id)} — ${esc(r.w.name)} <small class="hint">${esc(r.dept||"")}${r.w.status==="موقوف"?" · موقوف":""}</small></label>`).join("")||'<span class="hint">لا نتائج</span>';
    $("#pk_n").textContent=list().length+" من "+R.rows.length+" عامل";upd();};
  const upd=()=>{$("#cnt").textContent=list().length+" عامل";const r=R.rows.find(x=>x.id===slipId);$("#prev").innerHTML=r?slipHTML(r,R):"";};upd();
  $("#per").onchange=e=>{slipOpts.per=+e.target.value;dupUi();};$("#sdup").onchange=e=>{slipOpts.dup=e.target.checked;dupUi();};dupUi();$("#sk").onchange=e=>{slipOpts.skipSusp=e.target.checked;R.rows.filter(r=>r.w.status==="موقوف").forEach(r=>{slipOpts.sel[r.id]=!slipOpts.skipSusp;});drawPick();};
  $("#one").onchange=e=>{slipId=e.target.value;upd();};
  $("#pk_d").onchange=e=>{const d=e.target.dataset.dp;if(d===undefined)return;inDept(d).forEach(r=>{slipOpts.sel[r.id]=e.target.checked;});drawPick();};
  $("#pk_w").onchange=e=>{const id=e.target.dataset.w;if(id===undefined)return;slipOpts.sel[id]=e.target.checked;$("#pk_n").textContent=list().length+" من "+R.rows.length+" عامل";$("#cnt").textContent=list().length+" عامل";drawPickDepts();};
  const drawPickDepts=()=>{$("#pk_d").innerHTML=dnames().map(d=>{const rs=inDept(d),n=rs.filter(isSel).length;return `<label class="chk" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-dp="${esc(d)}" ${n===rs.length?"checked":""}> <b>${esc(d)}</b> <small class="hint">(${n}/${rs.length})</small></label>`;}).join("");$("#pk_d").querySelectorAll("[data-dp]").forEach(cb=>{const rs=inDept(cb.dataset.dp),n=rs.filter(isSel).length;cb.indeterminate=n>0&&n<rs.length;});};
  $("#pk_q").oninput=e=>{slipOpts.q=e.target.value;drawPick();};
  $("#pk_all").onclick=()=>{R.rows.forEach(r=>slipOpts.sel[r.id]=true);drawPick();};$("#pk_none").onclick=()=>{R.rows.forEach(r=>slipOpts.sel[r.id]=false);drawPick();};
  $("#pk_vis").onclick=()=>{visible().forEach(r=>slipOpts.sel[r.id]=true);drawPick();};$("#pk_unv").onclick=()=>{visible().forEach(r=>slipOpts.sel[r.id]=false);drawPick();};
  drawPick();
  $("#p1").onclick=()=>{const r=R.rows.find(x=>x.id===slipId);if(r)printSlips([r],R,1,slipOpts.dup,true);};
  $("#pall").onclick=()=>{const l=list();if(!l.length){toast("لا يوجد عمال للطباعة");return;}printSlips(l,R,slipOpts.per,slipOpts.dup);};
  $("#pem").onclick=()=>{const l=list();if(!l.length){toast("لا يوجد عمال للإرسال");return;}emailSlips(l,R,slipOpts.per,slipOpts.dup);};
  $("#ppdf").onclick=async()=>{const l=list();if(!l.length){toast("لا يوجد عمال للطباعة");return;}
    if(!NATIVE){toast("حفظ PDF متاح في نسخة الويندوز. استخدم الطباعة واختر Save as PDF.");printSlips(l,R,slipOpts.per,slipOpts.dup);return;}
    $("#printArea").innerHTML=withExp(slipPages(l,R,slipOpts.per,slipOpts.dup),R);
    const ok=await NATIVE.pdf(`قسائم-الرواتب-${R.start}.pdf`);if(ok)toast("تم حفظ الملف");};
}

/* ---------- الإعدادات ---------- */
function pSettings(c){
  const S=data.settings,fields=[["company","اسم المصنع / الشركة","text"],["daysBasis","أيام الشهر للحساب (لقسمة الراتب)","number"],["hoursDay","ساعات العمل اليومية (الافتراضي)","number"],["otDay","معامل ساعة الإضافي (الافتراضي)","number"],["fridayMult","معامل إضافي الجمعة","number"],["absMult","معامل خصم يوم الغياب","number"],["deficitMult","معامل خصم العجز (تأخير/انصراف مبكر)","number"],["minWage","الحد الأدنى للأجر (للتنبيه فقط)","number"]];
  c.innerHTML=`<div class="card"><h3>معاملات الحساب</h3><div class="form">${fields.map(([k,l,t])=>`<label>${l}<input class="fld" data-s="${k}" type="${t}" step="any" value="${esc(S[k])}"></label>`).join("")}</div></div>
  <div class="card"><h3>الأقسام</h3><textarea class="fld" id="depts" rows="5" style="width:320px">${esc(S.departments.join("\n"))}</textarea><div class="hint">قسم في كل سطر.</div></div>
  <div class="card"><h3>قواعد الحضور والبصمة</h3><div class="form">
   <label>مدة الراحة التي لا تُحسب من الدوام (دقيقة)<input class="fld" data-ar="restMin" type="number" step="any" value="${esc(S.attRules.restMin)}"></label>
   <label>سماح التأخير والانصراف المبكر (دقيقة) — لا يُحسب لو ≤ الرقم<input class="fld" data-ar="graceMin" type="number" step="any" value="${esc(S.attRules.graceMin)}"></label>
   <label>أقل مدة إضافي تُحتسب (دقيقة) — أقل منها لا يُحسب<input class="fld" data-ar="otStartMin" type="number" step="any" value="${esc(S.attRules.otStartMin)}"></label></div>
   <div class="hint" style="margin-top:8px">القيم الحالية مطابقة لطريقة حسابك في شيت البصمة (سماح 10 دقائق، والإضافي من 10 دقائق فأكثر، وإذا تجاوز السماح تُحسب الدقائق كلها).</div></div>
  <div class="card"><h3>بنود المصاريف الإضافية</h3><textarea class="fld" id="xcats" rows="6" style="width:320px">${esc((S.expenseCats||[]).join("\n"))}</textarea><div class="hint">بند في كل سطر.</div></div>
  ${mailCardHTML()}
  <div class="card${me&&me.admin?"":" nodisp"}"><h3>البيانات والنسخ الاحتياطي</h3><div class="bar"><button class="btn t" id="imp">${ICON.xl} استيراد من ملف Excel (الشيت القديم)</button><button class="btn g" id="bk">نسخة احتياطية (ملف)</button><button class="btn g" id="rs">استرجاع نسخة احتياطية</button><button class="btn r" id="clr">مسح كل البيانات</button></div>
   <div class="hint" id="loc">${NATIVE?"يُحفظ البرنامج بياناته تلقائياً ويحتفظ بنسخ احتياطية يومية.":"تُحفظ البيانات داخل المتصفح."}</div>
   <input type="file" id="fx" accept=".xlsx,.xlsm" hidden><input type="file" id="fj" accept=".json" hidden></div>`;
  c.querySelectorAll("[data-s]").forEach(i=>i.onchange=()=>{S[i.dataset.s]=i.type==="number"?E.num(i.value):i.value;save();if(i.dataset.s==="company")shell(),render();});
  $("#depts").onchange=e=>{S.departments=e.target.value.split("\n").map(s=>s.trim()).filter(Boolean);save();toast("تم حفظ الأقسام");};
  c.querySelectorAll("[data-ar]").forEach(i=>i.onchange=()=>{S.attRules[i.dataset.ar]=E.num(i.value);save();toast("تم الحفظ — اضغط «إعادة الحساب» في صفحة البصمة لتطبيقها");});
  $("#xcats").onchange=e=>{S.expenseCats=e.target.value.split("\n").map(x=>x.trim()).filter(Boolean);save();toast("تم حفظ بنود المصاريف");};
  mailCardInit(c);
  if(NATIVE)NATIVE.info().then(p=>$("#loc").textContent=`مكان البيانات: ${p.dir}  |  النسخ الاحتياطية: ${p.backups}`);
  $("#imp").onclick=()=>$("#fx").click();$("#fx").onchange=async e=>{if(e.target.files[0])await importXlsx(e.target.files[0]);e.target.value="";};
  $("#bk").onclick=()=>saveFile(`نسخة-احتياطية-${E.iso(new Date())}.json`,new Blob([JSON.stringify(data)],{type:"application/json"}));
  $("#rs").onclick=()=>$("#fj").click();$("#fj").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!d.workers||!d.settings)throw 0;if(!d.users||!d.users.length)d.users=data.users;data=d;normData();save();if(!refreshMe())return logout();if(lvl(page)<1)page=allowedPages()[0]||"dash";shell();render();act("import","استرجاع نسخة احتياطية");toast("تم الاسترجاع");}catch(x){toast("ملف غير صالح");}e.target.value="";};
  $("#clr").onclick=()=>openModal(`<h3>مسح كل البيانات</h3><p>سيتم حذف العمال والحركات وكل الإدخالات. خذ نسخة احتياطية أولاً. هل أنت متأكد؟</p><div class="bar"><button class="btn r" id="yes">نعم، امسح</button><button class="btn g" data-close>إلغاء</button></div>`,m=>m.querySelector("#yes").onclick=()=>{const uu=data.users;data=blank();data.users=uu;save();closeModal();shell();render();});
}

/* ---------- حفظ الملفات ---------- */
async function saveFile(name,blob){
  if(NATIVE){const buf=new Uint8Array(await blob.arrayBuffer());const ok=await NATIVE.saveFile(name,buf);if(ok)toast("تم الحفظ");return;}
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
function exportXlsx(){act("export","تصدير كشف المرتبات Excel");saveFile(`كشف-المرتبات-${calc().start}.xlsx`,payXlsx());}
function payXlsx(R0){
  const R=R0||calc(),head=COLS.map(c=>c[1]),keys=COLS.map(c=>c[0]);
  const rows=R.rows.map(r=>keys.map(k=>k==="name"?r.w.name:k==="warn"?r.warns.join("، "):k==="id"?(isNaN(r.id)?r.id:+r.id):r[k]));
  const foot=keys.map((k,i)=>i===0?"":k==="name"?"الإجمالي":R.tot[k]!==undefined?R.tot[k]:"");
  return XLSX2.writeSheet("كشف المرتبات",head,rows,foot);
}

/* ---------- الاستيراد من الشيت القديم ---------- */
function serialISO(v){if(typeof v==="number"){const d=new Date(Date.UTC(1899,11,30)+Math.round(v)*86400000);return d.getUTCFullYear()+"-"+String(d.getUTCMonth()+1).padStart(2,"0")+"-"+String(d.getUTCDate()).padStart(2,"0");}
  const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(v||"").trim());return m?`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`:(/^\d{4}-\d\d-\d\d/.test(v)?String(v).slice(0,10):null);}
function tableOf(sh,key){ // يرجع {hr, col(textIncludes)}
  if(!sh)return null;let hr=0;for(let r=1;r<=12&&!hr;r++)for(let c=1;c<=40;c++){const v=sh.cells[colL(c)+r];if(typeof v==="string"&&v.trim().startsWith(key)){hr=r;break;}}
  if(!hr)return null;const hdr={};for(let c=1;c<=40;c++){const v=sh.cells[colL(c)+hr];if(v!=null)hdr[colL(c)]=String(v);}
  return {hr,max:sh.maxR,hdr,find:(...ts)=>Object.keys(hdr).find(k=>ts.every(t=>hdr[k].includes(t))),get:(sh2,col,r)=>sh.cells[col+r]};
}
const colL=n=>{let s="";while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;};
async function importXlsx(file){
  try{
    const wb=await XLSX2.readWorkbook(await file.arrayBuffer()),nd=blank(),rep=[];nd.users=data.users;
    const ws=wb["العمال"],T=tableOf(ws,"الكود");if(!T)throw new Error("لم أجد شيت «العمال»");
    const cID=T.find("الكود"),cN=T.find("الاسم"),cD=T.find("القسم"),cJ=T.find("الوظيفة"),cT=T.find("نوع الأجر"),cW=Object.keys(T.hdr).find(k=>T.hdr[k].startsWith("الأجر")&&!T.hdr[k].includes("التأميني")&&!T.hdr[k].includes("نوع")),cH=T.find("تاريخ"),cP=T.find("التليفون"),cS=T.find("الحالة"),cHr=T.find("ساعات العمل"),cOm=T.find("معامل");
    for(let r=T.hr+1;r<=T.max;r++){const g=c=>c?ws.cells[c+r]:undefined,name=g(cN);if(name==null||name==="")continue;
      const hire=serialISO(g(cH));nd.workers.push({id:String(g(cID)??nd.workers.length+1),name:String(name),dept:g(cD)||"",job:g(cJ)||"",type:g(cT)==="يومي"?"يومي":"شهري",wage:E.num(g(cW)),hire:hire||"",phone:g(cP)||"",status:g(cS)==="موقوف"?"موقوف":"نشط",hours:g(cHr)&&g(cHr)!==8?E.num(g(cHr)):"",otMult:g(cOm)?E.num(g(cOm)):""});}
    rep.push(`${nd.workers.length} عامل`);
    // الإعدادات
    const st=wb["الإعدادات"];if(st){const map=[["اسم المصنع","company",1],["أيام الشهر","daysBasis"],["ساعات العمل اليومية","hoursDay"],["الإضافي النهاري","otDay"],["خصم يوم الغياب","absMult"],["خصم العجز","deficitMult"],["القطاع الخاص","minWage"],["بداية فترة","periodStart",2]];
      let depStart=0;for(let r=1;r<=60;r++){const l=st.cells["A"+r],v=st.cells["B"+r];if(typeof l!=="string")continue;if(l.trim()==="الأقسام"){depStart=r;continue;}
        for(const [k,key,t] of map){if(l.includes(k)&&v!=null&&!(key==="otDay"&&nd.settings._otSet)){nd.settings[key]=t===1?String(v):t===2?serialISO(v):E.num(v);if(key==="otDay")nd.settings._otSet=1;break;}}}
      delete nd.settings._otSet;if(depStart){const deps=[];for(let r=depStart+1;r<=depStart+30;r++){const v=st.cells["A"+r];if(v==null)break;deps.push(String(v));}if(deps.length)nd.settings.departments=deps;}}
    nd.workers.forEach(w=>{if(w.dept&&!nd.settings.departments.includes(w.dept))nd.settings.departments.push(w.dept);});
    // السلف والخصومات
    const wt=wb["السلف والخصومات"],X=tableOf(wt,"التاريخ");let bad=0;
    if(X){const cd=X.find("التاريخ"),cw=X.find("كود"),ct=X.find("النوع"),ca=X.find("المبلغ"),cn=X.find("ملاحظة");
      for(let r=X.hr+1;r<=X.max;r++){const w=wt.cells[cw+r],a=wt.cells[ca+r];if(w==null||!a)continue;let d=serialISO(wt.cells[cd+r]);if(!d){d=nd.settings.periodStart;bad++;}
        nd.txns.push({date:d,workerId:String(w),type:wt.cells[ct+r]||"سلفة",amount:E.num(a),note:wt.cells[cn+r]||""});}
      rep.push(`${nd.txns.length} حركة سلف وخصومات`+(bad?` (${bad} بدون تاريخ صحيح وُضعت في بداية الفترة)`:""));}
    // إدخالات الفترة
    const pt=wb["كشف المرتبات"],P=tableOf(pt,"الكود");
    if(P){const f=(...a)=>P.find(...a),cc=f("الكود"),m={absent:f("أيام الغياب"),otMin:f("إضافي نهاري","✎")||f("إضافي نهاري","(")||f("الإضافي","("),otNight:f("إضافي ليلي","✎")||f("إضافي ليلي","("),deficitMin:f("العجز"),fridayMin:f("إضافي الجمعة")||f("أيام عمل الجمعة")||f("أيام عمل بالراحة")};
      const hours=k=>m[k]&&P.hdr[m[k]].includes("ساعة");const en={};
      for(let r=P.hr+1;r<=P.max;r++){const id=pt.cells[cc+r];if(id==null||id==="")continue;const o={};for(const k in m){if(!m[k])continue;let v=pt.cells[m[k]+r];if(typeof v!=="number")continue;if(hours(k))v=Math.round(v*60);if(k==="fridayMin"&&P.hdr[m[k]].includes("أيام"))v=Math.round(v*(nd.settings.hoursDay||8)*60);if(v){if(k==="otNight")o.otMin=(o.otMin||0)+v;else o[k]=(k==="otMin"?(o.otMin||0):0)+v;}}if(Object.keys(o).length)en[String(id)]=o;}
      nd.entries[nd.settings.periodStart]=en;rep.push(`إدخالات ${Object.keys(en).length} عامل للفترة ${dshow(nd.settings.periodStart)}`);}
    openModal(`<h3>تم قراءة الملف</h3><ul><li>${rep.join("</li><li>")}</li></ul><p class="hint">سيحلّ هذا محل كل البيانات الحالية في البرنامج (العمال والحركات والمصاريف والبصمة). هل تريد المتابعة؟</p><div class="bar"><button class="btn t" id="yes">استيراد</button><button class="btn g" data-close>إلغاء</button></div>`,m=>m.querySelector("#yes").onclick=()=>{data=nd;save();closeModal();page="pay";shell();render();toast("تم الاستيراد بنجاح");});
  }catch(e){openModal(`<h3>تعذّر الاستيراد</h3><p>${esc(e.message)}</p><div class="bar"><button class="btn g" data-close>حسناً</button></div>`);}
}

/* ---------- البصمة والحضور ---------- */
const DN=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const diffCls=v=>Math.abs(v)<0.005?"":(v>0?"dpos":"dneg");
function attSim(att){
  const s=cur(),en={...(data.entries[s]||{})};
  for(const id in att.draft){const d=att.draft[id],o={...(en[id]||{})};["absent","otMin","deficitMin"].forEach(k=>o[k]=E.num(d[k]));en[id]=o;}
  return E.compute({...data,entries:{...data.entries,[s]:en}},s);
}
function parsedFromAtt(att){return {recs:att.recs.map(a=>({code:a[0],date:a[1],sIn:a[2],sOut:a[3],aIn:a[4],aOut:a[5],fOt:a[6],fDef:a[7],name:a[8]||"",row:0})),bad:[]};}
function stageAtt(D){ // يحفظ نتيجة الحساب كمسودة للمراجعة
  const att={rows:D.rows,recs:D.recs,dates:D.dates,workDates:D.workDates,from:D.from,to:D.to,
    unknown:D.unknown,notes:D.notes,bad:D.bad.length,outside:D.outside,shifts:D.shifts,draft:{}};
  D.rows.forEach(r=>{if(r.inFile)att.draft[r.id]={absent:r.absent,otMin:r.otMin,deficitMin:r.deficitMin};});
  return att;
}
function fillShifts(shifts){let n=0;for(const id in shifts){const w=data.workers.find(x=>String(x.id)===id);if(w&&!w.shiftIn&&!w.shiftOut){w.shiftIn=Att.hm(shifts[id].sIn);w.shiftOut=Att.hm(shifts[id].sOut);n++;}}return n;}
async function importFingerprint(file,skipAsk){
  try{
    toast("جارٍ قراءة ملف البصمة…");
    const X=await XLSX2.readRows(await file.arrayBuffer()),P=Att.parseRows(X.rows);
    if(!P.recs.length)throw new Error("لا توجد صفوف بيانات في الملف.");
    const ds=P.recs.map(r=>r.date).sort(),mn=ds[0];let st=cur();
    const inCur=P.recs.some(r=>r.date>=st&&r.date<=E.periodEnd(st));
    if(!inCur){while(mn<st)st=E.shiftPeriod(st,-1);while(mn>E.periodEnd(st))st=E.shiftPeriod(st,1);
      if(!skipAsk){openModal(`<h3>الملف يخص فترة أخرى</h3><p>تواريخ الملف تبدأ من <b>${dshow(mn)}</b> وهي لا تقع في الفترة الحالية (${dshow(cur())} ← ${dshow(E.periodEnd(cur()))}).<br>هل تريد التحويل إلى الفترة <b>${dshow(st)} ← ${dshow(E.periodEnd(st))}</b> واستيراد الملف فيها؟</p><div class="bar"><button class="btn t" id="yes">نعم، حوّل الفترة واستورد</button><button class="btn g" data-close>إلغاء</button></div>`,m=>m.querySelector("#yes").onclick=async()=>{closeModal();data.settings.periodStart=st;save();shell();await importFingerprint(file,true);});return;}
      data.settings.periodStart=st;}
    const s=cur();
    const D=Att.buildDraft(P,data,s,{useFile:true});
    const att=stageAtt(D);att.file=file.name;att.at=E.iso(new Date());att.useFile=true;att.hasFileCalc=P.hasFileCalc;
    data.att[s]=att;const filled=fillShifts(D.shifts);save();page="att";shell();render();
    toast(`تم استيراد ${P.recs.length} سجل بصمة`+(filled?` — وتعبئة دوام ${filled} عامل`:""));
  }catch(e){openModal(`<h3>تعذّر استيراد البصمة</h3><p>${esc(e.message)}</p><div class="bar"><button class="btn g" data-close>حسناً</button></div>`);}
}
function attApply(){
  const att=data.att[cur()],s=cur(),R0=calc(),RS=attSim(att),en=(data.entries[s]=data.entries[s]||{});
  for(const id in att.draft){const d=att.draft[id],o=(en[id]=en[id]||{});o.absent=E.num(d.absent);o.otMin=E.num(d.otMin);o.deficitMin=E.num(d.deficitMin);}
  att.appliedAt=E.iso(new Date());repoSave(s,{applied:true});act("import","اعتماد نتائج البصمة على كشف المرتبات");save();closeModal();render();toast("تم اعتماد نتائج البصمة على كشف المرتبات");
}
function attDetail(id,st){
  const att=data.att[st||cur()],w=data.workers.find(x=>String(x.id)===id);if(!w)return;
  const days=Att.daysOf(att,w,data,att.useFile),have=new Set(days.filter(d=>d.c.present).map(d=>d.date));
  const miss=att.workDates.filter(d=>d<=att.to&&!have.has(d)&&(!w.hire||d>=w.hire));
  const rows=[...days.map(d=>({date:d.date,d})),...miss.map(m=>({date:m,miss:true}))].sort((a,b)=>a.date.localeCompare(b.date));
  const tm=Att.hm;
  openModal(`<h3>${esc(w.name)} — تفاصيل الحضور اليومي</h3><div class="tablewrap" style="max-height:60vh"><table><thead><tr><th>التاريخ</th><th>اليوم</th><th>الدوام</th><th>الحضور</th><th>الانصراف</th><th>تأخير</th><th>انصراف مبكر</th><th>إضافي</th><th class="l">ملاحظة</th></tr></thead><tbody>${
    rows.map(x=>{if(x.miss)return `<tr><td>${dshow(x.date)}</td><td>${DN[Att.dowIso(x.date)]}</td><td colspan="6" style="color:#b91c1c">غياب (لا توجد بصمة)</td><td class="l">يُحسب يوم غياب</td></tr>`;
      if(x.d.dow===5)return "";const c=x.d.c,r=x.d.r,fri=false,note=[];if(c.incomplete)note.push("بصمة ناقصة");if(c.fileDiff)note.push("رقم الشيت يختلف عن القاعدة");
      const lateM=c.late,earlyM=c.early;
      return `<tr><td>${dshow(x.date)}</td><td>${DN[x.d.dow]}</td><td>${fri?"—":tm(c.sIn)+" - "+tm(c.sOut)}</td><td>${tm(r.aIn)}</td><td>${tm(r.aOut)}</td><td>${fri?"":(lateM||"")}</td><td>${fri?"":(earlyM||"")}</td><td>${fri?"":(c.ot||"")}</td><td class="l">${note.join("، ")}</td></tr>`;}).join("")
  }</tbody></table></div><div class="bar" style="margin-top:12px"><button class="btn g" data-close>إغلاق</button></div>`,m=>{m.querySelector(".box").style.width="min(1000px,96vw)";});
}
function pAtt(c){
  const s=cur(),att=data.att[s],A=data.settings.attRules;
  if(!att){
    c.innerHTML=`<div class="card" style="max-width:740px;margin:30px auto;text-align:center;padding:32px"><h3 style="font-size:19px">استيراد شيت البصمة</h3>
     <p class="hint" style="font-size:13.5px;line-height:1.9">ارفع شيت البصمة (Excel) وسيحسب البرنامج الغياب والتأخير والانصراف المبكر والإضافي لكل العمال دفعة واحدة.<br>تراجع النتائج وتعدّلها، ثم تعتمدها على كشف المرتبات.</p>
     <div class="bar" style="justify-content:center"><button class="btn t big" id="fpb">${ICON.xl} اختيار ملف البصمة</button></div>
     <p class="hint">الفترة الحالية: ${dshow(s)} ← ${dshow(E.periodEnd(s))} &nbsp;|&nbsp; الراحة ${A.restMin} دقيقة، السماح ${A.graceMin} دقائق، الإضافي من ${A.otStartMin} دقائق</p>
     <input type="file" id="fpf" accept=".xlsx,.xlsm" hidden></div>`;
    $("#fpb").onclick=()=>$("#fpf").click();$("#fpf").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(f)await importFingerprint(f);};return;
  }
  const R0=calc(),curNet={};R0.rows.forEach(r=>curNet[r.id]=r.net);
  let RS=attSim(att);const simNet={};
  const KEYS=[["absent","الغياب (يوم)"],["deficitMin","العجز: تأخير وانصراف مبكر (دقيقة)"],["otMin","الإضافي (دقيقة)"]];
  const warns=[];
  if(att.unknown.length)warns.push(`أكواد في الملف غير موجودة في العمال (تم تجاهلها): ${att.unknown.map(u=>`${esc(u.code)} ${esc(u.name)} (${u.n} يوم)`).join("، ")}`);
  att.notes.forEach(n=>warns.push(`صف رقم ${n.row}: الكود ${esc(n.code)} (${esc(n.name)}) مكرر في يوم ${dshow(n.date)} — اعتُمد أول صف وتم تجاهل هذا الصف${n.ot?` (إضافي ${n.ot} دقيقة)`:""}. لو تريد احتسابه عدّل الخانة يدوياً.`));
  if(att.bad)warns.push(`${att.bad} صف بتاريخ غير مفهوم تم تجاهله.`);
  if(att.outside)warns.push(`${att.outside} صف خارج الفترة تم تجاهله.`);
  const inc=att.rows.filter(r=>r.inFile&&r.incomplete).length;if(inc)warns.push(`${inc} عامل عنده بصمة ناقصة (حضور بدون انصراف أو العكس) — راجع تفاصيله.`);
  warns.push("إضافي الجمعة يُدخل يدوياً من كشف المرتبات — الاستيراد لا يغيّره ويتجاهل صفوف الجمعة.");
  const diffRows=att.rows.filter(r=>r.inFile&&r.fileDiff);if(att.useFile&&diffRows.length)warns.push(`${diffRows.reduce((a,r)=>a+r.fileDiff,0)} يوم لدى ${diffRows.length} عامل أرقام الإضافي أو العجز فيها بالشيت (مكتوبة يدوياً) تختلف عن القاعدة — تم اعتماد رقم الشيت.`);
  c.innerHTML=`<div class="card"><h3>ملف البصمة: ${esc(att.file||"")}</h3>
   <div class="hint" style="line-height:1.9">الفترة في الملف: <b>${dshow(att.from)}</b> ← <b>${dshow(att.to)}</b> &nbsp;|&nbsp; أيام العمل الفعلية في الملف: <b>${att.workDates.length}</b> &nbsp;|&nbsp; ${att.rows.filter(r=>r.inFile).length} عامل في الملف
   <br>القواعد: الراحة ${A.restMin} دقيقة (لا تُحسب من الدوام) — تأخير/انصراف مبكر ≤ ${A.graceMin} دقائق لا يُحسب وإن زاد تُحسب الدقائق كلها — الإضافي من ${A.otStartMin} دقائق بعد نهاية الدوام — الغياب = يوم عمل بدون بصمة.</div>
   <div class="bar" style="margin-top:12px"><label class="hint"><input type="checkbox" id="uf" ${att.useFile?"checked":""} ${att.hasFileCalc?"":"disabled"}> اعتماد أرقام الإضافي والعجز الموجودة في الشيت إن وُجدت</label>
    <button class="btn g" id="rc">إعادة الحساب</button><button class="btn g" id="nf">استيراد ملف آخر</button><button class="btn r" id="dl">حذف بيانات البصمة</button></div>
   ${warns.length?`<div style="margin-top:8px">${warns.map(w=>`<div class="alert">⚠ ${w}</div>`).join("")}</div>`:""}</div>
   <div class="bar"><button class="btn t big" id="ap">اعتماد النتائج على كشف المرتبات</button><span class="hint">الخانات الصفراء قابلة للتعديل قبل الاعتماد. اضغط على اسم العامل لعرض الحضور اليومي.</span>${att.appliedAt?`<span class="badge ok">آخر اعتماد: ${dshow(att.appliedAt)}</span>`:""}</div>
   <div class="tablewrap"><table><thead><tr><th>الكود</th><th class="l sticky1">الاسم</th><th>الدوام</th><th>أيام الحضور</th>${KEYS.map(k=>`<th class="in" style="min-width:96px;white-space:normal">${k[1]}</th>`).join("")}<th class="out">الصافي الحالي</th><th class="out">الصافي بعد الاعتماد</th><th class="out">الفرق</th></tr></thead><tbody id="ab"></tbody><tfoot><tr class="tot" id="at"></tr></tfoot></table></div>`;
  const wmap={};data.workers.forEach(w=>wmap[String(w.id)]=w);
  const body=$("#ab");
  const rowHTML=r=>{const w=wmap[r.id]||{},cs=curNet[r.id]||0,ss=simNet[r.id]!=null?simNet[r.id]:cs,df=ss-cs;
    if(!r.inFile)return `<tr data-id="${esc(r.id)}" class="mute"><td>${esc(r.id)}</td><td class="l sticky1">${esc(r.name)}</td><td>${w.shiftIn?esc(w.shiftIn+" - "+w.shiftOut):""}</td><td colspan="4" class="hint">غير موجود في ملف البصمة — لم يتغير</td><td class="n">${nf(cs)}</td><td class="n">${nf(cs)}</td><td class="n"></td></tr>`;
    const d=att.draft[r.id],e=E.entryOf(data,s,r.id);
    return `<tr data-id="${esc(r.id)}"><td>${esc(r.id)}</td><td class="l sticky1"><a href="#" class="nm" data-id="${esc(r.id)}">${esc(r.name)}</a>${r.incomplete?' <span class="badge">بصمة ناقصة</span>':""}</td><td>${w.shiftIn?esc(w.shiftIn+" - "+w.shiftOut):""}</td><td>${r.present}</td>${
      KEYS.map(([k])=>{if(d[k]==null)return `<td class="hint" title="الملف لا يحتوي جمعة">${e[k]||0}</td>`;const was=E.num(e[k]),now=E.num(d[k]);
        return `<td><input class="cell" type="number" min="0" step="any" data-k="${k}" data-id="${esc(r.id)}" value="${d[k]||""}">${Math.abs(was-now)>1e-9?`<small class="was">كان ${E.fmt0(was)}</small>`:""}</td>`;}).join("")}
      <td class="n" data-c="cur">${nf(cs)}</td><td class="n net" data-c="sim">${nf(ss)}</td><td class="n ${diffCls(df)}" data-c="df">${Math.abs(df)<0.005?"":nf(df)}</td></tr>`;};
  const fill=()=>{RS=attSim(att);RS.rows.forEach(r=>simNet[r.id]=r.net);body.innerHTML=att.rows.map(rowHTML).join("");totals();};
  const totals=()=>{const a=R0.tot.net,b=RS.tot.net;$("#at").innerHTML=`<td colspan="7" class="l">الإجمالي (${att.rows.length})</td><td class="n">${nf(a)}</td><td class="n">${nf(b)}</td><td class="n ${diffCls(b-a)}">${Math.abs(b-a)<0.005?"":nf(b-a)}</td>`;};
  fill();
  body.addEventListener("input",e=>{const i=e.target;if(!i.dataset.k)return;const id=i.dataset.id;att.draft[id][i.dataset.k]=E.num(i.value);
    RS=attSim(att);RS.rows.forEach(r=>simNet[r.id]=r.net);const tr=i.closest("tr"),r=att.rows.find(x=>x.id===id),df=simNet[id]-curNet[id];
    tr.querySelector('[data-c="sim"]').textContent=nf(simNet[id]);const dc=tr.querySelector('[data-c="df"]');dc.textContent=Math.abs(df)<0.005?"":nf(df);dc.className="n "+diffCls(df);
    const e0=E.entryOf(data,s,id),was=E.num(e0[i.dataset.k]),cell=i.parentElement;let sm=cell.querySelector("small");
    if(Math.abs(was-att.draft[id][i.dataset.k])>1e-9){if(!sm){sm=document.createElement("small");sm.className="was";cell.appendChild(sm);}sm.textContent="كان "+E.fmt0(was);}else if(sm)sm.remove();
    totals();save();});
  body.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.dataset.k){e.preventDefault();let tr=e.target.closest("tr");do{tr=e.shiftKey?tr.previousElementSibling:tr.nextElementSibling;}while(tr&&!tr.querySelector(`[data-k="${e.target.dataset.k}"]`));const n=tr&&tr.querySelector(`[data-k="${e.target.dataset.k}"]`);if(n){n.focus();n.select();}}});
  body.addEventListener("click",e=>{const a=e.target.closest(".nm");if(a){e.preventDefault();attDetail(a.dataset.id);}});
  $("#uf").onchange=e=>{att.useFile=e.target.checked;};
  $("#rc").onclick=()=>openModal(`<h3>إعادة الحساب من ملف البصمة</h3><p>سيُعاد حساب كل الأرقام بالقواعد الحالية، وتضيع أي تعديلات يدوية أجريتها في هذه الصفحة قبل الاعتماد. هل تريد المتابعة؟</p><div class="bar"><button class="btn t" id="yes">إعادة الحساب</button><button class="btn g" data-close>إلغاء</button></div>`,m=>m.querySelector("#yes").onclick=()=>{
    const D=Att.buildDraft(parsedFromAtt(att),data,s,{useFile:att.useFile});Object.assign(att,stageAtt(D));save();closeModal();render();toast("تمت إعادة الحساب");});
  $("#nf").onclick=()=>openModal(`<h3>استيراد ملف بصمة آخر</h3><p>سيحلّ الملف الجديد محل بيانات البصمة الحالية لهذه الفترة (وتضيع تعديلاتك قبل الاعتماد). كشف المرتبات لا يتغير إلا عند الاعتماد. هل تريد المتابعة؟</p><div class="bar"><button class="btn t" id="yes">اختيار الملف</button><button class="btn g" data-close>إلغاء</button></div>`,m=>m.querySelector("#yes").onclick=()=>{closeModal();const f=document.createElement("input");f.type="file";f.accept=".xlsx,.xlsm";f.onchange=async()=>{if(f.files[0])await importFingerprint(f.files[0]);};f.click();});
  $("#dl").onclick=()=>openModal(`<h3>حذف بيانات البصمة</h3><p>سيتم حذف بيانات البصمة المستوردة لهذه الفترة فقط. لا يتغير كشف المرتبات. هل أنت متأكد؟</p><div class="bar"><button class="btn r" id="yes">نعم، احذف</button><button class="btn g" data-close>إلغاء</button></div>`,m=>m.querySelector("#yes").onclick=()=>{delete data.att[s];save();closeModal();render();});
  $("#ap").onclick=()=>{const a=R0.tot.net,b=RS.tot.net,n=Object.keys(att.draft).length;
    openModal(`<h3>اعتماد نتائج البصمة</h3><p>سيتم تحديث الغياب والعجز والإضافي لعدد <b>${n}</b> عامل في كشف المرتبات (إضافي الجمعة لا يتغير).<br>صافي المرتبات: <b>${nf(a)}</b> ← <b>${nf(b)}</b> (${b-a>=0?"+":""}${nf(b-a)})</p><div class="bar"><button class="btn t" id="yes">اعتماد</button><button class="btn g" data-close>إلغاء</button></div>`,m=>m.querySelector("#yes").onclick=attApply);};
}

/* ---------- المصاريف الإضافية ---------- */
let expAll=false;
function pExp(c){
  const S=data.settings,s=cur(),cats=()=>[...new Set([...(S.expenseCats||[]),"أخرى"])];
  const today=E.iso(new Date()),defDate=(today>=s&&today<=E.periodEnd(s))?today:s;
  c.innerHTML=`<div class="card"><h3>إضافة مصروف</h3><div class="form"><label>التاريخ<input class="fld" type="date" id="xd" value="${defDate}"></label>
   <label>البند<select class="fld" id="xc">${cats().map(x=>`<option>${esc(x)}</option>`).join("")}</select></label>
   <label>البيان / ملاحظة<input class="fld" id="xn"></label><label>المبلغ<input class="fld" type="number" step="any" id="xa"></label></div>
   <div class="bar" style="margin-top:14px"><button class="btn t" id="xadd">${ICON.plus} إضافة</button><button class="btn g" id="xcp">نسخ مصاريف الفترة السابقة</button><span class="hint">كل الخانات في الجدول قابلة للتعديل مباشرة. بنود المصاريف تُعدَّل من الإعدادات.</span></div></div>
   <div class="kpis" id="xk"></div>
   <div class="bar"><label class="hint"><input type="checkbox" id="xall" ${expAll?"checked":""}> عرض كل الفترات</label><span class="hint">إجمالي المصاريف المعروضة: <b id="xs"></b></span></div>
   <div class="tablewrap"><table><thead><tr><th>التاريخ</th><th>البند</th><th class="l">البيان</th><th>المبلغ</th><th></th></tr></thead><tbody id="xb"></tbody></table></div>`;
  const kp=()=>{const X=E.expenses(data,s),ks=Object.entries(X.byCat);$("#xk").innerHTML=`<div class="kpi t"><small>إجمالي المصاريف (الفترة الحالية)</small><b>${nf(X.total)}</b></div>`+ks.map(([k,v])=>`<div class="kpi"><small>${esc(k)}</small><b>${nf(v)}</b></div>`).join("");
    const L=data.expenses.filter(x=>expAll||(x.date>=s&&x.date<=E.periodEnd(s)));$("#xs").textContent=nf(L.reduce((a,x)=>a+E.num(x.amount),0));};
  const fill=()=>{const L=data.expenses.map((x,i)=>({x,i})).filter(({x})=>expAll||(x.date>=s&&x.date<=E.periodEnd(s))).sort((a,b)=>a.x.date.localeCompare(b.x.date));
    $("#xb").innerHTML=L.map(({x,i})=>`<tr data-i="${i}"><td><input class="cell m" type="date" data-f="date" value="${esc(x.date)}"></td><td><select class="cell m" data-f="cat">${[...new Set([...cats(),x.cat])].filter(Boolean).map(k=>`<option ${k===x.cat?"selected":""}>${esc(k)}</option>`).join("")}</select></td>
     <td><input class="cell w" style="width:320px" data-f="note" value="${esc(x.note||"")}"></td><td><input class="cell m" type="number" step="any" data-f="amount" value="${x.amount??""}"></td><td><button class="btn r" data-del="${i}">حذف</button></td></tr>`).join("")||'<tr><td colspan="5" class="hint" style="padding:24px">لا توجد مصاريف في هذه الفترة</td></tr>';kp();};
  fill();
  $("#xall").onchange=e=>{expAll=e.target.checked;fill();};
  $("#xadd").onclick=()=>{const a=E.num($("#xa").value);if(!$("#xd").value||!a){toast("أكمل التاريخ والمبلغ");return;}data.expenses.push({id:uid(),date:$("#xd").value,cat:$("#xc").value,note:$("#xn").value,amount:a});save();$("#xa").value="";$("#xn").value="";fill();toast("تمت الإضافة");};
  $("#xcp").onclick=()=>{if(E.expenses(data,s).list.length){toast("الفترة الحالية فيها مصاريف بالفعل");return;}const prev=E.expenses(data,E.shiftPeriod(s,-1)).list;if(!prev.length){toast("لا توجد مصاريف في الفترة السابقة");return;}
    prev.forEach(x=>data.expenses.push({id:uid(),date:E.shiftPeriod(x.date,1),cat:x.cat,note:x.note,amount:x.amount}));save();fill();toast(`تم نسخ ${prev.length} مصروف — عدّل المبالغ حسب الحاجة`);};
  $("#xb").addEventListener("change",e=>{const t=e.target,tr=t.closest("tr");if(!t.dataset.f||!tr)return;const x=data.expenses[+tr.dataset.i];x[t.dataset.f]=t.dataset.f==="amount"?E.num(t.value):t.value;save();kp();});
  $("#xb").addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(!b)return;data.expenses.splice(+b.dataset.del,1);save();fill();});
}

/* ---------- التقرير المالي ---------- */
function finModel(){return finFrom(calc(),E.expenses(data,cur()),finExtraFor(cur()));}
function finFrom(R,X,ex){
  const t=R.tot,S=data.settings,sum=(rs,k)=>rs.reduce((a,r)=>a+r[k],0);
  const groups=S.departments.map(d=>({d,rs:R.rows.filter(r=>r.dept===d)}));const other=R.rows.filter(r=>!S.departments.includes(r.dept));if(other.length)groups.push({d:"بدون قسم",rs:other});
  const dep=groups.filter(g=>g.rs.length).map(g=>({d:g.d,n:g.rs.length,basic:sum(g.rs,"basic"),ot:sum(g.rs,"otAmt")+sum(g.rs,"friday"),bonus:sum(g.rs,"bonus"),gross:sum(g.rs,"gross"),ded:sum(g.rs,"ded"),net:sum(g.rs,"net")}));
  return {R,X,t,dep,cost:t.gross+X.total,cash:t.net+X.total,P:ex&&ex.P||null,C:ex&&ex.C||null};
}
function finHTML(M){
  const t=M.t,X=M.X,S=data.settings,line=(l,v,cls)=>`<tr class="${cls||""}"><td class="l">${l}</td><td class="n">${nf(v)}</td></tr>`;
  const cats=Object.entries(X.byCat).sort((a,b)=>b[1]-a[1]);
  return `<div class="rep"><div class="rh"><b>${esc(S.company)} — التقرير المالي</b><span>الفترة: ${dshow(M.R.start)} إلى ${dshow(M.R.end)}</span></div>
  <div class="rcols"><div><h4>ملخص الفترة</h4><table><tbody>${line("إجمالي مستحقات العمال",t.gross)}${line("(−) السلف والجزاءات وخصم العجز",t.ded)}${line("صافي المرتبات",t.net,"s")}${line("المصاريف الإضافية",X.total)}
   ${line("إجمالي التكلفة (المستحقات + المصاريف)",M.cost,"s")}${line("المطلوب دفعه فعلياً (الصافي + المصاريف)",M.cash,"s")}</tbody></table>
   <div class="hint" style="margin-top:6px">التكلفة = ما يتحمله المصنع عن الفترة. المطلوب دفعه = ما يخرج الآن بعد خصم السلف المدفوعة سابقاً والجزاءات.</div></div>
  <div><h4>تفصيل المرتبات</h4><table><tbody>${line("الأجور الأساسية المستحقة",t.basic)}${line("الإضافي",t.otAmt)}${line("إضافي الجمعة",t.friday)}${line("مكافآت وبدلات",t.bonus)}${line("إجمالي المستحقات",t.gross,"s")}${line("السلف",t.adv)}${line("جزاءات وخصومات",t.pen)}${line("خصم العجز",t.deficit)}${line("إجمالي الاستقطاعات",t.ded,"s")}${line("صافي المرتبات",t.net,"s")}</tbody></table></div></div>
  ${finCharts(M)}
  <h4>المرتبات حسب القسم</h4><table><thead><tr><th class="l">القسم</th><th>العمال</th><th>الأجور</th><th>الإضافي والجمعة</th><th>مكافآت</th><th>الإجمالي</th><th>الاستقطاعات</th><th>الصافي</th></tr></thead><tbody>${
    M.dep.map(d=>`<tr><td class="l">${esc(d.d)}</td><td>${d.n}</td><td class="n">${nf(d.basic)}</td><td class="n">${nf(d.ot)}</td><td class="n">${nf(d.bonus)}</td><td class="n">${nf(d.gross)}</td><td class="n">${nf(d.ded)}</td><td class="n"><b>${nf(d.net)}</b></td></tr>`).join("")}
   <tr class="s"><td class="l">الإجمالي</td><td>${M.R.rows.length}</td><td class="n">${nf(t.basic)}</td><td class="n">${nf(t.otAmt+t.friday)}</td><td class="n">${nf(t.bonus)}</td><td class="n">${nf(t.gross)}</td><td class="n">${nf(t.ded)}</td><td class="n">${nf(t.net)}</td></tr></tbody></table>
  <h4>المصاريف الإضافية حسب البند</h4><table><thead><tr><th class="l">البند</th><th>المبلغ</th><th>النسبة</th></tr></thead><tbody>${cats.map(([k,v])=>`<tr><td class="l">${esc(k)}</td><td class="n">${nf(v)}</td><td>${X.total?(v/X.total*100).toFixed(1)+"%":""}</td></tr>`).join("")||'<tr><td colspan="3" class="hint">لا توجد مصاريف في هذه الفترة</td></tr>'}
   <tr class="s"><td class="l">الإجمالي</td><td class="n">${nf(X.total)}</td><td></td></tr></tbody></table>
  ${finExtraHTML(M)}
  ${X.list.length?`<h4>تفصيل المصاريف</h4><table><thead><tr><th>التاريخ</th><th>البند</th><th class="l">البيان</th><th>المبلغ</th></tr></thead><tbody>${[...X.list].sort((a,b)=>a.date.localeCompare(b.date)).map(x=>`<tr><td>${dshow(x.date)}</td><td>${esc(x.cat||"")}</td><td class="l">${esc(x.note||"")}</td><td class="n">${nf(x.amount)}</td></tr>`).join("")}</tbody></table>`:""}</div>`;
}
function exportFin(){const M=finModel();act("export","تصدير التقرير المالي Excel");saveFile(`التقرير-المالي-${M.R.start}.xlsx`,finXlsx(M));}
function finXlsx(M){
  const t=M.t,rows=[],add=(a,b,v)=>rows.push([a,b,v]);
  add("ملخص","إجمالي مستحقات العمال",t.gross);add("ملخص","السلف والجزاءات وخصم العجز",t.ded);add("ملخص","صافي المرتبات",t.net);add("ملخص","المصاريف الإضافية",M.X.total);add("ملخص","إجمالي التكلفة (المستحقات + المصاريف)",M.cost);add("ملخص","المطلوب دفعه فعلياً (الصافي + المصاريف)",M.cash);
  [["الأجور الأساسية المستحقة",t.basic],["الإضافي",t.otAmt],["إضافي الجمعة",t.friday],["مكافآت وبدلات",t.bonus],["السلف",t.adv],["جزاءات وخصومات",t.pen],["خصم العجز",t.deficit]].forEach(([a,v])=>add("تفصيل المرتبات",a,v));
  M.dep.forEach(d=>{add("حسب القسم — الإجمالي",d.d,d.gross);add("حسب القسم — الصافي",d.d,d.net);});
  Object.entries(M.X.byCat).forEach(([k,v])=>add("المصاريف حسب البند",k,v));
  if(M.P){add("المشتريات","عدد الفواتير",M.P.count);add("المشتريات","إجمالي المشتريات",M.P.total);add("المشتريات","المدفوع للموردين",M.P.paid);(M.P.byCat||[]).forEach(x=>add("المشتريات حسب التصنيف",x.l,x.v));}
  if(M.C){add("الخزينة","رصيد أول الفترة",M.C.open);add("الخزينة","الوارد",M.C.inn);add("الخزينة","المنصرف",M.C.out);add("الخزينة","رصيد آخر الفترة",M.C.close);}
  [...M.X.list].sort((a,b)=>a.date.localeCompare(b.date)).forEach(x=>add("تفصيل المصاريف",`${dshow(x.date)} — ${x.cat||""}${x.note?" — "+x.note:""}`,E.num(x.amount)));
  return XLSX2.writeSheet("التقرير المالي",["القسم","البند","المبلغ"],rows,["","التكلفة الإجمالية",M.cost]);
}
function pFin(c){
  const M=finModel();
  c.innerHTML=`<div class="bar"><button class="btn t big" id="fp">${ICON.print} طباعة التقرير</button><button class="btn g" id="fx">${ICON.xl} تصدير لـ Excel</button><button class="btn g" id="em">✉ إرسال بالبريد</button><span class="hint">التقرير يخص الفترة المعروضة بالأعلى. غيّرها بأزرار الفترة.</span></div>
  <div class="card finrep">${finHTML(M)}</div>`;
  $("#em").onclick=emailFin;$("#fx").onclick=exportFin;$("#fp").onclick=()=>{$("#printArea").innerHTML=`<div class="pg p1">${finHTML(M)}</div>`;setTimeout(()=>window.print(),150);};
}

/* ---------- مستودع التقارير الشهرية ---------- */
const MONTHS_AR=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const periodName=s=>{const e=E.periodEnd(s).split("-");return MONTHS_AR[+e[1]-1]+" "+e[0];};
const periodOf=(d,anchor)=>{let st=anchor||cur(),n=0;while(d<st&&n++<1200)st=E.shiftPeriod(st,-1);while(d>E.periodEnd(st)&&n++<2400)st=E.shiftPeriod(st,1);return st;};
let repoOpen=null,repoTab="sum";
const hasEntries=s=>{const e=data.entries[s]||{};return Object.values(e).some(o=>E.ENTRY_KEYS.some(k=>E.num(o[k])));};
function repoSnap(start){ // لقطة ثابتة لتقرير الشهر (لا تتأثر بتعديل الأجور لاحقاً)
  const R=E.compute(data,start),X=E.expenses(data,start);
  const rows=R.rows.map(r=>{const o={};for(const k in r)if(k!=="w")o[k]=r[k];o.w={name:r.w.name,job:r.w.job||""};return o;});
  return {at:E.iso(new Date()),start,end:R.end,workDays:R.workDays,fridays:R.fridays,rows,tot:R.tot,
    exp:{list:X.list.map(x=>({date:x.date,cat:x.cat,note:x.note,amount:x.amount})),byCat:X.byCat,total:X.total},...modsSnap(start)};
}
function repoApplyDraft(start){
  const att=data.att[start];if(!att)return false;const en=(data.entries[start]=data.entries[start]||{});
  for(const id in att.draft){const d=att.draft[id],o=(en[id]=en[id]||{});o.absent=E.num(d.absent);o.otMin=E.num(d.otMin);o.deficitMin=E.num(d.deficitMin);}
  att.appliedAt=E.iso(new Date());return true;
}
function repoSave(start,extra){ // يحدّث لقطة الشهر في المستودع
  const old=data.repo[start]||{},att=data.att[start]||{};
  data.repo[start]={...old,file:old.file||att.file||"",importedAt:old.importedAt||att.at||E.iso(new Date()),partial:att.to?att.to<E.periodEnd(start):!!old.partial,...(extra||{}),snap:repoSnap(start)};
}
function repoMonths(){
  const keys=new Set([...Object.keys(data.repo||{}),...Object.keys(data.att||{}).filter(k=>(data.att[k]||{}).rows)]);
  return [...keys].sort().map(s=>{const r=(data.repo||{})[s]||null,a=data.att[s]||null;return {start:s,repo:r,att:a,snap:r&&r.snap||null};});
}
async function repoPlan(files){
  const plan=[],errs=[];
  for(const f of files){
    if(!/\.(xlsx|xlsm)$/i.test(f.name)){errs.push(`${f.name}: الصيغة غير مدعومة (استخدم ملف xlsx)`);continue;}
    try{
      toast("جارٍ قراءة "+f.name+"…");
      const X=await XLSX2.readRows(await f.arrayBuffer()),P=Att.parseRows(X.rows);
      if(!P.recs.length){errs.push(`${f.name}: لا توجد صفوف بيانات`);continue;}
      const cache={},groups={};
      for(const r of P.recs){const s=cache[r.date]||(cache[r.date]=periodOf(r.date));(groups[s]=groups[s]||[]).push(r);}
      for(const s of Object.keys(groups).sort()){
        const recs=groups[s],pp={...P,recs,bad:[]},D=Att.buildDraft(pp,data,s,{useFile:true});
        plan.push({file:f.name,start:s,P:pp,D,n:recs.length,exists:!!(data.att[s]||(data.repo||{})[s]),entries:hasEntries(s),on:true,apply:!hasEntries(s)});
      }
    }catch(e){errs.push(`${f.name}: ${e.message}`);}
  }
  return {plan,errs};
}
function repoCommit(items){
  for(const it of items){
    const att=stageAtt(it.D);att.file=it.file;att.at=E.iso(new Date());att.useFile=true;att.hasFileCalc=it.P.hasFileCalc;
    data.att[it.start]=att;fillShifts(it.D.shifts);
    if(it.apply)repoApplyDraft(it.start);
    const old=data.repo[it.start]||{};
    data.repo[it.start]={file:it.file,importedAt:att.at,applied:!!it.apply,partial:it.D.to<E.periodEnd(it.start),snap:it.apply?repoSnap(it.start):(old.snap||null)};
    if(!data.repo[it.start].snap)delete data.repo[it.start].snap;
  }
}
async function repoImport(files){
  if(lvl("repo")<2)return toast("ليس لديك صلاحية الاستيراد");
  const {plan,errs}=await repoPlan([...files]);
  if(!plan.length)return openModal(`<h3>تعذّر الاستيراد</h3>${errs.map(e=>`<div class="alert">⚠ ${esc(e)}</div>`).join("")||"<p>لا توجد بيانات.</p>"}<div class="bar"><button class="btn g" data-close>حسناً</button></div>`);
  const seen={};plan.forEach(p=>{if(seen[p.start])p.dupOf=seen[p.start];seen[p.start]=p.file;});
  openModal(`<h3>تأكيد استيراد البصمة</h3><p class="hint">تم تقسيم الملفات تلقائياً حسب فترة المرتبات (${dshow(cur())} ← ${dshow(E.periodEnd(cur()))} هي الفترة الحالية). اختر ما تريد تخزينه:</p>
   ${errs.map(e=>`<div class="alert">⚠ ${esc(e)}</div>`).join("")}
   <div class="tablewrap" style="max-height:48vh"><table><thead><tr><th>استيراد</th><th class="l">الشهر</th><th class="l">الملف</th><th>السجلات</th><th>العمال</th><th>الفترة في الملف</th><th>اعتماد على الكشف</th><th class="l">ملاحظات</th></tr></thead><tbody>${plan.map((p,i)=>{
     const notes=[];if(p.exists)notes.push("الشهر موجود وسيُستبدل");if(p.entries)notes.push("فيه بيانات مسجّلة بالكشف");if(p.D.to<E.periodEnd(p.start))notes.push("الملف جزئي حتى "+dshow(p.D.to));if(p.D.unknown.length)notes.push(p.D.unknown.length+" كود غير موجود");if(p.D.notes.length)notes.push(p.D.notes.length+" صف مكرر");if(p.dupOf)notes.push("يكرر شهر ملف "+p.dupOf);
     return `<tr><td><input type="checkbox" data-on="${i}" checked></td><td class="l"><b>${periodName(p.start)}</b><br><small class="hint">${dshow(p.start)} ← ${dshow(E.periodEnd(p.start))}</small></td><td class="l">${esc(p.file)}</td><td>${p.n}</td><td>${p.D.rows.filter(r=>r.inFile).length}</td><td>${dshow(p.D.from)} ← ${dshow(p.D.to)}</td><td><input type="checkbox" data-ap="${i}" ${p.apply?"checked":""}></td><td class="l" style="white-space:normal;max-width:260px;color:#b45309">${notes.join("، ")}</td></tr>`;}).join("")}</tbody></table></div>
   <div class="hint" style="margin-top:8px;line-height:1.8">«اعتماد على الكشف» يكتب الغياب والعجز والإضافي في كشف مرتبات ذلك الشهر ويحفظ تقريره في المستودع. إضافي الجمعة لا يتغير. لو لم تعتمد، يُحفظ الملف كمسودة وتراجعه وتعتمده لاحقاً.</div>
   <div class="bar" style="margin-top:12px"><button class="btn t big" id="go">تخزين الشهور المحددة</button><button class="btn g" data-close>إلغاء</button></div>`,m=>{
    m.querySelector(".box").style.width="min(1000px,96vw)";
    m.querySelector("#go").onclick=()=>{
      const items=plan.filter((p,i)=>m.querySelector(`[data-on="${i}"]`).checked).map(p=>({...p,apply:m.querySelector(`[data-ap="${plan.indexOf(p)}"]`).checked}));
      if(!items.length)return toast("لم تحدد أي شهر");
      repoCommit(items);act("import",`استيراد بصمة إلى المستودع: ${items.map(i=>periodName(i.start)).join("، ")}`);save();closeModal();
      repoOpen=null;page="repo";shell();render();toast(`تم تخزين ${items.length} شهر في المستودع`);};
  });
}
function repoNet(s){const m=repoMonths().find(x=>x.start===s);return m&&m.snap?m.snap.tot.net:null;}
function finFromSnap(sn){return finFrom({start:sn.start,end:sn.end,rows:sn.rows,tot:sn.tot},sn.exp,sn.pur?{P:sn.pur,C:sn.cash}:null);}
function pRepo(c){
  const can=lvl("repo")>=2;
  if(repoOpen&&repoMonths().some(m=>m.start===repoOpen))return repoMonth(c,repoOpen);
  repoOpen=null;
  const months=repoMonths(),saved=months.filter(m=>m.snap),nets=saved.map(m=>m.snap.tot.net);
  const kp=saved.length?`<div class="kpis"><div class="kpi t"><small>الشهور المحفوظة</small><b>${saved.length}</b></div><div class="kpi"><small>إجمالي صافي كل الشهور</small><b>${nf(nets.reduce((a,b)=>a+b,0))}</b></div><div class="kpi"><small>متوسط الصافي الشهري</small><b>${nf(nets.reduce((a,b)=>a+b,0)/saved.length)}</b></div><div class="kpi"><small>أعلى شهر</small><b>${periodName(saved[nets.indexOf(Math.max(...nets))].start)}</b></div></div>`:"";
  c.innerHTML=`<div class="card dropzone" id="dz"><h3 style="font-size:17px">اسحب ملف البصمة هنا</h3>
    <p class="hint" style="font-size:13px;line-height:1.9">اسحب ملف (أو عدة ملفات) البصمة وأفلته هنا، والبرنامج يحدد الشهر تلقائياً من التواريخ ويحسب الغياب والعجز والإضافي ويخزن تقرير الشهر.<br>لو الملف فيه أكثر من شهر يتقسّم تلقائياً.</p>
    <div class="bar" style="justify-content:center"><button class="btn t big" id="rpb">${ICON.xl} أو اختر الملف من الجهاز</button></div>
    <input type="file" id="rpf" accept=".xlsx,.xlsm" multiple hidden>
    <div class="bar" style="justify-content:center"><button class="btn g" id="rkc">💾 حفظ الشهر الحالي (${periodName(cur())}) في المستودع</button></div></div>
   ${kp}
   <div class="tablewrap"><table><thead><tr><th class="l">الشهر</th><th>الفترة</th><th class="l">ملف البصمة</th><th>العمال</th><th>المستحقات</th><th>الاستقطاعات</th><th>الصافي</th><th>المصاريف</th><th>التغيّر</th><th>الحالة</th><th></th></tr></thead><tbody id="rb"></tbody></table></div>`;
  const rb=$("#rb");let prevNet=null;
  const rows=months.map(m=>{const s=m.start,sn=m.snap,cn=E.compute(data,s).tot.net;let delta="",st;
    if(sn){if(prevNet!=null&&prevNet!==0){const p=(sn.tot.net-prevNet)/Math.abs(prevNet)*100;delta=`<span style="direction:ltr;display:inline-block;color:#475569;font-weight:600">${p>=0?"▲ ":"▼ "}${Math.abs(p).toFixed(1)}%</span>`;}prevNet=sn.tot.net;}
    if(sn)st=Math.abs(cn-sn.tot.net)>0.005&&s===cur()?'<span class="badge">البيانات الحالية تختلف — حدّث التقرير</span>':(m.repo.partial?'<span class="badge">جزئي</span>':'<span class="badge ok">محفوظ</span>');
    else st='<span class="badge">بانتظار الاعتماد</span>';
    return {s,html:`<tr data-s="${s}"><td class="l"><b>${periodName(s)}</b></td><td><small>${dshow(s)} ← ${dshow(E.periodEnd(s))}</small></td><td class="l">${esc((m.repo&&m.repo.file)||(m.att&&m.att.file)||"—")}</td><td>${sn?sn.rows.length:(m.att?m.att.rows.filter(r=>r.inFile).length:"")}</td><td class="n">${sn?nf(sn.tot.gross):""}</td><td class="n">${sn?nf(sn.tot.ded):""}</td><td class="n net">${sn?nf(sn.tot.net):""}</td><td class="n">${sn?nf(sn.exp.total):""}</td><td>${delta}</td><td>${st}</td>
     <td style="white-space:nowrap">${sn?`<button class="btn t" data-open="${s}" data-rook>فتح</button> <button class="btn g" data-xl="${s}" data-rook>Excel</button> `:`<button class="btn t" data-ap2="${s}">اعتماد وحفظ</button> `}<button class="btn g" data-rev="${s}">مراجعة البصمة</button> <button class="btn r" data-del="${s}">حذف</button></td></tr>`};});
  rb.innerHTML=rows.reverse().map(r=>r.html).join("")||'<tr><td colspan="11" class="hint" style="padding:30px">لا توجد شهور محفوظة بعد. اسحب أول ملف بصمة للبدء.</td></tr>';
  const dz=$("#dz"),stop=e=>{e.preventDefault();e.stopPropagation();};
  ["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev,e=>{stop(e);dz.classList.add("over");}));
  ["dragleave","drop"].forEach(ev=>dz.addEventListener(ev,e=>{stop(e);dz.classList.remove("over");}));
  dz.addEventListener("drop",e=>{const f=e.dataTransfer&&e.dataTransfer.files;if(f&&f.length)repoImport(f);});
  $("#rkc").onclick=()=>{repoSave(cur());save();render();toast("تم حفظ تقرير "+periodName(cur()));};
  $("#rpb").onclick=()=>$("#rpf").click();$("#rpf").onchange=e=>{const f=[...e.target.files];e.target.value="";if(f.length)repoImport(f);};
  rb.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    if(b.dataset.open){repoOpen=b.dataset.open;repoTab="sum";render();}
    else if(b.dataset.xl){const sn=data.repo[b.dataset.xl].snap;act("export","تصدير كشف شهر "+periodName(sn.start));saveFile(`كشف-المرتبات-${sn.start}.xlsx`,payXlsx({rows:sn.rows,tot:sn.tot}));}
    else if(b.dataset.rev){data.settings.periodStart=b.dataset.rev;save();page="att";shell();render();}
    else if(b.dataset.ap2){const s=b.dataset.ap2;repoApplyDraft(s);repoSave(s,{applied:true});act("import","اعتماد شهر "+periodName(s)+" من المستودع");save();render();toast("تم الاعتماد وحفظ التقرير");}
    else if(b.dataset.del){const s=b.dataset.del;openModal(`<h3>حذف شهر من المستودع</h3><p>سيتم حذف تقرير وبيانات بصمة <b>${periodName(s)}</b> من المستودع. كشف المرتبات (الغياب والإضافي المسجلين) لا يتأثر. هل أنت متأكد؟</p><div class="bar"><button class="btn r" id="yes">نعم، احذف</button><button class="btn g" data-close>إلغاء</button></div>`,m=>m.querySelector("#yes").onclick=()=>{delete data.repo[s];delete data.att[s];act("edit","حذف شهر "+periodName(s)+" من المستودع");save();closeModal();render();});}
  });
}
function repoMonth(c,s){
  const m=repoMonths().find(x=>x.start===s),sn=m.snap,att=m.att;
  if(!sn){repoOpen=null;return pRepo(c);}
  const M=finFromSnap(sn),can=lvl("repo")>=2;
  c.innerHTML=`<div class="bar"><button class="btn g" id="bk" data-rook>→ رجوع للمستودع</button><h3 style="margin:0">${periodName(s)}</h3><button class="btn g" id="mp" title="الشهر السابق">◀</button><select class="fld" id="msel">${repoMonths().filter(x=>x.snap).reverse().map(x=>`<option value="${x.start}" ${x.start===s?"selected":""}>${periodName(x.start)}</option>`).join("")}</select><button class="btn g" id="mn" title="الشهر التالي">▶</button><span class="hint">${dshow(s)} ← ${dshow(sn.end)} | الملف: ${esc((m.repo&&m.repo.file)||"—")} | آخر حفظ: ${dshow(sn.at)}</span></div>
   <div class="kpis"><div class="kpi t"><small>إجمالي المستحقات</small><b>${nf(sn.tot.gross)}</b></div><div class="kpi"><small>الاستقطاعات</small><b>${nf(sn.tot.ded)}</b></div><div class="kpi g"><small>صافي المرتبات</small><b>${nf(sn.tot.net)}</b></div><div class="kpi"><small>المصاريف الإضافية</small><b>${nf(sn.exp.total)}</b></div></div>
   <div class="bar"><button class="btn ${repoTab==="sum"?"t":"g"}" data-tab="sum" data-rook>التقرير المالي</button><button class="btn ${repoTab==="pay"?"t":"g"}" data-tab="pay" data-rook>كشف المرتبات</button><button class="btn ${repoTab==="att"?"t":"g"}" data-tab="att" data-rook>الحضور والبصمة</button><div class="sp"></div>
    <button class="btn g" id="rx" data-rook>${ICON.xl} كشف Excel</button><button class="btn g" id="rfx" data-rook>${ICON.xl} التقرير المالي Excel</button><button class="btn g" id="rpr" data-rook>${ICON.print} طباعة</button><button class="btn g" id="rup">↻ تحديث التقرير من البيانات الحالية</button></div>
   <div id="rtab"></div>`;
  const tab=$("#rtab");
  if(repoTab==="sum")tab.innerHTML=`<div class="card finrep">${finHTML(M)}</div>`;
  else if(repoTab==="pay"){const t=sn.tot,K=[["idx","م"],["id","الكود"],["name","الاسم"],["dept","القسم"],["present","أيام الحضور"],["absent","غياب"],["otMin","إضافي (د)"],["deficitMin","عجز (د)"],["fridayMin","جمعة (د)"],["basic","الأجر المستحق"],["otAmt","الإضافي"],["friday","إضافي الجمعة"],["bonus","مكافآت"],["gross","الإجمالي"],["adv","السلف"],["pen","جزاءات"],["deficit","خصم العجز"],["ded","إجمالي الخصومات"],["net","الصافي"]];
    tab.innerHTML=`<div class="tablewrap"><table><thead><tr>${K.map(([k,l])=>`<th>${l}</th>`).join("")}</tr></thead><tbody>${sn.rows.map(r=>`<tr>${K.map(([k])=>`<td class="${["name","dept"].includes(k)?"l":["idx","id","present","absent","otMin","deficitMin","fridayMin"].includes(k)?"":"n"}${k==="net"?" net":""}">${k==="name"?esc(r.w.name):k==="dept"?esc(r.dept):k==="id"?esc(r.id):["idx","present","absent","otMin","deficitMin","fridayMin"].includes(k)?(r[k]||0):nf(r[k])}</td>`).join("")}</tr>`).join("")}</tbody><tfoot><tr class="tot">${K.map(([k],i)=>`<td class="${i<2?"":"n"}">${i===2?"الإجمالي ("+sn.rows.length+")":t[k]!==undefined&&!["idx"].includes(k)?(["present","absent","otMin","deficitMin","fridayMin"].includes(k)?t[k]:nf(t[k])):""}</td>`).join("")}</tr></tfoot></table></div>`;}
  else{
    if(!att||!att.rows)tab.innerHTML='<div class="card hint">لا توجد بيانات بصمة محفوظة لهذا الشهر.</div>';
    else{const wm={};sn.rows.forEach(r=>wm[r.id]=r);
      tab.innerHTML=`<div class="hint" style="margin-bottom:8px">الفترة في الملف: ${dshow(att.from)} ← ${dshow(att.to)} | أيام العمل: ${att.workDates.length}${att.unknown.length?` | أكواد غير موجودة: ${att.unknown.map(u=>esc(u.code)).join("، ")}`:""}. اضغط على الاسم لعرض الحضور اليومي.</div>
      <div class="tablewrap"><table><thead><tr><th>الكود</th><th class="l">الاسم</th><th>أيام الحضور</th><th>الغياب</th><th>العجز (دقيقة)</th><th>الإضافي (دقيقة)</th></tr></thead><tbody>${att.rows.filter(r=>r.inFile).map(r=>{const d=att.draft[r.id]||{};return `<tr><td>${esc(r.id)}</td><td class="l"><a href="#" class="nm" data-id="${esc(r.id)}">${esc(r.name)}</a></td><td>${r.present}</td><td>${d.absent||0}</td><td>${d.deficitMin||0}</td><td>${d.otMin||0}</td></tr>`;}).join("")}</tbody></table></div>`;}}
  c.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{repoTab=b.dataset.tab;render();});
  $("#bk").onclick=()=>{repoOpen=null;render();};
  {const ks=repoMonths().filter(x=>x.snap).map(x=>x.start),i=ks.indexOf(s),go=k=>{repoOpen=k;render();};$("#msel").onchange=e=>go(e.target.value);
   $("#mp").onclick=()=>{if(i>0)go(ks[i-1]);else toast("لا يوجد شهر أقدم");};$("#mn").onclick=()=>{if(i<ks.length-1)go(ks[i+1]);else toast("لا يوجد شهر أحدث");};}
  $("#rx").onclick=()=>{act("export","تصدير كشف شهر "+periodName(s));saveFile(`كشف-المرتبات-${s}.xlsx`,payXlsx({rows:sn.rows,tot:sn.tot}));};
  $("#rfx").onclick=()=>{act("export","تصدير التقرير المالي لشهر "+periodName(s));saveFile(`التقرير-المالي-${s}.xlsx`,finXlsx(M));};
  $("#rpr").onclick=()=>{act("print","طباعة تقرير شهر "+periodName(s));$("#printArea").innerHTML=`<div class="pg p1">${finHTML(M)}</div>`;setTimeout(()=>window.print(),150);};
  $("#rup").onclick=()=>{if(!can)return;openModal(`<h3>تحديث تقرير ${periodName(s)}</h3><p>سيُعاد حساب تقرير هذا الشهر من البيانات الحالية (الأجور، السلف، المصاريف، كشف المرتبات). هل تريد المتابعة؟</p><div class="bar"><button class="btn t" id="yes">تحديث</button><button class="btn g" data-close>إلغاء</button></div>`,mm=>mm.querySelector("#yes").onclick=()=>{repoSave(s);act("edit","تحديث تقرير "+periodName(s));save();closeModal();render();toast("تم تحديث التقرير");});};
  c.querySelectorAll(".nm").forEach(a=>a.onclick=e=>{e.preventDefault();attDetail(a.dataset.id,s);});
}

/* ---------- المستخدمون وتسجيل الدخول والصلاحيات ---------- */
let me=null,loginFails=0,lockUntil=0;
const PERM_PAGES=[["dash","لوحة المرتبات"],["pay","كشف المرتبات"],["att","استيراد البصمة والحضور"],["repo","مستودع التقارير"],["slips","قسائم الرواتب"],["workers","العمال"],["txns","السلف والخصومات"],["exp","المصاريف الإضافية"],["buy","المشتريات"],["cash","الخزينة"],["fin","التقرير المالي"],["settings","الإعدادات"]];
const PERM_NAMES=["بدون صلاحية","عرض فقط","عرض وتعديل"];
const lvl=p=>!me?0:me.admin?2:p==="users"||p==="dev"?0:((me.perms&&me.perms[p])|0);
const allowedPages=()=>PAGES.filter(p=>lvl(p[0])>0).map(p=>p[0]);
const b64e=u=>{let s="";u.forEach(x=>s+=String.fromCharCode(x));return btoa(s);},b64d=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function hashPw(pw,salt){
  if(!(window.crypto&&crypto.subtle))throw new Error("المتصفح لا يدعم التشفير المطلوب لكلمات المرور.");
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveBits"]);
  return b64e(new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",salt:b64d(salt),iterations:150000,hash:"SHA-256"},key,256)));
}
const newSalt=()=>b64e(crypto.getRandomValues(new Uint8Array(16)));
const uid=()=>"u"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function refreshMe(){if(!me)return false;me=data.users.find(u=>u.id===me.id)||null;return !!me;}
async function authScreen(mode,msg){
  me=null;closeModal();$("#printArea").innerHTML="";
  const setup=mode==="setup";
  let ci={available:false,last:"",saved:[]};
  if(!setup&&NATIVE&&NATIVE.credInfo){try{ci=await NATIVE.credInfo();}catch(e){}}
  const selId=(data.users.find(u=>u.id===ci.last&&!u.disabled)||data.users.find(u=>!u.disabled)||data.users[0]||{}).id;
  if(NATIVE&&NATIVE.sync){try{SY.st=SY.st||await NATIVE.sync("state");}catch(e){}}
  $("#app").innerHTML=`<div class="auth"><div class="authbox"><div class="logo">م</div><h2>${esc(data.settings.company)}</h2><p class="hint">${setup?"أنشئ حساب المدير الأول. المدير هو من يضيف المستخدمين ويحدد صلاحياتهم.":"سجّل الدخول للمتابعة"}</p>
   ${setup?'<label>الاسم<input class="fld" id="au_name" autocomplete="off"></label><label>اسم المستخدم<input class="fld" id="au_user" autocomplete="username" autocapitalize="off"></label>'
     :`<label>المستخدم<select class="fld" id="au_user">${data.users.map(u=>`<option value="${esc(u.id)}" ${u.id===selId?"selected":""}>${esc(u.name)} (${esc(u.username)})${u.disabled?" — موقوف":""}</option>`).join("")}</select></label>`}
   <label>كلمة المرور<input class="fld" id="au_pw" type="password" autocomplete="${setup?"new-password":"current-password"}"></label>
   ${setup?'<label>تأكيد كلمة المرور<input class="fld" id="au_pw2" type="password" autocomplete="new-password"></label><label>البريد الإلكتروني (لاسترداد كلمة المرور — اختياري)<input class="fld" id="au_mail" type="email" autocomplete="off" dir="ltr"></label>':""}
   ${!setup&&ci.available?'<label class="chk"><input type="checkbox" id="au_rm"> حفظ كلمة المرور على هذا الجهاز</label>':""}
   <div class="alert" id="au_err" style="display:none"></div>
   <button class="btn t big" id="au_go" style="width:100%;justify-content:center;margin-top:8px">${setup?"إنشاء الحساب والدخول":"دخول"}</button>
   ${setup&&NATIVE&&NATIVE.sync?'<button class="btn g" id="au_join" style="width:100%;justify-content:center">ربط هذا الجهاز بنظام موجود (مجلد مشترك)</button>':""}
   ${setup?"":'<a href="#" id="au_fg" class="hint" style="text-decoration:underline;cursor:pointer">نسيت كلمة المرور؟</a>'}</div></div>`;
  const err=m=>{const e=$("#au_err");e.textContent=m;e.style.display=m?"block":"none";};
  if(msg)err(msg);
  if(setup&&$("#au_join"))$("#au_join").onclick=joinDialog;
  const loadSaved=async()=>{
    const id=$("#au_user").value,rm=$("#au_rm");if(!rm)return;
    if(ci.saved.includes(id)){const pw=await NATIVE.credGet(id);if(pw){$("#au_pw").value=pw;rm.checked=true;return;}}
    $("#au_pw").value="";rm.checked=false;};
  const go=async()=>{
    try{
      const pw=$("#au_pw").value;
      if(setup){
        const nm=$("#au_name").value.trim(),un=$("#au_user").value.trim(),mail=$("#au_mail").value.trim();
        if(!nm||!un)return err("اكتب الاسم واسم المستخدم.");if(pw.length<4)return err("كلمة المرور 4 أحرف على الأقل.");if(pw!==$("#au_pw2").value)return err("تأكيد كلمة المرور غير مطابق.");
        if(mail&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail))return err("البريد الإلكتروني غير صحيح.");
        const salt=newSalt(),u={id:uid(),name:nm,username:un,email:mail,salt,hash:await hashPw(pw,salt),admin:true,perms:{}};
        data.users.push(u);save();flush();enter(u);return;
      }
      const now=Date.now();if(now<lockUntil)return err(`محاولات كثيرة خاطئة. انتظر ${Math.ceil((lockUntil-now)/1000)} ثانية.`);
      const u=data.users.find(x=>x.id===$("#au_user").value);
      if(u&&u.disabled)return err("هذا الحساب موقوف بواسطة المدير.");
      const ok=u&&(await hashPw(pw,u.salt))===u.hash;
      if(!ok){loginFails++;if(loginFails>=5){lockUntil=Date.now()+30000;loginFails=0;}act2("fail","محاولة دخول فاشلة للمستخدم "+(u?u.username:""));return err("كلمة المرور غير صحيحة.");}
      loginFails=0;
      if(NATIVE&&NATIVE.credSet){try{const rm=$("#au_rm");if(rm&&rm.checked)await NATIVE.credSet(u.id,pw);else{await NATIVE.credDel(u.id);await NATIVE.credLast(u.id);}}catch(e){}}
      enter(u);
    }catch(e){err(e.message);}
  };
  $("#au_go").onclick=go;$("#app").onkeydown=e=>{if(e.key==="Enter")go();};
  if(!setup){$("#au_user").onchange=loadSaved;loadSaved();$("#au_fg").onclick=e=>{e.preventDefault();forgotPw($("#au_user").value);};}
  setTimeout(()=>{const f=$(setup?"#au_name":(($("#au_pw").value)?"#au_go":"#au_pw"));if(f)f.focus();},50);
}
/* ---------- استرداد كلمة المرور بكود على البريد ---------- */
let rec=null,recSends=[];
const maskMail=s=>{const [a,b]=String(s).split("@");return (a.slice(0,2)+"***@"+b);};
function recipientOf(u,mc){return u.email||(u.admin&&mc&&mc.user)||"";}
async function forgotPw(selId){
  let mc=null;if(NATIVE&&NATIVE.mailCfg){try{mc=await NATIVE.mailCfg();}catch(e){}}
  const step1=()=>{
    openModal(`<h3>استرداد كلمة المرور</h3><p class="hint">سيصل كود من 6 أرقام على البريد الإلكتروني المسجّل للمستخدم (صالح 10 دقائق).</p>
     <label class="hint">المستخدم<select class="fld" id="fg_u" style="width:100%">${data.users.map(u=>`<option value="${esc(u.id)}" ${u.id===selId?"selected":""}>${esc(u.name)} (${esc(u.username)})</option>`).join("")}</select></label>
     <div class="hint" id="fg_info" style="margin:10px 0"></div><div class="alert" id="fg_err" style="display:none"></div>
     <div class="bar" style="margin-top:12px"><button class="btn t" id="fg_send">إرسال الكود</button><button class="btn g" data-close>إلغاء</button></div>`,m=>{
      const q=s=>m.querySelector(s),cu=()=>data.users.find(x=>x.id===q("#fg_u").value);
      const info=()=>{const u=cu(),r=recipientOf(u,mc);q("#fg_info").textContent=!(mc&&mc.ok)?"لم يُربط حساب بريد بالبرنامج بعد، لذلك لا يمكن الإرسال. اطلب من المدير تعيين كلمة مرور جديدة من «المستخدمون والصلاحيات».":r?`سيُرسل الكود إلى: ${maskMail(r)}`:"لا يوجد بريد مسجّل لهذا المستخدم. اطلب من المدير إضافته أو تعيين كلمة مرور جديدة.";q("#fg_send").disabled=!(mc&&mc.ok&&r);};
      q("#fg_u").onchange=info;info();
      q("#fg_send").onclick=async()=>{
        const u=cu(),r=recipientOf(u,mc),e=t=>{q("#fg_err").textContent=t;q("#fg_err").style.display="block";};
        recSends=recSends.filter(t=>Date.now()-t<900000);if(recSends.length>=3)return e("تم طلب أكواد كثيرة. حاول بعد 15 دقيقة.");
        const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,"0");
        q("#fg_send").disabled=true;q("#fg_send").textContent="جارٍ الإرسال…";
        const res=await NATIVE.mailSend({to:[r],subject:`كود استرداد كلمة المرور — ${data.settings.company}`,text:`كود استرداد كلمة المرور للمستخدم «${u.username}» في برنامج ${data.settings.company}:\n\n${code}\n\nالكود صالح لمدة 10 دقائق. إذا لم تطلب هذا الكود فتجاهل الرسالة.`,attachments:[]});
        q("#fg_send").textContent="إرسال الكود";q("#fg_send").disabled=false;
        if(!res.ok)return e(res.error);
        recSends.push(Date.now());rec={uid:u.id,code,exp:Date.now()+600000,tries:0};step2(u,r);};
    });};
  const step2=(u,r)=>openModal(`<h3>أدخل الكود وكلمة المرور الجديدة</h3><p class="hint">أُرسل الكود إلى ${esc(maskMail(r))}</p>
    <div class="form" style="grid-template-columns:1fr"><label>الكود (6 أرقام)<input class="fld" id="rc_code" inputmode="numeric" maxlength="6" dir="ltr"></label><label>كلمة المرور الجديدة<input class="fld" type="password" id="rc_p1" autocomplete="new-password"></label><label>تأكيد كلمة المرور<input class="fld" type="password" id="rc_p2" autocomplete="new-password"></label></div>
    <div class="alert" id="rc_err" style="display:none;margin-top:8px"></div><div class="bar" style="margin-top:12px"><button class="btn t" id="rc_ok">تغيير كلمة المرور</button><button class="btn g" data-close>إلغاء</button></div>`,m=>{
      const q=s=>m.querySelector(s),e=t=>{q("#rc_err").textContent=t;q("#rc_err").style.display="block";};
      q("#rc_ok").onclick=async()=>{
        if(!rec||Date.now()>rec.exp)return e("انتهت صلاحية الكود. اطلب كوداً جديداً.");
        if(q("#rc_code").value.trim()!==rec.code){rec.tries++;if(rec.tries>=5){rec=null;return e("محاولات كثيرة. اطلب كوداً جديداً.");}return e("الكود غير صحيح.");}
        const n=q("#rc_p1").value;if(n.length<4)return e("كلمة المرور 4 أحرف على الأقل.");if(n!==q("#rc_p2").value)return e("التأكيد غير مطابق.");
        u.salt=newSalt();u.hash=await hashPw(n,u.salt);rec=null;save();flush();
        try{await NATIVE.credDel(u.id);}catch(x){}
        closeModal();authScreen("login");setTimeout(()=>toast("تم تغيير كلمة المرور. سجّل الدخول بها."),100);};
    });
  step1();
}
function enter(u){
  me=u;sessionSeq=((data.control&&data.control.logoutSeq||{})[u.id])|0;snapStr=snapOf(data);act("login","تسجيل دخول");$("#app").onkeydown=null;const ok=allowedPages();page=ok.includes("dash")?"dash":(ok[0]||"dash");shell();render();
}
function logout(reason){act("logout",typeof reason==="string"?reason:"تسجيل خروج");flush();authScreen("login",typeof reason==="string"?reason:"");}
function meMenu(){
  openModal(`<h3>${esc(me.name)}</h3><p class="hint">${me.admin?"مدير النظام":"مستخدم"} — ${esc(me.username)}</p><div class="bar"><button class="btn g" id="cpw">تغيير كلمة المرور</button><button class="btn r" id="lo2">تسجيل الخروج</button><button class="btn g" data-close>إغلاق</button></div>`,m=>{
    m.querySelector("#lo2").onclick=logout;
    m.querySelector("#cpw").onclick=()=>openModal(`<h3>تغيير كلمة المرور</h3><div class="form" style="grid-template-columns:1fr"><label>كلمة المرور الحالية<input class="fld" type="password" id="p0"></label><label>الجديدة<input class="fld" type="password" id="p1"></label><label>تأكيد الجديدة<input class="fld" type="password" id="p2"></label></div><div class="alert" id="pe" style="display:none;margin-top:8px"></div><div class="bar" style="margin-top:14px"><button class="btn t" id="ps">حفظ</button><button class="btn g" data-close>إلغاء</button></div>`,m2=>m2.querySelector("#ps").onclick=async()=>{
      const e=t=>{const x=m2.querySelector("#pe");x.textContent=t;x.style.display="block";};
      const u=data.users.find(x=>x.id===me.id),n=m2.querySelector("#p1").value;
      if((await hashPw(m2.querySelector("#p0").value,u.salt))!==u.hash)return e("كلمة المرور الحالية غير صحيحة.");
      if(n.length<4)return e("كلمة المرور الجديدة 4 أحرف على الأقل.");if(n!==m2.querySelector("#p2").value)return e("التأكيد غير مطابق.");
      u.salt=newSalt();u.hash=await hashPw(n,u.salt);if(NATIVE&&NATIVE.credDel)try{await NATIVE.credDel(u.id);}catch(x){}save();closeModal();act("pw","تغيير كلمة مروره");toast("تم تغيير كلمة المرور");});
  });
}
/* عرض فقط: تعطيل كل أدوات التعديل في الصفحة مع إبقاء البحث والتصدير والطباعة */
const RO_OK=["q","dp","xall","all","xl","goxl","fx","fp","ppdf","goprint","em","pem"];
function applyRO(c){
  if(lvl(page)!==1||page==="slips")return;
  c.querySelectorAll("input,select,textarea,button").forEach(el=>{if(RO_OK.includes(el.id)||el.hasAttribute("data-close")||el.hasAttribute("data-rook"))return;el.disabled=true;});
  const b=document.createElement("div");b.className="alert";b.style.cssText="background:#eef2ff;color:#3730a3;border-color:#c7d2fe";b.textContent="صلاحيتك في هذه الصفحة: عرض فقط.";c.prepend(b);
}
function permSummary(u){if(u.admin)return "كل الصلاحيات (مدير)";const p=PERM_PAGES.filter(x=>(u.perms||{})[x[0]]>0).map(x=>`${x[1]}${u.perms[x[0]]===2?"":" (عرض)"}`);return p.length?p.join("، "):"لا صلاحيات";}
function pUsers(c){
  const admins=data.users.filter(u=>u.admin).length;
  c.innerHTML=`<div class="bar"><button class="btn t" id="ua">${ICON.plus} مستخدم جديد</button><span class="hint">المدير يرى كل شيء ويدير المستخدمين. بقية المستخدمين يرون الصفحات التي تحددها لهم فقط، إما للعرض أو للتعديل.</span></div>
  <div class="tablewrap"><table><thead><tr><th class="l">الاسم</th><th>اسم المستخدم</th><th>البريد (للاسترداد)</th><th>النوع</th><th class="l">الصلاحيات</th><th></th></tr></thead><tbody>${data.users.map(u=>`<tr><td class="l"><b>${esc(u.name)}</b></td><td>${esc(u.username)}</td><td dir="ltr">${esc(u.email||"—")}</td><td>${u.admin?'<span class="badge ok">مدير</span>':"مستخدم"}${u.disabled?' <span class="badge">موقوف</span>':""}</td><td class="l" style="white-space:normal;max-width:520px">${esc(permSummary(u))}</td><td><button class="btn g" data-ed="${u.id}">تعديل</button> ${u.id===me.id?"":`<button class="btn g" data-dis="${u.id}">${u.disabled?"تفعيل":"إيقاف"}</button> <button class="btn g" data-ko="${u.id}">إخراج الآن</button>`} <button class="btn r" data-rm="${u.id}">حذف</button></td></tr>`).join("")}</tbody></table></div>
  <div class="hint" style="margin-top:12px;line-height:1.9">ملاحظة: الصلاحيات تحمي واجهة البرنامج. ملف البيانات نفسه على الجهاز غير مشفّر، فاحتفظ بالجهاز في مكان آمن. إذا نسيت كلمة مرور المدير الوحيد لا توجد طريقة لاسترجاعها، لذلك أنشئ مديراً ثانياً.</div>`;
  $("#ua").onclick=()=>userForm(null);
  c.querySelectorAll("[data-dis]").forEach(b=>b.onclick=()=>{const u=data.users.find(x=>x.id===b.dataset.dis);if(!u.disabled&&u.admin&&data.users.filter(x=>x.admin&&!x.disabled).length<2)return toast("لا يمكن إيقاف آخر مدير");u.disabled=!u.disabled;act("user",(u.disabled?"إيقاف الحساب: ":"تفعيل الحساب: ")+u.username);save();syncSoon();render();toast(u.disabled?"تم إيقاف الحساب":"تم تفعيل الحساب");});
  c.querySelectorAll("[data-ko]").forEach(b=>b.onclick=()=>{const u=data.users.find(x=>x.id===b.dataset.ko),cl=data.control;cl.logoutSeq[u.id]=((cl.logoutSeq[u.id]|0)+1);act("control","إخراج المستخدم "+u.username+" من كل الأجهزة");save();syncSoon();toast("سيتم إخراجه خلال ثوانٍ");});
  c.querySelectorAll("[data-ed]").forEach(b=>b.onclick=()=>userForm(data.users.find(u=>u.id===b.dataset.ed)));
  c.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{const u=data.users.find(x=>x.id===b.dataset.rm);
    if(u.id===me.id)return toast("لا يمكنك حذف حسابك وأنت مسجّل به");if(u.admin&&admins<2)return toast("لا يمكن حذف آخر مدير");
    openModal(`<h3>حذف المستخدم</h3><p>سيتم حذف <b>${esc(u.name)}</b> نهائياً. هل أنت متأكد؟</p><div class="bar"><button class="btn r" id="yes">نعم، احذف</button><button class="btn g" data-close>إلغاء</button></div>`,m=>m.querySelector("#yes").onclick=()=>{act("user","حذف حساب: "+u.username);data.users=data.users.filter(x=>x.id!==u.id);if(NATIVE&&NATIVE.credDel)NATIVE.credDel(u.id);save();closeModal();render();});});
}
function userForm(u){
  const isNew=!u,perms={...(u&&u.perms||{})};
  openModal(`<h3>${isNew?"مستخدم جديد":"تعديل: "+esc(u.name)}</h3><div class="form" style="grid-template-columns:1fr 1fr">
   <label>الاسم<input class="fld" id="f_name" value="${esc(u?u.name:"")}"></label><label>اسم المستخدم<input class="fld" id="f_user" autocapitalize="off" value="${esc(u?u.username:"")}"></label>
   <label>البريد الإلكتروني (لاسترداد كلمة المرور)<input class="fld" id="f_mail" type="email" dir="ltr" value="${esc(u&&u.email||"")}"></label>
   <label>${isNew?"كلمة المرور":"كلمة مرور جديدة (اتركها فارغة لعدم التغيير)"}<input class="fld" type="password" id="f_pw" autocomplete="new-password"></label>
   <label style="flex-direction:row;align-items:center;gap:8px;margin-top:20px"><input type="checkbox" id="f_admin" ${u&&u.admin?"checked":""}> مدير (كل الصلاحيات وإدارة المستخدمين)</label></div>
   <div id="pm" style="margin-top:14px"><div class="bar"><b>الصلاحيات حسب الصفحة</b><button class="btn g" id="pa">الكل: تعديل</button><button class="btn g" id="pv">الكل: عرض</button><button class="btn g" id="pn0">مسح</button></div>
   <table style="margin-top:6px"><tbody>${PERM_PAGES.map(([k,n])=>`<tr><td class="l">${n}</td><td><select class="cell m" data-pp="${k}">${PERM_NAMES.map((t,i)=>`<option value="${i}" ${((perms[k])|0)===i?"selected":""}>${t}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div>
   <div class="alert" id="fe" style="display:none;margin-top:8px"></div>
   <div class="bar" style="margin-top:14px"><button class="btn t" id="fs">حفظ</button><button class="btn g" data-close>إلغاء</button></div>`,m=>{
    const q=s=>m.querySelector(s),setAll=v=>m.querySelectorAll("[data-pp]").forEach(s=>s.value=v),tg=()=>q("#pm").style.display=q("#f_admin").checked?"none":"block";
    q("#f_admin").onchange=tg;tg();q("#pa").onclick=()=>setAll(2);q("#pv").onclick=()=>setAll(1);q("#pn0").onclick=()=>setAll(0);
    q("#fs").onclick=async()=>{
      const e=t=>{q("#fe").textContent=t;q("#fe").style.display="block";};
      const name=q("#f_name").value.trim(),un=q("#f_user").value.trim(),pw=q("#f_pw").value,adm=q("#f_admin").checked,mail=q("#f_mail").value.trim();
      if(mail&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail))return e("البريد الإلكتروني غير صحيح.");
      if(!name||!un)return e("اكتب الاسم واسم المستخدم.");
      if(data.users.some(x=>x.id!==(u&&u.id)&&x.username.toLowerCase()===un.toLowerCase()))return e("اسم المستخدم مستخدم بالفعل.");
      if(isNew&&pw.length<4)return e("كلمة المرور 4 أحرف على الأقل.");if(!isNew&&pw&&pw.length<4)return e("كلمة المرور 4 أحرف على الأقل.");
      if(u&&u.admin&&!adm&&data.users.filter(x=>x.admin).length<2)return e("لا يمكن إلغاء آخر مدير.");
      const np={};m.querySelectorAll("[data-pp]").forEach(s=>{if(+s.value>0)np[s.dataset.pp]=+s.value;});
      const t=u||{id:uid()};t.name=name;t.username=un;t.email=mail;t.admin=adm;t.perms=adm?{}:np;
      if(pw){t.salt=newSalt();t.hash=await hashPw(pw,t.salt);if(NATIVE&&NATIVE.credDel)try{await NATIVE.credDel(t.id);}catch(x){}}
      if(isNew)data.users.push(t);act("user",(isNew?"إضافة حساب: ":"تعديل حساب: ")+t.username+(adm?" (مدير)":""));save();closeModal();
      if(!refreshMe())return logout();
      if(lvl(page)<1)page=allowedPages()[0]||"dash";shell();render();toast("تم الحفظ");};
  });
}

/* ---------- إرسال التقارير بالبريد ---------- */
const bytesB64=u=>{let s="";for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);};
const MIME={xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",pdf:"application/pdf"};
async function emailDialog(o){ // o:{subject,body,files:[{name,make}]}
  if(!NATIVE||!NATIVE.mailSend)return toast("الإرسال بالبريد متاح في نسخة الويندوز.");
  let mc=null;try{mc=await NATIVE.mailCfg();}catch(e){}
  if(!mc||!mc.ok)return openModal(`<h3>حساب البريد غير مربوط</h3><p>اربط حساب البريد أولاً من <b>الإعدادات ← البريد الإلكتروني</b>${me&&me.admin?"":" (يحتاج صلاحية المدير)"}.</p><div class="bar">${me&&me.admin?'<button class="btn t" id="gs">فتح الإعدادات</button>':""}<button class="btn g" data-close>إغلاق</button></div>`,m=>{const b=m.querySelector("#gs");if(b)b.onclick=()=>{closeModal();page="settings";render();};});
  openModal(`<h3>إرسال بالبريد الإلكتروني</h3><div class="form" style="grid-template-columns:1fr">
    <label>إلى (افصل بين العناوين بفاصلة)<input class="fld" id="em_to" dir="ltr" value="${esc((data.settings.mailTo||[]).join(", "))}"></label>
    <label>العنوان<input class="fld" id="em_sub" value="${esc(o.subject)}"></label>
    <label>نص الرسالة<textarea class="fld" id="em_body" rows="4">${esc(o.body||"")}</textarea></label></div>
    <div style="margin-top:8px"><b class="hint">المرفقات</b>${o.files.map((f,i)=>`<label class="chk" style="display:flex;gap:8px;margin-top:4px"><input type="checkbox" data-f="${i}" checked> ${esc(f.name)}</label>`).join("")}</div>
    <div class="hint" style="margin-top:8px">سيُرسل من: ${esc(mc.user)}</div><div class="alert" id="em_err" style="display:none;margin-top:8px"></div>
    <div class="bar" style="margin-top:12px"><button class="btn t" id="em_go">إرسال</button><button class="btn g" data-close>إلغاء</button></div>`,m=>{
    const q=s=>m.querySelector(s),e=t=>{q("#em_err").textContent=t;q("#em_err").style.display=t?"block":"none";};
    q("#em_go").onclick=async()=>{
      const to=q("#em_to").value.split(/[,;\s]+/).map(s=>s.trim()).filter(Boolean);
      if(!to.length||to.some(a=>!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a)))return e("اكتب عنوان بريد صحيح (أو أكثر).");
      q("#em_go").disabled=true;q("#em_go").textContent="جارٍ التجهيز والإرسال…";e("");
      try{
        const att=[];for(const cb of m.querySelectorAll("[data-f]")){if(!cb.checked)continue;const f=o.files[+cb.dataset.f],r=await f.make(),u=r instanceof Blob?new Uint8Array(await r.arrayBuffer()):new Uint8Array(r);att.push({name:f.name,type:MIME[f.name.split(".").pop()]||"application/octet-stream",b64:bytesB64(u)});}
        const res=await NATIVE.mailSend({to,subject:q("#em_sub").value,text:q("#em_body").value,attachments:att});
        if(!res.ok){q("#em_go").disabled=false;q("#em_go").textContent="إرسال";return e(res.error);}
        data.settings.mailTo=to;act("export","إرسال بالبريد: "+q("#em_sub").value+" إلى "+to.join("، "));save();closeModal();toast("تم إرسال الرسالة ✓");
      }catch(x){q("#em_go").disabled=false;q("#em_go").textContent="إرسال";e("تعذّر التجهيز: "+x.message);}
    };
  });
}
const pdfOf=html=>async()=>{$("#printArea").innerHTML=html;await new Promise(r=>setTimeout(r,200));const b=await NATIVE.pdfBuffer();$("#printArea").innerHTML="";return b;};
function emailPay(){const R=calc();emailDialog({subject:`كشف المرتبات ${dshow(R.start)} - ${dshow(R.end)} — ${data.settings.company}`,body:`مرفق كشف المرتبات عن الفترة من ${dshow(R.start)} إلى ${dshow(R.end)}.\nإجمالي صافي المرتبات: ${nf(R.tot.net)}`,files:[{name:`كشف-المرتبات-${R.start}.xlsx`,make:async()=>payXlsx()}]});}
function emailFin(){const M=finModel();emailDialog({subject:`التقرير المالي ${dshow(M.R.start)} - ${dshow(M.R.end)} — ${data.settings.company}`,body:`مرفق التقرير المالي عن الفترة من ${dshow(M.R.start)} إلى ${dshow(M.R.end)}.\nصافي المرتبات: ${nf(M.t.net)}\nالمصاريف الإضافية: ${nf(M.X.total)}\nإجمالي التكلفة: ${nf(M.cost)}`,
  files:[{name:`التقرير-المالي-${M.R.start}.pdf`,make:pdfOf(`<div class="pg p1">${finHTML(M)}</div>`)},{name:`التقرير-المالي-${M.R.start}.xlsx`,make:async()=>finXlsx(M)}]});}
function emailSlips(list,R,per,dup){
  emailDialog({subject:`قسائم الرواتب ${dshow(R.start)} - ${dshow(R.end)} — ${data.settings.company}`,body:`مرفق قسائم الرواتب (${list.length} عامل) عن الفترة من ${dshow(R.start)} إلى ${dshow(R.end)}.`,files:[{name:`قسائم-الرواتب-${R.start}.pdf`,make:pdfOf(withExp(slipPages(list,R,per,dup),R))}]});}
/* بطاقة ربط البريد في الإعدادات */
const MAIL_PRESETS={gmail:["smtp.gmail.com",465,"ssl"],outlook:["smtp-mail.outlook.com",587,"starttls"],yahoo:["smtp.mail.yahoo.com",465,"ssl"],custom:["",465,"ssl"]};
function mailCardHTML(){return `<div class="card${me&&me.admin?"":" nodisp"}" id="mailcard"><h3>البريد الإلكتروني (استرداد كلمة المرور وإرسال التقارير)</h3>
  ${NATIVE?`<div class="form"><label>نوع الحساب<select class="fld" id="mc_p"><option value="gmail">Gmail</option><option value="outlook">Outlook / Hotmail</option><option value="yahoo">Yahoo</option><option value="custom">سيرفر آخر (SMTP)</option></select></label>
   <label>البريد (حساب الإرسال)<input class="fld" id="mc_u" type="email" dir="ltr"></label>
   <label>كلمة مرور التطبيق (App Password)<input class="fld" id="mc_pw" type="password" autocomplete="new-password" dir="ltr" placeholder=""></label>
   <label>اسم المرسل الظاهر<input class="fld" id="mc_n" placeholder="${esc(data.settings.company)}"></label>
   <label>سيرفر SMTP<input class="fld" id="mc_h" dir="ltr"></label><label>المنفذ<input class="fld" id="mc_po" type="number" dir="ltr"></label>
   <label>التشفير<select class="fld" id="mc_s"><option value="ssl">SSL (465)</option><option value="starttls">STARTTLS (587)</option></select></label>
   <label>المستلمون الافتراضيون للتقارير<input class="fld" id="mc_to" dir="ltr" placeholder="owner@example.com, accountant@example.com"></label></div>
   <div class="bar" style="margin-top:12px"><button class="btn t" id="mc_save">حفظ الربط</button><button class="btn g" id="mc_test">إرسال رسالة تجريبية</button><span class="hint" id="mc_st"></span></div>
   <div class="hint" style="line-height:1.9;margin-top:8px">لـ Gmail: فعّل «التحقق بخطوتين» في حساب Google ثم أنشئ «كلمة مرور التطبيق» من إعدادات الأمان وضعها هنا (وليس كلمة مرور الجيميل العادية). كلمة المرور تُحفظ مشفّرة بحساب ويندوز على هذا الجهاز فقط ولا تدخل في النسخ الاحتياطية.
   هذا البريد يُستخدم لإرسال أكواد استرداد كلمة المرور (لبريد كل مستخدم المسجّل في صفحة المستخدمين، وللمدير الذي بلا بريد يُرسل لهذا البريد نفسه) ولإرسال التقارير.</div>`
  :'<div class="hint">ربط البريد متاح في نسخة الويندوز.</div>'}</div>`;}
async function mailCardInit(c){
  if(!NATIVE||!$("#mc_p"))return;const g=id=>c.querySelector("#"+id);
  const cfg=await NATIVE.mailCfg();g("mc_p").value=cfg.provider||"gmail";g("mc_u").value=cfg.user;g("mc_n").value=cfg.fromName;g("mc_h").value=cfg.host||MAIL_PRESETS[cfg.provider||"gmail"][0];g("mc_po").value=cfg.port;g("mc_s").value=cfg.secure;
  g("mc_pw").placeholder=cfg.hasPass?"•••••••• (محفوظة — اتركها فارغة لعدم التغيير)":"16 حرف من Google";g("mc_to").value=(data.settings.mailTo||[]).join(", ");g("mc_st").textContent=cfg.ok?"✓ الحساب مربوط":"غير مربوط";
  g("mc_p").onchange=()=>{const p=MAIL_PRESETS[g("mc_p").value];if(g("mc_p").value!=="custom"){g("mc_h").value=p[0];g("mc_po").value=p[1];g("mc_s").value=p[2];}};
  const saveCfg=async()=>{const to=g("mc_to").value.split(/[,;\s]+/).map(s=>s.trim()).filter(Boolean);data.settings.mailTo=to;save();
    return NATIVE.mailSet({provider:g("mc_p").value,host:g("mc_h").value,port:g("mc_po").value,secure:g("mc_s").value,user:g("mc_u").value,fromName:g("mc_n").value},g("mc_pw").value);};
  g("mc_save").onclick=async()=>{const r=await saveCfg();if(!r.ok)return toast(r.error);g("mc_pw").value="";const n=await NATIVE.mailCfg();g("mc_st").textContent=n.ok?"✓ تم الحفظ — جرّب الرسالة التجريبية":"ناقص: البريد أو كلمة مرور التطبيق";toast("تم حفظ إعدادات البريد");};
  g("mc_test").onclick=async()=>{const r=await saveCfg();if(!r.ok)return toast(r.error);g("mc_pw").value="";g("mc_st").textContent="جارٍ الإرسال…";
    const x=await NATIVE.mailSend({to:[g("mc_u").value],subject:`رسالة تجريبية — ${data.settings.company}`,text:"تم ربط البريد بنجاح. ستصلك عليه أكواد استرداد كلمة المرور والتقارير.",attachments:[]});
    g("mc_st").textContent=x.ok?"✓ تم الإرسال — افحص البريد (وصندوق الرسائل المزعجة)":"✗ "+x.error;};
}

/* ---------- المزامنة والأجهزة وسجل النشاط والتحكم ---------- */
const SY={st:null,busy:false,status:"off",timer:null,hb:null,pendingRender:false};
let snapStr="",sessionSeq=0,devTimer=null;
const snapOf=d=>JSON.stringify({workers:d.workers,txns:d.txns,entries:d.entries,expenses:d.expenses,purchases:d.purchases,cash:d.cash,settings:d.settings,att:Object.keys(d.att||{}).map(k=>[k,((d.att[k]||{}).recs||[]).length])});
function diffSummary(a,b){
  try{const A=JSON.parse(a),B=JSON.parse(b),out=[],eq=Merge.eq,nm=id=>{const w=(B.workers.find(x=>String(x.id)===id)||A.workers.find(x=>String(x.id)===id)||{});return w.name||id;};
    const mapOf=l=>new Map(l.map(x=>[String(x.id),x])),wa=mapOf(A.workers),wb=mapOf(B.workers);
    const add=[...wb.keys()].filter(k=>!wa.has(k)),rem=[...wa.keys()].filter(k=>!wb.has(k)),chg=[...wb.keys()].filter(k=>wa.has(k)&&!eq(wa.get(k),wb.get(k)));
    if(add.length)out.push("إضافة عامل: "+add.slice(0,3).map(nm).join("، ")+(add.length>3?` (+${add.length-3})`:""));
    if(rem.length)out.push("حذف عامل: "+rem.slice(0,3).map(k=>(wa.get(k).name||k)).join("، "));
    if(chg.length)out.push("تعديل بيانات عامل: "+chg.slice(0,3).map(nm).join("، ")+(chg.length>3?` (+${chg.length-3})`:""));
    let cells=0;const who=new Set();
    for(const p of new Set([...Object.keys(A.entries||{}),...Object.keys(B.entries||{})])){const ea=(A.entries||{})[p]||{},eb=(B.entries||{})[p]||{};
      for(const id of new Set([...Object.keys(ea),...Object.keys(eb)])){const x=ea[id]||{},y=eb[id]||{};for(const k of new Set([...Object.keys(x),...Object.keys(y)]))if((x[k]||0)!==(y[k]||0)){cells++;who.add(id);}}}
    if(cells)out.push(`كشف المرتبات: تعديل ${cells} خانة (${[...who].slice(0,3).map(nm).join("، ")}${who.size>3?"…":""})`);
    const cnt=(k,l)=>{const x=(A[k]||[]).length,y=(B[k]||[]).length;if(y>x)out.push(`${l}: إضافة ${y-x}`);else if(y<x)out.push(`${l}: حذف ${x-y}`);else if(!eq(A[k],B[k]))out.push(`${l}: تعديل`);};
    cnt("txns","السلف والخصومات");cnt("expenses","المصاريف");cnt("purchases","المشتريات");cnt("cash","الخزينة");
    if(!eq(A.settings,B.settings))out.push("تعديل الإعدادات");if(!eq(A.att,B.att))out.push("تحديث بيانات البصمة");
    return out.join(" — ");}catch(e){return "";}
}
function act2(action,detail){if(NATIVE&&NATIVE.sync)NATIVE.sync("log",{t:Date.now(),username:"",name:"",action,detail:detail||""}).catch(()=>{});}
function act(action,detail){if(NATIVE&&NATIVE.sync)NATIVE.sync("log",{t:Date.now(),username:me?me.username:"",name:me?me.name:"",action,detail:detail||""}).catch(()=>{});}
const syncIO=()=>NATIVE&&NATIVE.sync?{read:()=>NATIVE.sync("read"),write:(s,r,f)=>NATIVE.sync("write",s,r,f),setBase:(s,r)=>NATIVE.sync("setBase",s,r)}:null;
const typing=()=>{const a=document.activeElement;return a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.closest("#content,.modal");};
async function syncNow(){
  const io=syncIO();if(!io||SY.busy||!data)return;
  try{SY.st=await NATIVE.sync("state");}catch(e){return;}
  if(!SY.st.enabled){SY.status="off";badge();return;}
  SY.busy=true;
  try{
    const r=await SyncCore.tick(io,()=>data,x=>{data=x;});
    SY.status=r.status;
    if(r.changedLocal){normData();snapStr=snapOf(data);save(true);afterRemote();}
  }catch(e){SY.status="error";}
  SY.busy=false;badge();enforce();
}
function afterRemote(){
  if(!me){return;}
  if(!refreshMe())return enforce();
  if(lvl(page)<1)page=allowedPages()[0]||"dash";
  if(typing()){SY.pendingRender=true;return;}
  shell();render();
}
document.addEventListener("focusout",()=>setTimeout(()=>{if(SY.pendingRender&&!typing()&&me){SY.pendingRender=false;shell();render();}},300));
function badge(){const el=$("#syncb");if(!el)return;const s=SY.status;
  el.textContent=s==="off"?"":s==="offline"?"☁ المجلد غير متاح":s==="error"?"☁ خطأ مزامنة":s==="conflict"?"☁ جارٍ إعادة المحاولة…":"☁ متزامن";
  el.style.color=s==="offline"||s==="error"?"#b45309":"#0f766e";}
let syncDebounce=null;const syncSoon=()=>{clearTimeout(syncDebounce);syncDebounce=setTimeout(syncNow,1200);};
function enforce(){
  const c=data.control||{},dev=SY.st&&SY.st.deviceId;
  if(dev&&(c.blockedDevices||{})[dev]){if(!$("#app .blocked"))blockedScreen();return;}
  if($("#app .blocked")&&me==null)authScreen("login");
  if(!me)return;
  const u=data.users.find(x=>x.id===me.id);
  if(!u)return logout("تم حذف حسابك بواسطة المدير.");
  if(u.disabled)return logout("تم إيقاف حسابك بواسطة المدير.");
  if(((c.logoutSeq||{})[me.id]|0)>sessionSeq)return logout("تم تسجيل خروجك بواسطة المدير.");
}
function blockedScreen(){me=null;closeModal();$("#app").innerHTML=`<div class="auth blocked"><div class="authbox" style="text-align:center"><div class="logo">!</div><h2>الجهاز موقوف</h2><p class="hint">تم إيقاف هذا الجهاز بواسطة المدير. تواصل مع المدير لإعادة تفعيله.</p></div></div>`;}
function startSyncLoops(){
  clearInterval(SY.timer);clearInterval(SY.hb);
  if(!NATIVE||!NATIVE.sync)return;
  const hb=()=>NATIVE.sync("heartbeat",{user:me?me.name:"",username:me?me.username:"",page:me?(PAGES.find(p=>p[0]===page)||[0,""])[1]:"شاشة الدخول",version:"1.4"}).catch(()=>{});
  SY.timer=setInterval(syncNow,10000);SY.hb=setInterval(hb,30000);syncNow();hb();
}
const ago=t=>{const s=Math.max(0,Math.round((Date.now()-t)/1000));return s<60?"الآن":s<3600?`منذ ${Math.round(s/60)} دقيقة`:s<86400?`منذ ${Math.round(s/3600)} ساعة`:`منذ ${Math.round(s/86400)} يوم`;};
const tfmt=t=>{const d=new Date(t);return d.toLocaleDateString("en-GB")+" "+d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});};
function pickFolder(m,onPick){m.querySelector("#sf_pick").onclick=async()=>{const f=await NATIVE.syncChoose();if(!f)return;m.querySelector("#sf_path").textContent=f;m.querySelector("#sf_path").dataset.v=f;onPick&&onPick(f);};}
function linkDialog(){
  openModal(`<h3>تفعيل المزامنة بين الأجهزة</h3><p class="hint" style="line-height:1.9">اختر مجلداً على Google Drive أو OneDrive أو Dropbox (مجلد مزامنة على هذا الجهاز). الأجهزة الأخرى تختار نفس المجلد، فتشترك كلها في نفس البيانات ويظهر لك الأجهزة والنشاط.</p>
   <div class="bar"><button class="btn t" id="sf_pick">اختيار المجلد…</button><span id="sf_path" class="hint" dir="ltr" style="word-break:break-all">لم يتم اختيار مجلد</span></div>
   <label class="hint" style="display:block;margin-top:10px">اسم هذا الجهاز<input class="fld" id="sf_name" style="width:100%" value="${esc((SY.st&&SY.st.deviceName)||"")}"></label>
   <div id="sf_ex" style="display:none;margin-top:10px"><div class="alert">يوجد بالفعل نظام مشترك في هذا المجلد.</div>
    <label class="chk" style="display:flex;gap:8px;margin-top:6px"><input type="radio" name="sf_mode" value="join" checked> استخدام بيانات المجلد (تستبدل بيانات هذا الجهاز)</label>
    <label class="chk" style="display:flex;gap:8px;margin-top:4px"><input type="radio" name="sf_mode" value="publish"> رفع بيانات هذا الجهاز فوق ما في المجلد (يمسح بيانات المجلد)</label></div>
   <div class="alert" id="sf_err" style="display:none;margin-top:8px"></div><div class="bar" style="margin-top:12px"><button class="btn t" id="sf_go">تفعيل</button><button class="btn g" data-close>إلغاء</button></div>`,m=>{
    pickFolder(m,async f=>{m.querySelector("#sf_ex").style.display=(await NATIVE.sync("exists",f))?"block":"none";});
    m.querySelector("#sf_go").onclick=async()=>{const f=m.querySelector("#sf_path").dataset.v,e=t=>{m.querySelector("#sf_err").textContent=t;m.querySelector("#sf_err").style.display="block";};
      if(!f)return e("اختر المجلد أولاً.");const ex=await NATIVE.sync("exists",f),mode=ex?m.querySelector("[name=sf_mode]:checked").value:"publish";
      normData();const r=await NATIVE.sync("link",f,m.querySelector("#sf_name").value,mode,JSON.stringify(data));
      if(!r.ok)return e(r.error);
      if(mode==="join"){data=JSON.parse(r.data);normData();if(!refreshMe())return logout("تعذّر إيجاد حسابك في بيانات المجلد. سجّل الدخول من جديد.");save(true);}
      act("sync","تفعيل المزامنة"+(mode==="join"?" (استيراد من المجلد)":""));SY.st=await NATIVE.sync("state");snapStr=snapOf(data);closeModal();startSyncLoops();render();toast("تم تفعيل المزامنة");};
  });
}
function joinDialog(){
  openModal(`<h3>ربط هذا الجهاز بنظام موجود</h3><p class="hint" style="line-height:1.9">اختر نفس المجلد المشترك (على Drive/OneDrive/Dropbox) الذي فعّل المدير المزامنة عليه. بعد الربط تسجّل الدخول بحسابك الذي أنشأه المدير.</p>
   <div class="bar"><button class="btn t" id="sf_pick">اختيار المجلد…</button><span id="sf_path" class="hint" dir="ltr" style="word-break:break-all">لم يتم اختيار مجلد</span></div>
   <label class="hint" style="display:block;margin-top:10px">اسم هذا الجهاز (مثال: كمبيوتر المحاسبة)<input class="fld" id="sf_name" style="width:100%"></label>
   <div class="alert" id="sf_err" style="display:none;margin-top:8px"></div><div class="bar" style="margin-top:12px"><button class="btn t" id="sf_go">ربط</button><button class="btn g" data-close>إلغاء</button></div>`,m=>{
    pickFolder(m);m.querySelector("#sf_go").onclick=async()=>{const f=m.querySelector("#sf_path").dataset.v,e=t=>{m.querySelector("#sf_err").textContent=t;m.querySelector("#sf_err").style.display="block";};
      if(!f)return e("اختر المجلد أولاً.");const r=await NATIVE.sync("link",f,m.querySelector("#sf_name").value,"join");if(!r.ok)return e(r.error);
      data=JSON.parse(r.data);normData();save(true);flush();SY.st=await NATIVE.sync("state");closeModal();startSyncLoops();authScreen("login");setTimeout(()=>toast("تم الربط. سجّل الدخول بحسابك."),100);};});
}
function pDev(c){
  clearInterval(devTimer);
  if(!NATIVE||!NATIVE.sync){c.innerHTML='<div class="card"><h3>الأجهزة والتحكم</h3><p class="hint">هذه الصفحة متاحة في نسخة الويندوز.</p></div>';return;}
  const ctl=(data.control=data.control||{}),bl=(ctl.blockedDevices=ctl.blockedDevices||{});
  c.innerHTML=`<div class="card" id="dv_sync"></div><div class="card"><h3>الأجهزة المتصلة</h3><div class="tablewrap"><table><thead><tr><th class="l">الجهاز</th><th class="l">المستخدم الحالي</th><th class="l">الصفحة</th><th>آخر ظهور</th><th>الحالة</th><th></th></tr></thead><tbody id="dv_t"></tbody></table></div>
   <div class="hint" style="margin-top:6px">يتحدّث كل 10 ثوانٍ. «متصل» = ظهر خلال آخر 90 ثانية. حظر جهاز يمنع الدخول منه تماماً حتى تفكّ الحظر.</div></div>
   <div class="card"><h3>التحكم السريع في الحسابات</h3><div class="bar"><button class="btn r" id="dv_all">تسجيل خروج كل المستخدمين الآخرين</button><button class="btn g" id="dv_users">إدارة الحسابات والصلاحيات</button></div></div>
   <div class="card"><h3>سجل النشاط</h3><div class="bar"><select class="fld" id="al_u"><option value="">كل المستخدمين</option></select><select class="fld" id="al_d"><option value="">كل الأجهزة</option></select><select class="fld" id="al_a"><option value="">كل الأحداث</option></select><input class="fld" id="al_q" placeholder="بحث في التفاصيل…"><button class="btn g" id="al_r">تحديث</button><button class="btn g" id="al_x">${ICON.xl} تصدير</button></div>
   <div class="tablewrap" style="max-height:55vh"><table><thead><tr><th>الوقت</th><th class="l">الجهاز</th><th class="l">المستخدم</th><th>الحدث</th><th class="l">التفاصيل</th></tr></thead><tbody id="al_t"></tbody></table></div></div>`;
  const ACT={login:"دخول",logout:"خروج",fail:"محاولة دخول فاشلة",edit:"تعديل بيانات",user:"إدارة حسابات",sync:"مزامنة",import:"استيراد",export:"تصدير/إرسال",print:"طباعة",control:"تحكم",pw:"كلمة مرور"};
  const drawSync=async()=>{const st=SY.st=await NATIVE.sync("state"),el=$("#dv_sync");if(!el)return;
    el.innerHTML=st.enabled?`<h3>المزامنة بين الأجهزة</h3><div class="hint" style="line-height:2">الحالة: <b>${SY.status==="off"?"—":badgeTxt()}</b> — المجلد: <span dir="ltr">${esc(st.folder)}</span><br>اسم هذا الجهاز: <input class="fld" id="dv_name" value="${esc(st.deviceName)}" style="width:200px"> آخر اتصال ناجح: ${st.lastOk?ago(st.lastOk):"—"}${st.error?`<br><span style="color:#b45309">${esc(st.error)}</span>`:""}</div>
      <div class="bar" style="margin-top:8px"><button class="btn t" id="dv_now">مزامنة الآن</button><button class="btn r" id="dv_off">إيقاف المزامنة على هذا الجهاز</button></div>
      <div class="hint" style="margin-top:6px">التغييرات تظهر على الأجهزة الأخرى بعد أن يزامن Drive/OneDrive الملف (ثوانٍ إلى دقائق حسب الإنترنت).</div>`
     :`<h3>المزامنة بين الأجهزة</h3><p class="hint" style="line-height:1.9">غير مفعّلة. فعّلها لتجمع كل الأجهزة على نفس البيانات، وتتحكم من هنا في الحسابات على الأجهزة الأخرى وترى نشاطها.</p><button class="btn t" id="dv_on">تفعيل المزامنة…</button>`;
    const q=s=>el.querySelector(s);
    if(q("#dv_on"))q("#dv_on").onclick=linkDialog;
    if(q("#dv_now"))q("#dv_now").onclick=async()=>{await syncNow();drawSync();drawDev();toast("تمت المزامنة");};
    if(q("#dv_name"))q("#dv_name").onchange=async e=>{await NATIVE.sync("rename",e.target.value);SY.st=await NATIVE.sync("state");toast("تم تغيير اسم الجهاز");};
    if(q("#dv_off"))q("#dv_off").onclick=()=>openModal(`<h3>إيقاف المزامنة</h3><p>سيعمل هذا الجهاز بعدها ببياناته المحلية فقط (آخر نسخة مزامنة). هل أنت متأكد؟</p><div class="bar"><button class="btn r" id="yes">نعم، أوقف</button><button class="btn g" data-close>إلغاء</button></div>`,m=>m.querySelector("#yes").onclick=async()=>{act("sync","إيقاف المزامنة على جهاز");await NATIVE.sync("unlink");SY.st=await NATIVE.sync("state");SY.status="off";closeModal();badge();drawSync();drawDev();});};
  const badgeTxt=()=>({ok:"متزامن ✓",pushed:"متزامن ✓",offline:"المجلد غير متاح",error:"خطأ",conflict:"إعادة محاولة"})[SY.status]||SY.status;
  const drawDev=async()=>{const t=$("#dv_t");if(!t)return;const st=SY.st||await NATIVE.sync("state"),list=(await NATIVE.sync("devices")).sort((a,b)=>b.lastSeen-a.lastSeen);
    t.innerHTML=list.map(d=>{const on=Date.now()-d.lastSeen<90000,me_=d.id===st.deviceId;return `<tr><td class="l"><b>${esc(d.name)}</b>${me_?' <span class="badge ok">هذا الجهاز</span>':""}<br><small style="color:#64748b">${esc(d.host||"")}</small></td><td class="l">${esc(d.user||"—")}</td><td class="l">${esc(d.page||"")}</td><td>${ago(d.lastSeen)}</td>
      <td>${bl[d.id]?'<span class="badge">⛔ محظور</span>':on?'<span class="badge ok">● متصل</span>':'<span class="badge" style="background:#e2e8f0;color:#475569">غير متصل</span>'}</td>
      <td>${me_?"":`<button class="btn ${bl[d.id]?"g":"r"}" data-bl="${esc(d.id)}">${bl[d.id]?"فك الحظر":"حظر"}</button> <button class="btn g" data-rm="${esc(d.id)}">إخفاء</button>`}</td></tr>`;}).join("")||`<tr><td colspan="6" class="hint" style="padding:20px">${st.enabled?"لا توجد أجهزة بعد.":"فعّل المزامنة لترى الأجهزة."}</td></tr>`;};
  const drawAct=async()=>{const all=await NATIVE.sync("activity",600),sel=(id,vals,cur)=>{const e=$(id),c=e.value;e.innerHTML=e.options[0].outerHTML+vals.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join("");e.value=c;};
    sel("#al_u",[...new Set(all.map(x=>x.username).filter(Boolean))].map(u=>[u,u]));sel("#al_d",[...new Map(all.map(x=>[x.deviceId,x.device])).entries()]);sel("#al_a",[...new Set(all.map(x=>x.action))].map(a=>[a,ACT[a]||a]));
    const fu=$("#al_u").value,fd=$("#al_d").value,fa=$("#al_a").value,fq=$("#al_q").value.trim().toLowerCase();
    const rows=all.filter(x=>(!fu||x.username===fu)&&(!fd||x.deviceId===fd)&&(!fa||x.action===fa)&&(!fq||String(x.detail||"").toLowerCase().includes(fq)));
    drawAct.rows=rows;$("#al_t").innerHTML=rows.slice(0,300).map(x=>`<tr><td dir="ltr">${tfmt(x.t)}</td><td class="l">${esc(x.device||"")}</td><td class="l">${esc(x.name||x.username||"—")}</td><td>${esc(ACT[x.action]||x.action)}</td><td class="l" style="white-space:normal;max-width:520px">${esc(x.detail||"")}</td></tr>`).join("")||'<tr><td colspan="5" class="hint" style="padding:20px">لا يوجد نشاط</td></tr>';};
  drawSync();drawDev();drawAct();
  devTimer=setInterval(()=>{if(page!=="dev"||!$("#dv_t")){clearInterval(devTimer);return;}drawDev();},10000);
  ["al_u","al_d","al_a"].forEach(i=>$("#"+i).onchange=drawAct);$("#al_q").oninput=drawAct;$("#al_r").onclick=drawAct;
  $("#al_x").onclick=()=>saveFile(`سجل-النشاط-${E.iso(new Date())}.xlsx`,XLSX2.writeSheet("سجل النشاط",["الوقت","الجهاز","المستخدم","الحدث","التفاصيل"],(drawAct.rows||[]).map(x=>[tfmt(x.t),x.device||"",x.name||x.username||"",ACT[x.action]||x.action,x.detail||""])));
  $("#dv_users").onclick=()=>{page="users";render();};
  $("#dv_all").onclick=()=>openModal(`<h3>تسجيل خروج الجميع</h3><p>سيتم إخراج كل المستخدمين (عدا حسابك) من كل الأجهزة خلال ثوانٍ، ويمكنهم الدخول من جديد.</p><div class="bar"><button class="btn r" id="yes">نعم، أخرجهم</button><button class="btn g" data-close>إلغاء</button></div>`,m=>m.querySelector("#yes").onclick=()=>{ctl.logoutSeq=ctl.logoutSeq||{};data.users.forEach(u=>{if(u.id!==me.id)ctl.logoutSeq[u.id]=((ctl.logoutSeq[u.id]|0)+1);});act("control","تسجيل خروج كل المستخدمين الآخرين");save();syncSoon();closeModal();toast("تم");});
  $("#dv_t").onclick=async e=>{const b=e.target.closest("[data-bl]"),r=e.target.closest("[data-rm]");
    if(b){const id=b.dataset.bl;if(bl[id])delete bl[id];else bl[id]=true;act("control",(bl[id]?"حظر":"فك حظر")+" جهاز");save();syncSoon();drawDev();}
    if(r){await NATIVE.sync("removeDevice",r.dataset.rm);drawDev();}};
}

/* ---------- بدء التشغيل ---------- */
function flush(){if(saveTimer){clearTimeout(saveTimer);saveTimer=null;try{const s=JSON.stringify(data);if(NATIVE&&NATIVE.saveSync)NATIVE.saveSync(s);else localStorage.setItem("payroll_data",s);}catch(e){}}}
window.addEventListener("beforeunload",flush);document.addEventListener("visibilitychange",()=>{if(document.hidden)flush();});
["dragover","drop"].forEach(ev=>window.addEventListener(ev,e=>{if(e.dataTransfer&&[...(e.dataTransfer.types||[])].includes("Files"))e.preventDefault();}));
(async()=>{await loadData();window.__app={get data(){return data},calc,render,importXlsx,get me(){return me},setData:d=>{data=d;normData();if(me)(shell(),render());}};authScreen(data.users.length?"login":"setup");startSyncLoops();})();
