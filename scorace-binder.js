(()=>{
'use strict';
const brandLogo=document.querySelector('img.brand-logo');if(brandLogo){brandLogo.addEventListener('error',function(){if(this.getAttribute('src')!=='scorace.png')this.src='scorace.png'},{once:true});brandLogo.src='scorace-logo-nova.webp';brandLogo.style.width='180px';brandLogo.style.height='60px';brandLogo.style.maxWidth='min(36vw,180px)';}const frame=document.getElementById('scorace-binder-frame');if(!frame)return;let mode='all',ready=false;try{const saved=localStorage.getItem('scorace_binder_mode_v1');if(['all','owned','colored'].includes(saved))mode=saved}catch{}

function controls(){document.querySelectorAll('[data-collection-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.collectionMode===mode)))}
window.refreshScoraceBinder=function(){controls();if(!ready||!window.scoraceBinderSnapshot)return;const snapshot=window.scoraceBinderSnapshot();frame.contentWindow.postMessage({...snapshot,type:'scorace:collection',mode,theme:document.documentElement.classList.contains('dark')?'dark':'light'},location.origin)};
window.openScoraceBinder=function(){if(!frame.getAttribute('src'))frame.src=frame.dataset.src;window.refreshScoraceBinder()};
for(const button of document.querySelectorAll('[data-collection-mode]'))button.addEventListener('click',()=>{mode=button.dataset.collectionMode;try{localStorage.setItem('scorace_binder_mode_v1',mode)}catch{}window.refreshScoraceBinder()});
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==frame.contentWindow)return;if(event.data?.type==='scorace:binder-ready'){ready=true;window.refreshScoraceBinder()}if(event.data?.type==='scorace:set-mode'&&['all','owned','colored'].includes(event.data.mode)){mode=event.data.mode;try{localStorage.setItem('scorace_binder_mode_v1',mode)}catch{}window.refreshScoraceBinder()}});
new MutationObserver(()=>window.refreshScoraceBinder()).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
const originalModes=[...document.querySelectorAll('[data-collection-mode]')];
for(const b of originalModes){b.style.display='none';b.tabIndex=-1;b.setAttribute('aria-hidden','true')}
if(originalModes.length){const p=originalModes[0].parentElement;if(p&&[...p.children].every(c=>c.matches?.('[data-collection-mode]')))p.style.display='none'}
const screenStyle=document.createElement('style');screenStyle.textContent='body.scorace-iframe-fit{overflow:hidden!important}';document.head.append(screenStyle);
function fitBinderViewport(){
 const visible=frame.getClientRects().length>0&&frame.offsetWidth>0&&getComputedStyle(frame).visibility!=='hidden';
 document.body.classList.toggle('scorace-iframe-fit',visible);
 if(visible){
  const height=Math.max(280,Math.floor(window.innerHeight-frame.getBoundingClientRect().top-2));
  if(frame.style.height!==height+'px')frame.style.setProperty('height',height+'px','important');
  if(frame.style.maxHeight!==height+'px')frame.style.setProperty('max-height',height+'px','important')
 }
}
window.addEventListener('resize',fitBinderViewport);
document.addEventListener('click',()=>requestAnimationFrame(fitBinderViewport),true);
setTimeout(fitBinderViewport,150);
setInterval(fitBinderViewport,900);
controls();
})();
