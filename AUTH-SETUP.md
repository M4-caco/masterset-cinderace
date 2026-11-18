# SCORACE: autenticação individual e migração sem perda de dados

**NÃO publicar esta branch antes de configurar o Firebase e fazer a migração.**

## Arquitetura

- Firebase Authentication: e-mail/senha, registro, recuperação e verificação.
- Cada conta usa o documento `users_data/{Firebase Auth UID}`.
- Coleção, capturas, duplicatas e itens adquiridos são sincronizados por UID.
- Uma nova conta começa com os quatro conjuntos vazios.
- Cache da coleção, rascunhos do Mercado e biblioteca local do fichário são isolados por conta.
- O legado `users_data/cinderace_masterset` permanece intocado e não é mais lido pelo site.

## Migração guiada, sem precisar instalar o Admin SDK

Depois de criar a conta do proprietário no Authentication, a versão de testes oferece `migrar-colecao.html`.
Essa página NÃO contém o backup nem senhas. Ela exige login com o UID proprietário confirmado,
consulta o documento antigo diretamente e, após consentimento explícito, copia cartas, capturas e
duplicatas em transação, sem apagar a origem. Também confere o conteúdo gravado no destino.

1. Faça backup no Console e confira o documento antigo. O arquivo de texto fornecido pelo usuário
   representa uma versão de 13/11/2026 e pode estar desatualizado.
2. Na prévia da Vercel desta branch, abra `/migrar-colecao.html`. Entre com o usuário do Firebase.
3. Clique em **Verificar coleção atual no Firebase**, confira os totais e a data. Se a leitura não funcionar,
   a interface permite escolher uma cópia JSON do próprio usuário; o arquivo NÃO é enviado ao GitHub.
   Prefira sempre a cópia mais recente do Firebase.
4. Se o destino estiver vazio, marque a confirmação e clique em **Copiar minha coleção com segurança**.
5. Aguarde a conferência e confira `users_data/{uid}` no Console. O documento antigo deverá permanecer.
6. **Se houver permission-denied, não substitua as regras por regras abertas**. Investigue as regras
   atuais e mantenha o banco original intacto. Para cenários com restrições, use o script administrativo abaixo.

**Ordem de publicação:** execute e verifique a migração ANTES de fechar o acesso legado com `firestore.rules`.
Somente depois publique o site autenticado, confirme que ele mostra a coleção migrada e aplique
imediatamente as regras restritivas do Firestore. Publicar essas regras antes de atualizar o site
principal pode impedir a leitura da coleção pelo frontend antigo.

### Alternativa administrativa
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
