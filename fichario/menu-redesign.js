function setupScoraceMenu(){
const panel=document.querySelector('#collectionPanel .dock-content'),workspace=document.getElementById('binderWorkspace');
if(!panel||!workspace||panel.dataset.newMenu)return;
panel.dataset.newMenu='true';document.body.classList.add('sc-menu-new');
const section=(name,id)=>{const s=document.createElement('section');s.className='sc-menu-section';s.id=id;const h=document.createElement('h3');h.textContent=name;s.append(h);panel.append(s);return s};
const binder=section('Fichário','scMenuBinder'),heading=document.querySelector('.binder-heading');
if(heading)binder.append(heading);
const editor=document.getElementById('editMode');
if(editor){const span=document.createElement('span');span.textContent='Editar fichário';editor.append(span);editor.classList.add('sc-editor-fab');workspace.append(editor)}
const toolbar=document.querySelector('.book-toolbar');if(toolbar)binder.append(toolbar);
const view=section('Visualização','scMenuView');
for(const selector of ['.camera-bar','.scene-top']){const item=document.querySelector(selector);if(item)view.append(item)}
const collection=section('Coleção','scMenuCollection');
const modes=document.createElement('div');modes.className='sc-modes';modes.id='scModes';
for(const [mode,label] of [['all','Todas'],['owned','Só tenho'],['colored','Tenho coloridas']]){
const button=document.createElement('button');button.type='button';button.dataset.mode=mode;button.textContent=label;
button.onclick=()=>{for(const b of modes.children)b.setAttribute('aria-pressed',String(b.dataset.mode===mode));window.parent.postMessage({type:'scorace:set-mode',mode},location.origin)};
modes.append(button)}collection.append(modes);
const organize=document.getElementById('binderOrganization');if(organize){organize.open=false;collection.append(organize)}
const zoom=section('Zoom','scMenuZoom'),zc=document.querySelector('.zoom-control');if(zc)zoom.append(zc);
const quality=section('Desempenho','scMenuQuality');for(const selector of ['.render-quality','#renderStatus']){const el=document.querySelector(selector);if(el)quality.append(el)}
const screen=section('Interface','scMenuScreen'),visibility=document.getElementById('uiVisibility');
if(visibility)screen.append(visibility);
const show=document.createElement('button');show.id='scShowMenus';show.type='button';show.textContent='☰ Mostrar controles';show.onclick=()=>visibility?.click();workspace.append(show);
document.querySelector('#collectionPanel .dock-quick')?.remove();
document.getElementById('trayToggle')?.setAttribute('hidden','');
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==window.parent||e.data?.type!=='scorace:collection')return;for(const b of modes.children)b.setAttribute('aria-pressed',String(b.dataset.mode===e.data.mode))});
for(const b of modes.children)b.setAttribute('aria-pressed',String(b.dataset.mode==='all'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupScoraceMenu,{once:true});else setupScoraceMenu();
