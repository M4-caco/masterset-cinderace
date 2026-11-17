const section = document.getElementById('view-pokemon');
const status = section.querySelector('.pokemon-message');
const retry = section.querySelector('.pokemon-retry');
let viewer;
let loading;
let active = false;

function show() {
    if (!active) window.scrollTo(0, 0);
    active = true;
    if (viewer) {
        viewer.show();
        return;
    }
    if (loading) return;
    status.hidden = false;
    status.textContent = 'Preparando visualizador 3D…';
    retry.hidden = true;
    loading = import('./showcase.js?v=23').then(({ mountShowcase }) => {
        viewer = mountShowcase(section);
        status.hidden = true;
    }).catch(error => {
        console.error('Scorace · Pokémon', error);
        status.textContent = 'O visualizador 3D não pôde ser iniciado.';
        retry.hidden = false;
    }).finally(() => { loading = null; });
}

section.addEventListener('pokemon:show', show);
section.addEventListener('pokemon:hide', () => {
    active = false;
    viewer?.hide();
});
retry.addEventListener('click', show);
if (!section.classList.contains('hidden')) show();
