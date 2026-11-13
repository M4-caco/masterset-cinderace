(() => {
  'use strict';

  const brandLogo = document.querySelector('img.brand-logo');
  if (brandLogo) {
    brandLogo.addEventListener('error', () => {
      if (brandLogo.getAttribute('src') !== 'scorace.png') brandLogo.src = 'scorace.png';
    }, {once:true});
    brandLogo.src = 'scorace-logo-nova.webp';
    brandLogo.style.width = '180px';
    brandLogo.style.height = '60px';
    brandLogo.style.maxWidth = 'min(36vw,180px)';
  }

  const binder = document.getElementById('view-binder');
  const frame = document.getElementById('scorace-binder-frame');
  if (!frame) return;

  const mobile = document.getElementById('scorace-binder-mobile');
  const stage = frame.parentElement;
  const back = binder.querySelector('.scorace-binder-return');
  const modes = new Set(['all', 'colored']);
  const grid = document.getElementById('binder-mobile-grid');
  const status = document.getElementById('binder-mobile-status');
  const retry = document.getElementById('binder-mobile-retry');
  const pageLabel = document.getElementById('binder-mobile-page');
  const prev = document.getElementById('binder-mobile-prev');
  const next = document.getElementById('binder-mobile-next');
  const smallScreen = matchMedia('(max-width: 740px), (pointer: coarse) and (max-width: 1024px)');
  const cardsPerPage = 9;
  const storageKey = 'scorace_binder_mode_v1';
  let mode = 'all';
  let page = 0;
  let pageCount = 0;
  let renderKey = '';
  let renderGeneration = 0;
  let frameReady = false;
  let mobile3D = false;

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'owned') {
      mode = 'colored';
      localStorage.setItem(storageKey, mode);
    } else if (modes.has(saved)) {
      mode = saved;
    }
  } catch {}

  function fitBinderViewport() {
    const visible = !binder.classList.contains('hidden') && !stage.hidden && frame.offsetWidth > 0;
    document.body.classList.toggle('scorace-iframe-fit', visible);
    if (!visible) return;
    const viewport = window.visualViewport;
    const bottom = viewport ? viewport.offsetTop + viewport.height : innerHeight;
    const height = Math.max(0, Math.floor(bottom - stage.getBoundingClientRect().top - 8));
    stage.style.setProperty('--binder-stage-height', `${height}px`);
  }

  function statusMessage(message, failed = false) {
    status.textContent = message;
    status.hidden = !message;
    retry.hidden = !failed;
  }

  async function renderMobilePage(cards) {
    pageCount = Math.ceil(cards.length / cardsPerPage);
    page = Math.max(0, Math.min(page, pageCount - 1));
    prev.disabled = page === 0;
    next.disabled = page >= pageCount - 1;
    pageLabel.textContent = pageCount ? 'Página ' + (page + 1) + ' de ' + pageCount : '';
    const shown = cards.slice(page * cardsPerPage, (page + 1) * cardsPerPage);
    const key = JSON.stringify([mode, page, shown]);
    if (key === renderKey) return;
    renderKey = key;
    const generation = ++renderGeneration;
    grid.hidden = true;
    if (!shown.length) {
      grid.replaceChildren();
      statusMessage('Nenhuma carta na coleção.');
      return;
    }

    statusMessage('Carregando as cartas…');
    const pockets = document.createDocumentFragment();
    const images = [];
    for (const card of shown) {
      const pocket = document.createElement('button');
      pocket.type = 'button';
      pocket.className = 'scorace-binder-pocket';
      pocket.classList.toggle('is-missing', mode === 'colored' && !card.owned);
      pocket.setAttribute('aria-label', 'Ampliar ' + card.name + (card.owned ? ' · Tenho' : ' · Faltante'));
      pocket.addEventListener('click', () => window.showZoomModal(card.id));
      const image = new Image(63, 88);
      image.alt = '';
      image.draggable = false;
      image.src = card.image;
      images.push(image.decode());
      pocket.append(image);
      pockets.append(pocket);
    }
    for (let i = shown.length; i < cardsPerPage; i++) {
      const empty = document.createElement('span');
      empty.className = 'scorace-binder-pocket';
      empty.setAttribute('aria-hidden', 'true');
      pockets.append(empty);
    }

    try {
      await Promise.all(images);
      if (generation !== renderGeneration) return;
      grid.replaceChildren(pockets);
      grid.hidden = false;
      statusMessage('');
    } catch {
      if (generation === renderGeneration) {
        grid.replaceChildren();
        statusMessage('Não foi possível carregar todas as cartas desta página.', true);
      }
    }
  }

  window.refreshScoraceBinder = function() {
    const isMobileView = !mobile.hidden && !binder.classList.contains('hidden');
    if ((!frameReady && !isMobileView) || !window.scoraceBinderSnapshot) return;
    const snapshot = window.scoraceBinderSnapshot();
    if (isMobileView) {
      renderMobilePage(snapshot.cards);
    } else if (frameReady) {
      const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      frame.contentWindow.postMessage({...snapshot,type:'scorace:collection',mode,theme},location.origin);
    }
  };

  function updateBinderView() {
    const light = smallScreen.matches && !mobile3D;
    mobile.hidden = !light;
    stage.hidden = light;
    back.hidden = !smallScreen.matches || light;
    if (light && frame.hasAttribute('src')) {
      frameReady = false;
      frame.removeAttribute('src');
    } else if (!light && !binder.classList.contains('hidden') && !frame.hasAttribute('src')) {
      frame.src = frame.dataset.src;
    }
    window.refreshScoraceBinder();
    requestAnimationFrame(fitBinderViewport);
  }

  window.openScoraceBinder = updateBinderView;

  function setMode(value) {
    if (!modes.has(value) || mode === value) return;
    mode = value;
    page = 0;
    try { localStorage.setItem(storageKey, mode); } catch {}
    window.refreshScoraceBinder();
  }

  function turnPage(direction) {
    const target = page + direction;
    if (target < 0 || target >= pageCount) return false;
    page = target;
    window.refreshScoraceBinder();
    return true;
  }

  prev.addEventListener('click', () => turnPage(-1));
  next.addEventListener('click', () => turnPage(1));
  retry.addEventListener('click', () => {
    renderKey = '';
    window.refreshScoraceBinder();
  });

  let startTouch;
  grid.addEventListener('touchstart', event => {
    startTouch = event.touches.length === 1 ? event.touches[0] : null;
  }, {passive:true});
  grid.addEventListener('touchcancel', () => { startTouch = null; }, {passive:true});
  grid.addEventListener('touchend', event => {
    const start = startTouch;
    startTouch = null;
    if (!start || event.touches.length) return;
    const end = Array.from(event.changedTouches).find(touch => touch.identifier === start.identifier);
    if (!end) return;
    const dx = end.clientX - start.clientX;
    const dy = end.clientY - start.clientY;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > 1.5 * Math.abs(dy)) {
      event.preventDefault();
      turnPage(dx < 0 ? 1 : -1);
    }
  });

  mobile.querySelector('[data-binder-view="3d"]').addEventListener('click', () => {
    mobile3D = true;
    updateBinderView();
    back.querySelector('button').focus();
  });
  back.querySelector('button').addEventListener('click', () => {
    mobile3D = false;
    updateBinderView();
    mobile.querySelector('[data-binder-view="3d"]').focus();
  });

  window.addEventListener('message', event => {
    if (stage.hidden || event.origin !== location.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'scorace:binder-ready') {
      frameReady = true;
      window.refreshScoraceBinder();
    }
    if (event.data?.type === 'scorace:set-mode') setMode(event.data.mode);
  });
  smallScreen.addEventListener('change', () => {
    mobile3D = false;
    updateBinderView();
  });
  new MutationObserver(() => {
    if (binder.classList.contains('hidden') && mobile3D) {
      mobile3D = false;
      updateBinderView();
    }
    fitBinderViewport();
  }).observe(binder,{attributes:true,attributeFilter:['class']});
  new MutationObserver(window.refreshScoraceBinder)
    .observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  new ResizeObserver(fitBinderViewport).observe(document.querySelector('header'));
  window.addEventListener('resize', fitBinderViewport);
  window.visualViewport?.addEventListener('resize', fitBinderViewport);
  window.visualViewport?.addEventListener('scroll', fitBinderViewport);
  updateBinderView();
})();
