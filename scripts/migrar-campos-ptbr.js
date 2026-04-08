const admin = require('firebase-admin');

const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const APPLY = process.argv.includes('--apply');

const MAP_USERS = {
  name: 'nome',
  nickname: 'apelido',
  phone: 'telefone',
  createdAt: 'criadoEm',
  favorites: 'favoritos',
  anuncianteLevel: 'nivelAnunciante',
};

const MAP_ANUNCIOS = {
  userId: 'usuarioId',
  userEmail: 'emailUsuario',
  businessId: 'idNegocio',
  name: 'nome',
  category: 'categoria',
  description: 'descricao',
  location: 'localizacao',
  street: 'rua',
  number: 'numero',
  phone: 'telefone',
  whatsapp: 'whatsapp',
  email: 'email',
  site: 'site',
  instagram: 'instagram',
  facebook: 'facebook',
  pinterest: 'pinterest',
  entregaRapida: 'entregaRapida',
  isImperdivel: 'imperdivel',
  contactVisibility: 'visibilidadeContato',
  reportCount: 'totalDenuncias',
  createdAt: 'criadoEm',
  updatedAt: 'atualizadoEm',
  expiresAt: 'expiraEm',
};

function hasField(data, fieldName) {
  return Object.prototype.hasOwnProperty.call(data, fieldName);
}

async function migrarColecao(nomeColecao, mapa) {
  const snap = await db.collection(nomeColecao).get();
  console.log(`\nColeção ${nomeColecao}: ${snap.size} documento(s)`);

  for (const documentSnapshot of snap.docs) {
    const data = documentSnapshot.data();
    const updatePayload = {};
    const changedFields = [];

    for (const [oldKey, newKey] of Object.entries(mapa)) {
      if (!hasField(data, oldKey)) continue;
      if (oldKey === newKey) continue;

      updatePayload[newKey] = data[oldKey];
      updatePayload[oldKey] = admin.firestore.FieldValue.delete();
      changedFields.push(`${oldKey} -> ${newKey}`);
    }

    if (changedFields.length === 0) {
      console.log(`- ${documentSnapshot.id}: sem alterações`);
      continue;
    }

    console.log(`- ${documentSnapshot.id}: ${changedFields.join(', ')}`);

    if (APPLY) {
      await documentSnapshot.ref.update(updatePayload);
      console.log(`  ✔ aplicado`);
    } else {
      console.log(`  (simulação)`);
    }
  }
}

async function run() {
  console.log(APPLY ? 'MODO APLICAR' : 'MODO SIMULAÇÃO');
  await migrarColecao('users', MAP_USERS);
  await migrarColecao('anuncios', MAP_ANUNCIOS);
  console.log('\nConcluído.');
  console.log(APPLY ? 'Migração aplicada no Firestore.' : 'Nada foi alterado. Execute com --apply para aplicar.');
}

run().catch((error) => {
  console.error('\nErro na migração:', error.message);
  process.exit(1);
});
