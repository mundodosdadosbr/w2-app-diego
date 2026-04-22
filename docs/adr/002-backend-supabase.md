# ADR-002: Backend — Supabase (Postgres, Auth, Storage, Edge Functions)

- **Status**: Accepted
- **Data**: 2026-04-21
- **Tags**: backend, database, auth, stack

## Contexto

Precisamos de:
- Banco relacional bem modelado (users, progresso, conteúdo, tentativas, revisões, speaking sessions).
- Autenticação (email/senha, magic link, provedores sociais no futuro).
- Storage (áudio TTS gerado/cacheado, áudios de speaking do aluno, imagens de vocabulário quando aplicável).
- APIs para lessons, progresso, revisões e sessões de speaking.
- Realtime para eventos colaborativos futuros (ranking, desafios semanais, turmas).
- Baixa sobrecarga operacional — o time é pequeno e o foco deve estar em pedagogia e IA, não em infra.

O projeto já tem o MCP do Supabase configurado para o projeto `ucbbhymgflujbtcopaeb` (ver `.mcp.json`), sinalizando preferência por Supabase.

## Decisão

Adotamos **Supabase** como backend primário:

- **Postgres 15+** para todos os dados relacionais.
- **Supabase Auth** para login/cadastro, sessões, e recuperação de senha.
- **Row-Level Security (RLS)** para autorização. Ver [ADR-003](003-rls-e-autorizacao.md).
- **Supabase Storage** para áudios TTS cacheados e gravações do aluno.
- **Edge Functions (Deno)** para integrações com provedores de IA, TTS e STT que não podem rodar no cliente (chaves de API) e para endpoints que exigem lógica customizada (ex.: orquestração de speaking session, cálculo de score de pronúncia).
- **Database Functions + Triggers** (plpgsql) para regras que precisam ser atômicas no banco (ex.: atualizar streak, criar review ao concluir lesson).
- **Migrations versionadas** em `supabase/migrations/` com `supabase db diff` + `supabase db push`.

O frontend acessa Postgres via `supabase-js` v2 com RLS, **não** via rota de API Next.js para leituras simples. Escritas críticas passam por Edge Function ou RPC.

## Alternativas consideradas

- **Node.js + Prisma + Postgres gerenciado (Neon/Railway/RDS) + Auth próprio** — flexibilidade total, mas dobra o esforço (auth, realtime, storage, RLS manual, deploy separado). Não justifica para o MVP.
- **Firebase** — ótimo para realtime, mas NoSQL dificulta modelar progresso pedagógico relacional (trilha → unidade → lesson → seção → exercício → tentativa).
- **PocketBase / Appwrite** — boas alternativas self-hosted, mas ecossistema menor, comunidade menor, menos ferramentas (MCP, CLI, Studio).
- **Nhost / Hasura** — interessantes, porém Supabase tem melhor DX de Auth e Storage integrados e o MCP já configurado.

## Consequências

### Positivas
- Stack única: Auth, DB, Storage, Functions, Realtime em um só provedor.
- RLS permite que a maior parte da autorização viva no banco, reduzindo lógica duplicada no backend. Ver [ADR-003](003-rls-e-autorizacao.md).
- Tipos Postgres gerados automaticamente para TypeScript.
- MCP do Supabase disponível para o agente operar o projeto via Claude Code — acelera schema, debugging, advisors.

### Negativas / Custos aceitos
- Lock-in parcial. Se quisermos sair, precisaremos reescrever Auth e migrar RLS para middleware. Aceitamos — Postgres em si é portável e migrações ficam versionadas.
- Edge Functions em Deno têm ecossistema npm mais limitado que Node; precisamos validar libs de áudio e de IA antes de assumir.
- RLS mal projetada pode vazar dados. Mitigação: políticas escritas com testes (`pg_tap` ou tests por usuário sintético). Ver [ADR-003](003-rls-e-autorizacao.md) e [ADR-014](014-estrategia-de-testes.md).

### Neutras / Impactos
- Deploy em [ADR-013](013-hosting-e-deploy.md).
- Schema e seed do conteúdo em [knowledge/07-modelo-de-dominio.md](../knowledge/07-modelo-de-dominio.md) e [ADR-008](008-conteudo-e-versionamento.md).

## Referências
- https://supabase.com/docs
- Projeto: `ucbbhymgflujbtcopaeb` (via MCP `supabase-w2`)
