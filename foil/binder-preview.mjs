import {mountFoil} from './interaction.mjs';

const preview = document.getElementById('cardPreview');
const dialog = document.getElementById('cardDialog');
let reverseCards = {};
let tiltListeners;
window.addEventListener('message', event => {
  if (event.source === parent && event.origin === location.origin && event.data?.type === 'scorace:collection') {
    reverseCards = event.data.reverseFoils ?? {};
  }
});

new MutationObserver(() => {
  const image = preview.querySelector(':scope > img');
  if (!image) return;
  clearTilt();
  const id = image.getAttribute('src')?.match(/\/foil\/v1\/(card-\d+)\.webp(?:$|\?)/)?.[1];
  const config = reverseCards[id];
  if (!config) return;

  const face = document.createElement('div');
  Object.assign(face.style, {position:'relative', height:'100%', maxWidth:'100%', aspectRatio:'5 / 7'});
  Object.assign(image.style, {display:'block', width:'100%', height:'100%'});
  preview.replaceChildren(face);
  face.append(image);
  const setPose = mountFoil(face, image, config);
  preview.style.perspective = '900px';
  preview.style.touchAction = 'none';
  preview.tabIndex = 0;
  preview.setAttribute('aria-label', 'Inclinar a carta');
  const rotate = (x,y) => {
    face.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
    setPose(x,y);
  };
  tiltListeners = new AbortController();
  const options = {capture:true, signal:tiltListeners.signal};
  preview.addEventListener('pointermove', event => {
    event.stopImmediatePropagation();
    if (event.pointerType === 'touch' && !event.isPrimary) return;
    const rect = preview.getBoundingClientRect();
    const x = Math.max(-1,Math.min(1,(event.clientX-rect.left)*2/rect.width-1));
    const y = Math.max(-1,Math.min(1,(event.clientY-rect.top)*2/rect.height-1));
    rotate(-y*11.5,x*14);
  }, options);
  for (const type of ['pointerleave', 'pointercancel']) {
    preview.addEventListener(type, () => rotate(0,0), options);
  }
  preview.addEventListener('keydown', event => {
    const angles = {ArrowUp:[11.5,0],ArrowDown:[-11.5,0],ArrowLeft:[0,-14],ArrowRight:[0,14],Home:[0,0]};
    if (!Object.hasOwn(angles,event.key)) return;
    event.preventDefault();
    rotate(...angles[event.key]);
  }, options);
}).observe(preview,{childList:true});

function clearTilt() {
  tiltListeners?.abort();
  tiltListeners = undefined;
  preview.removeAttribute('tabindex');
  preview.removeAttribute('aria-label');
  preview.style.touchAction = '';
  preview.style.perspective = '';
}

dialog.addEventListener('close', clearTilt);
