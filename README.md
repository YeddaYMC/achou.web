# Achou App - React Native

[![Platform](https://img.shields.io/badge/platform-React%20Native-blue)](https://reactnative.dev)
[![Language](https://img.shields.io/badge/language-TypeScript-blue)](https://www.typescriptlang.org)
[![Framework](https://img.shields.io/badge/framework-Expo-black)](https://expo.dev)
[![Backend](https://img.shields.io/badge/backend-Firebase-orange)](https://firebase.google.com)

Plataforma mobile para conectar usuários a negócios e serviços locais com sistema robusto de descoberta, favoritos e comunicação.

## 📋 Índice

- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Desenvolvimento](#desenvolvimento)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Documentação](#documentação)
- [Build & Deploy](#build--deploy)

## 📦 Requisitos

- **Node.js** >= 16.0.0 | **npm** >= 8.0.0
- **Expo CLI** `npm install -g expo-cli`
- **Firebase Account** (console.firebase.google.com)
- **Expo Account** (expo.dev)

## 🚀 Instalação

```bash
# 1. Clonar e instalar
git clone <repo>
cd AchouAppRN
npm install

# 2. Configurar Firebase (já pré-configurado em firebaseConfig.js)
# Verificar que google-services.json está na raiz

# 3. Iniciar desenvolvimento
npm run web      # Browser
npm run android  # Android emulator
npm run ios      # iOS simulator (macOS)
```

## 👨‍💻 Desenvolvimento

### Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React Native + TypeScript |
| Framework | Expo ~54.0 |
| State | Context API |
| Backend | Firebase (Auth + Firestore) |
| UI Components | React Native + Custom |
| Styling | theme.ts (colors, spacing) |

### Padrões de Código

**TypeScript**
```typescript
// Tipos explícitos sempre
const handleLogin = async (email: string, password: string): Promise<void> => { }

// Interfaces para dados estruturados
interface UserProfile {
  name: string;
  email: string;
  cpf: string;
  anuncianteLevel: 1 | 2 | 3 | 4;
  createdAt: string;
}
```

**React Components**
- Functional components com hooks
- Props tipadas com interface
- Componentes pequenos e reutilizáveis

**Convenções**
- Variáveis: `camelCase`
- Tipos: `PascalCase`
- Constantes: `UPPER_SNAKE_CASE`
- Telas: `t{numero}-descricao.tsx`

## 📁 Estrutura de Diretórios

```
AchouAppRN/
├── app/                      # Expo Router entry point
├── assets/                   # Imagens e recursos
├── components/               # Componentes reutilizáveis
│   ├── ui/                  # Button, Input, Label, Dialog, etc
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Layout-RN.tsx
├── context/                 # Context API
│   └── AppContext.tsx       # Estado global + sincronização Firebase
├── hooks/                   # Custom hooks
│   └── useTheme.ts
├── screens/                 # Telas (t1-t12)
│   ├── t1-tela-inicial.tsx
│   ├── t2-cadastro.tsx      # Firebase: registerWithEmail()
│   ├── t3-login.tsx         # Firebase: loginWithEmail()
│   ├── t4-detalhes-negocio.tsx
│   └── ...
├── src/services/            # Serviços de negócio
│   └── authService.ts       # Firebase Auth API
├── styles/                  # Temas
│   └── theme.ts
├── dados-teste/             # Mock data
├── firebaseConfig.js        # Inicialização Firebase
├── google-services.json     # Config Android
├── app.json                 # Config Expo
├── tsconfig.json
├── package.json
└── README.md               # Este arquivo
```

## 🏗️ Arquitetura

Ver [ARCHITECTURE.md](ARCHITECTURE.md) para:
- Padrão de arquitetura (MVC-like)
- Fluxo de dados (Context → Components)
- Integração Firebase
- Componentes principais

## 📚 Documentação

| Documento | Conteúdo |
|-----------|----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Design de arquitetura, componentes, padrões |
| [API.md](API.md) | Documentação de APIs (authService, hooks) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Padrões de código, workflow, conventions |
| [BD-NOTAS.txt](BD-NOTAS.txt) | Estrutura Firestore, regras de negócio |

## 🧭 Próximos Passos: Geolocalização

- **Localização do usuário (default GPS):** solicitar permissão e capturar coordenadas; registrar quando GPS não estiver disponível.
- **Entrada opcional (CEP/endereço):** permitir informar manualmente; marcar explicitamente quando o dado for manual.
- **Localização fixa dos negócios:** armazenar coordenadas dos pontos (geopoint) para cálculo de proximidade.
- **Busca por proximidade:** consultar negócios mais próximos do usuário combinando GPS ou CEP/endereço quando fornecido.

## 🪪 Planos e Limites

- **Nível 1:** 1 foto no feed, sem imperdível, sem links.
- **Nível 2:** 1 foto no feed, sem imperdível, com links.
- **Nível 3:** 1 foto no feed e até 3 fotos em detalhes do negócio, com imperdível, com links.
- **Nível 4:** 1 foto no feed e até 5 fotos em detalhes do negócio, com imperdível, com links, relatórios (futuro).

### Anotações para implementação futura
- Garantir suporte consistente a “1 foto no feed e até 3/5 fotos em detalhes” nos fluxos de criação/edição e exibição.
- Validar limites por nível tanto no app quanto nas regras do Firestore.
- Upgrade de plano é automático no app (sem aprovação manual de admin).
- **Admin (futuro):** gestão financeira de planos/pagamentos pode ser feita em camada separada (SQL/Backoffice), sem alterar o fluxo atual de nível no Firestore.

## 🔐 Regras Firestore (resumo atual)

### 👤 Usuário comum
- **Perfil (`/users/{userId}`):** lê, cria, edita e exclui apenas o próprio perfil (nível válido 1–4).
- **Anúncios (`/anuncios/{anuncioId}`):** leitura pública; cria/edita/exclui apenas o dono logado e respeitando limites do plano.
- **Negócios (`/businesses/{businessId}`):** mesmas regras de anúncios.
- **Favoritos (`/users/{userId}/favoritos/{itemId}`):** leitura/lista/criação/exclusão apenas do próprio usuário.
- **Denúncias (`/denuncias/{denunciaId}`):** criação por usuário logado (`denuncianteId` deve ser o próprio `uid`).
- **Mensagens de contato (`/mensagensContato/{mensagemId}`):** envio liberado (`create`).

### 🛡️ Administrador (somente moderação)
- **Perfis de usuário:** não possui leitura de perfis em `/users`.
- **Anúncios/Negócios:** pode atualizar apenas campos de moderação (`statusModeracao`, `motivoReprovacao`, `moderadoEm`, `moderadoPor`).
- **Denúncias:** lê, atualiza e exclui; na atualização, aplica fluxo obrigatório:
  - `decisaoDenuncia = aceita` -> `statusDenuncia = anuncio_removido`
  - `decisaoDenuncia = nao_aceita` -> `statusDenuncia = denuncia_arquivada`
  - `justificativa` obrigatória em ambos os casos.
- **Mensagens de contato:** pode ler e atualizar status interno.

### ⭐ Favoritos e contador público
- O campo `totalFavoritos` em anúncios/negócios não pode ser alterado diretamente por usuários.
- A atualização desse contador deve ser automática por Cloud Function.

## 🚢 Build & Deploy

### Desenvolvimento Local

```bash
npm run web      # http://localhost:19006
npm run android  # Emulator
npm run ios      # Simulator
```

### Build de Produção

```bash
# Android via EAS
eas build -p android --release

# iOS via EAS
eas build -p ios --release
```

### Checklist Deploy

- [ ] Testar em dispositivo real
- [ ] Validar Firebase rules
- [ ] Atualizar versão em app.json
- [ ] Revisar console de erros
- [ ] Backup banco de dados

---

**Desenvolvido com React Native + Firebase** | Última atualização: 13/03/2026
