# Padrões de Desenvolvimento - Achou App

Guia com padrões de código, workflow de git e processo de desenvolvimento.

---

## 📋 Índice

- [Padrões de Código](#padrões-de-código)
- [Workflow de Git](#workflow-de-git)
- [Processo de Pull Request](#processo-de-pull-request)
- [Checklists](#checklists)

---

## 🎨 Padrões de Código

### TypeScript

**Sempre use tipos explícitos:**
```typescript
// ❌ Ruim
const handleSubmit = async (data) => {
  const result = await apiCall(data);
  return result;
};

// ✅ Bom
const handleSubmit = async (data: FormData): Promise<Result> => {
  const result = await apiCall(data);
  return result;
};
```

**Interfaces para dados estruturados:**
```typescript
// ❌ Ruim
function getUserData(id: string): any {
  return { name: 'John', email: 'john@example.com' };
}

// ✅ Bom
interface User {
  name: string;
  email: string;
  createdAt: string;
}

function getUserData(id: string): Promise<User> {
  // implementação
}
```

**Type guards:**
```typescript
// ✅ Bom
if (result.success && result.userData) {
  console.log(result.userData.name); // userData é garantidamente não-null
}
```

### React Components

**Functional components com hooks:**
```typescript
// ❌ Ruim - Class component
class MyComponent extends React.Component {
  render() {
    return <View>{this.props.children}</View>;
  }
}

// ✅ Bom - Functional component
interface MyComponentProps {
  title: string;
  onPress: () => void;
}

export function MyComponent({ title, onPress }: MyComponentProps) {
  return <TouchableOpacity onPress={onPress}>
    <Text>{title}</Text>
  </TouchableOpacity>;
}
```

**Props com interface:**
```typescript
interface ScreenProps {
  route?: RouteProp<RootStackParamList, 'T1'>;
  navigation?: NavigationProp<RootStackParamList>;
}

export default function ScreenName(props: ScreenProps) {
  // implementação
}
```

**Componentes pequenos e focados:**
```typescript
// ❌ Ruim - Componente grande
export function BusyScreen() {
  return (
    <View>
      <Header title="Home" />
      <FlatList data={...} />
      <Footer />
    </View>
  );
}

// ✅ Bom - Componentes separados
export function HomeScreen() {
  return (
    <LayoutRN>
      <BusinessList />
    </LayoutRN>
  );
}

interface BusinessListProps {
  onSelectBusiness: (id: number) => void;
}

function BusinessList({ onSelectBusiness }: BusinessListProps) {
  // componente focado
}
```

### Convenções de Nomes

```typescript
// Variáveis: camelCase
const userName = 'João';
const isLoading = false;

// Tipos/Interfaces: PascalCase
interface UserProfile { }
type LoginResult = { success: boolean };

// Constantes: UPPER_SNAKE_CASE
const MAX_ATTEMPTS = 3;
const API_TIMEOUT = 5000;

// Funções: camelCase
async function loginWithEmail() { }
const handleSubmit = () => { };

// Componentes React: PascalCase
function MyButton() { }
export default function LoginScreen() { }

// Telas: t{numero}-descricao.tsx
// t1-tela-inicial.tsx
// t2-cadastro.tsx
// t3-login.tsx

// Booleans: is/has prefix
const isLoading = true;
const hasError = false;
const isAuthenticated = false;

// Funções assíncas que buscam dados: get/fetch prefix
async function getUserProfile(uid: string) { }
async function fetchBusinesses() { }

// Event handlers: on{Event} prefix
const onPress = () => { };
const onChangeText = (text: string) => { };
const onSubmit = async () => { };
```

### Organização de Código

**Ordem de imports:**
```typescript
// 1. React/React Native
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';

// 2. Bibliotecas externas
import { useNavigation } from '@react-navigation/native';

// 3. Relativos ao projeto
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/ui/button';
import { loginWithEmail } from '../src/services/authService';

// 4. Estilos/tipos
import { styles } from './styles';
import type { ScreenProps } from '../types';
```

**Ordem de declarações em componente:**
```typescript
interface ComponentProps { }

export default function Component(props: ComponentProps) {
  // 1. Hooks
  const navigation = useNavigation();
  const { navigateTo } = useAppContext();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  // 2. Funções
  const handleSubmit = async () => { };
  const validateInput = (input: string): boolean => { };

  // 3. Effects
  useEffect(() => {
    // setup
  }, []);

  // 4. Render
  return <View>...</View>;
}

// 5. Styles (se não em arquivo separado)
const styles = StyleSheet.create({ });
```

### Documentação de Código

**JSDoc para funções públicas:**
```typescript
/**
 * Autentica usuário com email e senha.
 * 
 * @param email - Email do usuário
 * @param password - Senha (mín. 6 caracteres)
 * @returns Resultado da autenticação com dados do usuário ou erro
 * @throws Pode lançar erro se Firestore indisponível
 * 
 * @example
 * ```
 * const result = await loginWithEmail('user@example.com', 'password123');
 * if (result.success) {
 *   console.log(result.userData);
 * }
 * ```
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  // implementação
}
```

**Comentários para lógica complexa:**
```typescript
// ✅ Bom: explicar por que, não o que
const handleLogin = async () => {
  // Validar email antes de chamar Firebase para evitar requests desnecessárias
  if (!isValidEmail(email)) {
    return;
  }

  const result = await loginWithEmail(email, password);
  // ...
};

// ❌ Ruim: comentário óbvio
const handleLogin = async () => {
  // Chamar loginWithEmail
  const result = await loginWithEmail(email, password);
  // ...
};
```

---

## 🔄 Workflow de Git

### Commits com Conventional Commits

Padrão: `tipo(escopo): descrição`

**Tipos:**
- `feat:` - Nova feature
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação (sem lógica)
- `refactor:` - Refatoração (sem mudança de behavior)
- `perf:` - Melhoria de performance
- `test:` - Testes
- `chore:` - Tarefas de build/deps

**Exemplos:**
```bash
git commit -m "feat(auth): adicionar login com Firebase"
git commit -m "fix(t2-cadastro): validar CPF com 11 dígitos"
git commit -m "docs(README): atualizar instruções de instalação"
git commit -m "refactor(authService): simplificar error handling"
```

### Branch Naming

```bash
# Feature
git checkout -b feature/adicionar-google-signin

# Bug fix
git checkout -b fix/validacao-cpf-incorreta

# Refactor
git checkout -b refactor/reorganizar-componentes

# Docs
git checkout -b docs/adicionar-arquitetura
```

### Push e Sincronização

```bash
# Sincronizar com upstream
git fetch upstream
git rebase upstream/main

# Push para seu fork
git push origin feature/sua-feature
```

---

## 📤 Processo de Pull Request

### 1. Criar PR no GitHub

**Título:**
```
feat(auth): adicionar validação de senha mais forte
```

**Descrição:**
```markdown
## 📝 Descrição
Adiciona validação de força de senha no formulário de cadastro.

## 🎯 Mudanças
- [ ] Adiciona função `validatePasswordStrength()` em authService.ts
- [ ] Atualiza t2-cadastro.tsx com validação em tempo real
- [ ] Mostra feedback visual de força da senha

## 🧪 Testes
- Testado em navegador (npm run web)
- Testado com senhas fracas/fortes
- Verificado em diferentes resoluções

## 📸 Screenshots (se UI)
[adicione screenshots]

## 🔗 Relacionado
Fixes #123
Relates to #456
```

---

## ✅ Checklists

### Antes de Commitar

- [ ] Código compila sem erros
- [ ] Sem `any` types desnecessários
- [ ] Sem console.logs de debug
- [ ] Variáveis/funções bem nomeadas
- [ ] Imports organizados e usados

### Antes de Push

- [ ] Branch atualizado com upstream
- [ ] Tests locais passam
- [ ] Testado em web, Android, iOS (se possível)
- [ ] Sem conflicts
- [ ] Commits bem estruturados

### Antes de PR

- [ ] Descrição clara e concisa
- [ ] Screenshots (se UI change)
- [ ] Todos os checklist items feitos
- [ ] Documentação atualizada
- [ ] Nenhuma mudança desnecessária

---

## 🐛 Reportar Bugs

### Template de Issue

```markdown
## 🐛 Descrição do Bug
Descrição clara do problema.

## 📝 Passos para Reproduzir
1. Passo 1
2. Passo 2
3. Passo 3

## 🔴 Resultado Esperado
O que deveria acontecer.

## 🟠 Resultado Atual
O que realmente acontece.

## 📱 Ambiente
- OS: Windows/macOS/Linux
- React Native versão: 0.81.0
- Expo versão: 54.0

## 📎 Contexto Adicional
Logs, screenshots, etc.
```

---

## 💡 Sugestões de Features

### Template de Issue

```markdown
## 📋 Descrição
O que você gostaria de adicionar?

## 🎯 Motivação
Por que isso é importante?

## 💻 Solução Proposta
Como você imagina implementando?

## 🤔 Alternativas
Outras abordagens possíveis?

## ✨ Contexto Adicional
Qualquer outra informação útil?
```

---

## 📚 Recursos Úteis

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [React Best Practices](https://react.dev/learn)
- [React Native Docs](https://reactnative.dev/docs/getting-started)

---

**Última atualização**: 11/01/2026
