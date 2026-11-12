import {paintFoil, prepareFoil, stencilFor} from './render.mjs';

const root = new URL('../', import.meta.url);
const images = new Map();

function load(url) {
  if (!images.has(url)) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Imagem de foil indisponível'));
      image.src = url;
    }).catch(error => {
      images.delete(url);
      throw error;
    });
    images.set(url, promise);
    if (images.size > 12) images.delete(images.keys().next().value);
  }
  return images.get(url);
}

export function mountFoil(host, image, config) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.hidden = true;
  Object.assign(canvas.style, {
    position:'absolute', inset:'0', width:'100%', height:'100%',
    objectFit:'contain', pointerEvents:'none', borderRadius:'inherit'
  });
  host.append(canvas);
  const ctx = canvas.getContext('2d');
  let scene, frame, pose = {rotateX:0, rotateY:0};
  const setPose = (rotateX, rotateY) => {
    pose = {rotateX, rotateY};
    if (!scene || frame || !canvas.isConnected) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      if (canvas.isConnected) ctx.putImageData(paintFoil(scene, pose), 0, 0);
    });
  };
  if (!ctx) return setPose;

  const stencil = stencilFor(config.effect);
  Promise.all([
    load(new URL(config.base, root).href),
    stencil && load(new URL(stencil, import.meta.url).href),
    config.print && load(new URL(config.print, root).href)
  ]).then(([base, mask, print]) => {
    if (!canvas.isConnected) return;
    const createCanvas = (width, height) => Object.assign(document.createElement('canvas'), {width,height});
    scene = prepareFoil(base, config, mask, print, Math.min(500,base.naturalWidth), createCanvas, Path2D);
    canvas.width = scene.w;
    canvas.height = scene.h;
    canvas.style.borderRadius = getComputedStyle(image).borderRadius;
    ctx.putImageData(paintFoil(scene, pose), 0, 0);
    canvas.hidden = false;
    image.style.opacity = '0';
  }).catch(error => console.warn('[Scorace] Prévia estática do reverse foil', error));

  return setPose;
}
