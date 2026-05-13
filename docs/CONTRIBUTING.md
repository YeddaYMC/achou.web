# Guia de Contribuição - Achou App

Obrigado por considerar contribuir para o Achou App! Este guia explica como participar do desenvolvimento.

---

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Começar](#como-começar)
- [Padrões de Código](#padrões-de-código)
- [Workflow de Git](#workflow-de-git)
- [Processo de Pull Request](#processo-de-pull-request)
- [Checklist](#checklist)

---

## 🤝 Código de Conduta

- Seja respeitoso com outros contribuidores
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Reporte comportamentos problemáticos para os maintainers

---

## 🚀 Como Começar

### 1. Fork o Repositório
```bash
# No GitHub, clique em "Fork"
```

### 2. Clone seu Fork
```bash
git clone https://github.com/seu-usuario/achou-app.git
cd AchouAppRN
```

### 3. Adicionar Remote Upstream
```bash
git remote add upstream https://github.com/usuario-original/achou-app.git
```

### 4. Criar Branch
```bash
git checkout -b feature/sua-feature
# ou
git checkout -b fix/seu-bug
```

### 5. Desenvolver
```bash
npm install
npm run web  # Testar sua mudança
```

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

## ✅ Checklist

- [ ] Código compila sem erros
- [ ] Sem `any` types desnecessários
- [ ] Sem console.logs de debug
- [ ] Variáveis/funções bem nomeadas
- [ ] Imports organizados e usados
