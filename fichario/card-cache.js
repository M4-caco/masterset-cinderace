(() => {
"use strict";

const assets = new URL("assets/card-textures-v1/", document.currentScript.src);
const previews = new Map();
const sheets = new Map();
const requests = new Map();
const queue = [];
const concurrency = 4;
let running = 0;
let manifest;
let overlay;
let pending;
let generation = 0;

function loadImage(url) {
 return new Promise((resolve, reject) => {
  const image = new Image();
  if (new URL(url, document.baseURI).origin !== location.origin) image.crossOrigin = "anonymous";
  const timer = setTimeout(() => finish(new Error("Tempo de resposta esgotado")), 10000);
  function finish(error) {
   clearTimeout(timer);
   image.onload = image.onerror = null;
   if (error) {
    image.removeAttribute("src");
    reject(error);
   } else {
    resolve(image);
   }
  }
  image.onload = () => finish();
  image.onerror = () => finish(new Error("Arquivo indisponível ou inválido"));
  image.src = url;
 });
}

function loadSheet(number) {
 if (!sheets.has(number)) {
  const url = new URL(String(number).padStart(2, "0") + ".webp", assets);
  const promise = loadImage(url.href).catch(error => {
   sheets.delete(number);
   throw error;
  });
  sheets.set(number, promise);
  if (sheets.size > 4) sheets.delete(sheets.keys().next().value);
 }
 return sheets.get(number);
}

async function makePreview(url) {
 const source = new URL(url, document.baseURI);
 if (source.origin === location.origin && !source.search) {
  try {
   manifest ??= fetch(new URL("index.json", assets), {signal: AbortSignal.timeout(6000)})
    .then(response => {
     if (!response.ok) throw Error("Índice de miniaturas indisponível");
     return response.json();
    }).catch(() => {
     manifest = undefined;
     return {};
    });
   const entry = (await manifest)[source.pathname];
   if (Array.isArray(entry)) {
    const [number, x, y, width, height] = entry;
    const sheet = await loadSheet(number);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d", {alpha:false}).drawImage(sheet, x, y, width, height, 0, 0, width, height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", .9));
    if (blob?.size) return URL.createObjectURL(blob);
   }
  } catch (error) {
   console.warn("[Scorace] Usando a imagem original", source.pathname, error);
  }
 }
 await loadImage(url);
 return url;
}

function pump() {
 while (running < concurrency && queue.length) {
  const task = queue.shift();
  running++;
  task.started = true;
  makePreview(task.url).then(preview => {
   previews.set(task.url, preview);
   task.resolve(preview);
  }, task.reject).finally(() => {
   requests.delete(task.url);
   running--;
   pump();
  });
 }
}

function load(source, priority = false) {
 const url = new URL(source, document.baseURI).href;
 if (previews.has(url)) return Promise.resolve(previews.get(url));
 let task = requests.get(url);
 if (task) {
  if (priority && !task.started) {
   queue.splice(queue.indexOf(task), 1);
   queue.unshift(task);
  }
  return task.promise;
 }
 task = {url, started:false};
 task.promise = new Promise((resolve, reject) => Object.assign(task, {resolve, reject}));
 requests.set(url, task);
 if (priority) queue.unshift(task);
 else queue.push(task);
 pump();
 return task.promise;
}

function thumbnail(source) {
 return previews.get(new URL(source, document.baseURI).href);
}

function mount() {
 if (overlay) return;
 overlay = document.createElement("section");
 overlay.id = "scCardLoader";
 overlay.setAttribute("role", "status");
 overlay.setAttribute("aria-live", "polite");
 overlay.innerHTML = '<div class="sc-loader-card"><div class="sc-loader-logo">✦ SCORACE</div><h2>Preparando as cartas</h2><p id="scLoaderMessage"></p><div class="sc-loader-numbers"><strong id="scLoaderCount"></strong><span id="scLoaderPercent"></span></div><div class="sc-loader-progress" role="progressbar" aria-label="Imagens preparadas" aria-valuemin="0" aria-valuemax="100"><i id="scLoaderBar"></i></div><div id="scLoaderFailures" hidden></div><div class="sc-loader-actions"><button type="button" id="scLoaderRetry" hidden>Tentar novamente</button><button type="button" id="scLoaderCancel">Parar de folhear</button></div></div>';
 overlay.querySelector("#scLoaderRetry").onclick = () => {
  if (!pending) return;
  pending.reset?.();
  prepare(pending.items, pending.ready, pending.check, pending.reset, pending.options);
 };
 overlay.querySelector("#scLoaderCancel").onclick = () => window.dispatchEvent(new Event("scorace:cancel-page-jump"));
 document.body.append(overlay);
}

function draw(done, total, message, errors = []) {
 mount();
 overlay.hidden = false;
 const pct = total ? Math.round(done / total * 100) : 0;
 overlay.querySelector("#scLoaderCount").textContent = done + " / " + total;
 overlay.querySelector("#scLoaderPercent").textContent = pct + "%";
 overlay.querySelector("#scLoaderBar").style.width = pct + "%";
 overlay.querySelector(".sc-loader-progress").setAttribute("aria-valuenow", String(pct));
 overlay.querySelector("#scLoaderMessage").textContent = message;
 const failures = overlay.querySelector("#scLoaderFailures");
 failures.hidden = !errors.length;
 failures.textContent = errors.slice(0, 4).join(" · ");
 overlay.querySelector("#scLoaderRetry").hidden = !errors.length;
}

function prepare(items, ready, check, reset, options = {}) {
 const {inline = false} = options;
 const token = ++generation;
 const targets = new Map(items.filter(item => item.image).map(item => [item.image, item.name]));
 const total = targets.size;
 let done = [...targets.keys()].filter(thumbnail).length;
 const preparation = pending = {items, ready, check, reset, options};
 mount();
 overlay.classList.toggle("inline", inline);
 overlay.classList.remove("inline-textures");
 overlay.hidden = true;
 const visibleAt = performance.now() + (inline ? 250 : 0);
 function showProgress(done, total, message, errors = []) {
  if (errors.length || performance.now() >= visibleAt) draw(done, total, message, errors);
 }

 function finish() {
  if (token !== generation) return;
  pending = null;
  if (overlay) overlay.hidden = true;
  ready?.();
 }

 if (done === total && !check) {
  finish();
  return;
 }
 const errors = [];
 const report = () => showProgress(done, total, errors.length ? "Algumas imagens não puderam ser carregadas." : "Carregando as cartas desta página.");
 report();
 if(inline)setTimeout(()=>{if(token===generation&&pending===preparation&&!overlay.classList.contains("inline-textures"))report()},250);

 Promise.all([...targets].map(async ([image, name]) => {
  if (thumbnail(image)) return;
  try {
   await load(image, true);
   done++;
  } catch {
   errors.push(name);
  }
  if (token === generation) report();
 })).then(() => {
  if (token !== generation) return;
  if (errors.length) {
   draw(done, total, "Algumas imagens não puderam ser carregadas.", errors);
   return;
  }
  if (!check) {
   finish();
   return;
  }
  overlay.classList.add("inline-textures");
  const deadline = performance.now() + 8000;
  function waitForTextures() {
   if (token !== generation) return;
   const status = check();
   if (!status || status.ready) {
    finish();
    return;
   }
   if (status.failed?.length || performance.now() >= deadline) {
    showProgress(status.done, status.total, "Não foi possível preparar as texturas 3D.", status.failed?.length ? status.failed : ["A cena 3D demorou para responder."]);
    return;
   }
   showProgress(status.done, status.total, "Aplicando as imagens no fichário 3D.");
   setTimeout(waitForTextures, 100);
  }
  requestAnimationFrame(waitForTextures);
 });
}

function cancel() {
 generation++;
 pending = null;
 if (overlay) overlay.hidden = true;
}

window.ScoraceCardCache = {load, thumbnail, prepare, cancel, busy: () => pending !== undefined && pending !== null};
if (new URLSearchParams(location.search).get("collection") === "scorace" && window.parent !== window) {
 document.addEventListener("DOMContentLoaded", () => {
  if (!overlay) draw(0, 0, "Conectando ao catálogo do Scorace.");
 }, {once:true});
}
})();
