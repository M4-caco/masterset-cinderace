# Scorace

Master set de Scorbunny, Raboot e Cinderace. O site estático é publicado a partir da branch `main` em https://masterset-cinderace.vercel.app.

## Mapa do site

| Área | Ponto de entrada e arquivos |
| --- | --- |
| Navegação, tema e cabeçalho | `index.html`. Busque `switchTab` e os IDs `nav-*` / `mob-nav-*`. Cada aba fica em uma seção `view-*`. |
| Início e progresso da coleção | `index.html`, seção `view-dashboard` e função `renderDashboard`. |
| Coleção, filtros e dados das cartas | `index.html`, seção `view-grid` e catálogo `allCards`. As imagens das cartas ficam na raiz. `grupos-expansoes.json` e `fontes-logos.json` registram grupos e referências de logos. |
| Captura, câmera e OCR | `index.html`, seção `view-capture`. Busque `renderCaptureView`, `live-scanner` e `scannerOpen`. |
| Itens e Mercado | `index.html`, seções `view-items` e `view-market`. O catálogo e a lógica de Itens ficam no script ao final do HTML, perto de `window.renderItems`. |
| Fichário 3D | `index.html`, seção `view-binder`. `scorace-binder.js` e `scorace-binder.css` integram o iframe de `fichario/index.html`. Dentro dele, veja `fichario/realtime-engine.js` para a cena e `fichario/scorace-piles.js` para as pilhas de cartas. O contrato de integração está em `INTEGRACAO-FICHARIO.md`. |
| Reverse foil | `foil/catalog.mjs` liga cartas e variantes ao acabamento. `foil/interaction.mjs` cuida da interação, `foil/render.mjs` renderiza o efeito e `foil/binder-preview.mjs` integra a prévia do fichário. |
| Pokémon 3D | `index.html`, seção `view-pokemon` e template `pokemon-card-template`. `pokemon/entry.js` carrega `pokemon/showcase.js`, onde ficam espécies, escalas, câmera, carrossel e formas. `pokemon/showcase.css` define a aparência e os layouts. |
| Ficha e controles Pokémon | `pokemon/pokedex.js` reúne perfil, atributos e batalha e alterna os dados de Pokémon GO e Sword & Shield. `pokemon/showcase-controls.js` monta ícones e volume. |
| Animações e formas Max | `pokemon/face-animation.js`, `pokemon/battle-effects.js`, `pokemon/max-material.js` e `pokemon/max-clouds.js`. Modelos, sons e texturas ficam em `pokemon/models/`, `pokemon/audio/` e `pokemon/visuals/`. Veja `pokemon/ASSETS.md` antes de trocar esses arquivos. |

## Verificação local

- Rode `python -m http.server 8000` a partir da raiz e abra `http://localhost:8000/`. Os módulos ES carregam por HTTP.
- Para a aba Pokémon, abra `http://localhost:8000/?aba=pokemon` com WebGL ativo. Confira o trio e a ficha lateral no desktop, e as setas com a ficha abaixo no celular. Teste a seleção, as formas e o seletor de jogo quando a mudança afetar essas interações.
- Ao editar CSS ou módulos com URLs versionadas por `?v=`, atualize as referências afetadas, incluindo os módulos importadores quando necessário. Para Pokémon, confira a cadeia `index.html` → `entry.js` → `showcase.js` → módulos da aba.
- Para alterações na coleção ou no fichário, confira a aba real e a passagem do estado das cartas entre o site e o iframe.
