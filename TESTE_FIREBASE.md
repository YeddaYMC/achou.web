# Guia de Testes - Integração Firebase

## Status de Implementação ✅

### Completo
- ✅ Firebase Console configurado (projeto: achou-android)
- ✅ Autenticação Email/Password ativa
- ✅ Firestore Database em modo produção
- ✅ google-services.json com SHA-1 registrado
- ✅ firebaseConfig.js inicializado
- ✅ authService.ts com todas as funções de auth
- ✅ t3-login.tsx integrado com Firebase
- ✅ t2-cadastro.tsx integrado com Firebase
- ✅ AppContext sincronizado com Firebase Auth

---

## Fluxo de Testes

### 1️⃣ Teste de Cadastro (Sign Up)

**Tela**: T2 - Cadastro
**Passos**:
1. Navegue para a tela de cadastro
2. Preencha os campos:
   - Nome: "João Silva"
   - Email: "joao@example.com"
   - CPF: "12345678901"
   - Telefone: "(11) 98765-4321"
   - Senha: "senha123"
3. Aceite os termos LGPD
4. Clique em "CRIAR CONTA"

**Resultado Esperado**:
- ✅ Loading indicator aparece durante envio
- ✅ Alerta "Sucesso: Conta criada com sucesso!"
- ✅ Redirecionamento automático para T1 (Home)
- ✅ Usuário autenticado (AppContext.isLoggedIn = true)
- ✅ Dados salvos em Firestore (collection: users)

**Validações Testadas**:
- ✅ CPF com menos de 11 dígitos → Erro
- ✅ Senha com menos de 6 caracteres → Erro
- ✅ Termos não aceitos → Desabilita botão
- ✅ Email duplicado → Erro do Firebase (uid already exists)

---

### 2️⃣ Teste de Login (Sign In)

**Tela**: T3 - Login
**Passos**:
1. Navegue para a tela de login
2. Preencha os campos:
   - Email: "joao@example.com"
   - Senha: "senha123"
3. Clique em "ENTRAR"

**Resultado Esperado**:
- ✅ Loading indicator aparece durante autenticação
- ✅ Alerta "Sucesso: Login realizado com sucesso!"
- ✅ Redirecionamento automático para T1 (Home)
- ✅ Usuário autenticado (AppContext.isLoggedIn = true)
- ✅ Perfil carregado do Firestore

**Validações Testadas**:
- ✅ Email incorreto → Erro "E-mail ou senha incorretos"
- ✅ Senha incorreta → Erro com opção de ir para cadastro
- ✅ Email não registrado → Erro com opção de criar conta

---

### 3️⃣ Teste de Persistência de Sessão

**Cenário**: Fechar e reabrir o aplicativo

**Passos**:
1. Faça login com sucesso
2. Feche completamente o aplicativo
3. Reabra o aplicativo
4. Navegue até a tela inicial (T1)

**Resultado Esperado**:
- ✅ Usuário continua logado
- ✅ AppContext.isLoggedIn = true
- ✅ Perfil do usuário carregado automaticamente via subscribeToAuthState
- ✅ Nenhuma tela de login/cadastro é mostrada

**Como Funciona**:
```typescript
// AppContext.tsx - useEffect sincroniza com Firebase
useEffect(() => {
  const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid);
      setUserProfile(profile);
      setIsLoggedIn(true);
    }
  });
  return () => unsubscribe?.();
}, []);
```

---

### 4️⃣ Teste de Logout

**Tela**: Qualquer tela autenticada (necessário implementar botão de logout)

**Passos**:
1. [TODO] Encontre o botão de logout
2. Clique em "Sair" ou "Logout"

**Resultado Esperado**:
- ✅ Usuário deslogado (isLoggedIn = false)
- ✅ Redirecionamento para T3 (Login)
- ✅ Firebase Auth state limpo

---

## Dados de Teste

### Conta Válida (Criada no Firebase Console)
```
Email: test@achou.com
Senha: Test123!
Nome: Usuário Teste
```

### Emails para Cadastro de Teste
```
joao@example.com
maria@example.com
pedro@test.com
ana@example.com
```

---

## Estrutura de Dados no Firestore

### Collection: users/{uid}
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "(11) 98765-4321",
  "cpf": "12345678901",
  "isPremium": false,
  "createdAt": "2026-01-06T10:30:00Z"
}
```

---

## Troubleshooting

### ❌ Erro: "Não é possível localizar o módulo './firebaseConfig'"
**Solução**:
- Verificar que o arquivo `firebaseConfig.js` está na raiz do projeto
- Verificar o import em `authService.ts`:
  ```typescript
  import app from '../../firebaseConfig.js';
  ```

### ❌ Erro: "Firebase not initialized"
**Solução**:
- Garantir que `firebaseConfig.js` é importado antes de usar auth/firestore
- Verificar que `initializeApp()` é chamado no `firebaseConfig.js`

### ❌ Erro: "User with email already exists"
**Esperado**: Ao tentar cadastrar com email que já existe
**Solução**: Use outro email ou delete a conta no Firebase Console

### ❌ Erro: "Invalid CPF format"
**Esperado**: CPF com menos de 11 dígitos
**Solução**: Insira um CPF válido com 11 dígitos

### ❌ Erro: "Falha ao criar conta" (sem mensagem específica)
**Possível Causa**: Firestore rules muito restritivas
**Solução**: Verificar no Firebase Console → Firestore → Rules

---

## Arquivos Relacionados

- 📄 [firebaseConfig.js](firebaseConfig.js) - Inicialização Firebase
- 📄 [src/services/authService.ts](src/services/authService.ts) - Service layer
- 📄 [context/AppContext.tsx](context/AppContext.tsx) - State + sincronização
- 📄 [screens/t3-login.tsx](screens/t3-login.tsx) - Tela login
- 📄 [screens/t2-cadastro.tsx](screens/t2-cadastro.tsx) - Tela cadastro
- 📄 [google-services.json](google-services.json) - Config Android

---

## Comandos Úteis

### Compilar e testar
```bash
npm run android  # Expo - Android
npm run ios      # Expo - iOS
npm run web      # Expo - Web
```

### Verificar erros TypeScript
```bash
npx tsc --noEmit
```

### Limpar cache
```bash
npx expo start --clear
```

---

## Próximos Passos

- [ ] Implementar Google Sign-In
- [ ] Adicionar botão de logout na UI
- [ ] Migrar negócios para Firestore (remover mockData)
- [ ] Implementar upload de imagens
- [ ] Tela de edição de perfil
- [ ] Sistema de favoritos com Firestore
- [ ] Sistema de reportes
