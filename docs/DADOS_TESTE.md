# Guia Prático: Como Alterar Dados de Teste

## 📁 Estrutura de Dados de Teste

```
mockData/
├── mockBusinesses.ts    ← Edite aqui para adicionar/remover negócios
└── README.md            ← Documentação
```

## 🔧 Como Alterar Dados Rapidamente

### 1. **Adicionar um novo negócio**

Abra `mockData/mockBusinesses.ts` e adicione ao array:

```typescript
{
  id: 18,                                              // ID único
  name: 'Seu Negócio Aqui',                           // Nome
  category: 'Alimentação & Restaurantes',             // Categoria
  location: 'Seu Bairro - Pinhais',                  // Localização
  cep: '83000-000',                                   // CEP
  phone: '(41) 1234-5678',                            // Telefone
  whatsapp: '5541912345678',                          // WhatsApp
  description: 'Descrição do seu negócio aqui...',   // Descrição
  image: 'https://images.unsplash.com/...',          // URL imagem
  lat: -25.4300,                                      // Latitude
  lon: -49.2050,                                      // Longitude
}
```

### 2. **Encontrar Latitude/Longitude**

Use https://www.latlong.net/ ou Google Maps:
- Abra Google Maps
- Clique com botão direito no local
- As coordenadas aparecem no menu

### 3. **Buscar Imagens**

Use **Unsplash** (gratuito e sem copyright):
- https://unsplash.com
- Procure pela categoria (ex: "pizzaria", "academia")
- Copie URL da imagem com `?w=400` para otimizar

### 4. **Editar Negócio Existente**

Localize pelo `id` e altere os campos necessários:

```typescript
{
  id: 1,
  name: 'IFPR Pinhais',           // ← Mudou o nome
  category: 'Educação & Cursos',
  // ... resto igual
}
```

### 5. **Remover Negócio**

Delete a linha inteira ou comente:

```typescript
// { id: 3, name: 'Salão Beleza Pura', ... }, // Comentado
```

## 📋 Categorias Disponíveis

```
Alimentação & Restaurantes
Artesanato
Beleza & Estética
Cafés & Padarias
Casa & Construção
Educação & Cursos
Entretenimento & Lazer
Eventos
Limpeza & Manutenção
Moda & Vestuário
Pet Shop & Veterinária
Presentes & Joias
Saúde & Fitness
Serviços Automotivos
Tecnologia & Informática
```

## 🚀 Próximos Passos (Integração com BD)

Quando integrar com Firebase/banco de dados:

1. **Criar arquivo de serviço** (`services/businessService.ts`):
```typescript
import { mockBusinesses } from '../mockData/mockBusinesses';

export async function getBusinesses() {
  // Temporário: usar mock data
  return mockBusinesses;

  // Depois: buscar do BD
  // const snapshot = await db.collection('businesses').get();
  // return snapshot.docs.map(doc => doc.data());
}
```

2. **Usar em t1-tela-inicial.tsx**:
```typescript
useEffect(() => {
  getBusinesses().then(setFilteredBusinesses);
}, []);
```

3. **No BD, manter mesma estrutura**:
- Coleção: `businesses`
- Documentos com campos: `id, name, category, location, cep, phone, whatsapp, description, image, lat, lon`

## ✅ Dica Final

Para testar sem alterar o arquivo principal, crie versões:
- `mockBusinesses.ts` - Dados de produção
- `mockBusinesses.dev.ts` - Dados de desenvolvimento (teste aqui!)
- `mockBusinesses.staging.ts` - Dados de staging

E importe seletivamente no arquivo de tela.
