const SVG = 'http://www.w3.org/2000/svg';

const GLYPHS = {
    ball: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 12h5m6 0h5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    shiny: '<path d="M9 3c.45 6.1 1.5 7.15 7.6 7.6-6.1.45-7.15 1.5-7.6 7.6-.45-6.1-1.5-7.15-7.6-7.6C7.5 10.15 8.55 9.1 9 3Zm9.5 8.2c.25 3.7.95 4.4 4.65 4.65-3.7.25-4.4.95-4.65 4.65-.25-3.7-.95-4.4-4.65-4.65 3.7-.25 4.4-.95 4.65-4.65Zm.1-10c.2 2.6.7 3.1 3.3 3.3-2.6.2-3.1.7-3.3 3.3-.2-2.6-.7-3.1-3.3-3.3 2.6-.2 3.1-.7 3.3-3.3Z"/>',
    dynamax: '<path d="M3.5 5.5c3.1 1 5.4 2.1 7.3 3.3L12 5l1.2 3.8c1.9-1.2 4.2-2.3 7.3-3.3-3.5 2.8-5.7 5-8.5 8.2-2.8-3.2-5-5.4-8.5-8.2Zm5.35 8L2.7 20c2.35-1.22 4.65-1.63 7.2-2l1.2-2.7-2.25-1.8Zm6.64.02-2.46 2.55.66 1 2.57-2.83-.77-.72Zm1.3 1.38-2.62 2.83.53 1 2.87-3.16-.78-.67Zm1.47 1.33-2.55 2.84c1.9.38 3.68.78 5.59 1.68l-3.04-4.52Z" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>',
    gigamax: '<path d="M3.5 5.5c3.1 1 5.4 2.1 7.3 3.3L12 5l1.2 3.8c1.9-1.2 4.2-2.3 7.3-3.3-3.5 2.8-5.7 5-8.5 8.2-2.8-3.2-5-5.4-8.5-8.2Zm5.35 8L2.1 20.6c2.9-1.3 5.35-1.87 7.8-2.22l1.2-3.08-2.25-1.8Zm6.64.02-2.46 2.55.66 1 2.57-2.83-.77-.72Zm1.3 1.38-2.62 2.83.53 1 2.87-3.16-.78-.67Zm1.47 1.33-2.55 2.84c2.2.39 4.19.97 6.19 1.93l-3.64-4.77Z"/>',
    // UI-only move symbols, independent of retired battle particle effects.
    'move-physical': '<path d="M5 12.5V9a1.6 1.6 0 0 1 3.2 0V6a1.6 1.6 0 0 1 3.2 0v1a1.6 1.6 0 0 1 3.2 0v1.3a1.6 1.6 0 0 1 3.2 0v3.1a1.6 1.6 0 0 1 3.2.1v3.4c0 4-2.6 6.2-6.3 6.2h-3.2a6.5 6.5 0 0 1-5.4-2.9L3.3 15a1.7 1.7 0 0 1 2.7-2.1l2.2 2.3" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linejoin="round" stroke-linecap="round"/>',
    'move-alternate': '<path d="M12.7 2.4 5.4 12h5.2l-1.1 9.6 8.8-12h-5.5l-.1-7.2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m3 6 2-2m13 16 2-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    'move-max': '<path d="M12 2.2c.9 4.7-2.7 6.3-2.7 9.1 0 1.5 1 2.2 2 2.2 1.5 0 2.1-1.1 2.2-3.1 2.7 1.4 4.4 3.6 4.4 6.1a6 6 0 0 1-12 0c0-2.5 1.2-4.5 3.4-6.1-.3 1.7 0 2.6.6 3.1-.2-4.2 2.5-6.1 3.1-8.1Z"/><path d="M4 3.4v3.2m-1.6-1.6h3.2M20 4v4m-2-2h4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    // Faithfully styled, lightweight vectors based on the recognizable
    // circular type emblems from Pokémon GO: a curled flame with an open
    // inner core and a bold white Normal-type ring. No remote icon assets.
    fire: '<path fill-rule="evenodd" d="M12.6 1.2c1.55 3.35 1.45 6.1-.1 8.25 1.65-.4 2.5-2.05 2.55-3.55 3.5 2.65 5.35 6.2 4.45 10.2-.85 3.85-4.18 6.5-8.2 6.5-4.78 0-7.98-2.95-8-7.55-.01-2.3.72-4.18 2-5.7-.33 2.2.2 3.48 1.22 4.28-.48-2.75 1.22-5.4 2.98-7.68C11.28 4.35 12.4 2.9 12.6 1.2Zm.6 12.4c-2.27.08-3.77 1.85-3.68 3.8.1 2.2 1.75 3.55 3.76 3.5 2.06-.05 3.63-1.57 3.57-3.66-.04-1.56-.9-2.67-2.2-3.27.3 1.35-.3 2.45-1.33 2.78.6-1.3.34-2.42-.12-3.15Z"/>',
    normal: '<circle cx="12" cy="12" r="6.15" fill="none" stroke="currentColor" stroke-width="4.15"/>',
    volume: '<path d="M4 9h3l5-4v14l-5-4H4V9Zm11-.2a4.5 4.5 0 0 1 0 6.4m2.5-8.85a8 8 0 0 1 0 11.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    muted: '<path d="M4 9h3l5-4v14l-5-4H4V9Zm11 1 4 4m0-4-4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
};

function glyph(name) {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = GLYPHS[name] ?? GLYPHS.normal;
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
    const panel = control.querySelector('.pokemon-volume-popover');
    const range = control.querySelector('input');
    const output = control.querySelector('output');
    const key = 'scorace-pokemon-volume';
    try {
        const saved = localStorage.getItem(key);
        if (saved !== null && /^\d+$/.test(saved)) range.value = saved;
    } catch {}

    function apply() {
        const level = Number(range.value);
        const percent = level + '%';
        for (const card of cards) {
            // The shared volume slider controls welcome and attack audio.
            // Each track retains its own gain (the v2 greetings are balanced).
            for (const audio of [card.greetingAudio, card.attackCry]) {
                if (!audio) continue;
                const gain = Number(audio.dataset.gain) || 1;
                audio.volume = Math.min(1, level / 100 * gain);
            }
        }
        button.replaceChildren(glyph(level ? 'volume' : 'muted'));
        button.setAttribute('aria-label', `Volume dos Pokémon (${percent})`);
        button.title = `Volume ${percent}`;
        range.setAttribute('aria-valuetext', percent);
        output.value = percent;
        try { localStorage.setItem(key, range.value); } catch {}
    }

    function setOpen(open) {
        panel.hidden = !open;
        button.setAttribute('aria-expanded', String(open));
    }

    function close() {
        if (panel.hidden) return false;
        setOpen(false);
        if (panel.contains(document.activeElement)) button.focus({ preventScroll: true });
        return true;
    }

    range.addEventListener('input', apply);
    button.addEventListener('click', event => {
        if (!panel.hidden) {
            close();
            return;
        }
        setOpen(true);
        if (event.detail === 0) range.focus({ preventScroll: true });
    });
    document.addEventListener('pointerdown', event => {
        if (!control.contains(event.target)) close();
    });

    // Accumulate small trackpad deltas before applying a single volume step.
    let pending = 0;
    let lastWheel = 0;
    control.addEventListener('wheel', event => {
        if (event.ctrlKey || !event.deltaY) return;
        event.preventDefault();
        if (event.timeStamp - lastWheel > 200 || Math.sign(pending) !== Math.sign(event.deltaY)) pending = 0;
        lastWheel = event.timeStamp;
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 40 : 1;
        pending += event.deltaY * unit;
        const steps = Math.trunc(pending / 40);
        if (!steps) return;
        pending -= steps * 40;
        range.value = String(Math.max(0, Math.min(100, Number(range.value) - steps * 5)));
        apply();
    }, { passive: false });

    apply();
    return close;
}
