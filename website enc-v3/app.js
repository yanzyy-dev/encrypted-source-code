const $=s=>document.querySelector(s);
const input=$("#fileInput"),drop=$("#dropzone"),info=$("#fileInfo"),htmlInput=$("#htmlFileInput"),htmlDrop=$("#htmlDropzone"),htmlInfo=$("#htmlFileInfo"),out=$("#output"),size=$("#sizeState"),state=$("#fileState"),modeState=$("#modeState"),result=$("#resultText"),meter=$("#meterBar"),protect=$("#protectBtn"),download=$("#downloadBtn");
let source="",fileName="",sourceType="",mode="standard",targetKB=200,built="";

document.querySelectorAll(".mode").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".mode").forEach(x=>x.classList.remove("active"));
  b.classList.add("active"); mode=b.dataset.mode; modeState.textContent=mode.toUpperCase();
});
document.querySelectorAll(".size-choice").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".size-choice").forEach(x=>x.classList.remove("active"));
  b.classList.add("active"); targetKB=Number(b.dataset.kb);
  $("#targetState").textContent=`TARGET ${targetKB} KB`;
});

input.onchange=()=>input.files[0]&&loadFile(input.files[0]);
htmlInput.onchange=()=>htmlInput.files[0]&&loadFile(htmlInput.files[0]);
["dragenter","dragover"].forEach(e=>drop.addEventListener(e,x=>{x.preventDefault();drop.classList.add("drag")}));
["dragleave","drop"].forEach(e=>drop.addEventListener(e,x=>{x.preventDefault();drop.classList.remove("drag")}));
drop.ondrop=e=>e.dataTransfer.files[0]&&loadFile(e.dataTransfer.files[0]);
["dragenter","dragover"].forEach(e=>htmlDrop.addEventListener(e,x=>{x.preventDefault();htmlDrop.classList.add("drag")}));
["dragleave","drop"].forEach(e=>htmlDrop.addEventListener(e,x=>{x.preventDefault();htmlDrop.classList.remove("drag")}));
htmlDrop.ondrop=e=>e.dataTransfer.files[0]&&loadFile(e.dataTransfer.files[0]);

function loadFile(file){
  const isHTML=/\.(html|htm)$/i.test(file.name);
  const isJS=/\.(js|mjs|cjs)$/i.test(file.name);
  if(!isHTML&&!isJS){result.textContent="Only JavaScript files are supported.";return}
  const r=new FileReader();
  r.onload=()=>{source=String(r.result);fileName=file.name;sourceType=isHTML?"html":"js";const targetInfo=isHTML?htmlInfo:info;targetInfo.textContent=`${file.name} · ${source.length.toLocaleString()} characters`;state.textContent="READY";result.textContent=isHTML?"HTML source loaded locally.":"Source loaded locally.";out.textContent=source.slice(0,5000);size.textContent=bytes(source.length)};
  r.readAsText(file);
}

protect.onclick=async()=>{
  if(!source){result.textContent=sourceType==="html"?"Select an HTML file first.":"Select a JavaScript file first.";return}
  protect.disabled=true;download.disabled=true;meter.style.width="15%";result.textContent="Building protected output.";
  await wait(70);
  let code=source;
  if($("#comments").checked)code=stripComments(code);
  if($("#minify").checked)code=compact(code);
  meter.style.width="45%"; await wait(70);
  built=sourceType==="html"?wrapHTML(code,mode,targetKB):wrap(code,mode,targetKB);
  meter.style.width="100%";
  out.textContent=built;
  size.textContent=bytes(built.length);
  result.textContent=`Protected output ready · ${mode} · target ${targetKB} KB`;
  download.disabled=false; protect.disabled=false;
};

download.onclick=()=>{
  if(!built)return;
  const blob=new Blob([built],{type:"text/javascript"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download=fileName.replace(/\.(js|mjs|cjs)$/i,"")+".protected.js"; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),500);
};

function wrapHTML(code,type,target){
  const payload=b64(code);
  let wrapper;
  if(type==="china") wrapper=`<!doctype html><meta charset="utf-8"><script>(async()=>{const 保护="${payload}";const 解码=s=>decodeURIComponent(escape(atob(s)));document.open();document.write(解码(保护));document.close();})();<\/script>`;
  else if(type==="invisible") wrapper=`<!doctype html><meta charset="utf-8"><script>(async()=>{const p="${zero(payload)}";const d=s=>decodeURIComponent(escape(atob(s.replace(/[\u200b\u200c\u200d\u2060]/g,""))));document.open();document.write(d(p));document.close();})();<\/script>`;
  else if(type==="strong"){const p=b64(b64(code));wrapper=`<!doctype html><meta charset="utf-8"><script>(async()=>{const layer="${p}";const decode=s=>decodeURIComponent(escape(atob(s)));document.open();document.write(decode(decode(layer)));document.close();})();<\/script>`}
  else wrapper=`<!doctype html><meta charset="utf-8"><script>(async()=>{const source="${payload}";const decode=s=>decodeURIComponent(escape(atob(s)));document.open();document.write(decode(source));document.close();})();<\/script>`;
  return padToTargetHTML(wrapper,target);
}

function padToTargetHTML(code,kb){
  const target=Math.max(0,kb*1024);
  if(code.length>=target)return code;
  const token="CSHIELD_PAD_";
  const need=target-code.length;
  const raw=Math.max(0,need-token.length-30);
  const chunk="x".repeat(Math.min(8192,Math.max(1,raw)));
  let pad="";
  while(pad.length<raw)pad+=chunk;
  pad=pad.slice(0,raw);
  return `${code}<script>const __codeshield_padding__="${token}${pad}";<\/script>`;
}

function wrap(code,type,target){
  const payload=b64(code);
  let wrapper;
  if(type==="china") wrapper=`(async()=>{const 保护="${payload}";const 解码=s=>decodeURIComponent(escape(atob(s)));(0,eval)(解码(保护));})();`;
  else if(type==="invisible") wrapper=`(async()=>{const p="${zero(payload)}";const d=s=>decodeURIComponent(escape(atob(s.replace(/[\\u200b\\u200c\\u200d\\u2060]/g,""))));(0,eval)(d(p));})();`;
  else if(type==="strong"){const p=b64(b64(code)); wrapper=`(async()=>{const layer="${p}";const decode=s=>decodeURIComponent(escape(atob(s)));(0,eval)(decode(decode(layer)));})();`}
  else wrapper=`(async()=>{const source="${payload}";const decode=s=>decodeURIComponent(escape(atob(s)));(0,eval)(decode(source));})();`;
  return padToTarget(wrapper,target);
}

/* Padding is inert data kept in a local constant, so it does not change the decoded source.
   It is a size-control feature, not cryptographic protection. */
function padToTarget(code,kb){
  const target=Math.max(0,kb*1024);
  if(code.length>=target)return code;
  const token="CSHIELD_PAD_";
  const need=target-code.length;
  const raw=Math.max(0,need-token.length-40);
  const chunk="x".repeat(Math.min(8192,Math.max(1,raw)));
  let pad="";
  while(pad.length<raw)pad+=chunk;
  pad=pad.slice(0,raw);
  return `${code.slice(0,-4)};const __codeshield_padding__="${token}${pad}";})();`;
}

function b64(s){return btoa(unescape(encodeURIComponent(s)))}
function zero(s){return s.split("").map((c,i)=>c+(i%7===0?"\\u200b":"")).join("")}
function stripComments(s){return s.replace(/\/\*[\s\S]*?\*\//g,"").replace(/(^|[^:])\/\/.*$/gm,"$1")}
function compact(s){return s.replace(/^\s*[\r\n]/gm,"").replace(/[ \t]+/g," ").trim()}
function bytes(n){return n<1024?`${n} B`:`${(n/1024).toFixed(1)} KB`}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
