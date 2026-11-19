// Vozes PT-BR do anime, com o mesmo balanceamento do desktop (-19 LUFS).
// Android/Chrome usa Opus; Safari/iOS antigos recebem MP3 compatível.
const FILES = Object.freeze({
    scorbunny: 'scorbunny',
    raboot: 'raboot',
    cinderace: 'cinderace',
});

export function createJornadasGreeting(id) {
    const stem=FILES[id];
    if(!stem)return null;
    const probe=document.createElement('audio');
    const opus=probe.canPlayType('audio/ogg; codecs="opus"');
    const ext=opus ? 'ogg' : 'mp3';
    const audio=new Audio(new URL(`./audio/jornadas/${stem}.${ext}?v=5`,import.meta.url).href);
    audio.preload='auto';
    audio.dataset.gain='1';
    audio.volume=.55;
    return audio;
}
