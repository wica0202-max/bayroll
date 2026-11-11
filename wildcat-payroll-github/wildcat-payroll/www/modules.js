/* ===== المشتريات + الخزينة + الرسوم البيانية (النسخة 1.12) =====
   يُحمَّل قبل app.js ويستخدم دوال app.js (data, cur, nf, esc, E, save, act, toast...) عند الاستدعاء فقط. */
const PAL=["#0f766e","#1f2a44","#f59e0b","#dc2626","#6366f1","#0891b2","#84cc16","#a855f7","#64748b","#ea580c"];
const DEF_PURCH_CATS=["خامات","أقمشة","خيوط وإكسسوارات","مستلزمات تعبئة","قطع غيار وصيانة","معدات وأدوات","أخرى"];
const DEF_CASH_CATS_IN=["مبيعات","تحصيل من عملاء","إيداع / تمويل","أخرى"];
const DEF_CASH_CATS_OUT=["مرتبات","إيجار","كهرباء","مواصلات","مشتريات","سداد موردين","سلف عمال","أخرى"];
const mn=v=>E.num(v);
const r2m=v=>Math.round((+v||0)*100)/100;

function modsNorm(){
  data.purchases=data.purchases||[];data.cash=data.cash||[];
  data.purchases.forEach(x=>{if(!x.id)x.id=uid();});data.cash.forEach(x=>{if(!x.id)x.id=uid();});
  const S=data.settings;
  if(!Array.isArray(S.purchCats))S.purchCats=[...DEF_PURCH_CATS];
  if(S.cashOpening===undefined)S.cashOpening=0;
  S.cashAuto={purch:true,exp:true,adv:true,...(S.cashAuto||{})};
}

/* ---------- رسوم بيانية SVG/HTML خفيفة ---------- */
const shortN=v=>{const a=Math.abs(v);return a>=1e6?(v/1e6).toFixed(1)+"م":a>=1e3?(v/1e3).toFixed(a>=1e4?0:1)+"ك":String(Math.round(v));};
function chartDonut(items,opt){
  items=items.filter(i=>i.v>0);const tot=items.reduce((a,i)=>a+i.v,0);
  if(!tot)return '<div class="hint" style="padding:16px">لا توجد بيانات</div>';
  const R=40,C=2*Math.PI*R;let off=0;
  const segs=items.map((i,k)=>{const len=i.v/tot*C,s=`<circle r="${R}" cx="60" cy="60" fill="none" stroke="${PAL[k%PAL.length]}" stroke-width="22" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"/>`;off+=len;return s;}).join("");
  const leg=items.map((i,k)=>`<tr><td><i class="dot" style="background:${PAL[k%PAL.length]}"></i></td><td class="l">${esc(i.l)}</td><td class="n">${nf(i.v)}</td><td>${(i.v/tot*100).toFixed(1)}%</td></tr>`).join("");
  return `<div class="donut"><svg viewBox="0 0 120 120" class="dsvg">${segs}<text x="60" y="57" text-anchor="middle" font-size="8" fill="#64748b">الإجمالي</text><text x="60" y="69" text-anchor="middle" font-size="10" font-weight="700" fill="#1f2a44">${shortN(tot)}</text></svg><table class="dleg"><tbody>${leg}</tbody></table></div>`;
}
function chartHBars(items,opt){
  items=items.filter(i=>i.v>0);if(!items.length)return '<div class="hint" style="padding:16px">لا توجد بيانات</div>';
  const mx=Math.max(...items.map(i=>i.v));const col=(opt&&opt.color)||"var(--teal)";
  return `<div class="hb">${items.map(i=>`<div class="hbr"><span class="hbl">${esc(i.l)}</span><span class="hbt"><span class="hbf" style="width:${Math.max(2,i.v/mx*100)}%;background:${col}"></span></span><b class="hbv">${nf(i.v)}</b></div>`).join("")}</div>`;
}
function chartCols(labels,series){ // أعمدة مجمّعة
  const W=560,H=230,pl=56,pb=34,pt=14,pr=8,n=labels.length;if(!n)return "";
  const mx=Math.max(1,...series.flatMap(s=>s.vals)),step=niceStep(mx/4),top=Math.ceil(mx/step)*step||1;
  const gw=(W-pl-pr)/n,bw=Math.min(26,gw/(series.length+1)),ph=H-pt-pb;
  let g="";for(let i=0;i<=top/step;i++){const y=pt+ph-(i*step/top)*ph;g+=`<line x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}" stroke="#e5e9f0"/><text x="${pl-5}" y="${y+3}" text-anchor="end" font-size="9" fill="#64748b">${shortN(i*step)}</text>`;}
  labels.forEach((lb,i)=>{const cx=pl+gw*i+gw/2;g+=`<text x="${cx}" y="${H-pb+14}" text-anchor="middle" font-size="9" fill="#475569">${esc(lb)}</text>`;
    series.forEach((s,k)=>{const v=s.vals[i]||0,h=v/top*ph,x=cx-(series.length*bw)/2+k*bw;g+=`<rect x="${x}" y="${pt+ph-h}" width="${bw-2}" height="${Math.max(0,h)}" rx="2" fill="${s.color}"><title>${esc(s.name)}: ${nf(v)}</title></rect>`;});});
  const leg=series.map(s=>`<span><i class="dot" style="background:${s.color}"></i>${esc(s.name)}</span>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" class="csvg">${g}</svg><div class="cleg">${leg}</div>`;
}
function chartLine(labels,vals,color){
  const W=560,H=200,pl=56,pb=30,pt=14,pr=12,n=labels.length;if(!n)return "";
  let lo=Math.min(0,...vals),hi=Math.max(0,...vals);if(hi===lo)hi=lo+1;const step=niceStep((hi-lo)/4),a=Math.floor(lo/step)*step,b=Math.ceil(hi/step)*step,ph=H-pt-pb,Y=v=>pt+ph-(v-a)/(b-a)*ph,gw=(W-pl-pr)/Math.max(1,n-1),X=i=>n===1?(W+pl-pr)/2:pl+gw*i;
  let g="";for(let v=a;v<=b+1e-9;v+=step)g+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${Math.abs(v)<1e-9?"#94a3b8":"#e5e9f0"}"/><text x="${pl-5}" y="${Y(v)+3}" text-anchor="end" font-size="9" fill="#64748b">${shortN(v)}</text>`;
  const pts=vals.map((v,i)=>`${X(i)},${Y(v)}`).join(" ");
  g+=`<polygon points="${X(0)},${Y(0)} ${pts} ${X(n-1)},${Y(0)}" fill="${color}" opacity=".12"/><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.4"/>`;
  vals.forEach((v,i)=>{g+=`<circle cx="${X(i)}" cy="${Y(v)}" r="3.4" fill="${v<0?"#dc2626":color}"><title>${esc(labels[i])}: ${nf(v)}</title></circle><text x="${X(i)}" y="${H-pb+14}" text-anchor="middle" font-size="9" fill="#475569">${esc(labels[i])}</text>`;});
  return `<svg viewBox="0 0 ${W} ${H}" class="csvg">${g}</svg>`;
}
function niceStep(raw){raw=raw||1;const p=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/p;return(f<=1?1:f<=2?2:f<=5?5:10)*p;}
const cbox=(t,inner,wide)=>`<div class="cbox${wide?" wide":""}"><h4>${t}</h4>${inner}</div>`;
const periodLabel=s=>{const e=E.periodEnd(s).split("-");return MONTHS_AR[+e[1]-1]+" "+String(e[0]).slice(2);};
const lastPeriods=(n,from)=>{const out=[];let s=from||cur();for(let i=0;i<n;i++){out.unshift(s);s=E.shiftPeriod(s,-1);}return out;};
const sumBy=(list,keyF,valF)=>{const m={};list.forEach(x=>{const k=keyF(x)||"غير محدد";m[k]=(m[k]||0)+valF(x);});return Object.entries(m).map(([l,v])=>({l,v:r2m(v)})).sort((a,b)=>b.v-a.v);};

/* ---------- المشتريات: حسابات ---------- */
const buyTotal=x=>x.kind==="سداد"?0:r2m(mn(x.total));
const buyPaid=x=>mn(x.paid);
function purchStats(s,e){ // إحصائيات فترة
  const L=data.purchases.filter(x=>x.date>=s&&x.date<=e),inv=L.filter(x=>x.kind!=="سداد");
  const total=r2m(inv.reduce((a,x)=>a+buyTotal(x),0)),paid=r2m(L.reduce((a,x)=>a+buyPaid(x),0));
  return {count:inv.length,total,paid,list:L,byCat:sumBy(inv,x=>x.cat,buyTotal),bySup:sumBy(inv,x=>x.supplier,buyTotal)};
}
function supplierBalances(){
  const m={};data.purchases.forEach(x=>{const k=(x.supplier||"").trim()||"غير محدد";const o=m[k]||(m[k]={name:k,total:0,paid:0});o.total+=buyTotal(x);o.paid+=buyPaid(x);});
  return Object.values(m).map(o=>({...o,total:r2m(o.total),paid:r2m(o.paid),due:r2m(o.total-o.paid)})).sort((a,b)=>b.due-a.due);
}

/* ---------- الخزينة: حسابات ---------- */
function cashMoves(){
  const A=data.settings.cashAuto||{},L=[];
  data.cash.forEach(x=>L.push({id:x.id,date:x.date,type:x.type,cat:x.cat||"",note:x.note||"",amount:mn(x.amount),auto:false}));
  if(A.purch)data.purchases.forEach(x=>{const a=mn(x.paid);if(a>0)L.push({id:"p"+x.id,date:x.date,type:"منصرف",cat:x.kind==="سداد"?"سداد موردين":"مشتريات",note:(x.supplier||"")+(x.item?" — "+x.item:""),amount:a,auto:true,src:"المشتريات"});});
  if(A.exp)(data.expenses||[]).forEach(x=>{const a=mn(x.amount);if(a>0)L.push({id:"e"+x.id,date:x.date,type:"منصرف",cat:x.cat||"مصاريف",note:x.note||"",amount:a,auto:true,src:"المصاريف الإضافية"});});
  if(A.adv)data.txns.forEach(t=>{if(t.type!=="سلفة")return;const a=mn(t.amount);if(a>0){const w=data.workers.find(w=>String(w.id)===String(t.workerId));L.push({id:"a"+t.id,date:t.date,type:"منصرف",cat:"سلف عمال",note:(w?w.name:t.workerId)+(t.note?" — "+t.note:""),amount:a,auto:true,src:"السلف"});}});
  return L.map((m,i)=>({...m,_i:i})).sort((a,b)=>a.date.localeCompare(b.date)||a._i-b._i);
}
function cashStats(s,e,moves){
  moves=moves||cashMoves();const sg=m=>m.type==="وارد"?m.amount:-m.amount;
  const open=r2m(mn(data.settings.cashOpening)+moves.filter(m=>m.date<s).reduce((a,m)=>a+sg(m),0));
  const inP=moves.filter(m=>m.date>=s&&m.date<=e&&m.type==="وارد"),outP=moves.filter(m=>m.date>=s&&m.date<=e&&m.type!=="وارد");
  const inn=r2m(inP.reduce((a,m)=>a+m.amount,0)),out=r2m(outP.reduce((a,m)=>a+m.amount,0));
  return {open,inn,out,close:r2m(open+inn-out),inList:inP,outList:outP};
}

/* ---------- ملخصات للتقرير المالي (تُخزَّن في لقطة الشهر) ---------- */
function modsSnap(start){
  const e=E.periodEnd(start),P=purchStats(start,e),C=cashStats(start,e);
  return {pur:{count:P.count,total:P.total,paid:P.paid,byCat:P.byCat,bySup:P.bySup.slice(0,8),dueAll:r2m(supplierBalances().reduce((a,b)=>a+Math.max(0,b.due),0))},
          cash:{open:C.open,inn:C.inn,out:C.out,close:C.close,outByCat:sumBy(C.outList,m=>m.cat,m=>m.amount),inByCat:sumBy(C.inList,m=>m.cat,m=>m.amount)}};
}
/* رسوم + أقسام إضافية داخل التقرير المالي (M.P, M.C اختيارية) */
function finCharts(M){
  const t=M.t,X=M.X,boxes=[];
  const parts=[{l:"صافي المرتبات",v:t.net},{l:"مصاريف إضافية",v:X.total}];if(M.P&&M.P.paid>0)parts.push({l:"مشتريات (مدفوعة)",v:M.P.paid});
  boxes.push(cbox("توزيع المدفوعات",chartDonut(parts)));
  boxes.push(cbox("صافي المرتبات حسب القسم",chartHBars(M.dep.map(d=>({l:d.d,v:d.net})))));
  if(Object.keys(X.byCat).length)boxes.push(cbox("المصاريف الإضافية حسب البند",chartDonut(Object.entries(X.byCat).map(([l,v])=>({l,v})))));
  if(M.P&&M.P.byCat&&M.P.byCat.length)boxes.push(cbox("المشتريات حسب التصنيف",chartDonut(M.P.byCat)));
  if(M.C)boxes.push(cbox("حركة الخزينة في الفترة",chartHBars([{l:"رصيد أول الفترة",v:Math.max(0,M.C.open)},{l:"وارد",v:M.C.inn},{l:"منصرف",v:M.C.out},{l:"رصيد آخر الفترة",v:Math.max(0,M.C.close)}])));
  return `<div class="charts">${boxes.join("")}</div>`;
}
function finExtraHTML(M){
  let h="";
  if(M.P)h+=`<h4>المشتريات في الفترة</h4><table><tbody><tr><td class="l">عدد الفواتير</td><td class="n">${M.P.count}</td></tr><tr><td class="l">إجمالي المشتريات</td><td class="n">${nf(M.P.total)}</td></tr><tr><td class="l">المدفوع للموردين (فواتير + سداد)</td><td class="n">${nf(M.P.paid)}</td></tr>${M.P.dueAll!=null?`<tr class="s"><td class="l">إجمالي مستحقات الموردين (كل الفترات)</td><td class="n">${nf(M.P.dueAll)}</td></tr>`:""}</tbody></table>`;
  if(M.C)h+=`<h4>الخزينة</h4><table><tbody><tr><td class="l">رصيد أول الفترة</td><td class="n">${nf(M.C.open)}</td></tr><tr><td class="l">(+) الوارد</td><td class="n">${nf(M.C.inn)}</td></tr><tr><td class="l">(−) المنصرف</td><td class="n">${nf(M.C.out)}</td></tr><tr class="s"><td class="l">رصيد آخر الفترة</td><td class="n">${nf(M.C.close)}</td></tr></tbody></table>`;
  return h;
}
function finExtraFor(start){const m=modsSnap(start);return {P:{...m.pur},C:{...m.cash}};}

/* ---------- لوحة المرتبات: شريط الخزينة والمشتريات ---------- */
function modsDash(c){
  const s=cur(),e=E.periodEnd(s),P=purchStats(s,e),C=cashStats(s,e),dues=supplierBalances().reduce((a,b)=>a+Math.max(0,b.due),0);
  const periods=lastPeriods(6),cs=periods.map(p=>cashStats(p,E.periodEnd(p)));
  const d=document.createElement("div");
  d.innerHTML=`<div class="kpis" style="margin-top:18px"><div class="kpi t"><small>رصيد الخزينة (آخر الفترة)</small><b>${nf(C.close)}</b></div><div class="kpi"><small>وارد الفترة</small><b>${nf(C.inn)}</b></div><div class="kpi r"><small>منصرف الفترة</small><b>${nf(C.out)}</b></div><div class="kpi g"><small>مشتريات الفترة</small><b>${nf(P.total)}</b></div><div class="kpi r"><small>مستحقات الموردين</small><b>${nf(dues)}</b></div></div>
   <div class="charts">${cbox("الوارد والمنصرف — آخر 6 فترات",chartCols(periods.map(periodLabel),[{name:"وارد",color:"#0f766e",vals:cs.map(x=>x.inn)},{name:"منصرف",color:"#dc2626",vals:cs.map(x=>x.out)}]))}${cbox("رصيد الخزينة آخر كل فترة",chartLine(periods.map(periodLabel),cs.map(x=>x.close),"#1f2a44"))}</div>`;
  c.appendChild(d);
}

/* =================== صفحة المشتريات =================== */
let buyAll=false,buyQ="",buySup="";
function pBuy(c){
  const S=data.settings,s=cur(),e=E.periodEnd(s),today=E.iso(new Date()),defDate=(today>=s&&today<=e)?today:s;
  const sups=()=>[...new Set(data.purchases.map(x=>(x.supplier||"").trim()).filter(Boolean))].sort();
  const cats=()=>[...new Set([...(S.purchCats||[]),...data.purchases.map(x=>x.cat).filter(Boolean)])];
  c.innerHTML=`<div class="card"><h3>إضافة فاتورة / عملية شراء</h3><div class="form">
    <label>التاريخ<input class="fld" type="date" id="bd" value="${defDate}"></label>
    <label>المورد<input class="fld" id="bs" list="bsl" placeholder="اسم المورد"></label><datalist id="bsl">${sups().map(x=>`<option value="${esc(x)}">`).join("")}</datalist>
    <label>الصنف / البيان<input class="fld" id="bi"></label>
    <label>التصنيف<input class="fld" id="bc" list="bcl" placeholder="خامات…"></label><datalist id="bcl">${cats().map(x=>`<option value="${esc(x)}">`).join("")}</datalist>
    <label>الكمية<input class="fld" type="number" step="any" id="bq" value="1"></label>
    <label>سعر الوحدة<input class="fld" type="number" step="any" id="bp"></label>
    <label>الإجمالي<input class="fld" id="bt" readonly style="background:#f1f5f9"></label>
    <label>المدفوع الآن<input class="fld" type="number" step="any" id="bpd" placeholder="فارغ = مدفوع بالكامل، 0 = آجل"></label></div>
   <div class="bar" style="margin-top:14px"><button class="btn t" id="badd">${ICON.plus} إضافة</button><span class="hint">المدفوع يدخل الخزينة تلقائياً (من إعدادات الخزينة). الباقي يُسجَّل مستحقاً للمورد، وتسدده من «سداد مورد».</span></div></div>
  <div class="card"><h3>سداد دفعة لمورد</h3><div class="form"><label>التاريخ<input class="fld" type="date" id="sd2" value="${defDate}"></label>
    <label>المورد<select class="fld" id="ss"></select></label><label>المبلغ<input class="fld" type="number" step="any" id="sa"></label><label>ملاحظة<input class="fld" id="sn"></label></div>
   <div class="bar" style="margin-top:14px"><button class="btn t" id="spay">${ICON.plus} تسجيل السداد</button></div></div>
  <div class="kpis" id="bk"></div><div class="charts" id="bch"></div>
  <div class="card"><h3>أرصدة الموردين</h3><div class="tablewrap" style="max-height:260px"><table><thead><tr><th class="l">المورد</th><th>إجمالي المشتريات</th><th>المدفوع</th><th>المتبقي له</th><th style="width:26%"></th></tr></thead><tbody id="bsup"></tbody></table></div></div>
  <div class="bar"><label class="hint"><input type="checkbox" id="ball" ${buyAll?"checked":""}> عرض كل الفترات</label>
   <select class="fld" id="bfs"></select><input class="fld" id="bq2" placeholder="بحث…" value="${esc(buyQ)}" style="min-width:160px">
   <button class="btn g" id="bxl">${ICON.xl} Excel</button><button class="btn g" id="bpr">${ICON.print} طباعة</button></div>
  <div class="tablewrap"><table><thead><tr><th>التاريخ</th><th class="l">المورد</th><th class="l">الصنف / البيان</th><th>التصنيف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th></th></tr></thead><tbody id="bb"></tbody></table></div>`;
  const inScope=x=>buyAll||(x.date>=s&&x.date<=e);
  const shownList=()=>{const q=buyQ.trim().toLowerCase();return data.purchases.map((x,i)=>({x,i})).filter(({x})=>inScope(x)&&(!buySup||(x.supplier||"")===buySup)&&(!q||((x.supplier||"")+" "+(x.item||"")+" "+(x.cat||"")).toLowerCase().includes(q))).sort((a,b)=>b.x.date.localeCompare(a.x.date));};
  const draw=()=>{
    const bal=supplierBalances(),L=data.purchases.filter(inScope),inv=L.filter(x=>x.kind!=="سداد");
    const total=r2m(inv.reduce((a,x)=>a+buyTotal(x),0)),paid=r2m(L.reduce((a,x)=>a+buyPaid(x),0)),dues=r2m(bal.reduce((a,b)=>a+Math.max(0,b.due),0));
    $("#bk").innerHTML=`<div class="kpi t"><small>إجمالي المشتريات${buyAll?"":" (الفترة)"}</small><b>${nf(total)}</b></div><div class="kpi"><small>عدد الفواتير</small><b>${inv.length}</b></div><div class="kpi g"><small>المدفوع للموردين</small><b>${nf(paid)}</b></div><div class="kpi r"><small>إجمالي مستحقات الموردين</small><b>${nf(dues)}</b></div>`;
    const ps=lastPeriods(6),pv=ps.map(p=>purchStats(p,E.periodEnd(p)));
    $("#bch").innerHTML=cbox("المشتريات حسب التصنيف",chartDonut(sumBy(inv,x=>x.cat,buyTotal)))+cbox("أكبر الموردين (مشتريات)",chartHBars(sumBy(inv,x=>x.supplier,buyTotal).slice(0,8)))+cbox("المشتريات والمدفوع — آخر 6 فترات",chartCols(ps.map(periodLabel),[{name:"المشتريات",color:"#1f2a44",vals:pv.map(x=>x.total)},{name:"المدفوع",color:"#0f766e",vals:pv.map(x=>x.paid)}]),true);
    const mx=Math.max(1,...bal.map(b=>Math.abs(b.due)));
    $("#bsup").innerHTML=bal.map(b=>`<tr><td class="l"><a href="#" data-sf="${esc(b.name)}">${esc(b.name)}</a></td><td class="n">${nf(b.total)}</td><td class="n">${nf(b.paid)}</td><td class="n"><b style="color:${b.due>0.005?"#b91c1c":"#15803d"}">${nf(b.due)}</b></td><td><div class="hbar" style="width:${Math.max(2,Math.abs(b.due)/mx*100)}%;background:${b.due>0?"#dc2626":"#15803d"}"></div></td></tr>`).join("")||'<tr><td colspan="5" class="hint" style="padding:18px">لا يوجد موردون بعد</td></tr>';
    const cur2=$("#ss").value;$("#ss").innerHTML=bal.filter(b=>b.name!=="غير محدد"||b.due>0).map(b=>`<option value="${esc(b.name)}">${esc(b.name)} — متبقي ${nf(b.due)}</option>`).join("");if(cur2)$("#ss").value=cur2;
    $("#bfs").innerHTML=`<option value="">كل الموردين</option>`+sups().map(x=>`<option ${x===buySup?"selected":""} value="${esc(x)}">${esc(x)}</option>`).join("");
    const sl=shownList();
    $("#bb").innerHTML=sl.map(({x,i})=>{const pay=x.kind==="سداد",t=buyTotal(x),due=r2m(t-buyPaid(x));
      return `<tr data-i="${i}" ${pay?'style="background:#f0fdfa"':""}><td><input class="cell m" type="date" data-f="date" value="${esc(x.date)}"></td><td class="l"><input class="cell w" data-f="supplier" value="${esc(x.supplier||"")}" list="bsl"></td><td class="l"><input class="cell w" data-f="item" value="${esc(x.item||"")}"></td>
      <td>${pay?'<span class="badge ok">سداد</span>':`<input class="cell m" data-f="cat" value="${esc(x.cat||"")}" list="bcl">`}</td>
      <td>${pay?"":`<input class="cell" type="number" step="any" data-f="qty" value="${x.qty??""}">`}</td><td>${pay?"":`<input class="cell m" type="number" step="any" data-f="price" value="${x.price??""}">`}</td>
      <td class="n">${pay?"":nf(t)}</td><td><input class="cell m" type="number" step="any" data-f="paid" value="${x.paid??""}"></td><td class="n">${pay?"":`<b style="color:${due>0.005?"#b91c1c":"#15803d"}">${nf(due)}</b>`}</td><td><button class="btn r" data-del="${i}">حذف</button></td></tr>`;}).join("")||'<tr><td colspan="10" class="hint" style="padding:24px">لا توجد مشتريات في هذه الفترة</td></tr>';
    applyRO($("#content"));
  };
  const calcT=()=>{$("#bt").value=nf(r2m((mn($("#bq").value)||0)*mn($("#bp").value)));};
  $("#bq").oninput=$("#bp").oninput=calcT;calcT();
  $("#badd").onclick=()=>{const q=$("#bq").value===""?1:mn($("#bq").value),p=mn($("#bp").value),t=r2m(q*p);
    if(!$("#bd").value||!t){toast("أكمل التاريخ والسعر");return;}
    const pd=$("#bpd").value===""?t:mn($("#bpd").value);
    data.purchases.push({id:uid(),date:$("#bd").value,kind:"شراء",supplier:$("#bs").value.trim(),item:$("#bi").value,cat:$("#bc").value.trim()||"أخرى",qty:q,price:p,total:t,paid:pd});
    act("edit","إضافة فاتورة مشتريات "+nf(t));save();["#bi","#bp","#bpd"].forEach(k=>$(k).value="");$("#bq").value=1;calcT();draw();toast("تمت إضافة الفاتورة");};
  $("#spay").onclick=()=>{const a=mn($("#sa").value),sp=$("#ss").value;if(!sp||!a||!$("#sd2").value){toast("اختر المورد وأدخل المبلغ");return;}
    data.purchases.push({id:uid(),date:$("#sd2").value,kind:"سداد",supplier:sp,item:$("#sn").value||"سداد دفعة",cat:"",qty:"",price:"",total:0,paid:a});
    act("edit","سداد "+nf(a)+" للمورد "+sp);save();$("#sa").value="";$("#sn").value="";draw();toast("تم تسجيل السداد");};
  $("#ball").onchange=e=>{buyAll=e.target.checked;draw();};$("#bfs").onchange=e=>{buySup=e.target.value;draw();};$("#bq2").oninput=e=>{buyQ=e.target.value;draw();$("#bq2").focus();};
  $("#bsup").onclick=e=>{const a=e.target.closest("[data-sf]");if(!a)return;e.preventDefault();buySup=a.dataset.sf;buyAll=true;$("#ball").checked=true;draw();};
  $("#bb").addEventListener("change",e=>{const t=e.target,tr=t.closest("tr");if(!t.dataset.f||!tr)return;const x=data.purchases[+tr.dataset.i],f=t.dataset.f;
    x[f]=["qty","price","paid"].includes(f)?(t.value===""?"":mn(t.value)):t.value;
    if(x.kind!=="سداد"&&(f==="qty"||f==="price"))x.total=r2m((x.qty===""?1:mn(x.qty))*mn(x.price));
    save();draw();});
  $("#bb").addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(!b)return;data.purchases.splice(+b.dataset.del,1);save();draw();});
  const rowsFor=()=>shownList().map(({x})=>x);
  $("#bxl").onclick=()=>{const L=rowsFor();act("export","تصدير المشتريات Excel");
    saveFile(`المشتريات-${s}.xlsx`,XLSX2.writeSheet("المشتريات",["التاريخ","النوع","المورد","الصنف / البيان","التصنيف","الكمية","السعر","الإجمالي","المدفوع","المتبقي"],L.map(x=>[dshow(x.date),x.kind==="سداد"?"سداد":"شراء",x.supplier||"",x.item||"",x.cat||"",x.qty===""?"":mn(x.qty),x.price===""?"":mn(x.price),buyTotal(x),buyPaid(x),r2m(buyTotal(x)-buyPaid(x))]),["","","","","","","إجمالي",r2m(L.reduce((a,x)=>a+buyTotal(x),0)),r2m(L.reduce((a,x)=>a+buyPaid(x),0)),r2m(L.reduce((a,x)=>a+buyTotal(x)-buyPaid(x),0))]));};
  $("#bpr").onclick=()=>{act("print","طباعة المشتريات");const L=rowsFor(),bal=supplierBalances();
    $("#printArea").innerHTML=`<div class="pg p1"><div class="rep"><div class="rh"><b>${esc(S.company)} — تقرير المشتريات</b><span>${buyAll?"كل الفترات":`الفترة: ${dshow(s)} إلى ${dshow(e)}`}${buySup?" — المورد: "+esc(buySup):""}</span></div>
     <div class="charts">${cbox("المشتريات حسب التصنيف",chartDonut(sumBy(L.filter(x=>x.kind!=="سداد"),x=>x.cat,buyTotal)))}${cbox("أكبر الموردين",chartHBars(sumBy(L.filter(x=>x.kind!=="سداد"),x=>x.supplier,buyTotal).slice(0,8)))}</div>
     <h4>أرصدة الموردين</h4><table><thead><tr><th class="l">المورد</th><th>المشتريات</th><th>المدفوع</th><th>المتبقي</th></tr></thead><tbody>${bal.map(b=>`<tr><td class="l">${esc(b.name)}</td><td class="n">${nf(b.total)}</td><td class="n">${nf(b.paid)}</td><td class="n">${nf(b.due)}</td></tr>`).join("")}</tbody></table>
     <h4>التفصيل</h4><table><thead><tr><th>التاريخ</th><th class="l">المورد</th><th class="l">البيان</th><th>التصنيف</th><th>الإجمالي</th><th>المدفوع</th></tr></thead><tbody>${L.map(x=>`<tr><td>${dshow(x.date)}</td><td class="l">${esc(x.supplier||"")}</td><td class="l">${x.kind==="سداد"?"سداد — ":""}${esc(x.item||"")}</td><td>${esc(x.cat||"")}</td><td class="n">${x.kind==="سداد"?"":nf(buyTotal(x))}</td><td class="n">${nf(buyPaid(x))}</td></tr>`).join("")}
     <tr class="s"><td colspan="4" class="l">الإجمالي</td><td class="n">${nf(L.reduce((a,x)=>a+buyTotal(x),0))}</td><td class="n">${nf(L.reduce((a,x)=>a+buyPaid(x),0))}</td></tr></tbody></table></div></div>`;setTimeout(()=>window.print(),150);};
  draw();
}

/* =================== صفحة الخزينة =================== */
let cashAll=false,cashType="";
function pCash(c){
  const S=data.settings,s=cur(),e=E.periodEnd(s),today=E.iso(new Date()),defDate=(today>=s&&today<=e)?today:s,A=S.cashAuto;
  const catsOf=t=>[...new Set([...(t==="وارد"?DEF_CASH_CATS_IN:DEF_CASH_CATS_OUT),...data.cash.filter(x=>x.type===t).map(x=>x.cat).filter(Boolean)])];
  c.innerHTML=`<div class="card"><h3>إعدادات الخزينة</h3><div class="form"><label>الرصيد الافتتاحي (ما في الخزينة قبل أول حركة)<input class="fld" type="number" step="any" id="co" value="${S.cashOpening||""}"></label></div>
   <div class="bar" style="margin-top:10px"><span class="hint">تسجيل تلقائي في الخزينة (كمنصرف):</span><label class="chk"><input type="checkbox" id="ap" ${A.purch?"checked":""}> المبلغ المدفوع في المشتريات</label><label class="chk"><input type="checkbox" id="ae" ${A.exp?"checked":""}> المصاريف الإضافية</label><label class="chk"><input type="checkbox" id="aa" ${A.adv?"checked":""}> سلف العمال</label></div>
   <div class="hint">المرتبات لا تُسجَّل تلقائياً — استخدم زر «تسجيل صرف مرتبات الفترة» عند الصرف الفعلي (صافي المرتب يكون خصم منه السلف أصلاً).</div></div>
  <div class="card"><h3>إضافة حركة</h3><div class="form"><label>التاريخ<input class="fld" type="date" id="cd" value="${defDate}"></label>
   <label>النوع<select class="fld" id="ct"><option>وارد</option><option>منصرف</option></select></label>
   <label>البند<input class="fld" id="cc" list="ccl"></label><datalist id="ccl"></datalist>
   <label>البيان<input class="fld" id="cn"></label><label>المبلغ<input class="fld" type="number" step="any" id="ca"></label></div>
   <div class="bar" style="margin-top:14px"><button class="btn t" id="cadd">${ICON.plus} إضافة</button><button class="btn g" id="csal">💵 تسجيل صرف مرتبات الفترة (${nf(calc().tot.net)})</button></div></div>
  <div class="kpis" id="ck"></div><div class="charts" id="cch"></div>
  <div class="bar"><label class="hint"><input type="checkbox" id="call" ${cashAll?"checked":""}> عرض كل الفترات</label><select class="fld" id="cft"><option value="">وارد ومنصرف</option><option>وارد</option><option>منصرف</option></select>
   <button class="btn g" id="cxl">${ICON.xl} Excel</button><button class="btn g" id="cpr">${ICON.print} طباعة</button></div>
  <div class="tablewrap"><table><thead><tr><th>التاريخ</th><th>النوع</th><th>البند</th><th class="l">البيان</th><th>المصدر</th><th>وارد</th><th>منصرف</th><th>الرصيد</th><th></th></tr></thead><tbody id="cb"></tbody></table></div>`;
  const fillCats=()=>{$("#ccl").innerHTML=catsOf($("#ct").value).map(x=>`<option value="${esc(x)}">`).join("");};fillCats();$("#ct").onchange=fillCats;$("#cft").value=cashType;
  let moves;
  const view=()=>{moves=cashMoves();const sg=m=>m.type==="وارد"?m.amount:-m.amount;let run=mn(S.cashOpening);const withBal=moves.map(m=>{run=r2m(run+sg(m));return {...m,bal:run};});
    return withBal.filter(m=>(cashAll||(m.date>=s&&m.date<=e))&&(!cashType||m.type===cashType));};
  const draw=()=>{
    const st=cashAll?{open:mn(S.cashOpening),...(()=>{const all=moves||cashMoves();const i=all.filter(m=>m.type==="وارد").reduce((a,m)=>a+m.amount,0),o=all.filter(m=>m.type!=="وارد").reduce((a,m)=>a+m.amount,0);return {inn:r2m(i),out:r2m(o),close:r2m(mn(S.cashOpening)+i-o),inList:all.filter(m=>m.type==="وارد"),outList:all.filter(m=>m.type!=="وارد")};})()}:cashStats(s,e,cashMoves());
    $("#ck").innerHTML=`<div class="kpi"><small>${cashAll?"الرصيد الافتتاحي":"رصيد أول الفترة"}</small><b>${nf(st.open)}</b></div><div class="kpi t"><small>الوارد</small><b>${nf(st.inn)}</b></div><div class="kpi r"><small>المنصرف</small><b>${nf(st.out)}</b></div><div class="kpi g"><small>${cashAll?"الرصيد الحالي":"رصيد آخر الفترة"}</small><b style="color:${st.close<0?"#b91c1c":"inherit"}">${nf(st.close)}</b></div>`;
    const ps=lastPeriods(6),all=cashMoves(),cs=ps.map(p=>cashStats(p,E.periodEnd(p),all));
    $("#cch").innerHTML=cbox("الوارد والمنصرف — آخر 6 فترات",chartCols(ps.map(periodLabel),[{name:"وارد",color:"#0f766e",vals:cs.map(x=>x.inn)},{name:"منصرف",color:"#dc2626",vals:cs.map(x=>x.out)}]))+cbox("رصيد الخزينة آخر كل فترة",chartLine(ps.map(periodLabel),cs.map(x=>x.close),"#1f2a44"))+cbox("المنصرف حسب البند",chartDonut(sumBy(st.outList,m=>m.cat,m=>m.amount)))+cbox("الوارد حسب البند",chartHBars(sumBy(st.inList,m=>m.cat,m=>m.amount),{color:"#0f766e"}));
    const L=view();
    $("#cb").innerHTML=L.map(m=>{const isIn=m.type==="وارد";return `<tr ${m.auto?'style="background:#f8fafc"':""}><td>${m.auto?dshow(m.date):`<input class="cell m" type="date" data-f="date" data-id="${esc(m.id)}" value="${esc(m.date)}">`}</td><td>${isIn?'<span class="badge ok">وارد</span>':'<span class="badge">منصرف</span>'}</td><td>${m.auto?esc(m.cat):`<input class="cell m" data-f="cat" data-id="${esc(m.id)}" value="${esc(m.cat)}">`}</td><td class="l">${m.auto?esc(m.note):`<input class="cell w" data-f="note" data-id="${esc(m.id)}" value="${esc(m.note)}">`}</td><td>${m.auto?`<small class="hint">تلقائي — ${esc(m.src)}</small>`:"يدوي"}</td>
      <td class="n">${isIn?(m.auto?nf(m.amount):`<input class="cell m" type="number" step="any" data-f="amount" data-id="${esc(m.id)}" value="${m.amount}">`):""}</td><td class="n">${!isIn?(m.auto?nf(m.amount):`<input class="cell m" type="number" step="any" data-f="amount" data-id="${esc(m.id)}" value="${m.amount}">`):""}</td><td class="n"><b style="color:${m.bal<0?"#b91c1c":"inherit"}">${nf(m.bal)}</b></td><td>${m.auto?"":`<button class="btn r" data-del="${esc(m.id)}">حذف</button>`}</td></tr>`;}).join("")||'<tr><td colspan="9" class="hint" style="padding:24px">لا توجد حركات في هذه الفترة</td></tr>';
    applyRO($("#content"));
  };
  moves=cashMoves();draw();
  $("#co").onchange=e=>{S.cashOpening=mn(e.target.value);save();draw();};
  [["ap","purch"],["ae","exp"],["aa","adv"]].forEach(([id,k])=>$("#"+id).onchange=ev=>{S.cashAuto[k]=ev.target.checked;save();draw();});
  $("#cadd").onclick=()=>{const a=mn($("#ca").value);if(!$("#cd").value||!a){toast("أكمل التاريخ والمبلغ");return;}
    data.cash.push({id:uid(),date:$("#cd").value,type:$("#ct").value,cat:$("#cc").value.trim()||"أخرى",note:$("#cn").value,amount:a});act("edit",`حركة خزينة (${$("#ct").value}) ${nf(a)}`);save();$("#ca").value="";$("#cn").value="";draw();toast("تمت الإضافة");};
  $("#csal").onclick=()=>{const R=calc(),note="صافي مرتبات "+dshow(R.start)+" ← "+dshow(R.end);
    if(data.cash.some(x=>x.note===note)){toast("تم تسجيل صرف مرتبات هذه الفترة من قبل");return;}
    data.cash.push({id:uid(),date:defDate,type:"منصرف",cat:"مرتبات",note,amount:R.tot.net});act("edit","تسجيل صرف مرتبات "+nf(R.tot.net));save();draw();toast("تم تسجيل صرف المرتبات (يمكن تعديل المبلغ من الجدول)");};
  $("#call").onchange=e=>{cashAll=e.target.checked;draw();};$("#cft").onchange=e=>{cashType=e.target.value;draw();};
  $("#cb").addEventListener("change",e=>{const t=e.target,x=data.cash.find(v=>v.id===t.dataset.id);if(!x)return;x[t.dataset.f]=t.dataset.f==="amount"?mn(t.value):t.value;save();draw();});
  $("#cb").addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(!b)return;data.cash=data.cash.filter(x=>x.id!==b.dataset.del);save();draw();});
  $("#cxl").onclick=()=>{const L=view();act("export","تصدير الخزينة Excel");saveFile(`الخزينة-${s}.xlsx`,XLSX2.writeSheet("الخزينة",["التاريخ","النوع","البند","البيان","المصدر","وارد","منصرف","الرصيد"],L.map(m=>[dshow(m.date),m.type,m.cat,m.note,m.auto?"تلقائي — "+m.src:"يدوي",m.type==="وارد"?m.amount:"",m.type!=="وارد"?m.amount:"",m.bal]),["","","","","الإجمالي",r2m(L.filter(m=>m.type==="وارد").reduce((a,m)=>a+m.amount,0)),r2m(L.filter(m=>m.type!=="وارد").reduce((a,m)=>a+m.amount,0)),L.length?L[L.length-1].bal:""]));};
  $("#cpr").onclick=()=>{act("print","طباعة الخزينة");const L=view(),st=cashAll?null:cashStats(s,e),ps=lastPeriods(6),all=cashMoves(),cs=ps.map(p=>cashStats(p,E.periodEnd(p),all));
    $("#printArea").innerHTML=`<div class="pg p1"><div class="rep"><div class="rh"><b>${esc(S.company)} — كشف الخزينة</b><span>${cashAll?"كل الفترات":`الفترة: ${dshow(s)} إلى ${dshow(e)}`}</span></div>
     ${st?`<table><tbody><tr><td class="l">رصيد أول الفترة</td><td class="n">${nf(st.open)}</td></tr><tr><td class="l">الوارد</td><td class="n">${nf(st.inn)}</td></tr><tr><td class="l">المنصرف</td><td class="n">${nf(st.out)}</td></tr><tr class="s"><td class="l">رصيد آخر الفترة</td><td class="n">${nf(st.close)}</td></tr></tbody></table>`:""}
     <div class="charts">${cbox("الوارد والمنصرف — آخر 6 فترات",chartCols(ps.map(periodLabel),[{name:"وارد",color:"#0f766e",vals:cs.map(x=>x.inn)},{name:"منصرف",color:"#dc2626",vals:cs.map(x=>x.out)}]))}${cbox("المنصرف حسب البند",chartDonut(sumBy(L.filter(m=>m.type!=="وارد"),m=>m.cat,m=>m.amount)))}</div>
     <h4>الحركات</h4><table><thead><tr><th>التاريخ</th><th>النوع</th><th>البند</th><th class="l">البيان</th><th>وارد</th><th>منصرف</th><th>الرصيد</th></tr></thead><tbody>${L.map(m=>`<tr><td>${dshow(m.date)}</td><td>${m.type}</td><td>${esc(m.cat)}</td><td class="l">${esc(m.note)}</td><td class="n">${m.type==="وارد"?nf(m.amount):""}</td><td class="n">${m.type!=="وارد"?nf(m.amount):""}</td><td class="n">${nf(m.bal)}</td></tr>`).join("")}</tbody></table></div></div>`;setTimeout(()=>window.print(),150);};
}
