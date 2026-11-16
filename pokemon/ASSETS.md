# Arquivos do visualizador Pokémon

As malhas, os esqueletos, as texturas normal e Shiny, os clipes e os ícones vieram dos [pacotes Unity do Pokémon GO](https://github.com/ChicoEevee/Pokemon-GO-AssetBundles/tree/main/Pokemon). Os pacotes são `pm813_assets_all`, `pm814_assets_all`, `pm815_assets_all` e `pm815.floaf_assets_all` (Cinderace Gigamax).

Os modelos foram convertidos para glTF com buffers externos. A iluminação, a composição das texturas dos olhos e da bola de fogo, e a apresentação da aura foram adaptadas para o navegador. A nuvem usa o ícone do Cinderace Gigamax, e o brilho usa uma textura do pacote `bread_shared_assets_fx_max_glow`. O modo Dynamax usa a malha e o clipe especial de cada Pokémon da forma normal. O Gigamax usa o modelo, o ataque e o rugido do seu próprio pacote.

O arquivo `vendor/three-gltf.js` é um bundle do Three.js 0.180.0 e do seu GLTFLoader. A licença está em `vendor/three-LICENSE.txt`.

A animação de repouso usa `ba10_waitA01`. Os movimentos de toque foram identificados comparando os clipes com o vídeo da Pokédex. Os sons são os arquivos `pm813.cry`, `pm814.cry` e `pm815.cry` dos respectivos pacotes. O Cinderace Gigamax usa o mesmo som do Cinderace.

O brilho Max combina a textura original `maxCaustics` com os parâmetros de cor do material `BreadMode`. Os WebP de visualização foram renderizados diretamente dos modelos 3D e mantêm transparência, repouso, cores normais e Shiny.
