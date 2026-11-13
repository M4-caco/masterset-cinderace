const icons = {
  remove: '<path d="m7 20-4-4a2 2 0 0 1 0-3l9-9a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-8 8H7Z"/><path d="m7 9 8 8m-3 3h9"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="3"/>',
  save: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>'
};

function pill(button, label, icon) {
  const text = document.createElement('span');
  text.className = 'sc-pill-label';
  const caption = document.createElement('span');
  caption.textContent = label;
  text.append(caption);
  const circle = document.createElement('span');
  circle.className = 'sc-pill-icon';
  circle.append(icon);
  button.replaceChildren(text, circle);
  button.classList.add('sc-expand-pill');
  button.setAttribute('aria-label', label);
}

function setupScoraceMenu() {
  if (!document.body.classList.contains('scorace-embedded')) return;
  const get = id => document.getElementById(id);
  const panel = document.querySelector('#collectionPanel .dock-content');
  const workspace = get('binderWorkspace');
  if (!panel || !workspace || panel.dataset.newMenu) return;
  panel.dataset.newMenu = 'true';
  document.body.classList.add('sc-menu-new');

  function section(name, id) {
    const group = document.createElement('section');
    const title = document.createElement('h3');
    group.className = 'sc-menu-section';
    group.id = id;
    title.textContent = name;
    group.append(title);
    panel.append(group);
    return group;
  }

  const binder = section('Fichário', 'scMenuBinder');
  binder.append(document.querySelector('.binder-heading'));
  const bookToolbar = document.querySelector('.book-toolbar');
  const pagination = bookToolbar.querySelector('.pagination');
  pagination.classList.add('sc-bottom-pagination');
  pagination.setAttribute('role', 'group');
  pagination.setAttribute('aria-label', 'Páginas do fichário');
  workspace.append(pagination);
  const cameraBook = document.createElement('div');
  cameraBook.className = 'sc-camera-book';
  cameraBook.append(get('toggleBook'), get('quickZip'));
  get('cameraDialog').append(cameraBook);
  bookToolbar.hidden = true;
  const editor = get('editMode');
  pill(editor, 'Editar fichário', editor.querySelector('svg'));
  editor.setAttribute('aria-controls', 'editorDialog');
  editor.setAttribute('aria-expanded', 'false');
  editor.classList.add('sc-editor-fab');

  const toolbar = document.createElement('div');
  toolbar.className = 'sc-tool-bar';
  toolbar.append(editor);
  workspace.append(toolbar);
  const organizer = get('scOrganizer');
  const organizerToggle = organizer?.querySelector('#scOrgToggle');
  if (organizerToggle) toolbar.append(organizerToggle);

  function closeOtherMenus(current) {
    for (const dialog of document.querySelectorAll('.sc-tool-dialog[open]')) {
      if (dialog !== current) dialog.close();
    }
    const editorDialog = get('editorDialog');
    if (current !== editorDialog && editorDialog.open) get('collectionMode').click();
    if (current !== organizer) window.ScoraceCardOrganizer?.close();
  }

  for (const [id, label, dialogId] of [
    ['remove', 'Remoção', 'removeDialog'],
    ['camera', 'Câmera', 'cameraDialog'],
    ['save', 'Salvar', 'saveImageDialog']
  ]) {
    const trigger = document.createElement('button');
    trigger.id = id + 'BinderTool';
    trigger.type = 'button';
    trigger.setAttribute('aria-controls', dialogId);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[id]}</svg>`;
    pill(trigger, label, trigger.querySelector('svg'));
    toolbar.insertBefore(trigger, organizerToggle ?? null);
    const dialog = get(dialogId);
    trigger.onclick = () => {
      if (document.body.classList.contains('sc-exporting')) return;
      if (dialog.open) { dialog.close(); return; }
      closeOtherMenus(dialog);
      dialog.show();
      trigger.setAttribute('aria-expanded', 'true');
    };
    dialog.querySelector('[data-close-tool]').onclick = () => dialog.close();
    dialog.addEventListener('close', () => trigger.setAttribute('aria-expanded', String(dialog.open)));
  }
  organizerToggle?.addEventListener('click', () => {
    if (organizerToggle.getAttribute('aria-expanded') === 'true') closeOtherMenus(organizer);
  });
  editor.addEventListener('click', () => {
    const dialog = get('editorDialog');
    if (dialog.open) closeOtherMenus(dialog);
  });

  get('cameraViews').append(document.querySelector('.camera-bar'), document.querySelector('.scene-top'));
  get('cameraZoom').append(document.querySelector('.zoom-control'));
  for (const id of ['emptyBinder', 'resetBinder']) get('collectionOrganizationActions').append(get(id));
  get('binderOrganization').hidden = true;
  document.querySelector('#collectionPanel .dock-quick')?.remove();
  get('trayToggle').hidden = true;

  const collection = section('Coleção', 'scMenuCollection');
  const modes = document.createElement('div');
  modes.className = 'sc-modes';
  modes.id = 'scModes';
  for (const [mode, label] of [['all', 'Todas'], ['owned', 'Só tenho'], ['colored', 'Tenho coloridas']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.mode = mode;
    button.textContent = label;
    button.setAttribute('aria-pressed', String(mode === 'all'));
    button.onclick = () => window.parent.postMessage({type:'scorace:set-mode', mode}, location.origin);
    modes.append(button);
  }
  collection.append(modes);

  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== 'scorace:collection') return;
    for (const button of modes.children) button.setAttribute('aria-pressed', String(button.dataset.mode === event.data.mode));
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupScoraceMenu, {once:true});
else setupScoraceMenu();
