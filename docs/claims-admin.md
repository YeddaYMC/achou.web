# Claims de Admin — Resumo Técnico

## O que é um Claim?

**Claim** = informação adicional armazenada no token JWT do usuário. Ex.: `admin: true`.  
- Gerada pelo **servidor** (Firebase Admin SDK).
- Lida pelo **cliente** (app) via `getIdTokenResult()`.
- Não pode ser alterada pelo usuário (seguro).

## Como Implementar

### 1. Atribuir Claim ao Usuário (servidor)

```javascript
// Firebase Admin SDK (Node.js/Cloud Function)
const admin = require('firebase-admin');

await admin.auth().setCustomUserClaims(uid, { admin: true });
```

### 2. Verificar Claim no App (cliente)

```typescript
// authService.ts
export async function isUserAdmin(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  
  const idToken = await user.getIdTokenResult();
  return !!idToken.claims?.admin;
}
```

### 3. Usar no Componente

```typescript
// AppContext.tsx ou screen
const isAdmin = await isUserAdmin();
if (!isAdmin) {
  // Não renderiza componente admin
  return null;
}
return <AdminPanel />;
```

### 4. Bloquear Rota

```typescript
// RootNavigator.tsx
if (!isAdmin) {
  // Redireciona para home em vez de exibir tela admin
  return <RootStack.Screen name="Home" component={HomeScreen} />;
}
return <RootStack.Screen name="AdminDashboard" component={AdminDashboard} />;
```

### 5. Proteger Cloud Function

```typescript
// functions/src/index.ts
export const deleteAnnouncement = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Acesso negado');
  }
  // Lógica da função...
});
```

### 6. Regras Firestore

```firestore
function administrador() {
  return request.auth.token.admin == true;
}

match /denuncias/{denunciaId} {
  allow read, update, delete: if administrador();
}
```

## OBS — Pontos Críticos

- **Claim é atribuída pelo servidor:** use Firebase Admin SDK, nunca no app.
- **Token expira em ~1h:** após alterar claim, usuário precisa fazer login de novo ou chamar `getIdToken(true)` para renovar.
- **UI sem segurança:** checagem no app é só visual; o real bloqueio vem das **regras Firestore + Cloud Functions**.
- **Sincronização:** sempre que alterar claims, notifique o app para atualizar UI imediatamente.

## Fluxo Completo de Segurança

```
1. Admin atribui claim ao usuário (Admin SDK)
2. Usuário faz login ou renova token
3. App checa isUserAdmin() → oculta/bloqueia UI
4. Se tentar chamar Cloud Function sem claim → erro no servidor
5. Se tentar acessar Firestore sem permissão → regras bloqueiam
```
