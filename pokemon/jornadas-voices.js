// Vozes da saudação do Master Set. Os três arquivos OGG vêm dos
// MP3s aprimorado-v2 enviados pelo usuário, com volume balanceado em -19 LUFS.
// São independentes dos efeitos e gritos usados nos ataques.
const CLIPS = Object.freeze({
    scorbunny: './audio/jornadas/scorbunny.ogg?v=4',
    raboot: './audio/jornadas/raboot.ogg?v=4',
    cinderace: './audio/jornadas/cinderace.ogg?v=4',
});

export function createJornadasGreeting(id) {
    const path = CLIPS[id];
    if (!path) return null;
    const audio = new Audio(new URL(path, import.meta.url).href);
    audio.preload = 'auto';
    // O volume de cada arquivo foi normalizado. Os três usam o mesmo ganho.
    audio.dataset.gain = '1';
    audio.volume = 0.55;
    return audio;
}
