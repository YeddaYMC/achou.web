# RBAC e Fluxo de Moderação — Sprint 4

Discussão técnica resumida da S4. Descreve papéis, permissões, estados de anúncio, esquema de denúncias, regras e auditoria.

## 1. Objetivo

Definir um modelo de controle por papéis (RBAC) e o fluxo de moderação para anúncios e denúncias.

## 2. Papéis identificados

- **super_admin** — acesso total: gerir papéis, permissões, usuários, excluir/arquivar anúncios, visualizar e gerenciar logs de auditoria.
- **admin** — gestão operacional: criar/editar/excluir anúncios (operação administrativa), gerir usuários comuns, conceder anúncio extra, visualizar dashboards.
- **moderador** — apenas moderação: acessar fila de denúncias, alterar `anuncios.status` entre `pendente` → `aprovado` / `reprovado`, registrar decisão e `decisionAt`.
- **auditor** — leitura: acesso somente leitura a logs e histórico de ações.
- **usuario** — usuário comum: criar/editar seus próprios anúncios, reportar anúncios.



## 3. Estados de anúncio (campo `status`)

- Valores recomendados : `pendente`, `aprovado`, `reprovado`, `arquivado`, 
- Regra de visibilidade pública: somente anúncios com `status === 'aprovado'` devem aparecer nas listagens públicas e nas queries de busca.
- Fluxo básico:
  1. Ao criar ou editar um anúncio pelo `usuario` → definir `status: 'pendente'`.
  2. `moderador` analisa; se aprovar → `status: 'aprovado'` (publica); se reprovar → `status: 'reprovado'` (não público).
  3. Ações administrativas (ex.: arquivar) por `admin` / `super_admin` → `status: 'arquivado'`.

## 4. Coleção `denuncias` 

- `id` (string)
# RBAC e Fluxo de Moderação — Especificação técnica (PT-BR)

## Papéis (identificadores)

- `super_admin`
- `admin`
- `moderador`
- `auditor`
- `usuario`

## Estados de anúncio (`status`)

- `pendente`
- `aprovado`
- `reprovado`
- `arquivado`

## Coleções e campos 

- `users`
  - `nome`, `email`, `nivelAnunciante` (1..4), `papel`

- `anuncios`
  - `titulo`, `descricao`, `rua`, `numero`, `bairro`, `cidade`, `estado`, `cep`, `lat`, `lon`, `fotos`, `usuarioId`, `status`, `motivoReprovacao`, `moderadoEm`, `moderadoPor`, `totalFavoritos`

- `favoritos` (subcoleção em `/users/{userId}/favoritos`)
  - `anuncioId`, `criadoEm`

- `denuncias`
  - `id`, `anuncioId`, `denuncianteId`, `motivo`, `descricao`, `attachments`, `criadoEm`, `status` (`aberta` | `em_analise` | `resolvida`), `moderadorId`, `acaoTomada`, `notaDecisao`, `analisadaEm`

- `mensagensContato`
  - `nome`, `email`, `mensagem`, `criadoEm`, `statusInterno`

## Regras Firestore previstas

rules_version = '1';
service cloud.firestore {
  match /databases/{database}/documents {

    // FUNÇÕES AUXILIARES
    function logado() { return request.auth != null; }
    function administrador() { return logado() && request.auth.token.admin == true; }
    function nivelAnuncianteLogado() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.nivelAnunciante; }

    function validarConteudoPlano(nivel) {
      let dados = request.resource.data;
      let quantidadeFotos = dados.get('fotos', []).size();
      let possuiImperdivel = dados.get('imperdivel', dados.get('isImperdivel', false));
      let nivel1 = (nivel == 1 && quantidadeFotos <= 1 && possuiImperdivel == false);
      let nivel2 = (nivel == 2 && quantidadeFotos <= 1 && possuiImperdivel == false);
      let nivel3 = (nivel == 3 && quantidadeFotos <= 3);
      let nivel4 = (nivel == 4 && quantidadeFotos <= 5);
      return nivel1 || nivel2 || nivel3 || nivel4;
    }

    match /users/{userId} {
      allow read: if logado() && request.auth.uid == userId;
      allow create, update: if logado() && request.auth.uid == userId && request.resource.data.nivelAnunciante in [1, 2, 3, 4];
      allow delete: if logado() && request.auth.uid == userId;
    }

    match /anuncios/{anuncioId} {
      allow read: if true;
      allow create: if logado() && request.resource.data.usuarioId == request.auth.uid && validarConteudoPlano(nivelAnuncianteLogado());
      allow update: if ((logado() && request.resource.data.usuarioId == request.auth.uid && validarConteudoPlano(nivelAnuncianteLogado()) && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['totalFavoritos'])) || (administrador() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['statusModeracao','motivoReprovacao','moderadoEm','moderadoPor'])));
      allow delete: if logado() && resource.data.usuarioId == request.auth.uid;
    }

    match /users/{userId}/favoritos/{itemId} {
      allow read, list: if logado() && request.auth.uid == userId;
      allow create: if logado() && request.auth.uid == userId;
      allow delete: if logado() && request.auth.uid == userId;
    }

    match /mensagensContato/{mensagemId} {
      allow create: if true;
      allow read: if administrador();
      allow update: if administrador();
      allow delete: if false;
    }

    match /denuncias/{denunciaId} {
      allow read: if administrador();
      allow create: if logado() && request.resource.data.denuncianteId == request.auth.uid;
      allow update: if administrador() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['decisaoDenuncia','statusDenuncia','justificativa','analisadaEm','analisadaPor']) && request.resource.data.decisaoDenuncia in ['aceita','nao_aceita'] && request.resource.data.statusDenuncia in ['anuncio_removido','denuncia_arquivada'] && ((request.resource.data.decisaoDenuncia == 'aceita' && request.resource.data.statusDenuncia == 'anuncio_removido') || (request.resource.data.decisaoDenuncia == 'nao_aceita' && request.resource.data.statusDenuncia == 'denuncia_arquivada')) && request.resource.data.justificativa is string && request.resource.data.justificativa.size() > 0;
      allow delete: if administrador();
    }

  }
}

COLEÇÕES (resumo): users, anuncios, favoritos, denuncias, planos, geolocalizacao

