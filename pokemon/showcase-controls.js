const SVG = 'http://www.w3.org/2000/svg';

const GLYPHS = {
    ball: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 12h5m6 0h5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    shiny: '<path d="M9 3c.45 6.1 1.5 7.15 7.6 7.6-6.1.45-7.15 1.5-7.6 7.6-.45-6.1-1.5-7.15-7.6-7.6C7.5 10.15 8.55 9.1 9 3Zm9.5 8.2c.25 3.7.95 4.4 4.65 4.65-3.7.25-4.4.95-4.65 4.65-.25-3.7-.95-4.4-4.65-4.65 3.7-.25 4.4-.95 4.65-4.65Zm.1-10c.2 2.6.7 3.1 3.3 3.3-2.6.2-3.1.7-3.3 3.3-.2-2.6-.7-3.1-3.3-3.3 2.6-.2 3.1-.7 3.3-3.3Z"/>',
    dynamax: '<path d="M3.5 5.5c3.1 1 5.4 2.1 7.3 3.3L12 5l1.2 3.8c1.9-1.2 4.2-2.3 7.3-3.3-3.5 2.8-5.7 5-8.5 8.2-2.8-3.2-5-5.4-8.5-8.2Zm5.35 8L2.7 20c2.35-1.22 4.65-1.63 7.2-2l1.2-2.7-2.25-1.8Zm6.64.02-2.46 2.55.66 1 2.57-2.83-.77-.72Zm1.3 1.38-2.62 2.83.53 1 2.87-3.16-.78-.67Zm1.47 1.33-2.55 2.84c1.9.38 3.68.78 5.59 1.68l-3.04-4.52Z" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>',
    gigamax: '<path d="M3.5 5.5c3.1 1 5.4 2.1 7.3 3.3L12 5l1.2 3.8c1.9-1.2 4.2-2.3 7.3-3.3-3.5 2.8-5.7 5-8.5 8.2-2.8-3.2-5-5.4-8.5-8.2Zm5.35 8L2.1 20.6c2.9-1.3 5.35-1.87 7.8-2.22l1.2-3.08-2.25-1.8Zm6.64.02-2.46 2.55.66 1 2.57-2.83-.77-.72Zm1.3 1.38-2.62 2.83.53 1 2.87-3.16-.78-.67Zm1.47 1.33-2.55 2.84c2.2.39 4.19.97 6.19 1.93l-3.64-4.77Z"/>',
    fire: '<path d="M12.9 2c.73 4.75-2.6 6.2-2.6 9.2 0 1.3.82 2.05 1.73 2.05 1.32 0 2.18-1.39 2.13-3.2 2.4 1.05 4.35 3.32 4.35 5.84A6.36 6.36 0 0 1 12 22.15a6.53 6.53 0 0 1-6.5-6.57c0-2.56 1.45-5.1 3.65-6.52-.4 1.3-.35 2.22-.02 2.79C9 7.57 12.29 6.07 12.9 2Z"/>',
    normal: '<circle cx="12" cy="12" r="7.4" fill="none" stroke="currentColor" stroke-width="3.4"/>',
    volume: '<path d="M4 9h3l5-4v14l-5-4H4V9Zm11-.2a4.5 4.5 0 0 1 0 6.4m2.5-8.85a8 8 0 0 1 0 11.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    muted: '<path d="M4 9h3l5-4v14l-5-4H4V9Zm11 1 4 4m0-4-4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
};

function glyph(name) {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = GLYPHS[name];
    return svg;
}

export function iconControl(label, symbol, kind, action) {
    const button = document.createElement('button');
    const badge = document.createElement('span');
    const caption = document.createElement('span');
    button.type = 'button';
    button.className = 'pokemon-icon-control';
    badge.className = 'pokemon-badge pokemon-badge-' + kind;
    badge.append(glyph(symbol));
    caption.className = 'pokemon-control-caption';
    caption.textContent = label;
    button.append(badge, caption);
    button.addEventListener('click', action);
    return button;
}

export function mountVolume(section, cards) {
    const control = section.querySelector('.pokemon-volume');
    const button = control.querySelector('button');
    const range = control.querySelector('input');
    const key = 'scorace-pokemon-volume';
    try {
        const saved = localStorage.getItem(key);
        if (saved !== null && /^\d+$/.test(saved)) range.value = saved;
    } catch {}
    let audible = Number(range.value) || 55;
    function apply() {
        const level = Number(range.value);
        if (level > 0) audible = level;
        for (const card of cards) card.cry.volume = level / 100;
        button.replaceChildren(glyph(level ? 'volume' : 'muted'));
        button.setAttribute('aria-pressed', String(level === 0));
        button.setAttribute('aria-label', level ? 'Silenciar sons dos Pokémon' : 'Reativar sons dos Pokémon');
        range.setAttribute('aria-valuetext', level + '%');
        try { localStorage.setItem(key, range.value); } catch {}
    }
    range.addEventListener('input', apply);
    button.addEventListener('click', () => {
        range.value = Number(range.value) ? 0 : audible;
        apply();
    });
    apply();
}
