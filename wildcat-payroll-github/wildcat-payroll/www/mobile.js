/* واجهة الموبايل: ربط البيانات + المزامنة + المشاركة بدل البريد + التثبيت (يُحمَّل بعد app.js) */
(function(){
if(!window.__mobileNative)return;
const NM=()=>NATIVE.mobile;
let deferred=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;const b=document.getElementById("minst");if(b)b.style.display="";});
const readText=f=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsText(f);});
const pickJson=()=>new Promise(res=>{const i=document.createElement("input");i.type="file";i.accept=".json,application/json,text/plain,*/*";i.onchange=()=>res(i.files[0]||null);i.click();});

async function adopt(dataStr,fromAuth){
  data=JSON.parse(dataStr);normData();save(true);flush();SY.st=await NATIVE.sync("state");closeModal();startSyncLoops();
  if(fromAuth){authScreen("login");setTimeout(()=>toast("تم الربط. سجّل الدخول بنفس حسابك على الكمبيوتر."),100);}else{me=null;authScreen("login");setTimeout(()=>toast("تم الربط. سجّل الدخول من جديد."),100);}
}
function mLink(fromAuth){
  const st=SY.st||{};
  openModal(`<h3>ربط الموبايل ببيانات البرنامج</h3>
   <p class="hint" style="line-height:1.9">بعد الربط تسجّل الدخول بنفس حساباتك اللي على الكمبيوتر (المدير هو اللي بيضيفها).</p>
   <div class="bar"><button class="btn t" id="t1">① من ملف (بدون إعداد)</button>${NATIVE.isApp()?"":'<button class="btn g" id="t2">② Google Drive مباشرة</button>'}</div><div id="pane" style="margin-top:10px"></div>`,m=>{
    const pane=m.querySelector("#pane"),q=s=>m.querySelector(s);
    const err=t=>{const e=pane.querySelector("#lk_err");if(e){e.textContent=t;e.style.display=t?"block":"none";}};
    const tab1=()=>{q("#t1").className="btn t";q("#t2").className="btn g";
      pane.innerHTML=`<p class="hint" style="line-height:1.9">1) على الكمبيوتر: فعّل المزامنة ليظهر ملف <b dir="ltr">payroll-data.json</b> في مجلد Drive.<br>2) هنا اضغط «اختيار الملف» وروح لمجلد Drive واختار الملف.</p>
       <label class="hint" style="display:block">اسم هذا الجهاز<input class="fld" id="lk_n" style="width:100%" value="${esc(st.deviceName||"الموبايل")}"></label>
       <div class="alert" id="lk_err" style="display:none;margin-top:8px"></div><div class="bar" style="margin-top:10px"><button class="btn t" id="lk_go">اختيار الملف…</button><button class="btn g" data-close>إلغاء</button></div>`;
      pane.querySelector("#lk_go").onclick=async()=>{try{const f=await pickJson();if(!f)return;const txt=await readText(f);
        if(!fromAuth&&!confirm("سيتم استبدال بيانات هذا الموبايل ببيانات الملف. متابعة؟"))return;
        const s=await NATIVE.mobile.joinFile(txt,pane.querySelector("#lk_n").value);await adopt(s,fromAuth);}catch(e){err(e.message||String(e));}};};
    const tab2=()=>{q("#t2").className="btn t";q("#t1").className="btn g";
      pane.innerHTML=`<p class="hint" style="line-height:1.9">مزامنة تلقائية مع نفس المجلد. تحتاج إعداد مرة واحدة (Client ID من Google Cloud — الشرح في ملف اقرأني). عنوان التطبيق للإعداد: <b dir="ltr">${esc(location.origin)}</b></p>
       <label class="hint" style="display:block">معرّف العميل Client ID<input class="fld" id="lk_c" dir="ltr" style="width:100%" value="${esc(st.clientId||"")}"></label>
       <label class="hint" style="display:block;margin-top:6px">اسم مجلد المزامنة على Drive<input class="fld" id="lk_f" style="width:100%" value="${esc(st.folderName||"Wild Cat Payroll")}"></label>
       <label class="hint" style="display:block;margin-top:6px">اسم هذا الجهاز<input class="fld" id="lk_n" style="width:100%" value="${esc(st.deviceName||"الموبايل")}"></label>
       <div class="alert" id="lk_err" style="display:none;margin-top:8px"></div><div class="bar" style="margin-top:10px"><button class="btn t" id="lk_go">ربط</button><button class="btn g" data-close>إلغاء</button></div>`;
      pane.querySelector("#lk_go").onclick=async()=>{err("");const g=s=>pane.querySelector(s).value;if(!g("#lk_c").trim())return err("اكتب الـ Client ID.");
        try{const o={clientId:g("#lk_c"),folderName:g("#lk_f"),deviceName:g("#lk_n")};let r=await NM().driveLink({...o,mode:"probe"});if(!r.ok)return err(r.error);
          let mode="join";if(!fromAuth&&r.exists)mode=confirm("يوجد نظام مشترك في المجلد.\nموافق = استخدام بيانات المجلد (تستبدل بيانات الموبايل)\nإلغاء = رفع بيانات هذا الموبايل مكانها")?"join":"publish";
          if(!r.exists){if(fromAuth)return err("لا توجد بيانات مشتركة في المجلد. فعّل المزامنة من الكمبيوتر أولاً.");mode="publish";}
          r=await NM().driveLink({...o,mode});if(!r.ok)return err(r.error);
          if(mode==="join")await adopt(r.data,fromAuth);else{SY.st=await NATIVE.sync("state");closeModal();startSyncLoops();render&&render();toast("تم التفعيل");}
        }catch(e){err(e.message||String(e));}};};
    q("#t1").onclick=tab1;if(q("#t2"))q("#t2").onclick=tab2;tab1();});
}
async function mSync(){
  const st=await NATIVE.sync("state");SY.st=st;
  if(!st.enabled)return mLink(false);
  const drive=st.mode==="drive",stt=({ok:"متزامن ✓",pushed:"متزامن ✓",offline:"غير متاح",error:"خطأ",conflict:"إعادة محاولة",off:"—"})[SY.status]||SY.status;
  openModal(`<h3>المزامنة</h3><div class="hint" style="line-height:2">الوضع: <b>${drive?"Google Drive مباشر":"تبادل ملف"}</b> — الحالة: <b>${stt}</b><br>${drive?"المجلد: "+esc(st.folderName):""}آخر اتصال ناجح: ${st.lastOk?ago(st.lastOk):"—"}${st.error?`<br><span style="color:#b45309">${esc(st.error)}</span>`:""}</div>
   ${drive?`<div class="bar" style="margin-top:8px"><button class="btn t" id="ms_now">🔄 مزامنة الآن</button></div><div class="hint">لو ظهر أن الجلسة انتهت اضغط «مزامنة الآن» ليعاد تسجيل الدخول لـ Google (كل ساعة تقريباً).</div>`
    :`<div class="alert" style="margin-top:8px">${st.dirtyOut?"⚠ فيه تغييرات على الموبايل لم تُرفع لـ Drive بعد.":"✓ لا توجد تغييرات معلّقة."}</div>
      <div class="bar" style="margin-top:8px"><button class="btn t" id="ms_in">① تحديث من ملف Drive</button><button class="btn t" id="ms_out">② حفظ ملف التغييرات</button></div>
      <p class="hint" style="line-height:1.9">① قبل الشغل: اختار <b dir="ltr">payroll-data.json</b> من Drive لتحصل على آخر بيانات الكمبيوتر.<br>② بعد الشغل: احفظ الملف ثم ارفعه على Drive <b>مكان الملف القديم بنفس الاسم</b> (استبدال) ليصل للكمبيوتر.</p>`}
   <div class="bar" style="margin-top:10px"><button class="btn r" id="ms_off">فصل المزامنة</button><button class="btn g" data-close>إغلاق</button></div>`,m=>{
    const q=s=>m.querySelector(s);
    if(q("#ms_now"))q("#ms_now").onclick=async()=>{try{if(!NM().hasToken())await NM().driveAuth();await syncNow();toast("تمت المزامنة");closeModal();}catch(e){toast(e.message||"تعذّرت المزامنة");}};
    if(q("#ms_in"))q("#ms_in").onclick=async()=>{try{const f=await pickJson();if(!f)return;await NM().importFile(await readText(f));await syncNow();toast("تم التحديث ودمج التغييرات");closeModal();}catch(e){toast(e.message||String(e));}};
    if(q("#ms_out"))q("#ms_out").onclick=async()=>{await syncNow();const s=NM().exportFile();if(!s)return toast("لا توجد تغييرات لحفظها");const ok=await NATIVE.saveFile("payroll-data.json",new TextEncoder().encode(s));if(ok){await NM().markUploaded();toast("ارفع الملف على Drive مكان القديم");closeModal();}};
    q("#ms_off").onclick=()=>{if(!confirm("إيقاف المزامنة على هذا الموبايل؟ ستبقى بياناته المحلية."))return;NATIVE.sync("unlink").then(()=>{SY.status="off";badge();closeModal();toast("تم الفصل");});};
  });
}
/* استبدال دوال سطح المكتب */
window.joinDialog=()=>mLink(true);
window.linkDialog=()=>mLink(false);
/* زر المزامنة + التثبيت في الشريط العلوي */
const _shell=window.shell;
window.shell=function(){_shell.apply(this,arguments);
  const top=document.querySelector(".top"),sb=document.getElementById("syncb");if(!top||!sb)return;
  const b=document.createElement("button");b.className="btn g";b.id="msync";b.textContent="🔄";b.title="المزامنة";b.onclick=mSync;sb.before(b);
  const i=document.createElement("button");i.className="btn g";i.id="minst";i.textContent="📲 تثبيت";i.style.display=deferred?"":"none";i.onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;i.style.display="none";};b.before(i);};
/* المشاركة بدل البريد */
window.emailDialog=async function(o){
  openModal(`<h3>مشاركة</h3><p class="hint">اختر الملفات ثم اختر التطبيق (واتساب، جيميل، Drive…).</p>
   <div>${o.files.map((f,i)=>`<label class="chk" style="display:flex;gap:8px;margin-top:4px"><input type="checkbox" data-f="${i}" ${/\.pdf$/i.test(f.name)?"":"checked"}> ${esc(f.name)}</label>`).join("")}</div>
   <div class="hint" style="margin-top:6px">ملفات PDF: استخدم زر الطباعة ثم «حفظ كـ PDF» من قايمة الطباعة.</div>
   <div class="bar" style="margin-top:12px"><button class="btn t" id="sh_go">مشاركة</button><button class="btn g" data-close>إلغاء</button></div>`,m=>{
    m.querySelector("#sh_go").onclick=async()=>{const files=[];
      for(const c of m.querySelectorAll("[data-f]:checked")){const f=o.files[+c.dataset.f];try{const b=await f.make();files.push(new File([b],f.name,{type:/\.xlsx$/i.test(f.name)?"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":"application/octet-stream"}));}catch(e){toast("تعذّر تجهيز "+f.name);}}
      if(!files.length)return toast("لا توجد ملفات");
      try{await NATIVE.shareFiles(files,o.subject,o.body||"");closeModal();act("export","مشاركة: "+o.subject);}catch(e){if(e&&e.name!=="AbortError")toast("تعذّرت المشاركة");}};});
};
if("serviceWorker" in navigator&&location.protocol.startsWith("http")&&!NATIVE.isApp())navigator.serviceWorker.register("sw.js").catch(()=>{});
if(window.__mobileUIReady)window.__mobileUIReady();
})();
