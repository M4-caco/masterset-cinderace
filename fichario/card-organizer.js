(()=>{
"use strict";
let root=null,api=null,renderKey="";
const state={cards:[],family:"cinderace",status:"all",search:"",page:0,selected:null};
const pageSize=12;
const familyList=[["scorbunny","Scorbunny"],["raboot","Raboot"],["cinderace","Cinderace"],["other","Outras"],["imported","Importadas"]];
function family(c){if(!c.catalog)return "imported";const n=(c.name||"").toLowerCase();return /scorbunny|ヒバニー|炎兔儿|炎兔兒/.test(n)?"scorbunny":/raboot|ラビフット|腾蹴小将|騰蹴小將/.test(n)?"raboot":/cinderace|エースバーン|闪焰王牌|閃焰王牌/.test(n)?"cinderace":"other"}
function available(){const q=state.search.trim().toLocaleLowerCase("pt-BR");return state.cards.filter(c=>c.slot===null&&family(c)===state.family&&(state.status==="all"||(state.status==="owned")===!!c.owned)&&(!q||(String(c.name)+" "+c.id).toLocaleLowerCase("pt-BR").includes(q)))}
function initUI(){
 if(root)return;
 root=document.createElement("aside");root.id="scOrganizer";root.setAttribute("aria-label","Organização de cartas fora do fichário");
 root.innerHTML='<div class="sc-org-head"><div><strong>Cartas avulsas</strong><small id="scOrgTotal"></small></div><button id="scOrgToggle" type="button" aria-label="Recolher organizador" aria-expanded="true">−</button></div><div class="sc-org-body"><div class="sc-org-family" id="scOrgFamily" role="group" aria-label="Famílias"></div><div class="sc-org-status" role="group" aria-label="Posse"><button data-org-status="all" type="button">Todas</button><button data-org-status="owned" type="button">Tenho</button><button data-org-status="missing" type="button">Não tenho</button></div><input id="scOrgSearch" type="search" placeholder="Buscar carta ou número" aria-label="Buscar carta ou número"><p id="scOrgHint">Clique na carta e depois no bolso do fichário, ou arraste a carta até ele.</p><div id="scOrgGrid" class="sc-org-grid"></div><div id="scOrgPages" class="sc-org-pages"><button id="scOrgPrev" type="button">‹</button><span id="scOrgPosition"></span><button id="scOrgNext" type="button">›</button></div><button type="button" class="sc-org-cancel" id="scOrgCancel" hidden>Cancelar seleção</button></div>';
 document.querySelector("#binderWorkspace")?.append(root);
 const toggle=root.querySelector("#scOrgToggle");
 toggle.classList.add("sc-expand-pill");
 toggle.innerHTML='<span class="sc-pill-label"><span>Cartas avulsas</span></span><span class="sc-pill-icon" aria-hidden="true">−</span>';
 const panel=root.querySelector(".sc-org-body");
 panel.id="scOrgBody";
 const upload=document.createElement("button");
 upload.type="button";
 upload.className="sc-org-upload";
 upload.textContent="+ Adicionar imagem";
 upload.onclick=()=>api?.upload?.();
 panel.prepend(upload);
 toggle.setAttribute("aria-controls",root.id);
 toggle.onclick=()=>setOpen(root.classList.contains("collapsed"));
 root.querySelectorAll("[data-org-status]").forEach(btn=>btn.onclick=()=>{state.status=btn.dataset.orgStatus;state.page=0;draw()});
 root.querySelector("#scOrgSearch").oninput=event=>{state.search=event.target.value;state.page=0;draw()};
 root.querySelector("#scOrgPrev").onclick=()=>{state.page=Math.max(0,state.page-1);draw()};
 root.querySelector("#scOrgNext").onclick=()=>{state.page++;draw()};
 root.querySelector("#scOrgCancel").onclick=()=>{api?.cancel?.();state.selected=null;draw()};
 setOpen(false);
}
function setOpen(open){
 const toggle=document.getElementById("scOrgToggle");
 if(!root||!toggle||root.classList.contains("collapsed")===!open)return;
 root.classList.toggle("collapsed",!open);
 toggle.querySelector(".sc-pill-icon").textContent=open?"−":"+";
 toggle.setAttribute("aria-label",open?"Recolher cartas avulsas":"Abrir cartas avulsas");
 toggle.setAttribute("aria-expanded",String(open));
 window.dispatchEvent(new Event("scorace:organizer-resize"));
}
function select(card,event,skipDraw=false){
 if(!card||card.slot!==null)return;
 if(state.selected&&state.selected!==card.id)api?.cancel?.();
 state.selected=card.id;
 const ok=api?.select?.(card.id,{clientX:event?.clientX||innerWidth/2,clientY:event?.clientY||innerHeight/2});
 if(ok===false)state.selected=null;
 if(!skipDraw)draw()
}
function draw(){
 if(!root)return;
 const outside=state.cards.filter(c=>c.slot===null);
 root.querySelector("#scOrgTotal").textContent=outside.length+" fora do fichário";
 const familyBtns=familyList.filter(([key])=>!["other","imported"].includes(key)||outside.some(c=>family(c)===key)).map(pair=>{
  const btn=document.createElement("button");btn.type="button";btn.dataset.family=pair[0];btn.setAttribute("aria-pressed",String(state.family===pair[0]));btn.textContent=pair[1];
  const num=document.createElement("small");num.textContent=String(outside.filter(c=>family(c)===pair[0]).length);btn.append(num);
  btn.onclick=()=>{state.family=pair[0];state.page=0;draw()};return btn
 });
 root.querySelector("#scOrgFamily").replaceChildren(...familyBtns);
 root.querySelectorAll("[data-org-status]").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.orgStatus===state.status)));
 const pool=available(),pages=Math.max(1,Math.ceil(pool.length/pageSize));
 state.page=Math.min(state.page,pages-1);
 const fragment=document.createDocumentFragment();
 for(const card of pool.slice(state.page*pageSize,(state.page+1)*pageSize)){
  const button=document.createElement("button");button.type="button";button.draggable=true;button.className="sc-org-card";button.dataset.cardId=card.id;
  if(state.selected===card.id)button.classList.add("selected");
  button.title=card.name+" · Clique para selecionar";
  const img=document.createElement("img");img.alt=card.name;img.loading="lazy";img.decoding="async";img.draggable=false;
  const showError=()=>{img.onerror=null;img.style.display="none";const error=document.createElement("span");error.className="sc-org-image-error";error.textContent="Imagem indisponível";button.prepend(error)};
  img.onerror=showError;
  const cache=window.ScoraceCardCache;
  if(cache)cache.load(card.image).then(url=>{if(img.isConnected)img.src=url},()=>{if(img.isConnected)showError()});
  else img.src=card.image;
  button.append(img);
  const label=document.createElement("span");label.textContent=card.name;label.className="sc-org-name";button.append(label);
  button.onclick=e=>{if(button.dataset.wasDragging){button.dataset.wasDragging="";return}if(card.catalog)select(card,e);else api?.edit?.(card.id)};
  button.addEventListener("dragstart",e=>{button.dataset.wasDragging="1";e.dataTransfer?.setData("text/plain",card.id);if(e.dataTransfer)e.dataTransfer.effectAllowed="move";select(card,e,true);button.classList.add("selected")});
  button.addEventListener("dragend",()=>{button.dataset.wasDragging="";if(api?.carrying?.()){api.cancel();state.selected=null;draw()}});
  fragment.append(button)
 }
 if(!pool.length){const empty=document.createElement("p");empty.className="sc-org-empty";empty.textContent=outside.length?"Nenhuma carta corresponde aos filtros.":"Todas as cartas já estão guardadas.";fragment.append(empty)}
 root.querySelector("#scOrgGrid").replaceChildren(fragment);
 root.querySelector("#scOrgPosition").textContent=(state.page+1)+" / "+pages;
 root.querySelector("#scOrgPrev").disabled=state.page===0;
 root.querySelector("#scOrgNext").disabled=state.page+1>=pages;
 root.querySelector("#scOrgPages").hidden=pages===1;
 root.querySelector("#scOrgCancel").hidden=!state.selected;
 root.querySelector("#scOrgHint").textContent=state.selected?"Selecione um bolso no fichário 3D para colocar a carta.":"Clique na carta e depois no bolso do fichário, ou arraste a carta até ele."
}
function render(cards){
 initUI();state.cards=cards;
 const next=JSON.stringify(state.cards.map(c=>[c.id,c.name,c.catalog?c.image:null,c.slot,c.owned]));
 if(next===renderKey)return;
 renderKey=next;
 if(state.selected&&!state.cards.some(c=>c.id===state.selected&&c.slot===null))state.selected=null;
 if(!state.cards.some(c=>c.slot===null&&family(c)===state.family))state.family=familyList.find(pair=>state.cards.some(c=>c.slot===null&&family(c)===pair[0]))?.[0]||"cinderace";
 draw()
}
function dropped(){state.selected=null;renderKey="";draw()}
function showImports(){
 state.family="imported";state.status="all";state.search="";state.page=0;
 root.querySelector("#scOrgSearch").value="";
 draw();
}
function init(options){
 api=options;initUI();
 const canvas=document.querySelector(".binder-canvas");
 if(canvas&&!canvas.dataset.organizerDrop){
  canvas.dataset.organizerDrop="1";
  canvas.addEventListener("dragover",e=>{if(!state.selected)return;e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect="move"});
  canvas.addEventListener("drop",e=>{if(!state.selected)return;e.preventDefault();const ok=api?.drop?.({clientX:e.clientX,clientY:e.clientY});if(ok){state.selected=null;renderKey="";draw()}});
 }
}
window.ScoraceCardOrganizer={init,render,dropped,showImports,close:()=>setOpen(false),state:()=>({...state,cards:undefined})};
})();
