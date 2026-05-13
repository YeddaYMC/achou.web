# Dados de Teste - Alternando Conteúdo

## 📁 Estrutura

```
dados-teste/
├── negociosTesteP.ts    ← Edite aqui para alterar negócios
└── README.md            ← Documentação
```

## 🔧 Como Alterar Dados

### 1. Abra o arquivo `dados-teste/negociosTesteP.ts`
### 2. Edite os negócios conforme necessário
### 3. Salve e a aplicação atualiza automaticamente

Para adicionar novo negócio:
```typescript
{
  id: 18,
  name: 'Nome do Negócio',
  category: 'Categoria',
  location: 'Endereço',
  cep: '00000-000',
  phone: '(41) 1234-5678',
  whatsapp: '5541912345678',
  description: 'Descrição...',
  image: 'https://...',
  lat: -25.4300,
  lon: -49.2050
}
```

## 🌐 Migração para BD

Quando integrar com banco de dados, basta:
1. Criar coleção com mesma estrutura
2. Substituir `import { mockBusinesses }` por chamada à API
3. Tudo funciona automaticamente
