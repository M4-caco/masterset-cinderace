const stellar = 'https://www.pokipair.com/stellar-crystal-csv9-card-list/';
const primordial = 'https://www.pokipair.com/primordial-arts-set-list-cs3a/';

const additions = [
  [228, 163, 'pokebola', 'Poké Ball', stellar],
  [229, 163, 'master', 'Master Ball', stellar],
  [230, 214, 'pokebola', 'Poké Ball', stellar],
  [231, 214, 'master', 'Master Ball', stellar],
  [232, 166, 'chamas', 'Chamas de Fogo espalhadas', primordial],
  [233, 223, 'chamas', 'Chamas de Fogo espalhadas', primordial],
  [234, 81, 'chamas', 'Chamas de Fogo espalhadas', primordial]
];

const finishes = {
  colunas: 'Mosaico de Energia de Fogo',
  mosaico: 'Mosaico de Fogo · Coroa Estelar',
  cobre: 'Metálico liso',
  'fogo-central': 'Símbolos de Energia',
  friend: 'Friend Ball'
};

export function prepareReverseCatalog(cards) {
  const byId = new Map(cards.map(card => [card.id, card]));
  const get = id => byId.get('card-' + id);
  const add = (id, effect, baseId, options = {}) => {
    const card = get(id);
    card.padrao = options.pattern ?? finishes[effect] ?? card.padrao;
    card.variante = [card.apresentacao, card.acabamento, card.padrao].join(' · ');
    card.foil = {
      effect,
      base: get(baseId).imagem,
      print: options.print ? card.imagem : null,
      layout: options.layout ?? 'silver',
      stage: card.pokemon !== 'Scorbunny'
    };
  };

  for (const [id, base] of [[23,4],[25,5],[29,28],[56,30],[58,32],[103,102],[105,104],[109,108],
    [124,123],[126,125],[130,129],[175,174],[177,176],[180,179],[190,189],[192,191],[195,194]]) {
    add(id, 'colunas', base, {layout:'yellow'});
  }
  add(51, 'colunas', 26, {layout:'yellow', print:true});
  for (const [id, base] of [[112,111],[133,132],[182,181],[197,196]]) add(id, 'mosaico', base);
  for (const [id, base] of [[24,22],[57,50],[118,117],[139,138],[188,187],[203,202]]) add(id, 'cobre', base);
  for (const [id, base] of [[114,113],[135,134],[185,184],[200,199]]) add(id, 'fogo-central', base);
  for (const [id, base] of [[115,113],[136,134],[186,184],[201,199]]) add(id, 'friend', base);

  // These six Gem Pack prints have no matching non-foil. Keep their printed
  // identifiers and Gem Pack seal over the clean Chinese Raboot face.
  for (const [id, effect] of [[215,'fogo'],[216,'pokebola'],[217,'estrelas'],[218,'master'],[219,'faixas'],[221,'prisma']]) {
    add(id, effect, 214, {print:true, layout:'gem'});
  }

  for (const [id, base, effect, pattern, source] of additions) {
    const normal = get(base);
    const card = {
      ...normal, id:'card-' + id, acabamento:'Reverse holo', varianteOriginal:'Reverse Foil',
      padrao:pattern, revisao:[], classificacao:'Variante conferida em catálogo',
      fontesClassificacao:[source], origemImagem:'Simulação sobre a imagem base da mesma carta'
    };
    cards.push(card);
    byId.set(card.id, card);
    add(id, effect, base, {pattern});
  }

  const gold = get(89);
  Object.assign(gold, {
    acabamento:'Holo / Foil', padrao:'Texturizado', apresentacao:'Gold',
    varianteOriginal:'ex Gold', variante:'Gold · Holo / Foil · Texturizado', revisao:[],
    classificacao:'Variante conferida em catálogo',
    fontesClassificacao:[stellar,'https://krystalkollectz.com/blogs/news/stellar-crystal-pokemon-card-list-csv9c-simplified-chinese']
  });
}

export function cardImage(card) {
  return card.foil ? 'foil/v1/' + card.id + '.webp' : card.imagem;
}

export const reverseBaseIds = new Map(additions.map(([id, base]) => [String(id), String(base)]));
