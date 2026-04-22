# ADR-013: Hosting e deploy — Vercel + Supabase

- **Status**: Accepted
- **Data**: 2026-04-21
- **Tags**: devops, infra

## Contexto

Precisamos hospedar:
- Frontend Next.js (SSR + ISR + Server Actions).
- Backend Supabase (Postgres, Auth, Storage, Realtime, Edge Functions).
- Jobs agendados (rotação de TTS pré-gerado, limpeza de gravações > 90 dias, recalcular streaks).
- CI/CD com checagens de tipo, testes, lint.

Prioridades: DX alta, operação mínima, preview deploys por PR, rollback rápido.

## Decisão

### Frontend
**Vercel** para o Next.js.
- Preview deploy por PR (URL única, seed de conteúdo de staging).
- `main` → produção; branches → preview.
- Env vars por ambiente (dev, preview, prod).
- Edge Middleware para refresh de sessão Supabase.

### Backend
**Supabase Cloud** (projeto `ucbbhymgflujbtcopaeb`).
- Branching do Supabase para previews (feature branches do banco por PR).
- Migrations aplicadas via `supabase db push` em CI quando PR é mergeado.
- Edge Functions deployadas via `supabase functions deploy` em CI.

### Ambientes
- **Local / dev**: Supabase CLI rodando local (`supabase start`), Next em `next dev`.
- **Preview** (por PR): Supabase branch efêmero + Vercel preview.
- **Staging**: branch `staging` → Supabase staging estável + Vercel staging.
- **Produção**: `main` → Supabase prod + Vercel prod.

### Jobs agendados
- **pg_cron** no Supabase para:
  - `refresh_streaks()` diária às 00:05 fuso do aluno (approximado via última atividade).
  - `purge_expired_recordings()` diária às 02:00.
  - `recompute_due_reviews()` idempotente, a cada 6h.
- Jobs mais complexos (pré-gerar TTS para batch) → **Edge Function acionada por trigger do banco** quando status passa a `published`.

### CI/CD
GitHub Actions:
- **Em PR**: lint (eslint), typecheck (`tsc --noEmit`), testes unit (vitest), testes de policies pgTAP, Playwright e2e em preview.
- **Em merge para main**: deploy Vercel (automático) + `supabase db push` + `supabase functions deploy`.
- **Manual**: `pnpm seed:content` para aplicar seed de conteúdo em um ambiente.

### Secrets
- GitHub Environments: `preview`, `staging`, `production`.
- Supabase service role key **nunca** em frontend; só em Edge Functions e GitHub Actions.
- Rotação trimestral das chaves de IA/TTS/STT, documentada em `docs/operations/secrets.md` (criar quando formalizar).

### Domínios
- `app.{dominio}` → Vercel produção.
- `staging.app.{dominio}` → Vercel staging.
- Supabase em subdomínio próprio do Supabase (`*.supabase.co`).

## Alternativas consideradas

- **Fly.io / Railway / Render** — bons para monolitos com backend custom; não temos backend custom pesado, Supabase cobre tudo.
- **AWS direto (EC2/ECS/RDS)** — flexibilidade máxima, operação pesada para time pequeno.
- **Cloudflare Pages + Workers** — competidor sério, Workers é ótimo. Ficamos com Vercel pela integração Next nativa; reavaliar em 12 meses.
- **Self-host Supabase em VPS** — redução de custo, mas aumenta operação (backups, upgrade de Postgres, monitoramento). Só faz sentido pós-PMF.

## Consequências

### Positivas
- Preview por PR = revisão de produto com URL funcional, valioso para autores pedagógicos revisarem conteúdo em contexto.
- Operação quase zero: sem servidor para patchar.
- Rollback é um revert no git.
- `pg_cron` mantém jobs perto dos dados.

### Negativas / Custos aceitos
- Dependência de dois SaaS (Vercel + Supabase). Mitigação: Next é portável; schema é portável; Edge Functions são Deno TypeScript simples.
- Custo escala com uso; Vercel pode ficar caro em tráfego alto. Monitorar.
- Supabase branching para PRs tem limites do plano — pode virar custo se abrir muitos PRs simultâneos.

### Neutras / Impactos
- Migrations em [ADR-008](008-conteudo-e-versionamento.md).
- Testes em [ADR-014](014-estrategia-de-testes.md).
- Observabilidade em [ADR-012](012-observabilidade-e-analytics.md).

## Referências
- https://vercel.com/docs
- https://supabase.com/docs/guides/cli
- https://supabase.com/docs/guides/platform/branching
