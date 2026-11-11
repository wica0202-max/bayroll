/* دمج ثلاثي (base / mine / theirs) لبيانات البرنامج — يُستخدم في كل الأجهزة */
(function(g){
const isObj=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const stable=v=>v===undefined?"u":JSON.stringify(v,(k,x)=>isObj(x)?Object.keys(x).sort().reduce((o,kk)=>(o[kk]=x[kk],o),{}):x);
const eq=(a,b)=>stable(a)===stable(b);
const idArr=a=>Array.isArray(a)&&a.every(x=>isObj(x)&&x.id!==undefined&&x.id!==null);
function merge3(b,m,t){
  if(m===undefined&&t===undefined)return undefined;
  if(eq(m,t))return m;
  if(eq(m,b))return t;
  if(eq(t,b))return m;
  if(m===undefined)return t;           // حذفتُ أنا وهو عدّل: نُبقي تعديله
  if(t===undefined)return m;           // حذف هو وأنا عدّلت: نُبقي تعديلي
  if(isObj(m)&&isObj(t)){const bb=isObj(b)?b:{},o={};
    for(const k of new Set([...Object.keys(t),...Object.keys(m)])){const v=merge3(bb[k],m[k],t[k]);if(v!==undefined)o[k]=v;}return o;}
  if(idArr(m)&&idArr(t)&&(b===undefined||idArr(b))){
    const key=x=>String(x.id),mm=new Map(m.map(x=>[key(x),x])),tm=new Map(t.map(x=>[key(x),x])),bm=new Map((b||[]).map(x=>[key(x),x])),out=[];
    for(const x of t){const k=key(x),v=merge3(bm.get(k),mm.get(k),x);if(v!==undefined)out.push(v);}
    for(const x of m){const k=key(x);if(tm.has(k))continue;const v=merge3(bm.get(k),x,undefined);if(v!==undefined)out.push(v);}
    return out;}
  return m;                            // تعارض حقيقي: الأحدث (أنا) يفوز
}
g.Merge={merge3,eq,stable};
if(typeof module!=="undefined")module.exports=g.Merge;
})(typeof window!=="undefined"?window:globalThis);
