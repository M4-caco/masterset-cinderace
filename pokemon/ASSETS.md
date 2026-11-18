# Arquivos do visualizador Pokémon

As malhas, os esqueletos, as texturas normal e Shiny, os clipes e os ícones vieram dos [pacotes Unity do Pokémon GO](https://github.com/ChicoEevee/Pokemon-GO-AssetBundles/tree/main/Pokemon). Os pacotes são `pm813_assets_all`, `pm814_assets_all`, `pm815_assets_all` e `pm815.floaf_assets_all` (Cinderace Gigamax).

Os modelos foram convertidos para glTF com buffers externos. A iluminação, a composição das texturas dos olhos e da bola de fogo e a apresentação da aura foram adaptadas para o navegador. As nuvens Max usam a malha `max_cloud_combined`, os atributos de fase dos vértices e a textura `max_cloud_vertex_anim` dos pacotes originais. O shader web reproduz as fórmulas do `MaxCloudShader` e usa os parâmetros de cor do material `fx_max_cloud`. O modo Dynamax usa a malha e o clipe especial de cada Pokémon da forma normal. O Gigamax usa o modelo, o ataque e o rugido do seu próprio pacote.

O arquivo `vendor/three-gltf.js` é um bundle do Three.js 0.180.0 e do seu GLTFLoader. A licença está em `vendor/three-LICENSE.txt`.

A animação de repouso usa `ba10_waitA01`. Os movimentos de toque foram identificados comparando os clipes com o vídeo da Pokédex. Os sons são os arquivos `pm813.cry`, `pm814.cry` e `pm815.cry` dos respectivos pacotes. O Cinderace Gigamax usa o mesmo som do Cinderace.

O brilho no corpo usa a textura original `maxCaustics`, os parâmetros `BreadMode` dos pacotes dos Pokémon e os cálculos de iluminação inferior, atenuação de borda e projeção da textura do shader `Pokemon_UBER_MAX` em `bread_shared_rendering_assets_all`. A iluminação de base é a do visualizador web. As miniaturas de carregamento foram renderizadas a partir dos modelos 3D.

A transição web segue a sequência observada na tela de atributos do jogo e usa as texturas `maxglow_noiseclouds` e `electric_anim` dos pacotes `bread_shared_assets_fx_max_glow` e `bread_shared_assets_fx_max_static_normal`, respectivamente. A escala aparente foi medida nos vídeos de Raboot Dinamax e Cinderace Gigamax. A interface web usa enquadramento próprio.

Os nomes dos golpes selecionados seguem os nomes em português do Pokémon GO. Os botões reproduzem os clipes corporais disponíveis para ataques físicos, especiais e Max do visualizador.

As expressões usam quadros das texturas de face originais, nas cores normal e Shiny. Raboot e Cinderace usam novamente a composição do contorno e da íris com a disposição espelhada do jogo. Os controladores de olhos dos clipes selecionam o quadro durante o ataque. A piscada de repouso é cadenciada pelo visualizador.

Investida, Chama Furacão, Ataque de Chamas e Bola Incendiária usam texturas do pacote Android `attackfx_assets_all`. As fases são adaptadas dos prefabs `tackle_fast_hit`, `fire_spin_fast_emit`, `flame_charge` e `pyroball`. O visualizador usa as texturas e os tempos dos prefabs em uma composição web. A Investida percorre a largura do palco com a trajetória horizontal do clipe, escalada para o espaço disponível.

O catálogo Android registra `max_flare` e `gmax_fireball` em `breadattackfx_assets_all` e a transformação em `breadbattlefx_assets_all`. A Chama Max usa uma adaptação web com texturas de fogo de `attackfx_assets_all`. A Bola de Chamas G-Max usa a animação e a malha da bola de fogo do pacote `pm815.floaf_assets_all`.

## Interação com animações originais

Os toques e os botões da aba Pokémon executam apenas os clipes de animação do próprio modelo GLTF (físico, especial, alternativo e rugido Gigamax, conforme os clipes disponíveis). Os sons originais do Pokémon GO continuam em `pokemon/audio/*.wav`. Arrastar gira o modelo 360°. Nenhum efeito visual de golpe é criado pelo site.

Gestos rápidos distinguem a animação física da especial; o Gigamax reage com rugido ao toque isolado. Os botões identificam as **animações**, e não reproduções de projéteis ou efeitos de batalha.

Teste: `node tests/pokemon-tap-gestures.mjs`.

## Impacto no solo durante Dynamax e Gigamax

O módulo `max-landing.js` adiciona uma explosão leve de fragmentos tridimensionais e poeira no instante da substituição visual do modelo Max. As pedras seguem uma trajetória balística determinística com gravidade, uma colisão com o piso e um quique, independentemente da taxa de quadros. O efeito usa um pool fixo de objetos e é cancelado ao trocar de forma, evitando duplicações e vazamentos. Em celulares a quantidade de partículas é menor.

**Limite dos recursos:** os fragmentos e a poeira desta implementação são materiais e geometrias procedurais, não as texturas exatas de `breadbattlefx_assets_all`. O repositório ainda não contém os arquivos de textura da aterrissagem Max que foram mencionados em um teste anterior. Substituí-los pela extração original e fazer uma comparação visual com Pokémon GO são tarefas distintas; não afirmar equivalência exata enquanto isso não for verificado.

Teste de trajetória, limpeza e cem reativações por perfil de renderização: `node tests/pokemon-max-landing.mjs`.


## Efeitos experimentais de golpes descontinuados (18/11/2026)

A pedido do usuário, a implementação própria de combate e efeitos de ataques foi retirada. Não são mais importados nem renderizados `battle-effects.js`, `ground-fire.js` ou `effect-space.js`, nem o antigo atlas `visuals/attack-fx.webp`. A simulação de investida, fogo no chão, lança-chamas, Bola Incendiária, Chama Max e projétil G-Max foi removida. Também não existe mais troca do efeito de acordo com o ângulo: só restam as animações 3D nativas dos modelos e seus sons.

**Os efeitos de transformação** Dynamax/Gigamax, incluindo materiais Max, nuvens e a explosão de pedras em `max-landing.js`, são uma funcionalidade diferente e continuam ativos.

Teste de regressão: `node tests/pokemon-no-attack-effects.mjs`.

## Cinderace Shiny: rosto

**Revisão facial Shiny (18/11/2026):** o formato e a orientação dos olhos na versão anterior à primeira reclamação estavam corretos. Foi mantido o mesmo atlas web de três expressões cinderace-face-shiny.webp, sem espelhamento ou reconstrução das íris. A camada do atlas agora é um decal transparente: preserva os olhos vermelhos, seu contorno escuro e apenas o branco próximo às íris. As regiões de cor que não pertencem aos olhos, incluindo os pontos escuros próximos ao nariz e à bochecha e as linhas claras ao redor do rosto, deixam de encobrir a pele. O material _FaceBase Shiny continua opaco para cobrir as áreas escuras internas da malha, com tonalidade aproximada à pele (#b5aaa1); ocultá-lo completamente causa artefatos escuros. A textura normal e os demais Pokémon não são alterados. Este é um ajuste específico da composição web, não uma importação completa do shader de olhos original do Pokémon GO. Validado com testes de pixel (dois olhos, detalhes brancos naturais, pálpebras e remoção de manchas) e comparação de materiais na cena WebGL em Chromium; a aparência deve ser revisada também no dispositivo do usuário.

Os recursos de efeitos de ataque removidos permanecem apenas no histórico Git. Não são utilizados nem carregados pelo aplicativo. A composição facial Shiny e as suas correções continuam em desenvolvimento independente da descontinuação dos efeitos de golpes.
