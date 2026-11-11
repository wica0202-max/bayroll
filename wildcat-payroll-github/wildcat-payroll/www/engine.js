/* محرك حساب المرتبات — نفس معادلات شيت Excel */
(function(g){
const r2=x=>{const s=x<0?-1:1;return s*Math.round(Math.abs(x)*100+1e-9)/100;};
const num=v=>{const n=parseFloat(v);return isFinite(n)?n:0;};
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const parse=s=>{const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d);};
const tmin=v=>{const m=/(\d{1,2}):(\d{2})/.exec(String(v==null?"":v));return m?(+m[1])*60+(+m[2]):null;};
function netHours(w,S){const a=tmin(w.shiftIn),b=tmin(w.shiftOut);if(a==null||b==null)return "";const rest=num(((S&&S.attRules)||{}).restMin!=null?S.attRules.restMin:30);return Math.round(((b>=a?b-a:b+1440-a)-rest)/60*100)/100;}
function expenses(data,start){const end=periodEnd(start),list=(data.expenses||[]).filter(x=>x.date>=start&&x.date<=end),byCat={};
  list.forEach(x=>{const k=x.cat||"أخرى";byCat[k]=(byCat[k]||0)+num(x.amount);});
  return {list,byCat,total:list.reduce((a,x)=>a+num(x.amount),0)};}
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d);};
function periodEnd(start){const d=parse(start);const e=new Date(d.getFullYear(),d.getMonth()+1,d.getDate());e.setDate(e.getDate()-1);return iso(e);}
function shiftPeriod(start,n){const d=parse(start);return iso(new Date(d.getFullYear(),d.getMonth()+n,d.getDate()));}
function countFridays(start,end){let c=0;for(let d=parse(start),e=parse(end);d<=e;d.setDate(d.getDate()+1))if(d.getDay()===5)c++;return c;}
function dayCount(start,end){return Math.round((parse(end)-parse(start))/86400000)+1;}
const DEFAULT_SETTINGS={company:"Wild Cat",periodStart:"2026-09-27",daysBasis:30,hoursDay:8,otDay:1.25,fridayMult:1.5,absMult:1,deficitMult:1,minWage:7000,
 departments:["القص","الخياطة","التشطيب","الكي والتعبئة","المخزن","الإدارة"],
 attRules:{restMin:30,graceMin:10,otStartMin:10},
 expenseCats:["إيجار","كهرباء","مواصلات","نقل","مصاريف أخرى"]};
const TXN_TYPES=["سلفة","جزاء","خصم آخر","مكافأة","بدل"];
const ENTRY_KEYS=["absent","otMin","deficitMin","fridayMin"];
function entryOf(data,start,id){const e=(data.entries[start]||{})[id]||{};const o={};ENTRY_KEYS.forEach(k=>o[k]=num(e[k]));return o;}
function compute(data,start){
  const S=data.settings,end=periodEnd(start),fr=countFridays(start,end),workDays=dayCount(start,end)-fr;
  const rows=data.workers.map((w,i)=>{
    const id=String(w.id),e=entryOf(data,start,id),wage=num(w.wage),monthly=w.type!=="يومي";
    const daily=monthly?r2(wage/num(S.daysBasis||30)):wage;
    const present=Math.max(0,workDays-e.absent);
    const basic=r2(monthly?Math.max(0,wage-e.absent*daily*num(S.absMult)):present*daily);
    const hw=num(w.hours)||num(S.hoursDay)||8, otm=num(w.otMult)||num(S.otDay);
    const otAmt=r2(e.otMin/60*daily/hw*otm);
    const friday=r2(e.fridayMin/60*daily/hw*num(S.fridayMult));
    let bonus=0,adv=0,pen=0,bonusDays=0,penDays=0;
    for(const t of data.txns){ if(String(t.workerId)!==id||t.date<start||t.date>end)continue; const dy=num(t.days),a=dy?r2(dy*daily):num(t.amount);
      if(t.type==="مكافأة"||t.type==="بدل"){bonus+=a;bonusDays+=dy;} else if(t.type==="سلفة")adv+=a; else {pen+=a;penDays+=dy;} }
    const deficit=r2(e.deficitMin/60*daily/hw*num(S.deficitMult));
    const gross=basic+otAmt+friday+bonus, ded=adv+pen+deficit, net=gross-ded;
    const warns=[]; if(w.status==="موقوف")warns.push("عامل موقوف");
    if(monthly&&wage<num(S.minWage))warns.push("أقل من الحد الأدنى"); if(!monthly&&present===0)warns.push("غياب كل الفترة"); if(net<0)warns.push("الصافي سالب");
    return {idx:i+1,w,id,dept:w.dept,type:monthly?"شهري":"يومي",shiftIn:w.shiftIn||"",shiftOut:w.shiftOut||"",netHours:netHours(w,S),wage,daily,hw,otm,bonusDays,penDays,present,...e,basic,otAmt,friday,bonus,gross,adv,pen,deficit,ded,net,warns};
  });
  const tot={};["wage","present","absent","otMin","deficitMin","fridayMin","basic","otAmt","friday","bonus","gross","adv","pen","deficit","ded","net"].forEach(k=>tot[k]=rows.reduce((s,r)=>s+r[k],0));
  return {start,end,workDays,fridays:fr,rows,tot};
}
const fmt=(n,d=2)=>(n==null||n==="")?"":Number(n).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const fmt0=n=>Number(n).toLocaleString("en-US",{maximumFractionDigits:2});
g.Engine={r2,num,tmin,netHours,expenses,iso,parse,addDays,periodEnd,shiftPeriod,countFridays,dayCount,DEFAULT_SETTINGS,TXN_TYPES,ENTRY_KEYS,compute,fmt,fmt0,entryOf};
})(typeof window!=="undefined"?window:globalThis);
