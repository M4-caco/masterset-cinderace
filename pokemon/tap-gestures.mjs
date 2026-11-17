// One isolated tap casts the selected Pokémon's fire move; quick repeats
// retain the physical move sequence from the existing Pokémon GO showcase.
export const SINGLE_TAP_WINDOW_MS = 300;
export const RAPID_TAP_GRACE_MS = 440;

export function isRapidTap(now, previous, rapidUntil) {
    return now - previous <= SINGLE_TAP_WINDOW_MS || now < rapidUntil;
}

export function singleTapEffect(speciesId, form) {
    if (form === 'gigamax') return null; // G-Max fireball stays button-only
    if (form === 'dynamax') return 'max';
    return speciesId === 'cinderace' ? 'charge' : 'flamethrower';
}
