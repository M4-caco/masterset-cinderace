import { cb as WebGLRenderer } from './chunks/chunk-OTERQLNG.js';

const backgroundImage = new URL('../site-assets/scorace-background.webp', import.meta.url);
const nextFrame = () => new Promise(requestAnimationFrame);

async function paintBackground(context, width, height) {
  const image = new Image();
  image.src = backgroundImage.href;
  await image.decode();
  const scale = Math.max(width / image.width, height / image.height);
  context.drawImage(image, (width - image.width * scale) / 2, (height - image.height * scale) / 2,
    image.width * scale, image.height * scale);
}

export async function exportBinderImage(scene, camera, renderer, options) {
  const {width, height, withBackground, report} = options;
  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  const context = output.getContext('2d');
  if (withBackground) await paintBackground(context, width, height);

  const image = document.createElement('canvas');
  image.width = width;
  image.height = height;
  const layer = image.getContext('2d');
  const exportRenderer = new WebGLRenderer({alpha: true, antialias: true, logarithmicDepthBuffer: true,
    preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  exportRenderer.setClearColor(0, 0);
  exportRenderer.outputColorSpace = renderer.outputColorSpace;
  exportRenderer.toneMapping = renderer.toneMapping;
  exportRenderer.toneMappingExposure = renderer.toneMappingExposure;
  exportRenderer.shadowMap.enabled = renderer.shadowMap.enabled;
  exportRenderer.shadowMap.type = renderer.shadowMap.type;
  const tileWidth = Math.ceil(width / Math.ceil(width / 1280));
  const tileHeight = Math.ceil(height / Math.ceil(height / 720));
  const {offsetX, offsetY} = camera.view;
  scene.updateMatrixWorld(true);
  const snapshot = scene.clone(true);
  let engine;
  let fallback = false;
  try {
    const renderTiles = async photo => {
      const columns = Math.ceil(width / tileWidth);
      const rows = Math.ceil(height / tileHeight);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const x = col * tileWidth, y = row * tileHeight;
          const tileW = Math.min(tileWidth, width - x), tileH = Math.min(tileHeight, height - y);
          report(`Renderizando ${row * columns + col + 1} de ${columns * rows}…`);
          await nextFrame();
          exportRenderer.setSize(tileW, tileH, false);
          camera.setViewOffset(width, height, x + offsetX, y + offsetY, tileW, tileH);
          if (photo) {
            if (!engine) {
              engine = photo.createPhotorealEngine(exportRenderer, snapshot, camera, {exportImage: true});
              await engine.prepare();
            } else engine.updateCamera();
            const deadline = performance.now() + 45000;
            let samples;
            do {
              exportRenderer.clear();
              samples = engine.sample();
              if (exportRenderer.getContext().isContextLost() || performance.now() > deadline) {
                throw new Error('A GPU não concluiu o render final.');
              }
              await nextFrame();
            } while (samples < 12);
          } else exportRenderer.render(snapshot, camera);
          layer.drawImage(exportRenderer.domElement, x, y);
        }
      }
    };
    try {
      await renderTiles(await import('./photoreal.js?v=binder-tools'));
    } catch (error) {
      engine?.dispose();
      engine = null;
      if (exportRenderer.getContext().isContextLost()) throw error;
      fallback = true;
      layer.clearRect(0, 0, width, height);
      await renderTiles(null);
    }
  } finally {
    engine?.dispose();
    snapshot.traverse(node => {
      node.shadow?.map?.dispose();
      node.shadow?.mapPass?.dispose();
    });
    exportRenderer.dispose();
    exportRenderer.forceContextLoss();
  }
  if (withBackground) {
    context.shadowColor = '#000a';
    context.shadowBlur = Math.max(10, width / 90);
    context.shadowOffsetY = Math.max(5, height / 110);
  }
  context.drawImage(image, 0, 0);
  const blob = await new Promise(resolve => output.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Não foi possível gerar o PNG.');
  return {blob, fallback};
}

export function setupImageSave(getRenderer, onFinish) {
  const dialog = document.getElementById('saveImageDialog');
  const form = document.getElementById('saveBinderImage');
  const resolution = document.getElementById('binderResolution');
  const background = document.getElementById('binderExportBackground');
  const status = document.getElementById('binderExportStatus');
  const report = message => { status.textContent = message; };
  let running = false;
  form.onsubmit = async event => {
    event.preventDefault();
    if (running) return;
    const renderer = getRenderer();
    if (!renderer?.saveImage) { report('O fichário 3D precisa estar disponível para salvar.'); return; }
    running = true;
    document.body.classList.add('sc-exporting');
    const fields = [...form.elements, dialog.querySelector('[data-close-tool]')];
    fields.forEach(control => { control.disabled = true; });
    report('Preparando a imagem…');
    try {
      const width = Number(resolution.value);
      const height = width * 9 / 16;
      const {blob, fallback} = await renderer.saveImage({width, height, withBackground: background.value === 'site', report});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `scorace-fichario-${width}x${height}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      report(fallback ? 'PNG salvo. A GPU usou o render interativo.' : 'PNG salvo.');
    } catch (error) {
      report(error.message || 'Não foi possível salvar a imagem.');
    } finally {
      running = false;
      document.body.classList.remove('sc-exporting');
      onFinish();
      fields.forEach(control => { control.disabled = false; });
    }
  };
  dialog.addEventListener('cancel', event => { if (running) event.preventDefault(); });
  dialog.addEventListener('close', () => { if (!running) report(''); });
}
