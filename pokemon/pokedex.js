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

export function mountPokedex(panel, speciesList, selectPokemon) {
    panel.innerHTML = `
        <header class="pokemon-dex-header">
            <div><p class="pokemon-dex-index"></p><h3 id="pokemon-dex-title"></h3></div>
            <div class="pokemon-dex-switch" role="group" aria-label="Jogo da ficha">
                <button type="button" data-game="go" aria-pressed="true">Pokémon GO</button>
                <button type="button" data-game="sword" aria-pressed="false">Sword &amp; Shield</button>
            </div>
        </header>
        <div class="pokemon-dex-grid">
            <div>
                <p class="pokemon-dex-description"></p><dl class="pokemon-dex-facts"></dl>
                <h4>Fraquezas e resistências</h4><dl class="pokemon-dex-matchups"></dl>
            </div>
            <div>
                <h4>Atributos base</h4><dl class="pokemon-dex-stats"></dl><dl class="pokemon-dex-battle"></dl>
            </div>
        </div>
        <div class="pokemon-dex-evolution"><h4>Linha evolutiva</h4><ol></ol></div>
        <p class="pokemon-dex-source"><a target="_blank" rel="noopener noreferrer"></a></p>`;
    const indexLine = panel.querySelector('.pokemon-dex-index');
    const title = panel.querySelector('#pokemon-dex-title');
    const description = panel.querySelector('.pokemon-dex-description');
    const facts = panel.querySelector('.pokemon-dex-facts');
    const matchups = panel.querySelector('.pokemon-dex-matchups');
    const stats = panel.querySelector('.pokemon-dex-stats');
    const battle = panel.querySelector('.pokemon-dex-battle');
    const evolution = panel.querySelector('.pokemon-dex-evolution ol');
    const source = panel.querySelector('.pokemon-dex-source a');
    const switches = [...panel.querySelectorAll('[data-game]')];
    const evolutionButtons = speciesList.map((species, index) => {
        const step = document.createElement('li');
        const requirement = document.createElement('span');
        requirement.className = 'pokemon-evolution-requirement';
        const label = document.createElement('span');
        label.className = 'pokemon-evolution-name';
        label.textContent = species.name;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = species.name;
        button.addEventListener('click', () => selectPokemon(index));
        step.append(requirement, button, label);
        evolution.append(step);
        return { button, label, requirement };
    });
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
        const mode = dyna ? ' Dinamax' : giga ? ' Gigamax' : '';
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
        indexLine.innerHTML = `#0${info.number} <span lang="ja">${info.japanese}</span> ${badge('Fogo')}`;
        title.textContent = species.name + mode;
        description.textContent = giga
            ? 'A energia Gigamax aumenta a bola de fogo sob Cinderace. Ele usa a força das pernas para chutar essa bola gigantesca contra o adversário.'
            : info.description;
        facts.innerHTML = fields([['Categoria', info.category], ['Região de origem', 'Galar'],
            ...measures, ...(go ? [] : abilities)]);
        matchups.innerHTML = fields([[go ? 'Fraquezas · 1,6×' : 'Fraquezas · 2×', weak.map(badge).join('')],
            [go ? 'Resistências · 0,625×' : 'Resistências · 0,5×', resist.map(badge).join('')]]);
        stats.innerHTML = values.map((value, i) => `
            <div><dt>${labels[i]}</dt><dd><span class="pokemon-dex-stat-track" aria-hidden="true">
                <span style="width:${value / 2.55}%"></span></span><strong>${value}</strong>
            </dd></div>`).join('');
        battle.innerHTML = fields(go
            ? [['PC máximo no nível 50', number.format(info.cp)], ['Ataques rápidos', fastMoves],
                ...(giga ? [] : [['Ataques carregados', baseMoves]]),
                ...(dyna || giga ? [['Ataque Max', maxMoves]] : [])]
            : [['Total dos atributos', values.reduce((sum, value) => sum + value, 0)],
                ...(giga || dyna ? [['Movimento Max', maxMoves]]
                    : cinderace ? [['Golpe característico', 'Pyro Ball (Bola Incendiária)']] : [])]);
        const steps = go ? ['', '25 Doces', '100 Doces'] : ['', 'Nível 16', 'Nível 35'];
        for (const [i, { button, label, requirement }] of evolutionButtons.entries()) {
            const active = String(speciesList[i].id === species.id);
            button.setAttribute('aria-current', active);
            label.setAttribute('aria-current', active);
            requirement.textContent = steps[i];
        }
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
        current = viewer;
        panel.hidden = !viewer;
        render();
    };
}
