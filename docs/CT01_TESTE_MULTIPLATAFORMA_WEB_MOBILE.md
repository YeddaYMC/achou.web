# CT01 — Teste Multiplataforma (Web vs Mobile)

## Metadados

- **ID:** T01  
- **Abordagem:** Caixa Preta (Interface e Layout)  
- **Executor:** Desenvolvedor (evidência técnica local)  
- **Data da execução:** 2026-06-05  
- **Ambiente:** Sandbox CI (sem dispositivo físico/emulador mobile)

## Fluxo único de validação (selecionado)

Telas críticas definidas para o CT01:
1. **Login (T3)**
2. **Cadastro/Perfil (T2/T5)**
3. **Publicação (T6)**

Roteiro previsto (idêntico nas duas plataformas):
1. Abrir app.
2. Navegar para Login/Cadastro.
3. Validar renderização de formulário, botões e textos.
4. Navegar para fluxo de publicação.
5. Validar execução de ação e persistência.

## Resultado de execução no ambiente atual

### Web (executado)

- **Execução local:** `npm run web -- --port 19006`
- **Viewport desktop:** 1366x768
- **Viewport mobile web:** 390x844
- **Evidências visuais:**
  - `/tmp/workspace/YeddaYMC/achou.web/docs/evidencias/ct01/web-desktop-localhost-19006.png`
  - `/tmp/workspace/YeddaYMC/achou.web/docs/evidencias/ct01/web-mobile-viewport-390x844-localhost-19006.png`

**Achados principais (Web):**
- A aplicação não renderizou o fluxo funcional esperado; exibiu **Unmatched Route**.
- Houve alerta de incompatibilidade de rota base no web:
  - `Router basename="/achou-web/" ... URL "/" não corresponde ao basename`
- Também ocorreram erros de rede no sandbox para Firestore (`ERR_BLOCKED_BY_CLIENT`), com fallback local de dados mock.

### Mobile (não executado no sandbox)

Não foi possível executar Expo Go/dispositivo real neste ambiente isolado.  
A validação mobile ficou pendente para execução manual em dispositivo/emulador.

## Checklist CT01 (status por plataforma)

| Item | Web | Mobile | Observação |
|---|---|---|---|
| Renderização de componentes | **Falhou** | Pendente | Web ficou em Unmatched Route |
| Responsividade e quebras | **Falhou** | Pendente | Não foi possível validar telas funcionais |
| Consistência de fontes e cores | **Falhou** | Pendente | Tela funcional não carregou no Web |
| Execução de ações (botões/fluxo) | **Falhou** | Pendente | Fluxo não iniciou por rota inválida |
| Consumo de APIs (incluindo CORS) | **Falhou** | Pendente | Firestore bloqueado no ambiente sandbox |
| Persistência local | **Falhou** | Pendente | Fluxo funcional indisponível no Web |
| Sincronização com banco | **Falhou** | Pendente | Sem navegação funcional no Web |

## Matriz comparativa visual

| Cenário | Evidência | Resultado |
|---|---|---|
| Web desktop | `web-desktop-localhost-19006.png` | Unmatched Route |
| Web viewport mobile | `web-mobile-viewport-390x844-localhost-19006.png` | Unmatched Route |
| Mobile real | Pendente | Não executado neste ambiente |

## Logs relevantes (resumo)

- Web console:
  - `Router basename="/achou-web/" is not able to match the URL "/"`
  - `Failed to load resource: net::ERR_BLOCKED_BY_CLIENT ... firestore.googleapis.com`
  - `Firestore ... Could not reach Cloud Firestore backend`
  - `Usando fallback local com 9 anúncio(s) de mock`

## Divergência de layout/portabilidade registrada

- **Componente/área afetada:** roteamento base da aplicação Web.
- **Comportamento observado:** app abre tela de erro de rota (Unmatched Route), impedindo validação de layout funcional.
- **Resolução/cenário:** desktop (1366x768) e viewport mobile (390x844), ambos no navegador local.
- **Referência de código associada ao sintoma:**  
  - `/tmp/workspace/YeddaYMC/achou.web/app/_layout.tsx:30` (`HashRouter basename="/achou-web/"`)  
  - `/tmp/workspace/YeddaYMC/achou.web/app.json:29` (`baseUrl: "/achou.web/"`)

## Conclusão do CT01

- **Status Web:** **Falhou** (rota base inconsistente no ambiente web + bloqueios de rede no sandbox)
- **Status Mobile:** **Pendente**
- **Status geral CT01:** **Em aberto / não aprovado**

Para concluir o CT01 com aprovação, é necessário:
1. Corrigir a inconsistência de base path no roteamento web.
2. Reexecutar o mesmo fluxo em Web e Mobile real.
3. Atualizar este relatório com evidências lado a lado das telas funcionais.
