// One-time owner-controlled migration. Never place collection data or a password in public Git.
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {getFirestore,doc,getDocFromServer,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const config={
  apiKey:"AIzaSyADGiKo9OxGKNbVaRB_-S8j1Yfi2f1Zt5k",
  authDomain:"pokedex-colecao.firebaseapp.com",
  projectId:"pokedex-colecao",
  storageBucket:"pokedex-colecao.firebasestorage.app",
  messagingSenderId:"612860563936",
  appId:"1:612860563936:web:9e2c47620127cbb0e05b85"
};
const OWNER_UID='ni2UkOT32qUXU2UB7g5omv06JZj2';
const SOURCE_PATH='users_data/cinderace_masterset';
const DEST_PATH='users_data/'+OWNER_UID;
const app=initializeApp(config,'scorace-migration');
const auth=getAuth(app);
const db=getFirestore(app);
const sourceRef=doc(db,SOURCE_PATH);
const destRef=doc(db,DEST_PATH);
const $=id=>document.getElementById(id);
let preview=null;
let current=null;
let running=false;

function status(message,type='') {
  $('status').textContent=message;
  $('status').className='status'+(type?' '+type:'');
}
function visible(id,show) {$ (id).hidden=!show;}
function owner(user) {
  return !!user && user.uid===OWNER_UID;
}
function needOwner() {
  if (!owner(auth.currentUser)) throw new Error('Somente a conta M4caco pode migrar esta coleção.');
}
function fail(error,action) {
  const code=error?.code || '';
  const common={
    'permission-denied':'O Firebase recusou acesso ao documento. Não altere as regras sem revisar a proteção da coleção antiga.',
    'unavailable':'O Firebase não respondeu. Verifique a conexão e tente novamente.',
    'auth/invalid-credential':'E-mail ou senha incorretos.',
    'auth/network-request-failed':'Sem conexão com o Firebase.',
    'failed-precondition':'Uma condição de segurança falhou. Confira as regras e o documento de destino.'
  };
  status(action+': '+(common[code] || error?.message || String(error)), 'error');
}
function shape(value) {
  return value!==null && typeof value==='object' && !Array.isArray(value);
}
function normalizeCollection(data) {
  if (!shape(data) || !shape(data.obtainedMap) || !shape(data.captureDataMap) || !Array.isArray(data.duplicateCaptures)) {
    throw new Error('O documento não contém uma coleção SCORACE completa (obtainedMap, captureDataMap, duplicateCaptures). Nada foi modificado.');
  }
  const info={
    obtainedMap:data.obtainedMap,
    captureDataMap:data.captureDataMap,
    duplicateCaptures:data.duplicateCaptures,
    collectionResetVersion:data.collectionResetVersion||'fresh-collection-20261030-v1',
    updatedAt:typeof data.updatedAt==='string'?data.updatedAt:null
  };
  const metrics=counts(info);
  if (!metrics.acquired || !metrics.captures) throw new Error('A origem está vazia ou incompleta. A migração foi bloqueada.');
  return info;
}
function counts(data) {
  return {
    acquired:Object.values(data.obtainedMap||{}).filter(value=>value===true).length,
    captures:Object.keys(data.captureDataMap||{}).length,
    duplicates:(data.duplicateCaptures||[]).length
  };
}
function occupied(data) {
  if (!data) return false;
  return data.migratedLegacy===true ||
    Object.keys(data.obtainedMap||{}).length>0 ||
    Object.keys(data.captureDataMap||{}).length>0 ||
    (data.duplicateCaptures||[]).length>0 ||
    Object.keys(data.itemsOwned||{}).length>0;
}
function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value==='object' && Object.getPrototypeOf(value)===Object.prototype) {
    return Object.fromEntries(Object.keys(value).sort().map(k=>[k,sorted(value[k])]));
  }
  return value;
}
function fingerprint(data) {
  return JSON.stringify(sorted({
    obtainedMap:data.obtainedMap,captureDataMap:data.captureDataMap,
    duplicateCaptures:data.duplicateCaptures,collectionResetVersion:data.collectionResetVersion,
    updatedAt:data.updatedAt
  }));
}
function checkReady() {
  $('copy').disabled=running || !preview || !$('confirm-copy').checked ||
    (preview.origin==='backup' && !$('confirm-backup').checked);
}
function resetPreview() {
  preview=null;
  visible('preview',false);
  visible('step-write',false);
  visible('complete',false);
  $('confirm-copy').checked=false;
  $('confirm-backup').checked=false;
  checkReady();
}
function displayPreview(info,origin,destination) {
  resetPreview();
  const metrics=counts(info);
  preview={info,origin,fingerprint:fingerprint(info)};
  $('stat-owned').textContent=metrics.acquired;
  $('stat-captures').textContent=metrics.captures;
  $('stat-duplicates').textContent=metrics.duplicates;
  $('preview-origin').textContent=origin==='live'?'Firebase, documento atual':'Arquivo JSON selecionado';
  $('preview-updated').textContent=info.updatedAt?'Última gravação na origem: '+new Date(info.updatedAt).toLocaleString('pt-BR'):'Última gravação na origem: data desconhecida';
  $('preview-warning').textContent=origin==='live'
    ? 'A origem será relida e conferida durante a cópia. O documento antigo não será apagado.'
    : 'Atenção: este arquivo é uma cópia local, possivelmente antiga. Só prossiga se tiver certeza de que reflete sua coleção.';
  visible('backup-ack-wrap',origin==='backup');
  const hasProgress=occupied(destination);
  $('destination-status').textContent=hasProgress
    ? '⚠ O perfil de destino já possui dados. A cópia foi bloqueada para não sobrescrevê-los.'
    : '✓ O perfil de destino está vazio ou ainda não foi criado. Podemos copiar sem sobrescrever progresso.';
  visible('preview',true);
  visible('step-write',!hasProgress);
  status(hasProgress?'Destino já contém dados. Não foi alterado.':'Origem e destino conferidos. Leia o resumo e autorize a cópia.','');
}
async function inspectLive() {
  needOwner();
  resetPreview();
  status('Consultando o documento original e verificando sua conta...');
  const [source,target]=await Promise.all([
    getDocFromServer(sourceRef),
    getDocFromServer(destRef)
  ]);
  if (!source.exists()) throw new Error('O documento original não foi encontrado. Nada foi alterado.');
  displayPreview(normalizeCollection(source.data()),'live',target.exists()?target.data():null);
}
async function inspectBackup() {
  needOwner();
  const file=$('backup-file').files?.[0];
  if(!file) throw new Error('Selecione primeiro o arquivo JSON.');
  if(file.size>3*1024*1024) throw new Error('Arquivo maior que 3 MB. Não foi processado.');
  resetPreview();
  status('Conferindo o JSON escolhido e o perfil de destino...');
  const data=normalizeCollection(JSON.parse(await file.text()));
  const target=await getDocFromServer(destRef);
  displayPreview(data,'backup',target.exists()?target.data():null);
}

function working(next) {
  running=next;
  for(const id of ['signin','signout','check-live','check-backup']) $(id).disabled=next;
  checkReady();
}
$('signin-form').addEventListener('submit',async event=>{
  event.preventDefault();
  if (running) return;
  working(true);
  status('Entrando na conta...');
  try {
    const email=$('email').value.trim();
    await signInWithEmailAndPassword(auth,email,$('password').value);
    $('password').value='';
  } catch(error) {fail(error,'Não foi possível entrar');}
  finally {working(false);}
});
$('signout').addEventListener('click',async()=>{
  try{await signOut(auth);}catch(error){fail(error,'Não foi possível sair');}
});
$('check-live').addEventListener('click',async()=>{
  if(running)return;
  working(true);
  try{await inspectLive();}catch(error){resetPreview();fail(error,'Consulta do documento antigo');}
  finally{working(false);}
});
$('check-backup').addEventListener('click',async()=>{
  if(running)return;
  working(true);
  try{await inspectBackup();}catch(error){resetPreview();fail(error,'Leitura do backup');}
  finally{working(false);}
});
$('confirm-copy').addEventListener('change',checkReady);
$('confirm-backup').addEventListener('change',checkReady);

$('copy').addEventListener('click',async()=>{
  if(running || !preview) return;
  try{needOwner();}catch(error){fail(error,'Conta incorreta');return;}
  if (!$('confirm-copy').checked || (preview.origin==='backup'&&!$('confirm-backup').checked)) return;
  const expected=preview;
  const stats=counts(expected.info);
  const originLabel=expected.origin==='live'?'documento atual do Firebase':'cópia JSON local';
  if(!confirm('Copiar '+stats.acquired+' cartas adquiridas, '+stats.captures+' capturas e '+stats.duplicates+
     ' duplicatas de '+originLabel+' para a conta M4caco? O documento original continuará intacto.'))return;
  working(true);
  status('Transferindo dentro de uma transação segura do Firebase...');
  try {
    let copied=null;
    await runTransaction(db,async transaction=>{
      needOwner();
      let sourceData=expected.info;
      if(expected.origin==='live'){
        const source=await transaction.get(sourceRef);
        if(!source.exists())throw new Error('O documento original desapareceu. Nenhuma alteração feita.');
        sourceData=normalizeCollection(source.data());
        if(fingerprint(sourceData)!==expected.fingerprint)throw new Error('A coleção original mudou desde a conferência. Atualize a prévia antes de copiar.');
      }
      const dest=await transaction.get(destRef);
      if(dest.exists() && occupied(dest.data()))throw new Error('O perfil de destino já contém dados. Migração bloqueada para protegê-los.');
      const transfer={
        obtainedMap:sourceData.obtainedMap,
        captureDataMap:sourceData.captureDataMap,
        duplicateCaptures:sourceData.duplicateCaptures,
        collectionResetVersion:sourceData.collectionResetVersion,
        nickname:'M4caco',migratedLegacy:true,
        migratedAt:serverTimestamp(),updatedAt:serverTimestamp()
      };
      if(sourceData.updatedAt)transfer.legacySourceUpdatedAt=sourceData.updatedAt;
      transaction.set(destRef,transfer,{merge:true});
      copied=sourceData;
    },{maxAttempts:3});
    status('Cópia gravada. Conferindo todos os registros diretamente no Firebase...');
    const verified=await getDocFromServer(destRef);
    const actual=verified.data()||{};
    if(!verified.exists() || actual.migratedLegacy!==true ||
       fingerprint({...actual,updatedAt:copied.updatedAt})!==fingerprint(copied)) {
      throw new Error('A gravação foi realizada, mas a conferência completa não passou. Não repita a operação; verifique o documento de destino.');
    }
    resetPreview();
    visible('step-data',false);
    visible('complete',true);
    $('done-meta').textContent=stats.acquired+' cartas adquiridas · '+stats.captures+' capturas · '+stats.duplicates+' duplicatas.';
    status('✓ Migração concluída e verificada! Sua coleção original foi preservada.','success');
  } catch(error){
    fail(error,'Migração');
  } finally {working(false);}
});

onAuthStateChanged(auth,user=>{
  current=user;
  resetPreview();
  if (user && !owner(user)) {
    visible('signin-form',false);
    visible('signed-in',true);
    visible('step-data',false);
    $('account-email').textContent=user.email||'(sem e-mail)';
    status('Esta conta não corresponde à conta M4caco autorizada. Clique em Sair e entre com a conta correta.','error');
    return;
  }
  visible('signin-form',!user);
  visible('signed-in',!!user);
  visible('step-data',!!user);
  if(user){
    $('account-email').textContent=user.email||'';
    $('destination-path').textContent=DEST_PATH;
    status('Conta M4caco reconhecida. Clique em “Verificar coleção atual no Firebase”.');
  }else{
    status('Entre na sua conta M4caco para começar. Nenhum dado será modificado sem sua confirmação.');
  }
},error=>fail(error,'Falha ao verificar a sessão'));
