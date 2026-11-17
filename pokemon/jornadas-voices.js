// Saudações recortadas do vídeo enviado pelo usuário (EQIN0zUug5w).
// A procedência exata da dublagem do compilado não foi verificada.
// Estes áudios são exclusivos da apresentação inicial dos três Pokémon;
// ataques continuam independentes destes arquivos.
const CLIPS = Object.freeze({
    scorbunny: './audio/jornadas/scorbunny.ogg',
    raboot: './audio/jornadas/raboot.ogg',
    cinderace: './audio/jornadas/cinderace.ogg',
});

export function createJornadasGreeting(id) {
    const path = CLIPS[id];
    if (!path) return null;
    const audio = new Audio(new URL(path, import.meta.url).href);
    audio.preload = 'auto';
    audio.volume = 0.55;
    return audio;
}
