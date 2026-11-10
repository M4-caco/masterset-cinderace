(()=>{
"use strict";
/* A catalogue is usable only after ALL of its card images have been fetched and decoded.
   CacheStorage stores the original files. ImageBitmap is immediately released after validation,
   avoiding hundreds of permanent GPU textures in mobile browsers. */
const CACHE="scorace-card-images-v1";
const state={key:"",runId:0,ready:false,working:false,total:0,checked:0,loaded:0,cached:0,errors:[],manifest:[],invalid:[],controller:null,sceneToken:0,sceneWorking:false,sceneReady:false,sceneError:"",sceneProgress:null,sceneIssues:[]};
let overlay=null;
function view(){
 if(overlay)return overlay;
 overlay=document.createElement("section");overlay.id="scCardLoader";
 overlay.setAttribute("role","alertdialog");overlay.setAttribute("aria-modal","true");
 overlay.setAttribute("aria-label","Carregamento obrigatório das cartas");
 overlay.innerHTML='<div class="sc-loader-card"><div class="sc-loader-logo">✦ SCORACE</div><h2>Preparando as cartas</h2><p id="scLoaderMessage">Conferindo a coleção...</p><div class="sc-loader-numbers"><strong id="scLoaderCount">0 / 0</strong><span id="scLoaderPercent">0%</span></div><div class="sc-loader-progress" role="progressbar" aria-label="Imagens válidas" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="scLoaderBar"></i></div><p id="scLoaderMeta"></p><div id="scLoaderFailures" class="sc-loader-failures" hidden></div><div class="sc-loader-actions"><button type="button" id="scLoaderRetry" hidden>Tentar novamente as imagens com erro</button></div></div>';
 const errors=overlay.querySelector("#scLoaderFailures");
 errors.style.cssText="display:none;max-height:156px;overflow:auto;margin-top:15px;padding:11px 13px;border:1px solid #a34f4380;border-radius:10px;background:#3d1d1b78;color:#f8d5ce;font:11px/1.5 system-ui,sans-serif;overflow-wrap:anywhere";
 overlay.querySelector("#scLoaderRetry").onclick=()=>retry();
 document.body.append(overlay);
 return overlay
}
function show(){
 view();overlay.hidden=false;
 if(document.activeElement instanceof HTMLElement&&overlay.contains(document.activeElement)===false)document.activeElement.blur();
}
function render(){
 if(!overlay)return;
 const percent=state.total?Math.round(state.loaded/state.total*100):0;
 overlay.querySelector("#scLoaderCount").textContent=state.loaded+" / "+state.total;
 overlay.querySelector("#scLoaderPercent").textContent=percent+"%";
 overlay.querySelector("#scLoaderBar").style.width=percent+"%";
 overlay.querySelector(".sc-loader-progress").setAttribute("aria-valuenow",String(percent));
 overlay.querySelector("#scLoaderMeta").textContent=state.sceneWorking&&state.sceneProgress?"Texturas 3D prontas: "+state.sceneProgress.done+" / "+state.sceneProgress.total:state.sceneReady?"Imagens decodificadas e texturas visíveis prontas":state.cached+" reutilizadas do cache • "+(state.checked-state.loaded)+" pendentes ou com erro";
 const msg=overlay.querySelector("#scLoaderMessage");
 msg.textContent=state.working?"Verificando download e decodificação de todas as cartas. O fichário só abre quando chegar a 100%.":state.sceneError?"As texturas da cena 3D ainda não ficaram prontas. O fichário continua bloqueado.":state.sceneWorking?"Imagens válidas. Preparando as texturas 3D que serão mostradas na tela...":state.sceneReady?"Cartas prontas. Abrindo o fichário...":state.ready?"Aguardando a cena 3D iniciar...":state.errors.length?"Há "+state.errors.length+" imagem(ns) com erro. O fichário permanecerá fechado até serem corrigidas.":"Verificando as imagens da coleção...";
 const list=overlay.querySelector("#scLoaderFailures");
 const issues=state.sceneError?state.sceneIssues:state.errors;
 if(issues.length&&!state.working&&!state.sceneWorking){
  list.style.display="block";list.hidden=false;
  list.replaceChildren();
  const heading=document.createElement("strong");heading.textContent="Arquivos que não carregaram:";list.append(heading);
  for(const issue of issues.slice(0,18)){
   const line=document.createElement("div");line.textContent=issue.name+" · "+issue.reason;list.append(line)
  }
  if(issues.length>18){const more=document.createElement("div");more.textContent="E mais "+(issues.length-18)+" arquivo(s).";list.append(more)}
 }else{list.hidden=true;list.style.display="none";list.replaceChildren()}
 overlay.querySelector("#scLoaderRetry").hidden=state.working||state.sceneWorking||(!state.errors.length&&!state.sceneError);
}
function manifest(cards){
 const items=new Map,invalid=[];
 for(let index=0;index<cards.length;index++){
  const card=cards[index],original=card?.image;
  if(typeof original!=="string"||!original.trim()){invalid.push({url:"",name:card?.name||"Carta "+(index+1),reason:"Endereço da imagem ausente"});continue}
  try{
   const parsed=new URL(original,document.baseURI);
   if(!["https:","http:","data:","blob:"].includes(parsed.protocol))throw Error("Protocolo inválido");
   if(!items.has(parsed.href))items.set(parsed.href,{url:parsed.href,name:String(card.name||card.id||"Carta "+(index+1)).slice(0,80)});
  }catch(e){invalid.push({url:"",name:card?.name||"Carta "+(index+1),reason:String(e)})}
 }
 return{items:[...items.values()],invalid}
}
function idFor(cards){const m=manifest(cards);return JSON.stringify([m.items.map(x=>x.url).sort(),m.invalid.length])}
async function decodeBlob(blob){
 if(!blob||!blob.size)throw Error("Arquivo de imagem vazio");
 if(typeof createImageBitmap==="function"){
  try{
   const bitmap=await createImageBitmap(blob);
   const valid=bitmap.width>0&&bitmap.height>0;
   bitmap.close();
   if(!valid)throw Error("Dimensões da imagem inválidas");
   return
  }catch(e){/* Fall back to Image.decode for image formats unsupported by ImageBitmap. */}
 }
 const src=URL.createObjectURL(blob),img=new Image();
 try{img.decoding="async";img.src=src;await img.decode();if(!img.naturalWidth||!img.naturalHeight)throw Error("Imagem sem dimensões válidas")}
 finally{img.src="";URL.revokeObjectURL(src)}
}
async function timedFetch(url,controller,ms=14000){
 const local=new AbortController;
 const onAbort=()=>local.abort();
 controller.signal.addEventListener("abort",onAbort,{once:true});
 const t=setTimeout(()=>local.abort(),ms);
 try{return await fetch(url,{mode:"cors",credentials:"same-origin",cache:"reload",signal:local.signal})}
 finally{clearTimeout(t);controller.signal.removeEventListener("abort",onAbort)}
}
async function validRemote(url){
 const img=new Image();img.decoding="async";img.crossOrigin="anonymous";
 let timer;
 try{
  const timeout=new Promise((_,reject)=>timer=setTimeout(()=>reject(Error("Tempo esgotado ao abrir imagem externa")),15000));
  img.src=url;
  await Promise.race([img.decode(),timeout]);
  if(!img.naturalWidth)throw Error("Imagem externa não decodificou")
 }finally{clearTimeout(timer);img.src=""}
}
async function inspect(item,cache,controller){
 if(controller.signal.aborted)throw Error("Cancelado");
 const {url}=item,origin=new URL(url).origin;
 if(/^(data:|blob:)/.test(url)){
  const response=await fetch(url);await decodeBlob(await response.blob());return false
 }
 const sameOrigin=origin===location.origin;
 if(sameOrigin&&cache){
  try{
   const stored=await cache.match(url,{ignoreVary:true});
   if(stored&&stored.ok){
    await decodeBlob(await stored.blob());
    return true
   }
  }catch(e){console.warn("[Scorace] Imagem inválida no cache, tentando recuperar",url,e)}
  await cache.delete(url).catch(()=>{})
 }
 if(!sameOrigin){
  // WebGL uses anonymous CORS too. A no-CORS image might open in an HTML image,
  // but cannot safely be drawn into the 3D card canvas.
  await validRemote(url);
  return false
 }
 let lastError;
 for(let attempt=0;attempt<3;attempt++){
  if(controller.signal.aborted)throw Error("Cancelado");
  try{
   const response=await timedFetch(url,controller,attempt===0?14000:22000);
   if(!response.ok)throw Error("HTTP "+response.status);
   const blob=await response.blob();
   await decodeBlob(blob);
   if(cache)try{await cache.put(url,new Response(blob,{headers:{"Content-Type":blob.type||"application/octet-stream"}}))}catch(e){console.warn("[Scorace] Sem espaço em disco para imagem",url,e)}
   return false
  }catch(e){
   lastError=e;
   if(controller.signal.aborted)throw e;
   console.warn("[Scorace] Falha de imagem, tentativa",attempt+1,url,e)
  }
 }
 throw lastError||Error("Imagem indisponível")
}
async function load(manifestItems,invalid,runId,onlyFailed=false){
 const abort=new AbortController;
 state.controller=abort;
 state.working=true;state.ready=false;state.sceneToken++;state.sceneWorking=false;state.sceneReady=false;state.sceneError="";state.sceneIssues=[];state.sceneProgress=null;
 const previous=onlyFailed?state.errors.filter(e=>!e.url):[];
 state.errors=[...invalid,...previous];
 state.total=manifestItems.length+state.errors.length;
 state.checked=state.errors.length;
 state.loaded=0;state.cached=0;
 show();render();
 let cache=null;
 try{if("caches" in window)cache=await caches.open(CACHE)}catch(e){console.warn("[Scorace] CacheStorage indisponível",e)}
 if(navigator.serviceWorker)navigator.serviceWorker.register("./card-sw.js",{scope:"./"}).catch(e=>console.warn("[Scorace] Service worker indisponível",e));
 let nextIndex=0;
 async function worker(){
  while(runId===state.runId&&nextIndex<manifestItems.length&&!abort.signal.aborted){
   const item=manifestItems[nextIndex++];
   try{
    const fromCache=await inspect(item,cache,abort);
    if(runId!==state.runId)return;
    state.loaded++;if(fromCache)state.cached++
   }catch(e){
    if(runId!==state.runId)return;
    state.errors.push({...item,reason:e?.message||String(e)})
   }
   state.checked++;render()
  }
 }
 await Promise.all(Array.from({length:Math.min(innerWidth<750?3:5,manifestItems.length)},worker));
 if(runId!==state.runId)return;
 state.working=false;
 state.ready=state.loaded===state.total&&state.errors.length===0;
 render();
 if(state.ready){
  window.dispatchEvent(new CustomEvent("scorace:cards-ready",{detail:{key:state.key,total:state.total,cached:state.cached}}));
  // The scene must explicitly confirm that its visible textures are painted before we hide the overlay.
 }else{
  window.dispatchEvent(new CustomEvent("scorace:cards-error",{detail:{errors:[...state.errors]}}))
 }
}
function ensure(cards){
 if(!Array.isArray(cards)||!cards.length){
  state.key="missing-collection";state.ready=false;state.working=false;
  state.total=1;state.loaded=0;state.errors=[{url:"",name:"Coleção",reason:"Nenhuma carta foi recebida"}];
  show();render();return
 }
 const key=idFor(cards);
 if(key===state.key&&(state.working||state.ready||state.errors.length))return;
 const parsed=manifest(cards);
 state.key=key;state.manifest=parsed.items;state.invalid=parsed.invalid;
 state.controller?.abort();
 load(parsed.items,parsed.invalid,++state.runId)
}
function retry(){
 if(state.working)return;
 // Retry the complete manifest to guarantee all images are still readable.
 // Already valid images are found in CacheStorage and finish quickly.
 state.controller?.abort();
 window.dispatchEvent(new Event("scorace:cards-retry"));
 load(state.manifest,state.invalid,++state.runId)
}

function waitSceneReady(check){
 if(!state.ready||!state.key)return;
 const token=++state.sceneToken;
 state.sceneReady=false;state.sceneWorking=true;state.sceneError="";state.sceneIssues=[];state.sceneProgress=null;
 show();render();
 const begun=performance.now();
 let observations=0;
 function poll(){
  if(token!==state.sceneToken||!state.ready)return;
  let result;
  try{result=check?.()}catch(e){console.warn("[Scorace] Erro ao verificar texturas 3D",e)}
  if(result&&Number.isInteger(result.total)){
   observations++;
   state.sceneProgress={done:result.done??0,total:result.total};
   if(result.ready&&observations>=2){
    state.sceneWorking=false;state.sceneReady=true;state.sceneError="";render();
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
     if(token===state.sceneToken&&state.ready&&state.sceneReady)overlay.hidden=true
    }));
    return
   }
   if(result.failed?.length){
    state.sceneError="Texturas das cartas não carregaram";
    state.sceneIssues=result.failed.map(url=>({name:String(url).split("/").pop(),reason:"Falha ao preparar textura 3D"}))
   }
  }
  if(state.sceneError||performance.now()-begun>30000){
   state.sceneWorking=false;
   if(!state.sceneError)state.sceneError="Tempo esgotado preparando as texturas 3D";
   if(!state.sceneIssues.length)state.sceneIssues=[{name:"Cena 3D",reason:state.sceneError}];
   render();
   return
  }
  render();setTimeout(poll,170)
 }
 requestAnimationFrame(()=>requestAnimationFrame(poll))
}
function isReady(cards){return state.ready&&state.key===idFor(cards)}
window.ScoraceCardCache={start:ensure,ensure,isReady,waitSceneReady,retry,stats:()=>({ready:state.ready,working:state.working,total:state.total,loaded:state.loaded,cached:state.cached,errors:state.errors.map(x=>({name:x.name,url:x.url,reason:x.reason}))})};
if(new URLSearchParams(location.search).get("collection")==="scorace"){
 const cover=()=>{show();render()};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",cover,{once:true});else cover()
}
})();