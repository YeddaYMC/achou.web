# Arquitetura - Achou App

## 📐 Visão Geral

Achou App segue um padrão **Context-based MVC** com separação clara entre apresentação, lógica de negócio e integração externa.

```
┌────────────────────────────────┐
│  Screens (UI / Presentation)   │
│  (t1-home, t2-signup, t3-login)│
└──────────┬─────────────────────┘
           │ useAppContext()
           ▼
┌────────────────────────────────┐
│  Context API + React Hooks     │
│  (AppContext, useTheme)        │
└──────────┬─────────────────────┘
           │ importa/chama
           ▼
┌────────────────────────────────┐
│  Service Layer (Business Logic)│
│  (authService.ts)              │
└──────────┬─────────────────────┘
           │ chama
           ▼
┌────────────────────────────────┐
│  External APIs (Firebase)      │
│  (Auth, Firestore, Storage)    │
└────────────────────────────────┘
```

---

## 🎯 Camadas

### 1. **Presentation Layer** (Screens)

**Responsabilidade**: Renderizar UI e capturar interações do usuário

**Arquivos**:
- `screens/t1-tela-inicial.tsx` - Home
- `screens/t2-cadastro.tsx` - Sign Up
- `screens/t3-login.tsx` - Login
- `screens/t4-detalhes-negocio.tsx` - Business Details
- Etc.

**Características**:
- Components funcionais com React Hooks
- Props tipadas com TypeScript
- Uso de `useAppContext()` para state
- Uso de `useTheme()` para styling
- Lógica mínima (apenas UI)

**Exemplo**:
```typescript
export default function t2CadastroScreen() {
  const { navigateTo, setIsLoggedIn, setUserProfile } = useAppContext();
  const { colors, spacing } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const result = await registerWithEmail(email, password, userData);
    if (result.success) {
      setIsLoggedIn(true);
      setUserProfile(result.userData);
      navigateTo('T1');
    }
    setLoading(false);
  };

  return <LayoutRN>...</LayoutRN>;
}
```

### 2. **State Management** (Context API)

**Responsabilidade**: Gerenciar estado global da aplicação

**Arquivo**: `context/AppContext.tsx`

**Tipos Gerenciados**:
```typescript
interface AppContextType {
  // Autenticação
  isLoggedIn: boolean;
  userProfile: UserProfile | null;
  setIsLoggedIn: (value: boolean) => void;
  setUserProfile: (profile: UserProfile | null) => void;

  // Navegação
  currentScreen: string;
  navigateTo: (screen: string) => void;
  navigateBack: () => void;

  // Dados
  selectedBusiness: Business | null;
  favorites: number[];
  toggleFavorite: (id: number) => void;

  // Tema
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}
```

**Sincronização Firebase**:
```typescript
useEffect(() => {
  const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid);
      setUserProfile(profile);
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
      setUserProfile(null);
    }
  });
  return () => unsubscribe?.();
}, []);
```

**Listener**:
- Automático: quando Firebase Auth muda, AppContext sincroniza
- Persistente: sessão mantém entre recarregamentos do app
- Reativo: componentes re-renderizam quando estado muda

### 3. **Business Logic** (Services)

**Responsabilidade**: Implementar regras de negócio e chamar APIs externas

**Arquivo**: `src/services/authService.ts`

**Funções Principais**:

#### `registerWithEmail(email, password, userData)`
```typescript
export async function registerWithEmail(
  email: string,
  password: string,
  userData: Omit<UserProfile, 'createdAt'>
): Promise<{ success: boolean; userData?: UserProfile; error?: string }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Salvar perfil em Firestore
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      email,
      createdAt: new Date().toISOString(),
    });

    return { success: true, userData: {...userData, email, createdAt: ...} };
  } catch (error) {
    const authError = error as AuthError;
    return { success: false, error: authError.message };
  }
}
```

#### `loginWithEmail(email, password)`
```typescript
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; userData?: UserProfile; error?: string }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(userCredential.user.uid);
    return { success: true, userData: profile };
  } catch (error) {
    return { success: false, error: (error as AuthError).message };
  }
}
```

#### `subscribeToAuthState(callback)`
```typescript
export function subscribeToAuthState(
  callback: (user: User | null) => Promise<void>
): () => void {
  return onAuthStateChanged(auth, callback);
}
```

**Padrão de Retorno**:
- `{ success: true, userData }` → operação bem-sucedida
- `{ success: false, error: string }` → erro com mensagem

### 4. **External Services** (Firebase)

**Responsabilidade**: Comunicação com backends

**Serviços**:
- **Firebase Authentication** (Email/Password, Google)
- **Firestore Database** (Dados de usuário, negócios, favoritos)
- **Firebase Storage** (Imagens)

**Configuração**: `firebaseConfig.js`
```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "achou-android.firebaseapp.com",
  projectId: "achou-android",
  // ...
};
const app = initializeApp(firebaseConfig);
```

---

## 📊 Fluxo de Dados

### Fluxo 1: Cadastro (Sign Up)

```
Usuário preenche form em t2-cadastro.tsx
         ↓
Clica "CRIAR CONTA"
         ↓
handleSubmit() chama registerWithEmail()
         ↓
registerWithEmail():
  - Cria usuário em Firebase Auth
  - Salva perfil em Firestore (collection: users/{uid})
  - Retorna { success: true, userData }
         ↓
handleSubmit() chama setIsLoggedIn(true) + setUserProfile()
         ↓
AppContext atualiza
         ↓
Componentes observam mudança
         ↓
Redireciona para T1 (home)
```

### Fluxo 2: Login (Sign In)

```
Usuário preenche form em t3-login.tsx
         ↓
Clica "ENTRAR"
         ↓
handleSubmit() chama loginWithEmail()
         ↓
loginWithEmail():
  - Autentica em Firebase Auth
  - Busca perfil em Firestore
  - Retorna { success: true, userData }
         ↓
handleSubmit() chama setIsLoggedIn(true) + setUserProfile()
         ↓
AppContext atualiza
         ↓
Redireciona para T1 (home)
```

### Fluxo 3: Persistência de Sessão

```
Usuário faz login (firebase.auth().currentUser existe)
         ↓
Fecha app
         ↓
Reabre app
         ↓
AppContext useEffect executa subscribeToAuthState()
         ↓
subscribeToAuthState() detecta usuário já autenticado
         ↓
Chama callback(firebaseUser)
         ↓
Busca perfil em Firestore
         ↓
setUserProfile() + setIsLoggedIn(true)
         ↓
Usuário já logado, acesso permitido a T1
```

---

## 🧩 Componentes Principais

### AppContext

**Responsabilidade**: Estado global

**Uso**:
```typescript
const { isLoggedIn, userProfile, navigateTo } = useAppContext();
```

### useTheme Hook

**Responsabilidade**: Tema (cores, spacing, fonts)

**Uso**:
```typescript
const { colors, spacing, fontSize, borderRadius } = useTheme();

// Aplicar ao View
<View style={{ backgroundColor: colors.background, padding: spacing.md }} />
```

### Components UI

**Responsabilidade**: Componentes reutilizáveis

**Exemplos**:
- `Button.tsx` - Botão customizado
- `Input.tsx` - Input customizado
- `Label.tsx` - Label customizado
- `Dialog.tsx` - Modal/Dialog

**Padrão**:
```typescript
interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onPress, disabled = false }: ButtonProps) {
  return <TouchableOpacity onPress={onPress} disabled={disabled}>
    <Text>{label}</Text>
  </TouchableOpacity>;
}
```

### Layout-RN

**Responsabilidade**: Wrapper de layout

**Características**:
- Header com gradiente
- Footer com navegação
- Safe area handling
- Tema automático

**Uso**:
```typescript
<LayoutRN>
  <View>{conteúdo}</View>
</LayoutRN>
```

---

## 🔄 Padrões de Design

### 1. **Controlado por Context**
- AppContext é source of truth
- Componentes leem de context
- Componentes callam actions que atualizam context

### 2. **Async/Await com Try-Catch**
```typescript
try {
  const result = await registerWithEmail(email, password, userData);
  if (result.success) {
    // sucesso
  } else {
    Alert.alert('Erro', result.error);
  }
} catch (error) {
  console.error(error);
}
```

### 3. **Loading State**
```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    // operação async
  } finally {
    setLoading(false);
  }
};

// UI
<ActivityIndicator animating={loading} />
<Button disabled={loading} />
```

### 4. **Tipagem Explícita**
```typescript
const handleLogin = async (email: string, password: string): Promise<void> => {
  const result: LoginResult = await loginWithEmail(email, password);
  if (result.success && result.userData) {
    // ...
  }
};
```

---

## 🗄️ Banco de Dados (Firestore)

### Collections

#### `users/{uid}`
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "(11) 98765-4321",
  "cpf": "12345678901",
  "isPremium": false,
  "createdAt": "2026-01-11T10:30:00Z"
}
```

#### `businesses/{businessId}` (Planejado)
```json
{
  "name": "Feira de Artesanato",
  "categories": ["Eventos", "Imperdíveis"],
  "location": "Bairro Centro",
  "description": "...",
  "createdBy": "uid"
}
```

#### `users/{uid}/favorites/{businessId}` (Planejado)
```json
{
  "businessId": "business123",
  "addedAt": "2026-01-11T10:30:00Z"
}
```

### Regras de Segurança

```javascript
// Production (Restritivo)
match /users/{uid} {
  allow read, write: if request.auth.uid == uid;
}

match /businesses/{document=**} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == resource.data.createdBy;
}
```

---

## 🚀 Fluxo de Desenvolvimento

1. **Nova Feature** → branch `feature/nome`
2. **Implementar** em screens + services
3. **Atualizar AppContext** se novo state
4. **Testar** localmente (web/android)
5. **Commit** com padrão conventionalcommits
6. **Pull Request** com descrição

---

## 📈 Escalabilidade

### Próximos Passos

- [ ] Migrar negócios para Firestore
- [ ] Google Sign-In
- [ ] Upload de imagens
- [ ] Paginação de dados
- [ ] Offline support (Firestore offline)
- [ ] Real-time updates (Firestore listeners)

### Performance

- Context re-render: otimizar com useMemo
- List rendering: usar FlatList com key
- Images: lazy load com Image cache
- Navigation: usar stack navigator eficiente

---

**Última atualização**: 11/01/2026
