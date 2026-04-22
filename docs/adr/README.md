# Architecture Decision Records (ADRs)

Registro de decisões arquiteturais e de produto estruturantes. Cada ADR descreve **contexto**, **decisão**, **alternativas consideradas** e **consequências**.

## Formato

Use [template.md](template.md) para novos ADRs. Status possíveis:

- `Proposed` — em discussão
- `Accepted` — decidido, vale como norma
- `Deprecated` — não vale mais, mas não foi substituído
- `Superseded by ADR-XXX` — substituído por outro ADR

## Numeração

Sequencial, 3 dígitos, nunca reaproveitar números. Quando uma decisão é revisada, criar um **novo ADR** que referencia o antigo com `Supersedes: ADR-XXX`.

## Índice

| # | Título | Status |
|---|--------|--------|
| [001](001-stack-frontend.md) | Stack do frontend — Next.js 15 + TypeScript + Tailwind + shadcn/ui | Accepted |
| [002](002-backend-supabase.md) | Backend — Supabase (Postgres, Auth, Storage, Edge Functions) | Accepted |
| [003](003-rls-e-autorizacao.md) | RLS e modelo de autorização | Accepted |
| [004](004-provedor-ia.md) | Provedor de IA — Anthropic Claude via API | Amended by 017 |
| [005](005-tts-stt.md) | Provedor de TTS e STT | STT partial-superseded by 016 |
| [006](006-spaced-repetition.md) | Algoritmo de revisão espaçada — SM-2 simplificado | Accepted |
| [007](007-pronunciation-scoring.md) | Estratégia de pronunciation scoring | Amended 2026-04-21 |
| [008](008-conteudo-e-versionamento.md) | Estrutura e versionamento do conteúdo pedagógico | Accepted |
| [009](009-copyright-e-ip.md) | Proteção de IP — conteúdo 100% original | Accepted |
| [010](010-estado-frontend.md) | Estratégia de estado no frontend | Accepted |
| [011](011-estrutura-do-repositorio.md) | Estrutura do repositório | Accepted |
| [012](012-observabilidade-e-analytics.md) | Observabilidade e analytics pedagógicos | Accepted |
| [013](013-hosting-e-deploy.md) | Hosting e deploy — Vercel + Supabase | Accepted |
| [014](014-estrategia-de-testes.md) | Estratégia de testes | Accepted |
| [015](015-i18n.md) | i18n — UI em pt-BR, conteúdo em en-US | Amended 2026-04-21 |
| [016](016-stt-amazon-transcribe.md) | STT com Amazon Transcribe em en-US | Accepted |
| [017](017-llm-amazon-bedrock.md) | LLM via Amazon Bedrock (Claude) | Accepted |
| [019](019-aws-auth.md) | Autenticação AWS a partir de Edge Functions Supabase | Accepted |
