(()=>{
"use strict";
const CACHE="scorace-card-images-v1";
const state={fingerprint:"",busy:false,total:0,done:0,loaded:0,cached:0,errors:[],run:0,hidden:false};
let overlay;
function ui(){
 if(overlay)return overlay;
 overlay=document.createElement("section");overlay.id="scCardLoader";overlay.setAttribute("role","status");overlay.setAttribute("aria-live","polite");
 overlay.innerHTML='<div class="sc-loader-card"><div class="sc-loader-logo">✦ SCORACE</div><h2>Preparando seu fichário</h2><p id="scLoaderMessage">Verificando as imagens e o cache do navegador.</p><div class="sc-loader-numbers"><strong id="scLoaderCount">0 / 0</strong><span id="scLoaderPercent">0%</span></div><div class="sc-loader-progress" role="progressbar" aria-label="Progresso das imagens" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="scLoaderBar"></i></div><p id="scLoaderMeta">Iniciando…</p><div class="sc-loader-actions"><button type="button" id="scLoaderRetry" hidden>Tentar novamente</button><button type="button" id="scLoaderSkip">Entrar no fichário</button></div></div>';
 document.body.append(overlay);
 overlay.querySelector("#scLoaderSkip").onclick=()=>{state.hidden=true;overlay.hidden=true};
 overlay.querySelector("#scLoaderRetry").onclick=()=>{const urls=state.errors.map(item=>item.url);if(urls.length){state.hidden=false;overlay.hidden=false;run(urls)}};
 return overlay
}
function render(){
 if(!overlay)return;
 const pct=state.total?Math.round(state.done/state.total*100):100;
 overlay.querySelector("#scLoaderCount").textContent=state.done+" / "+state.total;
 overlay.querySelector("#scLoaderPercent").textContent=pct+"%";
 overlay.querySelector("#scLoaderBar").style.width=pct+"%";
 overlay.querySelector(".sc-loader-progress").setAttribute("aria-valuenow",String(pct));
 overlay.querySelector("#scLoaderMeta").textContent=state.cached+" no cache · "+state.loaded+" disponíveis"+(state.errors.length?" · "+state.errors.length+" com falha":"");
 overlay.querySelector("#scLoaderMessage").textContent=state.busy?"Carregando as cartas. Nas próximas visitas, o navegador poderá reutilizá-las.":state.errors.length?"Algumas imagens falharam. Tente novamente ou entre no fichário.":"Arquivos recebidos. As texturas 3D são preparadas conforme as cartas aparecem.";
 overlay.querySelector("#scLoaderRetry").hidden=state.busy||!state.errors.length;
 overlay.querySelector("#scLoaderSkip").textContent=state.busy?"Entrar enquanto carrega":"Entrar no fichário"
}
function urlsFrom(cards){
 const urls=new Set;
 for(const card of cards||[])try{if(typeof card?.image==="string"&&card.image.trim()){const url=new URL(card.image,document.baseURI);if(["http:","https:","data:","blob:"].includes(url.protocol))urls.add(url.href)}}catch{}
 return [...urls]
}
async function fetchTimed(url,ms){
 const c=new AbortController,t=setTimeout(()=>c.abort(),ms);
 try{return await fetch(url,{mode:"cors",credentials:"same-origin",cache:"force-cache",signal:c.signal})}
 finally{clearTimeout(t)}
}
async function loadOne(url,cache){
 if(/^(data:|blob:)/.test(url))return{ok:true,cached:false};
 if(new URL(url).origin!==location.origin){
  return await new Promise(resolve=>{const img=new Image;let done=false;const finish=ok=>{if(done)return;done=true;clearTimeout(timer);img.onload=img.onerror=null;resolve({ok,cached:false})},timer=setTimeout(()=>finish(false),11000);img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src=url})
 }
 if(cache)try{if(await cache.match(url,{ignoreVary:true}))return{ok:true,cached:true}}catch{}
 let last;
 for(let attempt=0;attempt<2;attempt++)try{
  const response=await fetchTimed(url,attempt?14000:11000);
  if(!response.ok||!response.headers.get("content-type")?.startsWith("image/"))throw Error("HTTP "+response.status+" ou não é imagem");
  if(cache)try{await cache.put(url,response.clone());return{ok:true,cached:false}}catch(e){console.warn("[Scorace] Sem espaço para cache:",e)}
  return{ok:true,cached:false}
 }catch(e){last=e}
 console.warn("[Scorace] Não foi possível obter a carta",url,last);return{ok:false,cached:false,error:String(last)}
}
async function run(urls){
 const token=++state.run;state.busy=true;state.done=state.loaded=state.cached=0;state.total=urls.length;state.errors=[];render();
 let cache=null;try{if("caches" in window)cache=await caches.open(CACHE)}catch(e){console.warn("[Scorace] Cache indisponível:",e)}
 if(navigator.serviceWorker)navigator.serviceWorker.register("./card-sw.js",{scope:"./"}).catch(e=>console.warn("[Scorace] Service Worker não ativado",e));
 let index=0;
 async function worker(){
  while(token===state.run&&index<urls.length){
   const url=urls[index++],result=await loadOne(url,cache);
   if(token!==state.run)return;
   state.done++;if(result.ok){state.loaded++;if(result.cached)state.cached++}else state.errors.push({url,error:result.error});
   render()
  }
 }
 await Promise.all(Array.from({length:Math.min(6,urls.length)},worker));
 if(token!==state.run)return;
 state.busy=false;render();
 window.dispatchEvent(new CustomEvent("scorace:cards-cached",{detail:{total:state.total,loaded:state.loaded,cached:state.cached,failed:state.errors.length}}));
 if(!state.errors.length&&!state.hidden)setTimeout(()=>{if(!state.busy&&token===state.run){state.hidden=true;overlay.hidden=true}},850)
}
function start(cards){
 const urls=urlsFrom(cards);if(!urls.length)return;
 const key=urls.slice().sort().join("|");
 if(key===state.fingerprint&&(state.busy||(state.done===state.total&&!state.errors.length)))return;
 state.fingerprint=key;state.hidden=false;ui();overlay.hidden=false;run(urls)
}
window.ScoraceCardCache={start,stats:()=>({total:state.total,done:state.done,cached:state.cached,errors:state.errors.map(x=>x.url)})}
})();
