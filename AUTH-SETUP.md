# SCORACE: autenticação individual e migração sem perda de dados

**NÃO publicar esta branch antes de configurar o Firebase e fazer a migração.**

## Arquitetura

- Firebase Authentication: e-mail/senha, registro, recuperação e verificação.
- Cada conta usa o documento `users_data/{Firebase Auth UID}`.
- Coleção, capturas, duplicatas e itens adquiridos são sincronizados por UID.
- Uma nova conta começa com os quatro conjuntos vazios.
- Cache da coleção, rascunhos do Mercado e biblioteca local do fichário são isolados por conta.
- O legado `users_data/cinderace_masterset` permanece intocado e não é mais lido pelo site.

## Configuração obrigatória antes do deploy

1. No Firebase **pokedex-colecao**, faça backup do documento `users_data/cinderace_masterset` e confira a quantidade de cartas/duplicatas.
2. Em Authentication > Sign-in method, ative **Email/Password**. Em Authentication > Users, crie a conta proprietária com o e-mail e a senha informados PRIVADAMENTE e defina o apelido `M4caco`. Copie o **UID**; ele será a chave do novo documento. Nunca grave a senha no GitHub.
3. Em máquina confiável, use uma credencial Firebase Admin fora do repositório. Execute a prévia e só depois a migração:

```sh
cd scripts
npm install
export GOOGLE_APPLICATION_CREDENTIALS="/local/privado/service-account.json"
export SCORACE_OWNER_UID="UID_DA_CONTA_M4CACO"
export SCORACE_OWNER_EMAIL="EMAIL_PRIVADO_DA_CONTA"
npm run preview
npm run migrate
```

   O script verifica que o destino não contém progresso, migra o documento antigo e registra `migratedLegacy: true`. O original não é apagado.
4. Publique em Firestore Database > Rules o conteúdo do arquivo `firestore.rules`. Esse arquivo local **não é implantado automaticamente**. Teste que usuários leem/escrevem apenas seu próprio UID e que visitantes e contas diferentes NÃO acessam a coleção antiga.
5. Em Authentication > Settings > Authorized domains, confirme `masterset-cinderace.vercel.app`. Depois publique o código e faça os testes antes de abrir o cadastro ao público.

## Testes

- Conta proprietária: conferir os totais de cartas, capturas e duplicatas contra o backup.
- Conta nova: zero cartas e zero itens adquiridos.
- Sair e entrar com outro usuário no mesmo navegador: nenhum progresso da conta anterior visível.
- Ações de coleção e itens exigem login.
- Fazer uma mudança no computador e conferir no celular via mesmo usuário.
- Confirmar e-mails, recuperação de senha, conta no menu mobile e perfil com apelido.

## Migração de itens e fichário

- O estado antigo de **Itens** estava no `localStorage` do navegador. Depois que o documento do proprietário for migrado, abra o site no navegador original e clique em **Importar itens deste navegador** na área da conta. O botão só aparece na conta migrada e quando há itens antigos e nenhum item remoto.
- Os rascunhos do Mercado antigos são copiados ao perfil migrado no navegador original quando estiverem disponíveis.
- A biblioteca 3D antiga em IndexedDB `scorace-ficharios` continua disponível para a conta migrada no navegador original. Cada outra conta usa seu próprio banco local.
- **Importante:** cartas e itens são sincronizados via Firestore; capas, uploads e fichários personalizados locais ainda NÃO são sincronizados entre dispositivos. Isso precisa ser implementado antes de afirmar que o APK possui todos os fichários do desktop.

## APK Android (etapa seguinte)

O futuro APK poderá reutilizar o mesmo Firebase Authentication e o mesmo UID de usuário. O empacotamento via Capacitor/TWA e Android Studio é uma etapa posterior; nenhum APK é produzido por esta branch.

## Segurança

Não inclua senha, chave privada de serviço ou JSON do Firebase Admin em código público. O nickname nunca deve ser utilizado como autorização. Somente as regras do Firestore protegem os dados no servidor.
