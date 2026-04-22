# ADR-003: RLS e modelo de autorização

- **Status**: Accepted
- **Data**: 2026-04-21
- **Tags**: backend, seguranca, supabase

## Contexto

A plataforma lida com dois tipos de dados:

1. **Conteúdo pedagógico** (units, lessons, seções, vocabulário, frases, gramática, exercícios) — público para alunos autenticados, escrito apenas por curadores/autores.
2. **Dados do aluno** (perfil, progresso, tentativas, speaking sessions, gravações, self-assessments, reviews agendadas) — cada aluno só enxerga e escreve os próprios. Curadores/suporte podem ler (com log) para suporte; nunca para outros alunos.

Precisamos de uma política clara que funcione no Postgres via RLS (Supabase) e evite que uma rota de API mal escrita vaze dados.

## Decisão

**Autorização primária no banco via RLS.** Toda tabela tem RLS habilitado. A camada de aplicação nunca é a única defesa.

### Papéis

Definidos em `profiles.role`:

- `student` — aluno (padrão para cadastros públicos).
- `author` — pode criar e editar conteúdo pedagógico (units, lessons, exercises).
- `reviewer` — pode aprovar conteúdo em staging.
- `admin` — acesso total; auditado.

Supabase Auth fornece `auth.uid()`. Criamos função SQL `current_role()` que retorna o papel de `profiles` para o `auth.uid()` atual.

### Padrões de política

- **Conteúdo público do curso** (units, lessons, sections, exercises publicados):
  - `SELECT`: qualquer `authenticated` com `status = 'published'`.
  - `INSERT/UPDATE/DELETE`: `author`, `reviewer`, `admin`.
- **Dados do aluno** (progress, attempts, speaking_sessions, pronunciation_attempts, reviews, self_assessments):
  - `SELECT/INSERT/UPDATE/DELETE`: apenas registros onde `user_id = auth.uid()`.
  - `admin` e `reviewer` podem `SELECT` com policy separada, mas toda leitura admin é logada em `audit_log`.
- **Conteúdo em rascunho** (`status = 'draft'` ou `'review'`):
  - Visível apenas para `author` dono do item, `reviewer`, `admin`.

### Segredos e chamadas privilegiadas

- Integrações que exigem chaves (Claude, TTS, STT) **nunca** rodam no cliente. Rodam em Edge Functions com `SUPABASE_SERVICE_ROLE_KEY`, que bypassa RLS — por isso, cada Edge Function valida manualmente o `auth.uid()` recebido antes de ler/escrever em nome do aluno.
- Nenhuma chave de provedor vai para env do frontend. Ver [ADR-004](004-provedor-ia.md) e [ADR-005](005-tts-stt.md).

### Escritas críticas

Mudanças que afetam progresso (concluir lesson, criar review, atualizar streak) passam por **Postgres functions `security definer`** ou **Edge Functions**, nunca por `UPDATE` direto do cliente. Isso garante invariantes (ex.: não pode concluir lesson sem ter completado as seções obrigatórias — ver [knowledge/08-regras-de-negocio.md](../knowledge/08-regras-de-negocio.md)).

## Alternativas consideradas

- **Autorização só na API** (middleware) — mais simples de debugar, mas uma rota esquecida vaza tudo. Rejeitado — RLS é rede de segurança real.
- **JWT claims com papéis embarcados** — útil, mas exige re-login a cada mudança de papel e complica troca de role em staging. Manter papel em `profiles` com função SQL é mais operável.
- **Um único super-admin** — insuficiente: queremos separar `author` (produção de conteúdo) de `reviewer` (aprovação) e `admin` (infra).

## Consequências

### Positivas
- Defesa em profundidade. Mesmo bug em rota pública não vaza dados de outros alunos.
- Separação clara de papéis alinhada ao fluxo editorial (escrever → revisar → publicar).
- Edge Functions ficam pequenas — a lógica de "quem pode o quê" está declarada em SQL ao lado dos dados.

### Negativas / Custos aceitos
- Políticas RLS precisam de testes — um `USING (true)` esquecido é grave. Exigência: toda policy nova acompanha teste automatizado por papel sintético. Ver [ADR-014](014-estrategia-de-testes.md).
- Debug de "não vejo meus dados" exige checar a policy, não só a query — onboarding técnico do time precisa cobrir isso.
- `service_role` em Edge Functions exige disciplina: sempre validar `auth.uid()` do JWT antes de operar.

### Neutras / Impactos
- Estratégia de testes de autorização: [ADR-014](014-estrategia-de-testes.md).
- Auditoria e logs: [ADR-012](012-observabilidade-e-analytics.md).

## Referências
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth
