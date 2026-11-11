/* طبقة "native" للمتصفح/الموبايل — تحاكي واجهة نسخة الويندوز (preload.js) فيعمل نفس app.js بلا تعديل.
   التخزين: IndexedDB. المزامنة: (1) تبادل ملف payroll-data.json  (2) Google Drive API مباشرة. */
(function(){
if(window.native)return;
/* ---------- IndexedDB بسيط ---------- */
const DB=(()=>{let p=null;const open=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open("wildcat-payroll",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}));
  const tx=(m,f)=>open().then(db=>new Promise((res,rej)=>{const t=db.transaction("kv",m),s=t.objectStore("kv"),q=f(s);t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error);}));
  return {get:k=>tx("readonly",s=>s.get(k)),set:(k,v)=>tx("readwrite",s=>s.put(v,k)),del:k=>tx("readwrite",s=>s.delete(k))};})();
const uuid=()=>(crypto.randomUUID?crypto.randomUUID():"d"+Date.now().toString(36)+Math.random().toString(36).slice(2,10));
const uiReady=new Promise(r=>{window.__mobileUIReady=r;setTimeout(r,6000);});
const SHARED="payroll-data.json",GAPI="https://www.googleapis.com";
let cfg=null,base=null,shared=null,outbox=null,lastErr="",lastOk=0,logs=[],logDirty=false;
const ready=(async()=>{
  cfg=(await DB.get("cfg").catch(()=>null))||{};
  if(!cfg.deviceId){cfg.deviceId=uuid();cfg.deviceName="الموبايل";}
  base=(await DB.get("base").catch(()=>null))||null;shared=(await DB.get("shared").catch(()=>null))||null;outbox=(await DB.get("outbox").catch(()=>null))||null;
  logs=(await DB.get("log").catch(()=>null))||[];
  await DB.set("cfg",cfg).catch(()=>{});
})();
const saveCfg=()=>DB.set("cfg",cfg).catch(()=>{});
const j=(s,d)=>{try{return JSON.parse(s);}catch(e){return d;}};

/* ---------- Google Drive ---------- */
let tok=null,tokExp=0;try{const t=JSON.parse(localStorage.getItem("gd_tok")||"null");if(t&&t.exp>Date.now()){tok=t.t;tokExp=t.exp;}}catch(e){}
function loadGIS(){return new Promise((res,rej)=>{if(window.google&&google.accounts&&google.accounts.oauth2)return res();const s=document.createElement("script");s.src="https://accounts.google.com/gsi/client";s.onload=()=>res();s.onerror=()=>rej(new Error("تعذّر تحميل تسجيل الدخول من Google (تأكد من الإنترنت)"));document.head.appendChild(s);});}
async function getToken(interactive){
  if(tok&&Date.now()<tokExp-60000)return tok;
  if(!interactive)throw new Error("انتهت جلسة Google — اضغط زر 🔄 لإعادة الاتصال");
  if(!cfg.clientId)throw new Error("لم يُدخل معرّف العميل (Client ID)");
  await loadGIS();
  return new Promise((res,rej)=>{
    const tc=google.accounts.oauth2.initTokenClient({client_id:cfg.clientId,scope:"https://www.googleapis.com/auth/drive",
      callback:r=>{if(r.error)return rej(new Error("رفض تسجيل الدخول: "+(r.error_description||r.error)));tok=r.access_token;tokExp=Date.now()+(+r.expires_in||3600)*1000;try{localStorage.setItem("gd_tok",JSON.stringify({t:tok,exp:tokExp}));}catch(e){}res(tok);},
      error_callback:e=>rej(new Error("لم يكتمل تسجيل الدخول ("+(e&&e.type||"إلغاء")+")"))});
    tc.requestAccessToken({prompt:cfg.consented?"":"consent"});cfg.consented=true;saveCfg();});
}
async function gfetch(url,opt,retry){
  const t=await getToken(false);opt=opt||{};opt.headers={...(opt.headers||{}),Authorization:"Bearer "+t};
  const r=await fetch(url,opt);
  if(r.status===401&&!retry){tok=null;tokExp=0;try{localStorage.removeItem("gd_tok");}catch(e){}return gfetch(url,opt,true);}
  if(!r.ok){let m="";try{m=(await r.json()).error.message;}catch(e){}throw new Error("Drive "+r.status+(m?": "+m:""));}
  return r;
}
const q1=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
async function glist(q,fields){const r=await gfetch(`${GAPI}/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent("files("+(fields||"id,name,version,modifiedTime,mimeType")+")")}&pageSize=200&supportsAllDrives=true&includeItemsFromAllDrives=true`);return (await r.json()).files||[];}
async function gtext(id){return (await gfetch(`${GAPI}/drive/v3/files/${id}?alt=media&supportsAllDrives=true`)).text();}
async function gput(id,str){await gfetch(`${GAPI}/upload/drive/v3/files/${id}?uploadType=media&supportsAllDrives=true`,{method:"PATCH",headers:{"Content-Type":"application/json; charset=UTF-8"},body:str});}
async function gcreate(name,parent,str){
  const b="wc"+Date.now(),body=`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name,parents:[parent]})}\r\n--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${str}\r\n--${b}--`;
  const r=await gfetch(`${GAPI}/upload/drive/v3/files?uploadType=multipart&fields=id&supportsAllDrives=true`,{method:"POST",headers:{"Content-Type":"multipart/related; boundary="+b},body});return (await r.json()).id;}
async function gfolder(name,parent){const r=await gfetch(`${GAPI}/drive/v3/files?supportsAllDrives=true&fields=id`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,mimeType:"application/vnd.google-apps.folder",parents:[parent]})});return (await r.json()).id;}
const subs={};
async function sub(name,create){
  if(subs[name])return subs[name];
  const f=await glist(`'${q1(cfg.folderId)}' in parents and name='${q1(name)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,"id");
  if(f[0])return subs[name]=f[0].id;if(!create)return null;return subs[name]=await gfolder(name,cfg.folderId);
}
async function findFolder(name){
  const f=await glist(`name='${q1(name)}' and trashed=false and (mimeType='application/vnd.google-apps.folder' or mimeType='application/vnd.google-apps.shortcut')`,"id,name,mimeType,shortcutDetails");
  const x=f.find(a=>a.mimeType.endsWith("folder"))||f[0];if(!x)return null;return x.mimeType.endsWith("shortcut")&&x.shortcutDetails?x.shortcutDetails.targetId:x.id;
}
async function driveMain(){const f=await glist(`'${q1(cfg.folderId)}' in parents and name contains 'payroll-data' and trashed=false`,"id,name,version");return {main:f.find(a=>a.name===SHARED)||null,copies:f.filter(a=>a.name!==SHARED&&/^payroll-data.*\.json$/.test(a.name))};}
let mainCache={ver:null,obj:null};

const providers={
  file:{
    read(){if(!shared)return null;lastErr="";lastOk=Date.now();return {rev:shared.rev,data:shared.data,base:base&&base.data||null,baseRev:base?base.rev:0,copies:[]};},
    async write(str,expect){if(!shared||shared.rev!==expect)return {ok:false,conflict:true};
      if(str===shared.data){cfg.dirtyOut=false;await saveCfg();return {ok:true,rev:expect};}
      if(!outbox||outbox._s!==str){outbox={rev:expect+1,writer:cfg.deviceId,writerName:cfg.deviceName,time:Date.now(),data:JSON.parse(str),_s:str};cfg.dirtyOut=true;
        base={rev:shared.rev,data:shared.data}; // الأساس = آخر نسخة من الملف المشترك (وليس ما كتبناه)
        await Promise.all([DB.set("outbox",outbox),DB.set("base",base),saveCfg()]);}
      return {ok:true,rev:expect+1};},
    heartbeat(){return true;},devices(){return [{id:cfg.deviceId,name:cfg.deviceName,host:"هذا الجهاز (تبادل ملف)",lastSeen:Date.now(),user:"",page:""}];},removeDevice(){return true;},
    activity(limit){return logs.slice(-limit).reverse();}
  },
  drive:{
    async read(){
      try{
        const {main,copies}=await driveMain();if(!main){lastErr="";lastOk=Date.now();return {rev:0,data:null,base:base&&base.data||null,baseRev:base?base.rev:0,copies:[]};}
        let obj;if(mainCache.ver===main.version&&mainCache.id===main.id)obj=mainCache.obj;else{obj=j(await gtext(main.id),null);mainCache={ver:main.version,id:main.id,obj};}
        const cp=[];for(const c of copies){try{cp.push({name:c.name,data:await gtext(c.id),id:c.id});}catch(e){}}
        lastErr="";lastOk=Date.now();
        return {rev:obj?obj.rev:0,data:obj?JSON.stringify(obj.data):null,base:base&&base.data||null,baseRev:base?base.rev:0,copies:cp};
      }catch(e){lastErr=String(e.message||e);return null;}
    },
    async write(str,expect,folded){
      try{
        const {main}=await driveMain(),curObj=main?j(await gtext(main.id),null):null,cur=curObj?curObj.rev:0;if(cur!==expect)return {ok:false,conflict:true};
        const body=JSON.stringify({rev:cur+1,writer:cfg.deviceId,writerName:cfg.deviceName,time:Date.now(),data:JSON.parse(str)});
        let id=main&&main.id;if(id)await gput(id,body);else id=await gcreate(SHARED,cfg.folderId,body);
        const chk=j(await gtext(id),null);if(!chk||chk.writer!==cfg.deviceId||chk.rev!==cur+1)return {ok:false,conflict:true};
        base={rev:cur+1,data:str};await DB.set("base",base);mainCache={ver:null,obj:null};
        for(const n of folded||[]){try{const f=(await glist(`'${q1(cfg.folderId)}' in parents and name='${q1(n)}' and trashed=false`,"id"))[0];if(f)await gfetch(`${GAPI}/drive/v3/files/${f.id}?supportsAllDrives=true`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:n+".merged"})});}catch(e){}}
        lastErr="";lastOk=Date.now();return {ok:true,rev:cur+1};
      }catch(e){lastErr=String(e.message||e);return {ok:false,error:lastErr};}
    },
    async heartbeat(info){try{const d=await sub("devices",true),body=JSON.stringify({id:cfg.deviceId,name:cfg.deviceName,host:"موبايل",lastSeen:Date.now(),...info});
      if(!providers.drive._hb){const f=await glist(`'${q1(d)}' in parents and name='${q1(cfg.deviceId+".json")}' and trashed=false`,"id");providers.drive._hb=f[0]?f[0].id:null;}
      if(providers.drive._hb)await gput(providers.drive._hb,body);else providers.drive._hb=await gcreate(cfg.deviceId+".json",d,body);
      await flushLog();return true;}catch(e){return false;}},
    async devices(){try{const d=await sub("devices",false);if(!d)return [];const f=await glist(`'${q1(d)}' in parents and trashed=false`,"id,name");const out=await Promise.all(f.filter(x=>x.name.endsWith(".json")).map(async x=>j(await gtext(x.id).catch(()=>"null"),null)));return out.filter(Boolean);}catch(e){return [];}},
    async removeDevice(id){try{const d=await sub("devices",false);const f=(await glist(`'${q1(d)}' in parents and name='${q1(String(id).replace(/[^\w-]/g,"")+".json")}' and trashed=false`,"id"))[0];if(f)await gfetch(`${GAPI}/drive/v3/files/${f.id}?supportsAllDrives=true`,{method:"DELETE"});return true;}catch(e){return false;}},
    async activity(limit){const out=[...logs];try{const d=await sub("activity",false);if(d){const f=await glist(`'${q1(d)}' in parents and trashed=false`,"id,name");
      for(const x of f){if(x.name===cfg.deviceId+".jsonl")continue;for(const l of (await gtext(x.id).catch(()=>"")).split("\n").slice(-2500)){if(l){const o=j(l,null);if(o)out.push(o);}}}}}catch(e){}
      return out.sort((a,b)=>b.t-a.t).slice(0,limit||400);}
  }
};
let logFileId=null;
async function flushLog(){if(!logDirty||cfg.mode!=="drive")return;try{const d=await sub("activity",true),body=logs.map(l=>JSON.stringify(l)).join("\n")+"\n";
  if(!logFileId){const f=await glist(`'${q1(d)}' in parents and name='${q1(cfg.deviceId+".jsonl")}' and trashed=false`,"id");logFileId=f[0]?f[0].id:null;}
  if(logFileId)await gput(logFileId,body);else logFileId=await gcreate(cfg.deviceId+".jsonl",d,body);logDirty=false;}catch(e){}}
const P=()=>providers[cfg.mode]||providers.file;


/* ---------- مشاركة/حفظ الملفات (متصفح أو تطبيق Capacitor) ---------- */
const CAP=()=>window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform()?window.Capacitor:null;
const b64=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(",")[1]||"");r.onerror=()=>rej(r.error);r.readAsDataURL(blob);});
async function shareFiles(files,title,text){
  const C=CAP();
  if(C){const {Filesystem,Share}=C.Plugins,uris=[];
    for(const f of files){const w=await Filesystem.writeFile({path:f.name,data:await b64(f),directory:"CACHE"});uris.push(w.uri);}
    await Share.share({title:title||"",text:text||"",files:uris,dialogTitle:title||"مشاركة"});return true;}
  if(navigator.canShare&&navigator.canShare({files})){await navigator.share({files,title:title||"",text:text||""});return true;}
  for(const f of files){const a=document.createElement("a");a.href=URL.createObjectURL(f);a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),8000);}
  return true;
}

/* ---------- واجهة sync (نفس أسماء نسخة الويندوز) ---------- */
const sync={
  state(){return {enabled:!!cfg.enabled,folder:cfg.mode==="drive"?"Google Drive: "+(cfg.folderName||""):(cfg.enabled?"ملف مشترك (تبادل يدوي)":""),mode:cfg.mode||"",deviceId:cfg.deviceId,deviceName:cfg.deviceName,lastOk,error:lastErr,dirtyOut:!!cfg.dirtyOut,clientId:cfg.clientId||"",folderName:cfg.folderName||""};},
  async read(){if(!cfg.enabled)return null;return P().read();},
  async write(s,r,f){return P().write(s,r,f);},
  async setBase(s,r){base={rev:r,data:s};await DB.set("base",base);if(cfg.mode==="file"&&cfg.dirtyOut){cfg.dirtyOut=false;await saveCfg();}return true;},
  async unlink(){cfg.enabled=false;cfg.mode="";cfg.dirtyOut=false;base=null;shared=null;outbox=null;await Promise.all([saveCfg(),DB.del("base"),DB.del("shared"),DB.del("outbox")]);return true;},
  async rename(n){cfg.deviceName=String(n||"").trim()||cfg.deviceName;await saveCfg();return true;},
  async heartbeat(i){if(!cfg.enabled)return false;return P().heartbeat(i);},
  async devices(){if(!cfg.enabled)return [];return P().devices();},
  async removeDevice(id){return P().removeDevice(id);},
  async log(e){logs.push({...e,deviceId:cfg.deviceId,device:cfg.deviceName});if(logs.length>1500)logs=logs.slice(-1200);logDirty=true;DB.set("log",logs).catch(()=>{});return true;},
  async activity(l){return P().activity?P().activity(l||400):logs.slice(-(l||400)).reverse();},
  async exists(){return false;},async link(){return {ok:false,error:"استخدم نافذة الربط الخاصة بالموبايل"};}
};

/* ---------- عمليات خاصة بالموبايل (تستدعيها mobile.js) ---------- */
const mobile={
  async joinFile(text,name){ // أول ربط من ملف payroll-data.json (أو نسخة احتياطية كاملة)
    await ready;const o=j(text,null);if(!o)throw new Error("الملف غير صالح");const dataObj=o.data&&o.data.workers?o.data:(o.workers?o:null);if(!dataObj||!dataObj.settings)throw new Error("هذا ليس ملف بيانات البرنامج");
    const rev=o.rev!==undefined&&o.data?+o.rev:1,str=JSON.stringify(dataObj);
    cfg={...cfg,enabled:true,mode:"file",deviceName:name||cfg.deviceName,dirtyOut:false};shared={rev,data:str};base={rev,data:str};outbox=null;
    await Promise.all([saveCfg(),DB.set("shared",shared),DB.set("base",base),DB.del("outbox")]);return str;},
  async importFile(text){ // تحديث من ملف Drive أحدث (وضع الملف) — يُدمج لاحقاً في دورة المزامنة
    await ready;const o=j(text,null);if(!o||!o.data||!o.data.workers)throw new Error("اختر ملف payroll-data.json من مجلد المزامنة");
    shared={rev:+o.rev||1,data:JSON.stringify(o.data)};await DB.set("shared",shared);return true;},
  exportFile(){if(!outbox)return null;const {_s,...o}=outbox;return JSON.stringify(o);},
  async markUploaded(){cfg.dirtyOut=false;if(outbox){shared={rev:outbox.rev,data:outbox._s};base={rev:outbox.rev,data:outbox._s};await Promise.all([DB.set("shared",shared),DB.set("base",base)]);}await saveCfg();},
  async driveLink({clientId,folderName,deviceName,mode}){ // mode: join | publish | probe
    await ready;cfg.clientId=clientId.trim();cfg.folderName=folderName.trim();if(deviceName)cfg.deviceName=deviceName;await getToken(true);
    const fid=await findFolder(cfg.folderName);if(!fid)return {ok:false,error:"لم أجد مجلداً بهذا الاسم على حساب Drive. لو المجلد مشارَك معك: افتحه في Drive واختر «إضافة اختصار إلى Drive» ثم أعد المحاولة."};
    cfg.folderId=fid;Object.keys(subs).forEach(k=>delete subs[k]);mainCache={ver:null,obj:null};
    const {main}=await driveMain();
    if(mode==="probe")return {ok:true,exists:!!main};
    cfg.mode="drive";cfg.enabled=true;await saveCfg();
    if(mode==="join"){if(!main){cfg.enabled=false;await saveCfg();return {ok:false,error:"لا توجد بيانات مشتركة في هذا المجلد (payroll-data.json). فعّل المزامنة من الكمبيوتر أولاً."};}
      const o=j(await gtext(main.id),null);base={rev:o.rev,data:JSON.stringify(o.data)};await DB.set("base",base);return {ok:true,data:base.data};}
    return {ok:true};}, // publish: أول دورة مزامنة ترفع البيانات
  async driveAuth(){await ready;await getToken(true);return true;},
  hasToken(){return !!(tok&&Date.now()<tokExp-60000);}
};

/* ---------- باقي واجهة window.native ---------- */
window.native={
  load:async()=>{await ready;await uiReady;let s=await DB.get("data").catch(()=>null);if(s==null){try{s=localStorage.getItem("payroll_data");}catch(e){}}return s;},
  save:async s=>{await ready;await DB.set("data",s);try{localStorage.removeItem("payroll_data");}catch(e){}return true;},
  saveSync:s=>{try{localStorage.setItem("payroll_data",s);}catch(e){}DB.set("data",s).catch(()=>{});return true;},
  info:async()=>({dir:"داخل هذا الهاتف (تخزين التطبيق)",backups:"من الإعدادات ← تصدير نسخة احتياطية"}),
  saveFile:async(name,buf)=>{const f=new File([new Blob([buf])],name,{type:"application/octet-stream"});
    try{return await shareFiles([f],name);}catch(e){if(e&&(e.name==="AbortError"||/cancel/i.test(String(e.message))))return false;throw e;}},
  pdf:async()=>{window.print();return false;},
  pdfBuffer:async()=>{throw new Error("PDF");},
  credInfo:async()=>({available:false,last:"",saved:[]}),credGet:async()=>null,credSet:async()=>true,credDel:async()=>true,credLast:async()=>true,
  mailCfg:async()=>({ok:false}),mailSet:async()=>({ok:false}),mailSend:async()=>({ok:false,error:"الإرسال المباشر غير متاح على الموبايل"}),
  sync:async(fn,...a)=>{await ready;if(!sync[fn])throw new Error("bad call");return sync[fn](...a);},
  syncChoose:async()=>null,
  mobile,shareFiles,isApp:()=>!!CAP()
};
window.__mobileNative=true;
})();
