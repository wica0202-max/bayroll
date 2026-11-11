/* قراءة وكتابة ملفات Excel (xlsx/xlsm) بدون مكتبات خارجية */
(function(g){
const td=new TextDecoder("utf-8"),te=new TextEncoder();
async function inflate(u8){const ds=new DecompressionStream("deflate-raw");const w=ds.writable.getWriter();w.write(u8);w.close();return new Uint8Array(await new Response(ds.readable).arrayBuffer());}
async function unzip(buf){
  const u=new Uint8Array(buf),dv=new DataView(u.buffer,u.byteOffset,u.byteLength);let e=u.length-22;
  while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--; if(e<0)throw new Error("ملف غير صالح");
  const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const files={};
  for(let i=0;i<n;i++){
    const method=dv.getUint16(p+10,true),csize=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),el=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
    const name=td.decode(u.subarray(p+46,p+46+nl));
    const lnl=dv.getUint16(off+26,true),lel=dv.getUint16(off+28,true),ds=off+30+lnl+lel,data=u.subarray(ds,ds+csize);
    const fn=()=>method===0?Promise.resolve(data):inflate(data);
    fn.stream=()=>{const b=new Blob([data]).stream();return method===0?b:b.pipeThrough(new DecompressionStream("deflate-raw"));};
    files[name]=fn;
    p+=46+nl+el+cl;
  }
  return files;
}
const parseXml=s=>new DOMParser().parseFromString(s,"application/xml");
const colNum=s=>{let n=0;for(const ch of s)n=n*26+ch.charCodeAt(0)-64;return n;};
async function readWorkbook(buf){
  const z=await unzip(buf),txt=async n=>z[n]?td.decode(await z[n]()):null;
  const wb=parseXml(await txt("xl/workbook.xml")),rels=parseXml(await txt("xl/_rels/workbook.xml.rels"));
  const relMap={};for(const r of rels.getElementsByTagName("Relationship"))relMap[r.getAttribute("Id")]=r.getAttribute("Target");
  const ss=[];const sst=await txt("xl/sharedStrings.xml");
  if(sst){for(const si of parseXml(sst).getElementsByTagName("si")){ss.push([...si.getElementsByTagName("t")].map(t=>t.textContent).join(""));}}
  const sheets={};
  for(const s of wb.getElementsByTagName("sheet")){
    const name=s.getAttribute("name"),rid=s.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships","id")||s.getAttribute("r:id");
    let t=relMap[rid];t=t.startsWith("/")?t.slice(1):"xl/"+t;
    const x=parseXml(await txt(t)),cells={};let maxR=0;
    for(const c of x.getElementsByTagName("c")){
      const ref=c.getAttribute("r"),m=/([A-Z]+)(\d+)/.exec(ref),ty=c.getAttribute("t"),v=c.getElementsByTagName("v")[0];
      let val=null;
      if(ty==="inlineStr")val=[...c.getElementsByTagName("t")].map(t=>t.textContent).join("");
      else if(v){val=v.textContent;if(ty==="s")val=ss[+val];else if(ty==="str"||ty==="e")val=val;else if(ty==="b")val=val==="1";else val=val===""?null:parseFloat(val);}
      if(val===""||val===null)continue;
      cells[ref]=val;maxR=Math.max(maxR,+m[2]);
    }
    sheets[name]={cells,maxR,get:(col,row)=>cells[col+row]};
  }
  return sheets;
}
/* ---- قراءة تدريجية لشيت كبير (يتجاهل الصفوف الفاضية ويتوقف بعد نهاية البيانات) ---- */
const unesc=s=>s.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(m,n)=>String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi,(m,n)=>String.fromCharCode(parseInt(n,16))).replace(/&amp;/g,"&");
const attrs=tag=>{const o={};tag.replace(/([\w:.-]+)="([^"]*)"/g,(m,k,v)=>{o[k]=unesc(v);return m;});return o;};
async function readRows(buf,sheetName,opt){
  opt=opt||{};const maxCol=opt.maxCol||26,stopAfter=opt.stopAfterEmpty||3000;
  const z=await unzip(buf),txt=async n=>z[n]?td.decode(await z[n]()):null;
  const wbx=await txt("xl/workbook.xml");if(!wbx)throw new Error("ملف Excel غير صالح");
  const sheets=[...wbx.matchAll(/<sheet\b[^>]*>/g)].map(m=>attrs(m[0]));
  const sh=(sheetName&&sheets.find(x=>x.name===sheetName))||sheets[0];if(!sh)throw new Error("لا توجد شيتات في الملف");
  const rels={};for(const m of (await txt("xl/_rels/workbook.xml.rels")||"").matchAll(/<Relationship\b[^>]*>/g)){const a=attrs(m[0]);rels[a.Id]=a.Target;}
  let t=rels[sh["r:id"]];if(!t)throw new Error("تعذّر تحديد ملف الشيت");t=t.startsWith("/")?t.slice(1):"xl/"+t;
  const ss=[];const sst=await txt("xl/sharedStrings.xml");
  if(sst)for(const m of sst.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g))ss.push(unesc([...m[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(x=>x[1]).join("")));
  if(!z[t])throw new Error("تعذّر قراءة الشيت");
  const colIdx=s=>{let n=0;for(const ch of s)n=n*26+ch.charCodeAt(0)-64;return n;};
  const out=[],reader=z[t].stream().getReader(),dec=new TextDecoder("utf-8");
  let carry="",empty=0,seen=false,done=false;
  const rowRe=/<row\b[^>]*?(?:\/>|>[\s\S]*?<\/row>)/g;
  while(!done){
    const {value,done:fin}=await reader.read();
    carry+=dec.decode(value||new Uint8Array(0),{stream:!fin});
    rowRe.lastIndex=0;let m,last=0;
    while((m=rowRe.exec(carry))){
      last=rowRe.lastIndex;const row=m[0];
      if(row.indexOf("<v")<0&&row.indexOf("<is")<0){if(seen&&++empty>=stopAfter){done=true;break;}continue;}
      const r=+(/\br="(\d+)"/.exec(row)||[0,0])[1],cells={};
      for(const c of row.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)){
        if(c[2]===undefined)continue;const a=attrs(c[1]),ref=/^([A-Z]+)/.exec(a.r||"");if(!ref||colIdx(ref[1])>maxCol)continue;
        let val=null;const ty=a.t;
        if(ty==="inlineStr")val=unesc([...c[2].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(x=>x[1]).join(""));
        else{const v=/<v>([\s\S]*?)<\/v>/.exec(c[2]);if(v){if(ty==="s")val=ss[+v[1]];else if(ty==="str"||ty==="e")val=unesc(v[1]);else if(ty==="b")val=v[1]==="1";else{const f=parseFloat(v[1]);val=isFinite(f)?f:null;}}}
        if(val!==null&&val!=="")cells[ref[1]]=val;
      }
      if(Object.keys(cells).length){out.push({r,cells});seen=true;empty=0;}else if(seen&&++empty>=stopAfter){done=true;break;}
    }
    carry=carry.slice(last);
    if(fin)done=true;
  }
  try{await reader.cancel();}catch(e){}
  return {rows:out,sheets:sheets.map(x=>x.name),sheet:sh.name};
}
/* ---- كتابة xlsx بسيطة ---- */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
const crc32=u=>{let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0;};
function zip(files){
  const parts=[],cd=[];let off=0;
  for(const [name,content] of files){
    const nb=te.encode(name),data=typeof content==="string"?te.encode(content):content,crc=crc32(data);
    const lh=new Uint8Array(30+nb.length),d=new DataView(lh.buffer);
    d.setUint32(0,0x04034b50,true);d.setUint16(4,20,true);d.setUint16(6,0x0800,true);d.setUint32(14,crc,true);d.setUint32(18,data.length,true);d.setUint32(22,data.length,true);d.setUint16(26,nb.length,true);lh.set(nb,30);
    parts.push(lh,data);
    const ch=new Uint8Array(46+nb.length),c=new DataView(ch.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,nb.length,true);c.setUint32(42,off,true);ch.set(nb,46);
    cd.push(ch);off+=lh.length+data.length;
  }
  const cdSize=cd.reduce((s,a)=>s+a.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cdSize,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cd,end],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
}
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const colName=n=>{let s="";while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;};
function writeSheet(title,header,rows,footer){
  const all=[header,...rows,...(footer?[footer]:[])];
  let sd="";all.forEach((r,i)=>{sd+=`<row r="${i+1}">`;r.forEach((v,j)=>{const ref=colName(j+1)+(i+1),st=i===0?' s="1"':(footer&&i===all.length-1?' s="2"':"");
    if(v===null||v===undefined||v==="")sd+=`<c r="${ref}"${st}/>`;else if(typeof v==="number")sd+=`<c r="${ref}"${st?st:' s="3"'}><v>${v}</v></c>`;else sd+=`<c r="${ref}"${st} t="inlineStr"><is><t>${esc(v)}</t></is></c>`;});sd+="</row>";});
  const cols=header.map((h,j)=>`<col min="${j+1}" max="${j+1}" width="${Math.max(11,Math.min(26,String(h).length+4))}" customWidth="1"/>`).join("");
  return zip([
    ["[Content_Types].xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
    ["_rels/.rels",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ["xl/workbook.xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(title)}" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ["xl/_rels/workbook.xml.rels",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ["xl/styles.xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F2A44"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFDE68A"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="4"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf fontId="2" fillId="3" numFmtId="164" applyFont="1" applyFill="1" applyNumberFormat="1"/><xf numFmtId="164" applyNumberFormat="1"/></cellXfs></styleSheet>`],
    ["xl/worksheets/sheet1.xml",`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView rightToLeft="1" workbookViewId="0"><pane xSplit="3" ySplit="1" topLeftCell="D2" activePane="bottomRight" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${sd}</sheetData></worksheet>`]
  ]);
}
g.XLSX2={readWorkbook,readRows,writeSheet,colNum};
})(window);
