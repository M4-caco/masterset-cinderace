// Saudações recortadas do vídeo enviado pelo usuário (EQIN0zUug5w).
// A procedência exata da dublagem do compilado não foi verificada.
// Estes áudios são exclusivos da apresentação inicial dos três Pokémon;
// ataques continuam independentes destes arquivos.
const CLIPS = Object.freeze({
    scorbunny: './audio/jornadas/scorbunny.ogg',
    raboot: './audio/jornadas/raboot.ogg?v=3',
    cinderace: './audio/jornadas/cinderace.ogg',
});

// Gain compensation for the different loudness of the original recordings.
// Scorbunny was quiet, Raboot is the newly cleaned recording, and Cinderace
// was noticeably louder. The slider continues to control all three together.
const GAINS = Object.freeze({ scorbunny: 1.32, raboot: 1.50, cinderace: 0.74 });

export function createJornadasGreeting(id) {
    const path = CLIPS[id];
    if (!path) return null;
    const audio = new Audio(new URL(path, import.meta.url).href);
    audio.preload = 'auto';
    audio.dataset.gain = String(GAINS[id] ?? 1);
    audio.volume = Math.min(1, 0.55 * (GAINS[id] ?? 1));
    return audio;
}
