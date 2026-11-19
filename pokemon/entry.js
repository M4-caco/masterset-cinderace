const section = document.getElementById('view-pokemon');
const status = section.querySelector('.pokemon-message');
const retry = section.querySelector('.pokemon-retry');
import { createJornadasGreeting } from './jornadas-voices.js?v=5';

let viewer;
// First mobile entrance: a user pressing the Pokémon tab is a trusted gesture,
// unlike an automatic animation frame after the async GLTF has loaded.
const mobileWelcomeVoices = new Map();
for (const nav of document.querySelectorAll('#nav-pokemon, #mob-nav-pokemon')) nav.addEventListener('click', () => {
    if (!matchMedia('(max-width: 767px)').matches) return;
    const chosen = section.querySelector('.pokemon-viewer[data-selected] .pokemon-stage-species')
        ?.textContent?.trim()?.toLowerCase() || 'scorbunny';
    const id = ['scorbunny','raboot','cinderace'].includes(chosen) ? chosen : 'scorbunny';
    if (!mobileWelcomeVoices.has(id))
        mobileWelcomeVoices.set(id,createJornadasGreeting(id));
    const voice=mobileWelcomeVoices.get(id);
    if (!voice) return;
    voice.pause();
    voice.currentTime=0;
    // Must be invoked synchronously in the click; Safari disallows autoplay
    // when audio.play happens after a model import/promise.
    void voice.play().catch(() => {});
});
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
    loading = import('./showcase.js?v=54').then(({ mountShowcase }) => {
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
