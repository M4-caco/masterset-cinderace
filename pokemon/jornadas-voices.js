// The opening trio uses the PT-BR dialogue/character vocalizations from
// Pokémon Journeys, not the attack cries exported from Pokémon GO.
// Once the corresponding audio clips are available and authorized for use,
// save them under pokemon/audio/jornadas/ and replace each null with the
// corresponding relative path, e.g. './audio/jornadas/scorbunny.mp3'.
// Do not fall back to attack cries: an incorrect sound is worse than silence.
const CLIPS = Object.freeze({
    scorbunny: null,
    raboot: null,
    cinderace: null,
});

export function createJornadasGreeting(id) {
    const path = CLIPS[id];
    if (!path) return null;
    const audio = new Audio(new URL(path, import.meta.url).href);
    audio.preload = 'none';
    audio.volume = 0.55;
    return audio;
}
