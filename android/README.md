# SCORACE Android - APK de teste

Este é um aplicativo Android nativo que abre o site oficial SCORACE em WebView por HTTPS.
O login é o mesmo da versão web, usando Firebase Authentication e o documento
individual do Firestore. Não há senha, coleção nem chave administrativa embutida no APK.

## Testar no Android

Abra a página Releases deste repositório, selecione o pré-lançamento
"SCORACE Android | Teste" e baixe SCORACE-Android-Teste.apk no celular.
Pode ser necessário permitir que o navegador instale um aplicativo dessa origem.
Após instalar, abra o SCORACE, faça login com sua conta existente e confira
as cartas adquiridas.

O WebView possui armazenamento diferente do Chrome, por isso é normal
precisar entrar novamente com e-mail/senha no primeiro uso.

## Características

- Site oficial carregado via HTTPS e domínio verificado antes de permissões de câmera.
- Seleção de imagens e arquivos, downloads HTTPS, câmera mediante autorização.
- Aceleração de hardware para a página 3D; performance depende do aparelho.
- Links externos abertos no navegador, sem navegar fora do domínio no WebView.
- Sem permissão de microfone, localização ou acesso irrestrito aos arquivos.
- Sem backups automáticos do armazenamento privado do aplicativo.

## Limitações

- Precisa de internet para carregar site, modelos e imagens.
- Uploads, capas e fichários que só existem no navegador do PC permanecem locais;
  não aparecem automaticamente no APK.
- Este APK é de **teste**, assinado com chave temporária de depuração gerada
  durante a compilação. Uma versão posterior pode exigir desinstalar este APK.
- Não foi submetido à Google Play nem testado em aparelho físico.
- Downloads iniciados por URLs blob: ainda precisam de uma implementação adicional.

## Compilação

Requisitos: Java 17, Android SDK 35, Gradle 8.11.1 e Python com Pillow.

    python3 -m pip install Pillow==11.3.0
    python3 android/scripts/generate_icons.py
    gradle --project-dir android :app:assembleDebug --no-daemon

O APK gerado fica em android/app/build/outputs/apk/debug/app-debug.apk.
O GitHub Actions compila automaticamente o APK para Android e publica
o arquivo de teste como artefato e pré-lançamento no próprio repositório.

Para distribuir uma versão estável e atualizável, configurar uma keystore
privada (nunca enviá-la ao GitHub público).
