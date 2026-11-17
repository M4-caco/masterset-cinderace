# Arquivos do visualizador Pokémon

As malhas, os esqueletos, as texturas normal e Shiny, os clipes e os ícones vieram dos [pacotes Unity do Pokémon GO](https://github.com/ChicoEevee/Pokemon-GO-AssetBundles/tree/main/Pokemon). Os pacotes são `pm813_assets_all`, `pm814_assets_all`, `pm815_assets_all` e `pm815.floaf_assets_all` (Cinderace Gigamax).

Os modelos foram convertidos para glTF com buffers externos. A iluminação, a composição das texturas dos olhos e da bola de fogo e a apresentação da aura foram adaptadas para o navegador. As nuvens Max usam a malha `max_cloud_combined`, os atributos de fase dos vértices e a textura `max_cloud_vertex_anim` dos pacotes originais. O shader web reproduz as fórmulas do `MaxCloudShader` e usa os parâmetros de cor do material `fx_max_cloud`. O modo Dynamax usa a malha e o clipe especial de cada Pokémon da forma normal. O Gigamax usa o modelo, o ataque e o rugido do seu próprio pacote.

O arquivo `vendor/three-gltf.js` é um bundle do Three.js 0.180.0 e do seu GLTFLoader. A licença está em `vendor/three-LICENSE.txt`.

A animação de repouso usa `ba10_waitA01`. Os movimentos de toque foram identificados comparando os clipes com o vídeo da Pokédex. Os sons são os arquivos `pm813.cry`, `pm814.cry` e `pm815.cry` dos respectivos pacotes. O Cinderace Gigamax usa o mesmo som do Cinderace.

O brilho no corpo usa a textura original `maxCaustics`, os parâmetros `BreadMode` dos pacotes dos Pokémon e os cálculos de iluminação inferior, atenuação de borda e projeção da textura do shader `Pokemon_UBER_MAX` em `bread_shared_rendering_assets_all`. A iluminação de base é a do visualizador web. Os WebP de visualização foram renderizados diretamente dos modelos 3D e mantêm transparência, repouso, cores normais e Shiny.

A transição web segue a sequência observada na tela de atributos do jogo e usa as texturas `maxglow_noiseclouds` e `electric_anim` dos pacotes `bread_shared_assets_fx_max_glow` e `bread_shared_assets_fx_max_static_normal`, respectivamente. A escala aparente foi medida nos vídeos de Raboot Dinamax e Cinderace Gigamax. A interface web usa enquadramento próprio.

Os nomes dos golpes selecionados seguem os nomes em português do Pokémon GO. Os botões reproduzem os clipes corporais disponíveis para ataques físicos, especiais e Max do visualizador.

Investida, Chama Furacão, Ataque de Chamas e Bola Incendiária usam texturas do pacote Android `attackfx_assets_all`. As fases são adaptadas dos prefabs `tackle_fast_hit`, `fire_spin_fast_emit`, `flame_charge` e `pyroball`. O visualizador compõe os sprites sem reproduzir toda a simulação de partículas e os materiais Unity.

O catálogo Android registra `max_flare` e `gmax_fireball` em `breadattackfx_assets_all` e a transformação em `breadbattlefx_assets_all`. A Chama Max ainda usa o efeito web. A Bola de Chamas G-Max usa a animação e a malha da bola de fogo do pacote `pm815.floaf_assets_all`.
