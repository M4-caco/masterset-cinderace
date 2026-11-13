const CARD_WIDTH = 630;
const CARD_HEIGHT = 880;
export const cardAspectRatio = CARD_WIDTH / CARD_HEIGHT;

export function cardCropRect(width, height, {x = .5, y = .5, zoom = 1} = {}) {
  const limit = (value, min, max) => Math.max(min, Math.min(max, value));
  x = Number.isFinite(x) ? x : .5;
  y = Number.isFinite(y) ? y : .5;
  zoom = Number.isFinite(zoom) ? zoom : 1;
  const scale = Math.max(CARD_WIDTH / width, CARD_HEIGHT / height) * limit(zoom, 1, 6);
  const w = CARD_WIDTH / scale;
  const h = CARD_HEIGHT / scale;
  return {x: limit(x * width - w / 2, 0, width - w), y: limit(y * height - h / 2, 0, height - h), w, h};
}

function paintCard(context, image, {x, y, w, h}, left, top, width, height) {
  context.save();
  context.beginPath();
  context.roundRect(left, top, width, height, width * .047);
  context.clip();
  context.drawImage(image, x, y, w, h, left, top, width, height);
  context.restore();
}

export function renderCardCrop(image, crop) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  paintCard(canvas.getContext('2d'), image, cardCropRect(image.width, image.height, crop), 0, 0, CARD_WIDTH, CARD_HEIGHT);
  return canvas.toDataURL('image/webp', .92);
}

export async function decodeCardSource(source) {
  return createImageBitmap(await (await fetch(source)).blob());
}

export function createCardCropEditor(dialog) {
  const canvas = dialog.querySelector('canvas');
  const slider = dialog.querySelector('input[type=range]');
  const percentage = dialog.querySelector('output');
  const frame = {width: 270, height: 270 / cardAspectRatio};
  frame.x = (canvas.width - frame.width) / 2;
  frame.y = (canvas.height - frame.height) / 2;
  let session;
  let pointer;

  function draw() {
    const {image, crop} = session;
    const context = canvas.getContext('2d');
    const rect = cardCropRect(image.width, image.height, crop);
    crop.x = (rect.x + rect.w / 2) / image.width;
    crop.y = (rect.y + rect.h / 2) / image.height;
    const scale = frame.width / rect.w;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, frame.x - rect.x * scale, frame.y - rect.y * scale, image.width * scale, image.height * scale);
    context.fillStyle = '#101115b8';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.clearRect(frame.x, frame.y, frame.width, frame.height);
    paintCard(context, image, rect, frame.x, frame.y, frame.width, frame.height);
    context.beginPath();
    context.roundRect(frame.x, frame.y, frame.width, frame.height, frame.width * .047);
    context.strokeStyle = '#ffaf78';
    context.lineWidth = 2;
    context.stroke();
    slider.value = crop.zoom;
    percentage.value = Math.round(crop.zoom * 100) + '%';
  }

  function pan(dx, dy) {
    const {image, crop} = session;
    const rect = cardCropRect(image.width, image.height, crop);
    crop.x -= dx * rect.w / (frame.width * image.width);
    crop.y -= dy * rect.h / (frame.height * image.height);
    draw();
  }

  canvas.onpointerdown = event => {
    if (pointer || event.button !== 0) return;
    pointer = {id: event.pointerId, x: event.clientX, y: event.clientY};
    canvas.setPointerCapture(pointer.id);
  };
  canvas.onpointermove = event => {
    if (pointer?.id !== event.pointerId) return;
    const bounds = canvas.getBoundingClientRect();
    pan((event.clientX - pointer.x) * canvas.width / bounds.width, (event.clientY - pointer.y) * canvas.height / bounds.height);
    Object.assign(pointer, {x: event.clientX, y: event.clientY});
  };
  canvas.onlostpointercapture = () => { pointer = null; };
  canvas.onkeydown = event => {
    const offset = {ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8]}[event.key];
    if (!offset) return;
    event.preventDefault();
    event.stopPropagation();
    pan(...offset);
  };
  slider.oninput = () => { session.crop.zoom = slider.valueAsNumber; draw(); };
  dialog.querySelector('[data-reset-crop]').onclick = () => { session.crop = {x: .5, y: .5, zoom: 1}; draw(); };
  dialog.querySelector('[data-cancel-crop]').onclick = () => dialog.close();
  dialog.querySelector('[data-apply-crop]').onclick = () => {
    session.result = {crop: session.crop, image: renderCardCrop(session.image, session.crop)};
    dialog.close();
  };

  return (image, crop) => new Promise(resolve => {
    session = {image, crop: {x: .5, y: .5, zoom: 1, ...crop}};
    draw();
    dialog.showModal();
    dialog.addEventListener('close', () => {
      const result = session.result;
      session = pointer = null;
      resolve(result);
    }, {once: true});
  });
}
