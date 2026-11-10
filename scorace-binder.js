(()=>{
'use strict';
const frame=document.getElementById('scorace-binder-frame');if(!frame)return;let mode='all',ready=false;try{const saved=localStorage.getItem('scorace_binder_mode_v1');if(['all','owned','colored'].includes(saved))mode=saved}catch{}
function controls(){document.querySelectorAll('[data-collection-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.collectionMode===mode)))}
window.refreshScoraceBinder=function(){controls();if(!ready||!window.scoraceBinderSnapshot)return;const snapshot=window.scoraceBinderSnapshot();frame.contentWindow.postMessage({...snapshot,type:'scorace:collection',mode,theme:document.documentElement.classList.contains('dark')?'dark':'light'},location.origin)};
window.openScoraceBinder=function(){if(!frame.getAttribute('src'))frame.src=frame.dataset.src;window.refreshScoraceBinder()};
for(const button of document.querySelectorAll('[data-collection-mode]'))button.addEventListener('click',()=>{mode=button.dataset.collectionMode;try{localStorage.setItem('scorace_binder_mode_v1',mode)}catch{}window.refreshScoraceBinder()});
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==frame.contentWindow)return;if(event.data?.type==='scorace:binder-ready'){ready=true;window.refreshScoraceBinder()}});
new MutationObserver(()=>window.refreshScoraceBinder()).observe(document.documentElement,{attributes:true,attributeFilter:['class']});controls();
})();
