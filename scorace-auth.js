import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updateProfile,
  sendPasswordResetEmail, sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

export function initScoraceAuth(firebaseApp, onUserChanged) {
  const auth = getAuth(firebaseApp);
  const dialog = document.getElementById('scorace-auth-dialog');
  const status = document.getElementById('scorace-auth-status');
  const login = document.getElementById('scorace-login-form');
  const register = document.getElementById('scorace-register-form');
  const account = document.getElementById('scorace-account-panel');
  const heading = document.getElementById('scorace-auth-heading');
  const description = document.getElementById('scorace-auth-description');
  const triggers = [...document.querySelectorAll('[data-scorace-account-trigger]')];
  const modeButtons = [...document.querySelectorAll('[data-scorace-auth-mode]')];
  let currentUser = null;
  let busy = false;

  // Firebase Console accounts may have no displayName. For the existing
  // SCORACE owner only, display the confirmed nickname instead of email prefix.
  const ownerUid = 'ni2UkOT32qUXU2UB7g5omv06JZj2';
  const ownerNickname = 'M4caco';
  const emailPrefix = user => user?.email?.split('@')[0] || '';
  function needsOwnerNickname(user) {
    if (!user || user.uid !== ownerUid) return false;
    const name = (user.displayName || '').trim();
    return !name || name.toLowerCase() === emailPrefix(user).toLowerCase();
  }
  function nicknameFor(user) {
    if (!user) return '';
    if (needsOwnerNickname(user)) return ownerNickname;
    return user.displayName?.trim() || emailPrefix(user) || 'Colecionador';
  }

  const errorMessages = {
    'auth/email-already-in-use': 'Este e-mail já tem conta. Use Entrar.',
    'auth/invalid-email': 'Confira o endereço de e-mail.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/weak-password': 'Escolha uma senha mais forte.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/network-request-failed': 'Sem conexão. Verifique sua internet.',
    'auth/operation-not-allowed': 'O login por e-mail ainda precisa ser ativado no Firebase.',
    'auth/user-disabled': 'Esta conta foi desativada.'
  };
  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
  };
  function setBusy(next) {
    busy = next;
    dialog.querySelectorAll('button[type="submit"],[data-scorace-auth-action]').forEach(button => {
      button.disabled = next;
    });
  }
  function showMode(mode) {
    login.hidden = mode !== 'login';
    register.hidden = mode !== 'register';
    account.hidden = mode !== 'account';
    modeButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.scoraceAuthMode === mode));
      button.hidden = mode === 'account';
    });
    heading.textContent = mode === 'account' ? 'Sua conta SCORACE' : mode === 'register' ? 'Criar conta' : 'Entrar no SCORACE';
    description.textContent = mode === 'account'
      ? 'Seu progresso fica associado à sua conta.'
      : 'Use sua conta para sincronizar a coleção no site e no futuro aplicativo.';
    if (mode === 'account' && currentUser) {
      document.getElementById('scorace-account-name').textContent = nicknameFor(currentUser);
      document.getElementById('scorace-account-email').textContent = currentUser.email || '';
      document.getElementById('scorace-edit-nickname').value = nicknameFor(currentUser);
      const verification = document.getElementById('scorace-verification');
      verification.hidden = !!currentUser.emailVerified;
    }
    setStatus('');
  }
  function updateTriggers() {
    triggers.forEach(button => {
      const nickname = nicknameFor(currentUser);
      button.textContent = currentUser ? '👤 ' + nickname : '👤 Entrar / Criar conta';
      button.setAttribute('aria-label', currentUser ? 'Abrir minha conta' : 'Entrar ou criar uma conta');
    });
  }
  function open() {
    showMode(currentUser ? 'account' : 'login');
    if (!dialog.open) dialog.showModal();
  }
  // Contas criadas pelo Console do Firebase podem não ter displayName.
  // Neste caso, use o apelido salvo no perfil individual do Firestore.
  window.scoraceSyncNickname = async nickname => {
    const clean = typeof nickname === 'string' ? nickname.trim().slice(0, 32) : '';
    if (!clean || !currentUser || (currentUser.displayName && currentUser.displayName.toLowerCase() !== emailPrefix(currentUser).toLowerCase())) return;
    const account = currentUser;
    try {
      await updateProfile(account, {displayName: clean});
      if (currentUser !== account) return;
      updateTriggers();
      if (dialog.open) showMode('account');
    } catch (error) {
      console.warn('Não foi possível atualizar o apelido do perfil:', error.code || 'desconhecido');
    }
  };
  window.openScoraceAccount = open;
  triggers.forEach(button => button.addEventListener('click', open));
  document.getElementById('scorace-auth-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  modeButtons.forEach(button => button.addEventListener('click', () => showMode(button.dataset.scoraceAuthMode)));
  async function doAuth(task) {
    if (busy) return;
    setBusy(true);
    setStatus('');
    try { await task(); }
    catch (error) {
      console.error('Falha na autenticação:', error.code || 'desconhecido');
      setStatus(errorMessages[error.code] || 'Não foi possível concluir. Tente novamente.', true);
    } finally { setBusy(false); }
  }
  login.addEventListener('submit', event => {
    event.preventDefault();
    const email = document.getElementById('scorace-login-email').value.trim();
    const password = document.getElementById('scorace-login-password').value;
    doAuth(async () => {
      await signInWithEmailAndPassword(auth, email, password);
      login.reset();
      dialog.close();
    });
  });
  register.addEventListener('submit', event => {
    event.preventDefault();
    const nickname = document.getElementById('scorace-register-nickname').value.trim();
    const email = document.getElementById('scorace-register-email').value.trim();
    const password = document.getElementById('scorace-register-password').value;
    const confirm = document.getElementById('scorace-register-confirm').value;
    if (!nickname || nickname.length > 32 || password.length < 8 || password !== confirm) {
      setStatus('Informe um apelido de até 32 caracteres e uma senha de pelo menos 8 caracteres, repetida corretamente.', true);
      return;
    }
    doAuth(async () => {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, {displayName: nickname});
      await sendEmailVerification(credential.user);
      register.reset();
      currentUser = credential.user;
      updateTriggers();
      showMode('account');
      setStatus('Conta criada! Enviamos um link para verificar seu e-mail.');
    });
  });
  document.getElementById('scorace-reset-password').addEventListener('click', () => {
    const email = document.getElementById('scorace-login-email').value.trim();
    if (!email) {
      setStatus('Informe seu e-mail no campo acima para recuperar a senha.', true);
      return;
    }
    doAuth(async () => {
      await sendPasswordResetEmail(auth, email);
      setStatus('Se a conta existir, você receberá instruções de recuperação por e-mail.');
    });
  });
  document.getElementById('scorace-nickname-form').addEventListener('submit', event => {
    event.preventDefault();
    const nickname = document.getElementById('scorace-edit-nickname').value.trim();
    if (!currentUser || nickname.length < 1 || nickname.length > 32) {
      setStatus('O apelido deve ter entre 1 e 32 caracteres.', true);
      return;
    }
    doAuth(async () => {
      await updateProfile(currentUser, {displayName: nickname});
      updateTriggers();
      showMode('account');
      setStatus('Apelido atualizado.');
    });
  });
  document.getElementById('scorace-verify-email').addEventListener('click', () => {
    if (!currentUser) return;
    doAuth(async () => {
      await sendEmailVerification(currentUser);
      setStatus('Enviamos outro link de verificação para seu e-mail.');
    });
  });
  document.getElementById('scorace-refresh-verification').addEventListener('click', () => {
    if (!currentUser) return;
    doAuth(async () => {
      await currentUser.reload();
      await currentUser.getIdToken(true);
      if (currentUser.emailVerified) {
        showMode('account');
        setStatus('E-mail verificado.');
        await onUserChanged(currentUser);
      } else {
        setStatus('O e-mail ainda não foi verificado. Confira sua caixa de entrada.');
      }
    });
  });
  document.getElementById('scorace-logout').addEventListener('click', () => {
    doAuth(async () => {
      await signOut(auth);
      dialog.close();
    });
  });
  onAuthStateChanged(auth, async user => {
    currentUser = user;
    window.scoraceAccountUser = user;
    updateTriggers();
    if (dialog.open) showMode(user ? 'account' : 'login');
    if (needsOwnerNickname(user)) {
      const owner = user;
      updateProfile(owner, {displayName: ownerNickname}).then(() => {
        if (currentUser !== owner) return;
        updateTriggers();
        if (dialog.open) showMode('account');
      }).catch(error => {
        console.warn('Não foi possível salvar o apelido da conta:', error.code || 'desconhecido');
      });
    }
    try { await onUserChanged(user); }
    catch (error) {
      console.error('Não foi possível carregar o perfil:', error);
      setStatus('Sua sessão abriu, mas a coleção não pôde ser carregada. Verifique a conexão e as permissões do Firebase.', true);
    }
  }, error => {
    console.error('Erro ao inicializar autenticação:', error.code || 'desconhecido');
    setStatus('Não foi possível verificar a sessão. Recarregue a página.', true);
  });
  return {auth, open};
}
