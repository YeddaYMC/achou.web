# Configuração de Deleção de Imagens no Cloudinary

## Problema

Atualmente, ao excluir um anúncio no app, a imagem **não é removida do Cloudinary** porque falta a configuração do endpoint de backend seguro.

## Por que é necessário?

- **Segurança**: Não é seguro chamar a API de delete do Cloudinary diretamente do app mobile, pois exigiria expor a chave secreta (`API_SECRET`).
- **Solução**: Usar um endpoint backend (ex: Cloud Function, servidor Node.js) que recebe as requisições do app de forma autenticada e deleta as imagens com segurança.

## Solução

### Opção 1: Cloud Function (Recomendado para Firebase)

Crie uma Cloud Function no Firebase que:
1. Autentica o usuário via token Firebase
2. Recebe um array de `publicIds` do Cloudinary
3. Deleta as imagens usando `CLOUDINARY_API_SECRET`
4. Retorna confirmação de sucesso

**Exemplo (Node.js):**

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

exports.deleteCloudinaryImages = functions.https.onCall(async (data, context) => {
  // Verifica autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { publicIds } = data;
  
  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    return { deleted: 0 };
  }

  try {
    const cloudName = 'dkwhytmtk'; // Seu Cloud Name
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const deletePromises = publicIds.map(publicId =>
      axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/by_public_ids`,
        { public_ids: [publicId] },
        { auth: { username: apiKey, password: apiSecret } }
      )
    );

    await Promise.all(deletePromises);
    return { deleted: publicIds.length };
  } catch (error) {
    console.error('Erro ao deletar imagens do Cloudinary:', error);
    throw new functions.https.HttpsError('internal', 'Falha ao deletar imagens');
  }
});
```

### Opção 2: Endpoint HTTP Backend

Se usar um servidor Node.js/Express:

```javascript
app.post('/api/cloudinary/delete', authenticateUser, async (req, res) => {
  const { publicIds } = req.body;
  
  // Autentique e faça a deleção usando CLOUDINARY_API_SECRET
  // Retorne { deleted: count }
});
```

### Opção 3: Configuração Temporária para Teste

Para teste imediato (sem backend), no arquivo `.env.local`:

```env
EXPO_PUBLIC_CLOUDINARY_DELETE_ENDPOINT=http://localhost:3000/api/cloudinary/delete
```

## Próximas Etapas

1. **Escolha a opção** (Recomenda-se Cloud Function)
2. **Implemente o endpoint** com autenticação Firebase
3. **Configure a variável de ambiente**:
   - `.env.local` para desenvolvimento local
   - Variável no Firebase Console para produção

4. **Atualize o código do app** se necessário para passar autenticação

## Referência Atual

- **Arquivo**: `src/services/cloudinaryService.ts`
- **Função**: `deleteCloudinaryImagesByUrls()`
- **Status**: Aguardando `EXPO_PUBLIC_CLOUDINARY_DELETE_ENDPOINT`

---

**Nota**: Até que o endpoint seja configurado, as imagens ficarão no Cloudinary mesmo após excluir o anúncio.
