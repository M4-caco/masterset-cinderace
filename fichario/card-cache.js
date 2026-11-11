(()=>{
"use strict";
const THUMBS="scorace-3d-thumbnails-v2";
const ORIGINALS="scorace-card-images-v1";
const memory=new Map();
const state={key:"",ready:false,loading:false,items:[],errors:[],done:0,total:0,phase:"idle",sceneToken:0,generation:0,scope:null,sceneCheck:null,sceneError:null,sceneCount:null};
let overlay=null;
function mount(){
 if(overlay)return;
 overlay=document.createElement("section");
 overlay.id="scCardLoader";overlay.setAttribute("role","status");overlay.setAttribute("aria-live","polite");
 overlay.innerHTML='<div class="sc-loader-card"><div class="sc-loader-logo">✦ SCORACE</div><h2>Preparando as cartas</h2><p id="scLoaderMessage"></p><div class="sc-loader-numbers"><strong id="scLoaderCount">0 / 0</strong><span id="scLoaderPercent">0%</span></div><div class="sc-loader-progress" role="progressbar" aria-label="Cartas necessárias para abrir" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="scLoaderBar"></i></div><p id="scLoaderMeta"></p><div id="scLoaderFailures" hidden></div><div class="sc-loader-actions"><button type="button" id="scLoaderRetry" hidden>Tentar novamente</button></div></div>';
 overlay.querySelector("#scLoaderRetry").onclick=retry;
 const errors=overlay.querySelector("#scLoaderFailures");
 errors.style.cssText="margin-top:14px;max-height:142px;overflow-y:auto;color:#f3c7b3;font:11px/1.5 system-ui;overflow-wrap:anywhere";
 document.body.append(overlay);
}
function draw(){
 if(!overlay)return;
 const scene=state.phase==="scene";
 const done=scene?(state.sceneCount?.done??0):Math.max(0,state.done-state.errors.length);
 const total=scene?(state.sceneCount?.total??0):state.total;
 const pct=total?Math.round(done/total*100):0;
 overlay.querySelector("#scLoaderCount").textContent=done+" / "+total;
 overlay.querySelector("#scLoaderPercent").textContent=pct+"%";
 overlay.querySelector("#scLoaderBar").style.width=pct+"%";
 overlay.querySelector(".sc-loader-progress").setAttribute("aria-valuenow",String(pct));
 overlay.querySelector("#scLoaderMessage").textContent=state.loading?"Preparando as imagens prioritárias. As demais carregarão quando forem exibidas.":scene?"Aguardando as texturas das cartas aparecerem na cena 3D.":state.sceneError?"Não foi possível preparar algumas texturas.":"";
 overlay.querySelector("#scLoaderMeta").textContent=scene?"Preparação do 3D":"Miniaturas otimizadas guardadas no navegador";
 const issues=state.sceneError?[{name:"Texturas 3D",error:state.sceneError}]:state.errors;
 const list=overlay.querySelector("#scLoaderFailures");
 list.hidden=!issues.length;
 list.replaceChildren();
 issues.slice(0,12).forEach(issue=>{const line=document.createElement("p");line.textContent=issue.name+": "+issue.error;list.append(line)});
 const retry=overlay.querySelector("#scLoaderRetry");
 retry.hidden=state.loading||state.phase==="scene"&&!state.sceneError||!issues.length;
}
function show(){mount();overlay.hidden=false;draw()}
function names(cards){
 const chosen=new Map();
 const put=c=>{if(typeof c?.image!=="string"||!c.image.trim())return;try{const u=new URL(c.image,document.baseURI);if(!chosen.has(u.href))chosen.set(u.href,{url:u.href,name:String(c.name||"Carta").slice(0,100)})}catch{}};
 cards.slice(0,5).forEach(put);
 return [...chosen.values()]
}
function digest(cards,mode){return mode+"|"+names(mode==="owned"?cards.filter(c=>c.owned):cards).map(x=>x.url).join("|")}
function thumbnail(url){return memory.get(url)||null}
function withTimeout(url,ms=12000){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ms);
 return fetch(url,{cache:"force-cache",credentials:"same-origin",signal:controller.signal}).finally(()=>clearTimeout(timer))
}
async function toThumbnail(blob){
 if(!blob.size)throw Error("Imagem vazia");
 let bitmap;
 try{
  bitmap=await createImageBitmap(blob);
  if(!bitmap.width||!bitmap.height)throw Error("Dimensões inválidas");
  const scale=Math.min(1,640/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext("2d",{alpha:false});
  if(!ctx)throw Error("Canvas 2D indisponível");
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  const resized=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",.82));
  if(!resized?.size)throw Error("Não foi possível gerar miniatura");
  return resized
 }finally{bitmap?.close()}
}
async function getImage(item){
 const {url}=item;
 if(memory.has(url))return;
 let cache=null,origCache=null;
 if("caches" in window)try{cache=await caches.open(THUMBS);origCache=await caches.open(ORIGINALS)}catch{}
 if(cache)try{
  const stored=await cache.match(url,{ignoreVary:true});
  if(stored?.ok){const blob=await stored.blob();if(blob.size>0){const bmp=await createImageBitmap(blob);if(!bmp.width||!bmp.height)throw Error("Miniatura inválida");bmp.close();memory.set(url,URL.createObjectURL(blob));return}}
 }catch(e){console.warn("[Scorace] Miniatura inválida",item.name,e);await cache.delete(url).catch(()=>{})}
 let error;
 for(let attempt=0;attempt<2;attempt++)try{
  let response;
  if(attempt===0&&origCache)response=await origCache.match(url,{ignoreVary:true});
  if(!response?.ok)response=await withTimeout(url,attempt?16000:12000);
  if(!response?.ok)throw Error("HTTP "+response?.status);
  const blob=await response.blob();
  let thumb=await toThumbnail(blob);
  if(cache)try{await cache.put(url,new Response(thumb,{headers:{"Content-Type":"image/webp"}}))}catch(e){console.warn("[Scorace] Cache sem espaço",e)}
  memory.set(url,URL.createObjectURL(thumb));
  return
 }catch(e){error=e;console.warn("[Scorace] Falha de miniatura",item.url,e)}
 throw error||Error("Imagem inacessível")
}
async function start(cards,mode="all",force=false){
 const filtered=mode==="owned"?cards.filter(x=>x.owned):cards;
 const list=names(filtered),key=digest(cards,mode);
 if(!force&&state.key===key&&(state.ready||state.loading||state.errors.length))return;
 state.generation++;
 const current=state.generation;
 state.key=key;state.items=list;state.total=list.length;state.done=0;state.errors=[];state.ready=false;state.loading=true;state.phase="thumbs";state.sceneError=null;state.sceneToken++;
 show();
 if(!list.length){state.loading=false;state.ready=true;draw();window.dispatchEvent(new CustomEvent("scorace:cards-ready",{detail:{count:0}}));return}
 let index=0;
 async function worker(){
  while(current===state.generation&&index<list.length){
   const item=list[index++];
   try{await getImage(item)}catch(e){state.errors.push({name:item.name,error:e?.message||String(e)})}
   if(current!==state.generation)return;
   state.done++;draw()
  }
 }
 await Promise.all(Array.from({length:Math.min(4,list.length)},worker));
 if(current!==state.generation)return;
 state.loading=false;state.ready=!state.errors.length;
 draw();
 if(state.ready)window.dispatchEvent(new CustomEvent("scorace:cards-ready",{detail:{count:list.length}}));
}
function isReady(cards,mode){return state.ready&&state.key===digest(cards,mode)}
function retry(){
 if(state.loading)return;
 if(state.sceneError){
  state.sceneError=null;
  window.dispatchEvent(new Event("scorace:cards-retry"));
  if(state.sceneCheck)waitSceneReady(state.sceneCheck);
  return
 }
 if(state.scope)start(state.scope.cards,state.scope.mode,true);
}
function ensure(cards,mode="all"){if(!Array.isArray(cards)){return}state.scope={cards,mode};start(cards,mode)}
function waitSceneReady(check){
 if(!state.ready)return;
 const token=++state.sceneToken;
 state.sceneCheck=check;state.sceneError=null;state.sceneCount=null;state.phase="scene";
 show();
 const t=performance.now();
 let previous="";
 function tick(){
  if(token!==state.sceneToken||!state.ready)return;
  let result;
  try{result=check?.()}catch(e){state.sceneError=String(e)}
  if(result&&Number.isInteger(result.total)){
   state.sceneCount={done:result.done||0,total:result.total};
   if(result.failed?.length)state.sceneError="Falha nas imagens: "+result.failed.slice(0,5).map(x=>String(x).split("/").pop()).join(", ");
   if(result.ready&&!state.sceneError){
    state.phase="complete";state.sceneCheck=null;state.sceneCount=result;draw();
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(token===state.sceneToken&&state.ready)overlay.hidden=true}));
    return
   }
   const signature=state.sceneCount.done+"/"+state.sceneCount.total;
   if(signature!==previous)previous=signature;
  }
  if(performance.now()-t>16000&&!state.sceneError){state.sceneError="Texturas ainda não prontas. Você pode tentar novamente."}
  if(state.sceneError){draw();return}
  draw();setTimeout(tick,160)
 }
 requestAnimationFrame(tick)
}

async function capture(url,image){
 if(memory.has(url)||!image?.naturalWidth||!image?.naturalHeight)return;
 let cache=null;
 try{
  const scale=Math.min(1,640/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const ctx=canvas.getContext("2d",{alpha:false});ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",.82));
  if(!blob?.size)return;
  if("caches" in window){cache=await caches.open(THUMBS);await cache.put(url,new Response(blob,{headers:{"Content-Type":"image/webp"}}))}
  if(!memory.has(url))memory.set(url,URL.createObjectURL(blob))
 }catch(e){console.warn("[Scorace] Não foi possível otimizar imagem 3D",url,e)}
}
function warm(cards,page,pockets){
 const visible=cards.filter(c=>c.slot!==null&&Math.abs(Math.floor(c.slot/pockets)-page*2)<=2);
 let n=0;
 async function queue(){
  for(const card of visible){if(n++>=4)break;try{await getImage({url:new URL(card.image,document.baseURI).href,name:card.name})}catch{}}
 }
 queue()
}
window.addEventListener("pagehide",()=>{for(const u of memory.values())URL.revokeObjectURL(u);memory.clear()});
window.ScoraceCardCache={start:ensure,ensure,isReady,thumbnail,capture,waitSceneReady,warm,retry,stats:()=>({ready:state.ready,loading:state.loading,done:state.done,total:state.total,errors:state.errors})};
if(new URLSearchParams(location.search).get("collection")==="scorace"){
 const open=()=>{mount();show()};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",open,{once:true});else open()
}
})();