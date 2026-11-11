/* منطق الحضور والبصمة — استيراد شيت البصمة وحساب الغياب والعجز والإضافي */
(function(g){
const E=g.Engine;
const DEF_RULES={restMin:30,graceMin:10,otStartMin:10};
const AR=s=>String(s==null?"":s).replace(/[\u064B-\u065F\u0640]/g,"").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/\s+/g," ").trim();
const DOW={sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6,"الاحد":0,"الاثنين":1,"الثلاثاء":2,"الاربعاء":3,"الخميس":4,"الجمعه":5,"السبت":6};
const dowOf=v=>{if(v==null)return null;const k=AR(v).toLowerCase();if(k in DOW)return DOW[k];const s=k.slice(0,3);return s in DOW?DOW[s]:null;};
const pad=n=>String(n).padStart(2,"0");
const hm=m=>m==null||m===""?"":pad(Math.floor(m/60))+":"+pad(m%60);
function toMin(v){
  if(v==null||v==="")return null;
  if(typeof v==="number"){if(v<0||v>1.0000001)return null;return Math.round(v*1440)%1440;}
  const m=/(\d{1,2}):(\d{2})/.exec(String(v));return m?(+m[1])*60+(+m[2]):null;
}
const isoOf=(y,m,d)=>y+"-"+pad(m)+"-"+pad(d);
function validDate(y,m,d){const t=new Date(y,m-1,d);return t.getFullYear()===y&&t.getMonth()===m-1&&t.getDate()===d;}
function parseDate(v,dayName){
  if(v==null||v==="")return null;
  if(typeof v==="number"){const d=new Date(Date.UTC(1899,11,30)+Math.round(v)*86400000);return isoOf(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate());}
  const s=String(v).trim();let m=/^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);if(m)return isoOf(+m[1],+m[2],+m[3]);
  m=/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(s);if(!m)return null;
  const a=+m[1],b=+m[2],y=+m[3],want=dowOf(dayName);
  const mdy=validDate(y,a,b)?isoOf(y,a,b):null,dmy=validDate(y,b,a)?isoOf(y,b,a):null;
  if(mdy&&!dmy)return mdy;if(dmy&&!mdy)return dmy;if(!mdy&&!dmy)return null;
  if(want!=null){const dm=E.parse(mdy).getDay(),dd=E.parse(dmy).getDay();if(dm===want&&dd!==want)return mdy;if(dd===want&&dm!==want)return dmy;}
  return mdy; // الشيت يستخدم شهر/يوم/سنة
}
const dowIso=iso=>E.parse(iso).getDay();

/* ---- قراءة صفوف الشيت (من XLSX2.readRows) ---- */
function parseRows(rows){
  let hdr=null,hr=-1;
  for(let i=0;i<rows.length&&i<15;i++){const c=rows[i].cells;if(Object.values(c).some(v=>typeof v==="string"&&AR(v).startsWith("الكود"))){hdr=c;hr=i;break;}}
  if(!hdr)throw new Error("لم أجد صف العناوين (عمود «الكود»). تأكد إن الملف هو شيت البصمة.");
  const col={};
  for(const k of Object.keys(hdr)){const l=AR(hdr[k]);
    if(l.startsWith("الكود"))col.code=k;else if(l==="الاسم")col.name=k;else if(l==="التاريخ")col.date=k;else if(l==="اليوم")col.day=k;
    else if(l==="الحضور")col.sIn=k;else if(l==="الانصراف")col.sOut=k;
    else if(l.includes("الحضور")&&l.includes("الفعلي"))col.aIn=k;else if(l.includes("الانصراف")&&l.includes("الفعلي"))col.aOut=k;
    else if(l.includes("الاضافي")&&l.includes("بالدقيق"))col.fOt=k;else if(l.includes("العجز")&&l.includes("بالدقيق"))col.fDef=k;
    else if(l.includes("البصم"))col.pun=k;}
  if(!col.code||!col.date)throw new Error("الملف ينقصه عمود «الكود» أو «التاريخ».");
  if(!col.aIn&&!col.aOut&&!col.pun)throw new Error("الملف ينقصه أعمدة الحضور والانصراف الفعلي.");
  const out=[],bad=[];
  for(let i=hr+1;i<rows.length;i++){
    const c=rows[i].cells,code=c[col.code];if(code==null||code==="")continue;
    const date=parseDate(c[col.date],col.day?c[col.day]:null);if(!date){bad.push(rows[i].r);continue;}
    let aIn=col.aIn?toMin(c[col.aIn]):null,aOut=col.aOut?toMin(c[col.aOut]):null;
    if(aIn==null&&aOut==null&&col.pun){const t=[...String(c[col.pun]||"").matchAll(/(\d{1,2}):(\d{2})/g)].map(m=>(+m[1])*60+(+m[2]));
      if(t.length>1){aIn=t[0];aOut=t[t.length-1];}else if(t.length===1){if(t[0]<720)aIn=t[0];else aOut=t[0];}}
    const num=v=>typeof v==="number"?v:(v!=null&&v!==""&&isFinite(parseFloat(v))?parseFloat(v):null);
    out.push({code:String(code).trim(),name:c[col.name]==null?"":String(c[col.name]),date,sIn:col.sIn?toMin(c[col.sIn]):null,sOut:col.sOut?toMin(c[col.sOut]):null,aIn,aOut,
      fOt:col.fOt?num(c[col.fOt]):null,fDef:col.fDef?num(c[col.fDef]):null,row:rows[i].r});
  }
  return {recs:out,bad,hasFileCalc:!!(col.fOt||col.fDef),hasSched:!!(col.sIn&&col.sOut)};
}

/* ---- التكرار: الربط بالكود فقط. أول صف لكل (كود، تاريخ) يُعتمد والباقي يُتجاهل مع تنبيه ---- */
function dedupe(recs){
  const seen={},keep=[],notes=[];
  for(const r of recs){const k=r.code+"|"+r.date;
    if(!seen[k]){seen[k]=r;keep.push(r);}
    else notes.push({row:r.row,date:r.date,code:r.code,name:r.name,ot:r.fOt,aIn:r.aIn,aOut:r.aOut});}
  return {recs:keep,notes};
}

/* ---- حساب يوم واحد ---- */
function dayCalc(r,w,R,useFile){
  const sIn=r.sIn!=null?r.sIn:toMin(w&&w.shiftIn),sOut=r.sOut!=null?r.sOut:toMin(w&&w.shiftOut);
  const has=r.aIn!=null||r.aOut!=null,both=r.aIn!=null&&r.aOut!=null;
  const o={present:has,incomplete:has&&!both,late:0,early:0,ot:0,def:0,fri:0,sIn,sOut,fileDiff:false};
  if(!has)return o;
  if(dowIso(r.date)===5)return o; // الجمعة تُدخل يدوياً ولا يحسبها الاستيراد
  if(r.aIn!=null&&sIn!=null){const l=r.aIn-sIn;o.late=l>R.graceMin?l:0;}
  if(r.aOut!=null&&sOut!=null){const e=sOut-r.aOut;o.early=e>R.graceMin&&e<720?e:0;const x=r.aOut-sOut;o.ot=x>=R.otStartMin&&x<720?x:0;}
  o.def=o.late+o.early;
  if(useFile){
    if(r.fOt!=null){if(r.fOt!==o.ot)o.fileDiff=true;o.ot=r.fOt;}
    if(r.fDef!=null){if(r.fDef!==o.def)o.fileDiff=true;o.def=r.fDef;}
  }
  return o;
}

/* ---- ملخص كل العمال للفترة ---- */
function buildDraft(parsed,data,start,opt){
  opt=opt||{};const R={...DEF_RULES,...(data.settings.attRules||{})},end=E.periodEnd(start);
  const dd=dedupe(parsed.recs.map(r=>({...r})));
  const inPeriod=dd.recs.filter(r=>r.date>=start&&r.date<=end);
  const dates=[...new Set(inPeriod.map(r=>r.date))].sort();
  const lastDate=dates[dates.length-1]||start;
  const workDates=dates.filter(d=>dowIso(d)!==5&&inPeriod.some(r=>r.date===d&&(r.aIn!=null||r.aOut!=null)));
    const byCode={};for(const r of inPeriod)(byCode[r.code]=byCode[r.code]||[]).push(r);
  const wmap={};data.workers.forEach(w=>wmap[String(w.id)]=w);
  const rows=[];
  for(const w of data.workers){
    const id=String(w.id),list=byCode[id];
    if(!list){rows.push({id,name:w.name,inFile:false});continue;}
    let ot=0,def=0,present=0,incomplete=0,fileDiff=0;const pres=new Set();
    for(const r of list){const c=dayCalc(r,w,R,opt.useFile);if(!c.present)continue;pres.add(r.date);
      if(dowIso(r.date)!==5){present++;ot+=c.ot;def+=c.def;}
      if(c.incomplete)incomplete++;if(c.fileDiff)fileDiff++;}
    const hire=w.hire||"";
    const absent=workDates.filter(d=>d<=lastDate&&(!hire||d>=hire)&&!pres.has(d)).length;
    rows.push({id,name:w.name,inFile:true,fileName:(list[0]||{}).name||"",present,absent,otMin:ot,deficitMin:def,incomplete,fileDiff});
  }
  const unknown=[];for(const c in byCode)if(!wmap[c])unknown.push({code:c,name:(byCode[c][0]||{}).name||"",n:byCode[c].length});
  // الدوام الأكثر تكراراً لكل عامل (لتعبئة الحضور/الانصراف الفارغ)
  const shifts={};for(const c in byCode){const cnt={};for(const r of byCode[c]){if(r.sIn!=null&&r.sOut!=null&&dowIso(r.date)!==5){const k=r.sIn+"-"+r.sOut;cnt[k]=(cnt[k]||0)+1;}}
    const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];if(top){const [a,b]=top[0].split("-").map(Number);shifts[c]={sIn:a,sOut:b};}}
  return {rows,unknown,notes:dd.notes,bad:parsed.bad,dates,workDates,from:dates[0]||null,to:lastDate,shifts,
    recs:inPeriod.map(r=>[r.code,r.date,r.sIn,r.sOut,r.aIn,r.aOut,r.fOt,r.fDef,r.name]),outside:dd.recs.length-inPeriod.length};
}

/* ---- تفاصيل أيام عامل واحد من السجلات المحفوظة ---- */
function daysOf(att,w,data,useFile){
  const R={...DEF_RULES,...(data.settings.attRules||{})};
  return att.recs.filter(a=>a[0]===String(w.id)).map(a=>{const r={code:a[0],date:a[1],sIn:a[2],sOut:a[3],aIn:a[4],aOut:a[5],fOt:a[6],fDef:a[7]};
    return {date:r.date,dow:dowIso(r.date),r,c:dayCalc(r,w,R,useFile)};}).sort((x,y)=>x.date.localeCompare(y.date));
}
const netHours=E.netHours;

g.Att={DEF_RULES,toMin,hm,parseDate,parseRows,dedupe,dayCalc,buildDraft,daysOf,netHours,dowIso};
})(typeof window!=="undefined"?window:globalThis);
