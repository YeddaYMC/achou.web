# Dados de Teste e Integração com Banco de Dados

## Estrutura Atual

Os dados de teste estão organizados em:
- `mockData/mockBusinesses.ts` - Lista de negócios para prototipar

## Como Usar os Dados de Teste

### Importar em Qualquer Tela

```typescript
import { mockBusinesses } from '../mockData/mockBusinesses';

// Usar em vez de definir localmente
const [businesses, setBusinesses] = useState(mockBusinesses);
```

## Como Alterar Dados de Teste

1. **Editar `mockData/mockBusinesses.ts`** - Adicione/remova/modifique negócios diretamente
2. **Salvar arquivo** - As mudanças aparecem automaticamente em desenvolvimento

## Migração para Banco de Dados Real

Quando integrar com Firebase/banco de dados:

### Padrão de Transição

```typescript
// Antes (teste)
import { mockBusinesses } from '../mockData/mockBusinesses';
const [businesses, setBusinesses] = useState(mockBusinesses);

// Depois (com BD)
useEffect(() => {
  // Buscar do Firebase
  fetchBusinessesFromDatabase().then(setBusinesses);
}, []);
```

### Estrutura Esperada do BD

Manter a mesma estrutura de objeto `Business`:
```typescript
{
  id: number;
  name: string;
  category: string;
  location: string;
  cep: string;
  phone: string;
  whatsapp: string;
  description: string;
  image: string; // URL da imagem
  lat: number;
  lon: number;
}
```

## Próximos Passos

1. ✅ Dados de teste organizados em `mockData/`
2. ⏳ Criar `mockData/mockUsers.ts` para usuários
3. ⏳ Criar serviço de integração com BD em `services/api.ts`
4. ⏳ Substituir `useState` por chamadas reais ao BD

## Dica

Para testar rapidamente diferentes cenários:
- Crie ramificações em `mockBusinesses.ts`
- Use variáveis de ambiente para alternância

Exemplo:
```typescript
const USE_MOCK_DATA = process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';

export const getBusinesses = async () => {
  if (USE_MOCK_DATA) {
    return mockBusinesses;
  }
  return await fetchFromDatabase();
};
```
