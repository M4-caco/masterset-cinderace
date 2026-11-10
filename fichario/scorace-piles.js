(()=>{"use strict";
const st={open:null,lang:"all",page:{},fingerprint:"",cards:[],root:null,pick:null};
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=String(txt);return e}
function btn(txt,fn,cls){const b=el("button",cls,txt);b.type="button";b.addEventListener("click",ev=>{ev.stopPropagation();fn(ev)});return b}
function kind(c){const n=(c.name||"").toLowerCase();return n.includes("scorbunny")?"scorbunny":n.includes("raboot")?"raboot":n.includes("cinderace")?"cinderace":"outros"}
function lang(c){const s=(c.name||"").split(" · ").at(-1).trim().toUpperCase();return /^(PT-BR|PT|EN|JP|JA|CH|CN|ZH|ES|DE|FR|IT|KO|KR)(-[A-Z]+)?$/.test(s)?s:c.back==="japanese"?"JP":"OUTROS"}
function close(){st.open=null;paint()}
function paint(){
 const root=st.root;if(!root)return;root.replaceChildren();
 const free=st.cards.filter(c=>c.slot===null);
 const groups=[["scorbunny","Scorbunny"],["raboot","Raboot"],["cinderace","Cinderace"]];
 if(free.some(c=>kind(c)==="outros"))groups.push(["outros","Outras"]);
 for(const [key,label] of groups){
  const cards=free.filter(c=>kind(c)===key);if(!cards.length)continue;
  const pile=el("div","sc-pile sc-"+key+(st.open===key?" sc-expanded":""));
  const trigger=btn("",()=>{st.open=st.open===key?null:key;paint()},"sc-pile-trigger");
  trigger.title=label+": "+cards.length+" cartas. Passe o mouse para espalhar.";
  trigger.setAttribute("aria-expanded",String(st.open===key));
  const cover=cards.find(c=>st.lang==="all"||lang(c)===st.lang)||cards[0];
  const stack=el("span","sc-pile-art");
  for(let k=0;k<3;k++){const sh=el("span","sc-pile-sheet");if(k===2){const im=el("img");im.src=cover.image;im.alt="";im.loading="lazy";im.decoding="async";im.style.filter=cover.muted?"grayscale(1)":"none";sh.append(im)}stack.append(sh)}
  const meta=el("span","sc-pile-info");meta.append(el("strong","",label),el("small","",cards.length+" cartas · "+new Set(cards.map(lang)).size+" idiomas"));trigger.append(stack,meta);pile.append(trigger);
  pile.addEventListener("mouseenter",()=>{if(matchMedia("(hover:hover)").matches&&st.open!==key){st.open=key;paint()}});
  pile.addEventListener("mouseleave",()=>{if(matchMedia("(hover:hover)").matches&&st.open===key)close()});
  if(st.open===key){
   const fan=el("div","sc-pile-fan"),head=el("div","sc-fan-head");head.append(el("strong","",label+" · organizar"),btn("×",close,"sc-fan-close"));fan.append(head);
   const langs=[...new Set(cards.map(lang))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
   const filters=el("div","sc-fan-langs");
   for(const l of ["all",...langs]){
    const b=btn(l==="all"?"Todos":l,()=>{st.lang=l;st.page[key]=0;paint()},l===st.lang?"selected":"");b.setAttribute("aria-pressed",String(l===st.lang));filters.append(b)
   }fan.append(filters);
   const chosen=cards.filter(c=>st.lang==="all"||lang(c)===st.lang).sort((a,b)=>lang(a).localeCompare(lang(b),"pt-BR")||a.name.localeCompare(b.name,"pt-BR"));
   const pages=Math.max(1,Math.ceil(chosen.length/10)),page=Math.max(0,Math.min(st.page[key]||0,pages-1));st.page[key]=page;
   const strip=el("div","sc-fan-strip");
   for(const card of chosen.slice(page*10,page*10+10)){
    const item=btn("",ev=>{st.open=null;paint();st.pick?.(card.id,ev)},"sc-fan-card");item.title=card.name;
    const im=el("img");im.src=card.image;im.alt=card.name;im.loading="lazy";im.decoding="async";im.style.filter=card.muted?"grayscale(1)":"none";
    item.append(im,el("small","",card.name.split(" · ").slice(1).join(" · ")||card.name));strip.append(item)
   }fan.append(strip);
   const pager=el("div","sc-fan-footer"),prev=btn("←",()=>{st.page[key]=page-1;paint()}),next=btn("→",()=>{st.page[key]=page+1;paint()});prev.disabled=page===0;next.disabled=page+1>=pages;
   pager.append(prev,el("span","",(page+1)+" / "+pages),next);fan.append(pager);pile.append(fan)
  }root.append(pile)
 }
 if(free.length){
  const dock=el("div","sc-language-dock");dock.append(el("strong","","IDIOMAS"),el("small","","Filtrar as três pilhas"));
  const chips=el("div","sc-language-chips");
  for(const l of ["all",...[...new Set(free.map(lang))].sort((a,b)=>a.localeCompare(b,"pt-BR"))]){
   const b=btn(l==="all"?"Todos":l,()=>{st.lang=l;st.page={};paint()},l===st.lang?"selected":"");b.setAttribute("aria-pressed",String(l===st.lang));chips.append(b)
  }dock.append(chips);root.append(dock)
 }
}
window.ScoracePiles={
 render(cards,pick){
  if(!document.body.classList.contains("scorace-embedded"))return;
  st.cards=cards||[];st.pick=pick;
  if(!st.root){st.root=el("section","sc-stack-deck");st.root.id="scoraceTableStacks";st.root.setAttribute("aria-label","Cartas avulsas por Pokémon e idioma");document.getElementById("binderWorkspace")?.append(st.root)}
  const key=st.cards.filter(c=>c.slot===null).map(c=>c.id+":"+!!c.muted+":"+c.name).join("|");
  if(key!==st.fingerprint){st.fingerprint=key;paint()}
 },
 close
};
})();