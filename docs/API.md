# API Reference - Achou App

## 📚 Documentação de APIs

Documentação das principais funções e serviços da aplicação.

---

## 🔐 authService.ts

Service layer para autenticação e gerenciamento de usuário.

### Tipos

```typescript
interface UserProfile {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  isPremium: boolean;
  createdAt: string;
}

interface AuthResult {
  success: boolean;
  userData?: UserProfile;
  user?: User;
  uid?: string;
  error?: string;
}

interface ProfileResult {
  success: boolean;
  data?: UserProfile;
  error?: string;
}
```

### Funções

#### `registerWithEmail(email, password, userData)`

Registra novo usuário com email e senha.

**Parâmetros:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `email` | `string` | Email do usuário |
| `password` | `string` | Senha (mín. 6 caracteres) |
| `userData` | `Omit<UserProfile, 'createdAt'>` | Dados adicionais (name, phone, cpf, isPremium) |

**Retorno:**
```typescript
{
  success: true,
  userData: UserProfile,
  uid: string
} | {
  success: false,
  error: string
}
```

**Exemplo:**
```typescript
const result = await registerWithEmail(
  'usuario@example.com',
  'senha123',
  {
    name: 'João Silva',
    phone: '(11) 98765-4321',
    cpf: '12345678901',
    isPremium: false
  }
);

if (result.success) {
  console.log('Usuário criado:', result.userData);
} else {
  console.error('Erro:', result.error);
}
```

**Erros Possíveis:**
- `auth/email-already-in-use` - Email já registrado
- `auth/weak-password` - Senha muito fraca
- `auth/invalid-email` - Email inválido

---

#### `loginWithEmail(email, password)`

Autentica usuário com email e senha.

**Parâmetros:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `email` | `string` | Email do usuário |
| `password` | `string` | Senha |

**Retorno:**
```typescript
{
  success: true,
  userData: UserProfile
} | {
  success: false,
  error: string
}
```

**Exemplo:**
```typescript
const result = await loginWithEmail('usuario@example.com', 'senha123');

if (result.success) {
  console.log('Login bem-sucedido:', result.userData);
  navigateTo('T1');
} else {
  Alert.alert('Erro', result.error);
}
```

**Erros Possíveis:**
- `auth/user-not-found` - Usuário não existe
- `auth/wrong-password` - Senha incorreta
- `auth/invalid-email` - Email inválido

---

#### `logout()`

Faz logout do usuário autenticado.

**Parâmetros:** Nenhum

**Retorno:** `Promise<void>`

**Exemplo:**
```typescript
await logout();
setIsLoggedIn(false);
setUserProfile(null);
navigateTo('T3');
```

---

#### `subscribeToAuthState(callback)`

Listener para mudanças no estado de autenticação do Firebase.

**Parâmetros:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `callback` | `(user: User \| null) => Promise<void>` | Função chamada quando auth muda |

**Retorno:** `() => void` - Função para unsubscribe

**Exemplo:**
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

  return () => unsubscribe?.(); // Cleanup
}, []);
```

**Quando é chamado:**
- Usuário faz login
- Usuário faz logout
- App inicia (se usuário estava logado)

---

#### `getUserProfile(uid)`

Busca perfil de usuário no Firestore.

**Parâmetros:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `uid` | `string` | UID do usuário no Firebase Auth |

**Retorno:**
```typescript
UserProfile | null
```

**Exemplo:**
```typescript
const profile = await getUserProfile('uid123');

if (profile) {
  console.log('Nome:', profile.name);
  console.log('Email:', profile.email);
} else {
  console.log('Perfil não encontrado');
}
```

**Exceções:**
- Lança erro se Firestore indisponível

---

#### `updateUserProfile(uid, data)`

Atualiza perfil de usuário no Firestore.

**Parâmetros:**
| Param | Tipo | Descrição |
|-------|------|-----------|
| `uid` | `string` | UID do usuário |
| `data` | `Partial<UserProfile>` | Campos a atualizar |

**Retorno:** `Promise<void>`

**Exemplo:**
```typescript
await updateUserProfile('uid123', {
  name: 'Novo Nome',
  phone: '(11) 99999-9999'
});

// Documento é atualizado com merge (não sobrescreve)
```

**Nota:** Usa `setDoc` com `{ merge: true }`, preservando campos não especificados

---

## 🎨 useTheme Hook

Hook customizado para acessar tema (cores, spacing, fonts).

### Tipo

```typescript
interface Theme {
  colors: {
    background: string;
    formBackground: string;
    formBorder: string;
    formLabel: string;
    formTitle: string;
    formInputBg: string;
    formLink: string;
    text: string;
    success: string;
    error: string;
    muted: string;
    // mais cores...
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  fontSize: {
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}
```

### Uso

```typescript
const { colors, spacing, fontSize, borderRadius } = useTheme();

<View style={{
  backgroundColor: colors.background,
  padding: spacing.md,
  borderRadius: borderRadius.lg
}}>
  <Text style={{
    color: colors.text,
    fontSize: fontSize.base
  }}>
    Texto
  </Text>
</View>
```

---

## 🧭 AppContext

Context global da aplicação com tipos e funções.

### Tipos Principais

```typescript
interface Business {
  id: number;
  name: string;
  categories: string[];
  location: string;
  cep: string;
  phone: string;
  whatsapp: string;
  description: string;
  image: any;
  lat: number;
  lon: number;
  instagram?: string;
  facebook?: string;
  pinterest?: string;
}

interface AppContextType {
  // Navegação
  navigateTo: (screen: string) => void;
  navigateBack: () => void;
  currentScreen: string;

  // Autenticação
  isLoggedIn: boolean;
  userProfile: UserProfile | null;
  setIsLoggedIn: (value: boolean) => void;
  setUserProfile: (profile: UserProfile | null) => void;

  // Dados
  selectedBusiness: Business | null;
  setSelectedBusiness: (business: Business | null) => void;
  favorites: number[];
  setFavorites: (favorites: number[]) => void;
  toggleFavorite: (id: number) => void;

  // Tema
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}
```

### Uso

```typescript
const {
  navigateTo,
  isLoggedIn,
  userProfile,
  setIsLoggedIn
} = useAppContext();

if (!isLoggedIn) {
  navigateTo('T3'); // Redirecionar para login
}
```

### Funções Principais

#### `navigateTo(screen: string)`
Navega para tela específica
```typescript
navigateTo('T1'); // Home
navigateTo('T2'); // Cadastro
navigateTo('T3'); // Login
```

#### `toggleFavorite(id: number)`
Adiciona-remove negócio dos favoritos
```typescript
toggleFavorite(123);
// Se 123 estava nos favoritos, remove
// Se não estava, adiciona
```

---

## 📱 Components

### Button

```typescript
interface ButtonProps {
  onPress: () => void;
  children?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

<Button onPress={() => console.log('Clicado')}>
  <Text>Clique</Text>
</Button>
```

### Input

```typescript
interface InputProps extends TextInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
}

<Input
  placeholder="Digite..."
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
/
```

### Label

```typescript
interface LabelProps extends TextProps {
  children: string;
}

<Label>Email</Label>
```

### Dialog

```typescript
interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

<Dialog visible={showDialog} onClose={() => setShowDialog(false)} title="Confirmar">
  Deseja continuar?
</Dialog>
```

---

## 🔄 Padrões de Resposta

### Padrão Success/Error

```typescript
// Sucesso
{
  success: true,
  data: {...}
}

// Erro
{
  success: false,
  error: "Mensagem de erro"
}
```

### Padrão Async/Await

```typescript
try {
  const result = await minhaFuncao();
  if (result.success) {
    // processar sucesso
  } else {
    console.error(result.error);
  }
} catch (error) {
  console.error('Erro inesperado:', error);
}
```

---

## ⚠️ Tratamento de Erros

### Firebase Errors

```typescript
try {
  await registerWithEmail(email, password, userData);
} catch (error) {
  const authError = error as AuthError;
  
  switch (authError.code) {
    case 'auth/email-already-in-use':
      Alert.alert('Erro', 'Email já cadastrado');
      break;
    case 'auth/weak-password':
      Alert.alert('Erro', 'Senha muito fraca');
      break;
    default:
      Alert.alert('Erro', authError.message);
  }
}
```

### Firestore Errors

```typescript
try {
  const profile = await getUserProfile(uid);
} catch (error) {
  const firestoreError = error as FirestoreError;
  console.error(`[${firestoreError.code}]`, firestoreError.message);
  
  // Tratamento específico por código
  if (firestoreError.code === 'permission-denied') {
    Alert.alert('Erro', 'Sem permissão para acessar dados');
  }
}
```

---

## 📖 Exemplo Completo: Fluxo de Login

```typescript
import React, { useState } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { loginWithEmail } from '../src/services/authService';
import { useAppContext } from '../context/AppContext';

export default function LoginScreen() {
  const { setIsLoggedIn, setUserProfile, navigateTo } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Email e senha obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithEmail(email, password);

      if (result.success && result.userData) {
        setUserProfile(result.userData);
        setIsLoggedIn(true);
        Alert.alert('Sucesso', 'Login realizado!');
        navigateTo('T1');
      } else {
        Alert.alert('Erro', result.error || 'Login falhou');
      }
    } catch (error) {
      console.error('[LoginScreen]', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        editable={!loading}
      />
      <Input
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      <Button onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator /> : <Text>Entrar</Text>}
      </Button>
    </>
  );
}
```

---

**Última atualização**: 11/01/2026
