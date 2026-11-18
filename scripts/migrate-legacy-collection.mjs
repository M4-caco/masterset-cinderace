#!/usr/bin/env node
/**
 * One-time, conservative migration of the OLD shared collection into
 * the Firebase Authentication account supplied by SCORACE_OWNER_UID.
 *
 * Setup (run from a trusted machine, NOT in the browser or Vercel build):
 *   cd scripts && npm install
 *   export GOOGLE_APPLICATION_CREDENTIALS=/private/path/service-account.json
 *   export SCORACE_OWNER_UID=the_uid_from_firebase_authentication
 *   export SCORACE_OWNER_EMAIL=the_verified_owner_email
 *   node scripts/migrate-legacy-collection.mjs             # preview
 *   node scripts/migrate-legacy-collection.mjs --apply     # commit
 *
 * The service account must never be committed to Git.
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const uid = process.env.SCORACE_OWNER_UID;
if (!uid || !/^[A-Za-z0-9_-]{6,128}$/.test(uid)) {
  console.error('Configure SCORACE_OWNER_UID com o UID exato da conta Firebase Auth.');
  process.exit(1);
}
if (uid === 'cinderace_masterset') {
  console.error('O destino precisa ser um UID de usuário, diferente da coleção antiga.');
  process.exit(1);
}
const expectedEmail = (process.env.SCORACE_OWNER_EMAIL || '').trim().toLowerCase();
if (!expectedEmail || !expectedEmail.includes('@')) {
  console.error('Configure SCORACE_OWNER_EMAIL para confirmar o e-mail da conta de destino.');
  process.exit(1);
}
const apply = process.argv.includes('--apply');
const firestore = getFirestore(initializeApp({
  credential: applicationDefault(),
  projectId: 'pokedex-colecao'
}));
const targetUser = await getAuth().getUser(uid);
if ((targetUser.email || '').toLowerCase() !== expectedEmail) {
  throw new Error('O UID não pertence ao e-mail proprietário informado. Operação cancelada.');
}
const originalRef = firestore.doc('users_data/cinderace_masterset');
const targetRef = firestore.doc('users_data/' + uid);
const source = await originalRef.get();
if (!source.exists) {
  throw new Error('O documento original não existe. Nada foi alterado.');
}
const original = source.data();
const obtainedMap = original.obtainedMap || {};
const captureDataMap = original.captureDataMap || {};
const duplicateCaptures = Array.isArray(original.duplicateCaptures) ? original.duplicateCaptures : [];
const exists = await targetRef.get();
const current = exists.exists ? exists.data() : {};
const hasProgress = !!(
  Object.keys(current.obtainedMap || {}).some(key => current.obtainedMap[key])
  || Object.keys(current.captureDataMap || {}).length
  || (current.duplicateCaptures || []).length
);
if (hasProgress) {
  throw new Error('O perfil de destino já contém dados. Exportar e comparar antes de mesclar.');
}
console.log('Coleção original:', {
  acquired: Object.values(obtainedMap).filter(Boolean).length,
  captured: Object.keys(captureDataMap).length,
  duplicates: duplicateCaptures.length,
  destinationExists: exists.exists
});
if (!apply) {
  console.log('MODO PRÉVIA: nada gravado. Use --apply somente após conferir o UID e fazer backup.');
  process.exit(0);
}
await firestore.runTransaction(async transaction => {
  const [legacy, profile] = await Promise.all([
    transaction.get(originalRef), transaction.get(targetRef)
  ]);
  if (!legacy.exists) throw new Error('Documento de origem desapareceu.');
  const existing = profile.exists ? profile.data() : {};
  if ((existing.migratedLegacy || false)
      || Object.values(existing.obtainedMap || {}).some(Boolean)
      || Object.keys(existing.captureDataMap || {}).length
      || (existing.duplicateCaptures || []).length) {
    throw new Error('Destino já migrado ou modificado. Operação cancelada.');
  }
  const old = legacy.data();
  transaction.set(targetRef, {
    obtainedMap: old.obtainedMap || {},
    captureDataMap: old.captureDataMap || {},
    duplicateCaptures: Array.isArray(old.duplicateCaptures) ? old.duplicateCaptures : [],
    nickname: 'M4caco',
    migratedLegacy: true,
    migratedAt: new Date().toISOString(),
    // Keep existing item progress and unrelated fields in the user profile.
    updatedAt: new Date().toISOString()
  }, {merge:true});
});
console.log('Migração concluída. O documento original continua intacto como backup.');
