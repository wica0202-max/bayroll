/* دورة المزامنة: تقرأ من المجلد المشترك، تدمج مع بيانات الجهاز، وتكتب النتيجة */
(function(g){
const M=typeof module!=="undefined"?require("./merge.js"):g.Merge;
/* io: {read():{rev,data,base,copies:[{name,data}]}|null, write(str,expectRev,foldedNames):{ok,conflict}, setBase(str,rev)}
   getMine(): كائن البيانات الحالي. setMine(obj): استبداله. */
async function tick(io,getMine,setMine){
  const r=await io.read();if(!r)return {status:"offline"};
  if(r.data===null){ // لا يوجد ملف مشترك بعد
    const mine=getMine();const w=await io.write(JSON.stringify(mine),0,[]);return {status:w.ok?"pushed":"conflict"};}
  let theirs=JSON.parse(r.data);const base=r.base?JSON.parse(r.base):{};
  const folded=[];
  for(const c of r.copies||[]){try{theirs=M.merge3(base,theirs,JSON.parse(c.data));folded.push(c.name);}catch(e){}}
  const mine=getMine(),merged=M.merge3(base,mine,theirs);
  const changedLocal=!M.eq(merged,mine);
  if(changedLocal)setMine(merged);                      // نفس الدورة: بلا await بين القراءة والاستبدال
  const mergedStr=JSON.stringify(merged);
  if(M.eq(merged,theirs)&&!folded.length){await io.setBase(mergedStr,r.rev);return {status:"ok",changedLocal};}
  const w=await io.write(mergedStr,r.rev,folded);
  if(!w.ok)return {status:"conflict",changedLocal};
  return {status:"pushed",changedLocal};
}
const api={tick};g.SyncCore=api;if(typeof module!=="undefined")module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
