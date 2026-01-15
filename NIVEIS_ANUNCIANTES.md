# Sistema de Níveis de Anunciantes

**Data de Implementação**: 15 de Janeiro de 2026

---

## 📊 Tabela de Regras por Nível

| Recurso | Nível 1 (Gratuito) | Nível 2 (R$ 19,99) | Nível 3 (R$ 29,99) | Nível 4 (R$ 39,99) |
|---------|-------------------|-------------------|-------------------|-------------------|
| **Qtd. Anúncios** | 1 | 1 | 1 | 1 |
| **Fotos** | 1 foto principal | 1 foto principal | 3 fotos | 5 fotos |
| **Destaque "Imperdível"** | ❌ | ❌ | ✅ | ✅ |
| **Visualização** | Após anúncios pagos | Topo da página | Topo da página | Topo da página |
| **Divulgações no Detalhe** | — | — | 3 | 5 |
| **Múltiplas Categorias** | 1 categoria | 1+ categorias | 1+ categorias | 1+ categorias |
| **Links Adicionais** | ❌ Tooltip | ✅ | ✅ | ✅ |
| **Relatórios** | ❌ | ❌ | ❌ | ✅ |

---

## 🔒 Validações por Campo (T6 - Criação de Anúncios)

### Nível 1 (Gratuito)
```typescript
{
  maxFotos: 1,
  isImperdivelDisabled: true, // Com tooltip
  linksDisabled: true, // Site, Facebook, Pinterest com tooltip
  maxCategorias: 1,
  relatoriosDisabled: true
}
```

**Tooltip para Links Bloqueados**:
> "Este campo está disponível a partir do Nível 2 (R$ 19,99). [Consulte nossos planos]"

**Tooltip para Imperdível Bloqueado**:
> "Destaque 'Imperdível' disponível a partir do Nível 3 (R$ 29,99). [Consulte nossos planos]"

---

### Nível 2 (R$ 19,99)
```typescript
{
  maxFotos: 1,
  isImperdivelDisabled: true, // Com tooltip
  linksDisabled: false, // ✅ Liberados
  maxCategorias: Infinity,
  relatoriosDisabled: true
}
```

---

### Nível 3 (R$ 29,99)
```typescript
{
  maxFotos: 3,
  isImperdivelDisabled: false, // ✅ Liberado
  linksDisabled: false,
  maxCategorias: Infinity,
  relatoriosDisabled: true
}
```

---

### Nível 4 (R$ 39,99)
```typescript
{
  maxFotos: 5,
  isImperdivelDisabled: false,
  linksDisabled: false,
  maxCategorias: Infinity,
  relatoriosDisabled: false // ✅ Aba relatórios ativa
}
```

---

## 🏗️ Estrutura Firebase

```typescript
interface UserProfile {
  name: string;
  nickname?: string;
  email: string;
  phone: string;
  cpf: string;
  anuncianteLevel: 1 | 2 | 3 | 4;
  createdAt: string;
}
```

---

## ✅ Arquivos Alterados

| Arquivo | Mudança |
|---------|---------|
| **context/AppContext.tsx** | `isPremium: boolean` → `anuncianteLevel: 1\|2\|3\|4` |
| **authService.ts** | Interface atualizada + registro com nível 1 |
| **T2-cadastro.tsx** | Registra novos usuários com `anuncianteLevel: 1` |
| **T5-perfil.tsx** | Exibe "Plano Atual: Nível X (R$...)" |
| **T7-painel-gestao.tsx** | Limite de 1 anúncio para todos os níveis |
| **T6-criacao.tsx** | ⏳ Próximo: Validações por nível |

---

## 🚀 Próximas Implementações

1. ✅ **T6**: Validações por nível com tooltips
2. ⏳ **T12**: Tela de Planos/Upgrade
3. ⏳ **T1**: Ordenar anúncios por nível (após integração BD)
4. ⏳ **Firebase Rules**: Validar campo `anuncianteLevel`

---

## 📝 Checkpoint Git

**Commit antes da implementação**: `f5ed324`
```bash
git reset --hard f5ed324  # Para restaurar
```
