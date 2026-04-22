# W2 App

Plataforma de ensino de inglês com trilha guiada, speaking com IA, pronunciation coach e revisão espaçada. Conteúdo em **American English** para brasileiros iniciantes.

**Status do MVP**: M0 Foundation em execução. Ver [docs/mvp-backlog.md](docs/mvp-backlog.md).

## Início rápido

Requisitos: **Node.js ≥ 20.11**, **pnpm 9**, **Supabase CLI** (para local/testes), **AWS CDK** (para infra em M3+).

```bash
# 1) Instalar dependências
pnpm install

# 2) Configurar variáveis de ambiente
cp .env.example .env.local
# preencher NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
# (ver dashboard Supabase → API settings)

# 3) Rodar dev server
pnpm dev
# → http://localhost:3000
```

## Scripts

| Comando | Descrição |
|---|---|
| `pnpm dev` | Next.js dev server com Turbo |
| `pnpm build` | Build de produção |
| `pnpm lint` | ESLint (Next config + TypeScript) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` | Prettier (escreve) |
| `pnpm format:check` | Prettier (só verifica) |
| `pnpm test` | Vitest (unit/component) |
| `pnpm test:e2e` | Playwright (E2E + smoke) |
| `pnpm db:types` | Regera `types/database.ts` a partir do Supabase |
| `pnpm db:test` | pgTAP contra Supabase local |
| `pnpm db:diff` | Diff do schema local vs remoto |
| `pnpm db:push` | Aplica migrations no Supabase remoto |

## Estrutura (resumo)

```
app/                    # Next.js App Router
  (marketing)/          # landing pública
  (auth)/               # login, signup, reset
  (app)/                # área autenticada (dashboard, trilha, lesson, ...)
  api/                  # route handlers quando necessário
components/             # UI (ui/ = shadcn base, lesson/, exercises/, ...)
lib/
  supabase/             # client.ts, server.ts, middleware.ts
  llm/ tts/ stt/        # AI clients (implementados em M3)
  srs/ pronunciation/   # lógica pedagógica
  utils.ts              # cn() helper
schemas/                # Zod compartilhado entre cliente e servidor
types/
  database.ts           # gerado via supabase gen types
supabase/
  migrations/           # SQL versionado (0001..0008 aplicadas)
  tests/                # pgTAP (policies + functions)
  seed/                 # JSON do conteúdo seed
tests/
  unit/                 # Vitest
  e2e/                  # Playwright
  evals/                # LLM-as-judge (M3)
docs/                   # ADRs, knowledges, use cases, backlog, constitution
.github/workflows/      # CI + deploy
```

Detalhes em [docs/adr/011-estrutura-do-repositorio.md](docs/adr/011-estrutura-do-repositorio.md).

## Stack

- **Frontend**: Next.js 15 (App Router, Server Components) + TypeScript strict + Tailwind + shadcn/ui
- **Estado**: Server Components + TanStack Query + Zustand + React Hook Form + Zod
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions + RLS)
- **IA**: Claude via Amazon Bedrock (`us-east-1`); Anthropic direta como fallback
- **Áudio**: ElevenLabs (TTS) + Amazon Transcribe (STT)
- **Hosting**: Vercel (frontend) + Supabase Cloud (backend) + AWS (IA/áudio)

ADRs completos em [docs/adr/](docs/adr/).

## Documentação essencial

1. [Constitution](docs/constitution.md) — 10 princípios invioláveis. Leia antes de decidir qualquer coisa.
2. [ADRs](docs/adr/README.md) — decisões arquiteturais.
3. [Knowledge](docs/knowledge/README.md) — domínio, pedagogia, regras de negócio, personas IA.
4. [Use Cases](docs/use-cases/README.md) — fluxos principais.
5. [Backlog MVP](docs/mvp-backlog.md) — o que construir e quando.

## Supabase

Projeto: `ucbbhymgflujbtcopaeb` → https://ucbbhymgflujbtcopaeb.supabase.co

Schema aplicado via MCP: **34 tabelas** com RLS, **14 funções SQL** de negócio, **0 lints de segurança**, **0 WARN de performance**.

Para desenvolvimento local:

```bash
supabase start           # stack completa (Postgres + Studio + Auth)
supabase db reset        # reseta local + aplica 0001..0008
supabase test db         # roda pgTAP
```

## AWS

Implementação em **M3** (ver backlog). Por enquanto: conta AWS com permissões IAM criadas, Bedrock e Transcribe habilitados em `us-east-1`. CDK em `infra/` (vazio — M0 story 3.1).

## Conteúdo

American English por decisão explícita — ver [ADR-015](docs/adr/015-i18n.md) e [knowledge/14](docs/knowledge/14-guardrails-copyright.md). **Jamais copiar ou extrair conteúdo de apostilas ou portais de cursos.** Tudo original.

## Contribuindo

1. Checklist de [constitution](docs/constitution.md).
2. Feature nova? Precisa de ADR? Propor antes de codar.
3. Mudou schema? Migration + pgTAP.
4. Mudou prompt IA? Rodar evals.
5. PR passa `lint + typecheck + test + format:check + build`.

## Licença

Privado no MVP. Modelo de licenciamento a definir pós-PMF.
