# ADR-012: Observabilidade e analytics pedagógicos

- **Status**: Accepted
- **Data**: 2026-04-21
- **Tags**: observabilidade, analytics, pedagogia

## Contexto

Precisamos ver três realidades:

1. **Saúde técnica** — erros, latência, falhas de Edge Functions, falhas de TTS/STT/LLM, custos de API.
2. **Saúde pedagógica** — taxa de conclusão por lesson, pontos de drop-off, acerto por exercício, score médio de pronúncia, curva de retenção por revisão espaçada.
3. **Comportamento do aluno** — tempo por seção, streak, engajamento diário, funil de onboarding.

Sem isso, "adaptar ao desempenho do aluno" e "revisar com base em erros" viram promessas vazias.

## Decisão

### Stack de observabilidade

- **Erros e traces (técnico)**: **Sentry** no frontend (Next) e nas Edge Functions. `tracesSampleRate = 0.1` em produção; 1.0 em staging.
- **Logs estruturados**: Edge Functions logam JSON (`pino`-like shape) para Supabase Logs. Campos mínimos: `user_id` (quando presente), `route`, `duration_ms`, `status`, `error_code`.
- **Métricas de custo de IA**: cada chamada LLM/TTS/STT registra em tabela `ai_usage` (provider, model, tokens_in, tokens_out, cache_hit, cost_cents, user_id, purpose). Dashboard em `/admin/ai-usage`.
- **Product analytics**: **PostHog self-hosted** (ou cloud no MVP) — captura eventos de navegação e pedagógicos. `posthog-js` no cliente com `capture_pageview`, `autocapture = false` (eventos são explícitos, não heurísticos).

### Eventos pedagógicos obrigatórios
Todo evento carrega `user_id`, `session_id`, `timestamp`, e contextos pertinentes:

- `onboarding_started`, `onboarding_completed`, `level_test_completed { level }`
- `lesson_started { lesson_id, unit_id }`
- `lesson_section_viewed { lesson_id, section, elapsed_ms_since_previous }`
- `exercise_attempted { exercise_id, type, grade, attempt_number, time_ms }`
- `exercise_completed { exercise_id, type, final_grade }`
- `lesson_completed { lesson_id, total_time_ms, avg_grade }`
- `review_item_due { item_type, item_id }` (quando aparece para o aluno)
- `review_attempted { item_type, item_id, grade, stage_before, stage_after }`
- `speaking_session_started { mode, level }`
- `speaking_turn { tokens_in, tokens_out, cache_hit, user_words, latency_ms }`
- `pronunciation_attempted { expected, wer, score, problem_words_count }`
- `self_assessment_submitted { unit_id, confidence_map }`
- `streak_extended { days }`, `streak_broken { days }`

Todos também são persistidos em tabelas do Supabase quando pertinentes (fonte da verdade). Cópia vai para PostHog para análise ad-hoc.

### Dashboards
- **Saúde técnica**: Sentry + painel no Supabase Studio.
- **Saúde pedagógica**: SQL views dedicadas + dashboard interno em `/admin/analytics` (pode ser Metabase/Grafana conectado direto ao Postgres em fase 2).
- **Custo de IA por aluno ativo/mês**: alvo ≤ US$ 1; alerta em 0.8.

### Retenção de dados
- Gravações de áudio do aluno: 90 dias em Storage (exceto se o aluno opta-in por "manter histórico"). Política em [knowledge/08-regras-de-negocio.md](../knowledge/08-regras-de-negocio.md).
- Logs técnicos: 30 dias.
- Eventos pedagógicos em Postgres: indefinido (dado do domínio).
- PII mínima — eventos não carregam conteúdo pessoal além do necessário.

### Privacidade e LGPD
- Consentimento no onboarding para analytics (opt-out respeitado).
- Exclusão de conta: apaga dados pessoais; mantém agregados anonimizados.
- Política em `/privacy` (TODO de produto).

## Alternativas consideradas

- **Datadog / New Relic** — excelentes, caros para o estágio.
- **Only Supabase Logs + SQL** — suficiente para técnico, fraco para produto/UX analytics e funis.
- **Mixpanel / Amplitude** — comparáveis ao PostHog; este escolhido pela opção self-hosted e integração com feature flags.

## Consequências

### Positivas
- Decisões pedagógicas passam a ser embasadas (ex.: se 60% abandonam na seção Grammar da Lesson 3, a seção precisa ser redesenhada).
- Custo de IA visível antes de virar problema.
- Sentry evita bugs silenciosos em produção.

### Negativas / Custos aceitos
- PostHog e Sentry adicionam dependências externas. PostHog self-hosted só se crescermos.
- Telemetria precisa ser instrumentada consistentemente. Padronizamos via helper `track(event, props)` no `lib/analytics/`.

### Neutras / Impactos
- Eventos alimentam recomendações da SRS e do recomendador de revisão ([ADR-006](006-spaced-repetition.md), [knowledge/10-ai-personas-e-prompts.md](../knowledge/10-ai-personas-e-prompts.md)).
- Schema em [knowledge/07-modelo-de-dominio.md](../knowledge/07-modelo-de-dominio.md).

## Referências
- https://docs.sentry.io/
- https://posthog.com/docs
