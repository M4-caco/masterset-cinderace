const profiles = {
    scorbunny: {
        number: 813, japanese: 'ヒバニー', category: 'Pokémon Coelho',
        height: '0,3 m', weight: '4,5 kg',
        description: 'Quando corre para se aquecer, a energia de fogo começa a circular pelo seu corpo. O calor chega até as solas das patas, que podem incendiar a grama.',
        go: [132, 79, 137], cp: 1240, sword: [50, 71, 40, 40, 40, 69],
    },
    raboot: {
        number: 814, japanese: 'ラビフット', category: 'Pokémon Coelho',
        height: '0,6 m', weight: '9 kg',
        description: 'A pelagem espessa protege Raboot do frio e permite que ele use golpes de fogo mais quentes. Para treinar os chutes, ele derruba frutas dos galhos e faz embaixadinhas.',
        go: [170, 125, 163], cp: 2062, sword: [65, 86, 60, 55, 60, 94],
    },
    cinderace: {
        number: 815, japanese: 'エースバーン', category: 'Pokémon Atacante',
        height: '1,4 m', weight: '33 kg',
        description: 'Cinderace transforma uma pedrinha em uma bola de fogo e a chuta com precisão. A força e a explosão das pernas são suas maiores vantagens em combate.',
        go: [238, 163, 190], cp: 3412, sword: [80, 116, 75, 65, 75, 119],
    },
};

const goLabels = ['Ataque', 'Defesa', 'Resistência'];
const swordLabels = ['PS', 'Ataque', 'Defesa', 'Ataque Especial', 'Defesa Especial', 'Velocidade'];
const weak = ['Água', 'Pedra', 'Terrestre'];
const resist = ['Aço', 'Fada', 'Fogo', 'Gelo', 'Inseto', 'Planta'];
const badge = type => `<span class="pokemon-dex-type" data-type="${type}">${type}</span>`;
const fastMoves = 'Investida · Chama Furacão';
const chargedMoves = 'Ataque de Chamas · Lança-chamas';
const goUrl = 'https://db.pokemongohub.net/pt/pokemon/';
const swordUrl = 'https://pokemondb.net/pokedex/';
const gmaxUrl = 'https://pokestats.gg/pokemon/cinderace-gmax';
const number = new Intl.NumberFormat('pt-BR');

function fields(entries) {
    return entries.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
}

export function mountPokedex(panel) {
    panel.innerHTML = `
        <header class="pokemon-dex-header">
            <p class="pokemon-dex-index"></p>
            <div class="pokemon-dex-switch" role="group" aria-label="Jogo da ficha">
                <button type="button" data-game="go" aria-pressed="true">Pokémon GO</button>
                <button type="button" data-game="sword" aria-pressed="false">Sword &amp; Shield</button>
            </div>
        </header>
        <div class="pokemon-dex-content">
            <section>
                <h3>Perfil</h3>
                <p class="pokemon-dex-description"></p>
                <dl class="pokemon-dex-facts"></dl>
            </section>
            <section>
                <h3>Atributos</h3>
                <dl class="pokemon-dex-stats" aria-label="Atributos base"></dl>
                <dl class="pokemon-dex-total"></dl>
            </section>
            <section>
                <h3>Batalha</h3>
                <dl class="pokemon-dex-battle" aria-label="Ataques"></dl>
                <dl class="pokemon-dex-matchups" aria-label="Fraquezas e resistências"></dl>
            </section>
        </div>
        <p class="pokemon-dex-source"><a target="_blank" rel="noopener noreferrer"></a></p>`;
    const indexLine = panel.querySelector('.pokemon-dex-index');
    const description = panel.querySelector('.pokemon-dex-description');
    const facts = panel.querySelector('.pokemon-dex-facts');
    const matchups = panel.querySelector('.pokemon-dex-matchups');
    const stats = panel.querySelector('.pokemon-dex-stats');
    const battle = panel.querySelector('.pokemon-dex-battle');
    const total = panel.querySelector('.pokemon-dex-total');
    const source = panel.querySelector('.pokemon-dex-source a');
    const switches = [...panel.querySelectorAll('[data-game]')];
    let current;
    let game = 'go';

    function render() {
        if (!current) return;
        const { species, form } = current;
        const info = profiles[species.id];
        const go = game === 'go';
        const dyna = form === 'dynamax';
        const giga = form === 'gigamax';
        const cinderace = species.id === 'cinderace';
        const baseMoves = cinderace
            ? `${chargedMoves} · Explosão Focalizada · Bola Incendiária · Queimadura Explosiva (especial)`
            : chargedMoves;
        const maxMoves = giga ? 'Bola de Chamas G-Max'
            : go ? 'Chama Max (Fogo) ou Golpe Max (Normal), de acordo com o ataque rápido.'
                : 'Max Flare (Fogo). O Movimento Max depende do tipo do golpe original.';
        const abilities = [['Habilidade', 'Blaze · Fortalece golpes de Fogo com PS baixos.'],
            ['Habilidade oculta', 'Libero · Muda o tipo do Pokémon para o tipo do golpe que ele vai usar.']];
        const measures = dyna
            ? [['Medidas da forma normal', `${info.height} · ${info.weight}`]]
            : [['Altura', giga ? 'Mais de 27 m (Sword &amp; Shield)' : info.height],
                ['Peso', giga ? 'Desconhecido' : info.weight]];
        const labels = go ? goLabels : swordLabels;
        const values = info[game];
        indexLine.innerHTML = `#0${info.number} ${badge('Fogo')}`;
        description.textContent = giga
            ? 'A energia Gigamax aumenta a bola de fogo sob Cinderace. Ele usa a força das pernas para chutar essa bola gigantesca contra o adversário.'
            : info.description;
        facts.innerHTML = fields([['Categoria', info.category], ['Região de origem', 'Galar'],
            ['Nome em japonês', `<span lang="ja">${info.japanese}</span>`],
            ...measures, ...(go ? [] : abilities)]);
        matchups.innerHTML = fields([[go ? 'Fraquezas · 1,6×' : 'Fraquezas · 2×', weak.map(badge).join('')],
            [go ? 'Resistências · 0,625×' : 'Resistências · 0,5×', resist.map(badge).join('')]]);
        stats.innerHTML = values.map((value, i) => `
            <div><dt>${labels[i]}</dt><dd><span class="pokemon-dex-stat-track" aria-hidden="true">
                <span style="width:${value / 2.55}%"></span></span><strong>${value}</strong>
            </dd></div>`).join('');
        total.innerHTML = fields(go
            ? [['PC máximo no nível 50', number.format(info.cp)]]
            : [['Total dos atributos', values.reduce((sum, value) => sum + value, 0)]]);
        battle.innerHTML = fields(go
            ? [['Ataques rápidos', fastMoves],
                ...(giga ? [] : [['Ataques carregados', baseMoves]]),
                ...(dyna || giga ? [['Ataque Max', maxMoves]] : [])]
            : giga || dyna ? [['Movimento Max', maxMoves]]
                : cinderace ? [['Golpe característico', 'Pyro Ball (Bola Incendiária)']] : []);
        battle.hidden = !battle.hasChildNodes();
        source.href = go ? `${goUrl}${info.number}${giga ? '-Gigantamax' : dyna ? '-Dynamax' : ''}`
            : giga ? gmaxUrl : swordUrl + species.id;
        source.textContent = go ? 'Ver ficha completa no Pokémon GO Hub'
            : giga ? 'Ver ficha completa no PokeStats' : 'Ver ficha completa no Pokémon Database';
    }

    for (const button of switches) button.addEventListener('click', () => {
        if (game === button.dataset.game) return;
        game = button.dataset.game;
        for (const sibling of switches) sibling.setAttribute('aria-pressed', String(sibling === button));
        render();
    });

    return viewer => {
        if (current?.species !== viewer?.species) panel.scrollTop = 0;
        current = viewer;
        render();
    };
}
