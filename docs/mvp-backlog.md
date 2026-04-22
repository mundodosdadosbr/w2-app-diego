# MVP Backlog — Roadmap priorizado

> Plano de entrega do MVP em 5 milestones (M0 → M4). Cada milestone tem objetivo claro, entregável verificável e estimativa relativa. Stories ligadas a [use-cases/](use-cases/), [adr/](adr/), [knowledge/](knowledge/) e [constitution.md](constitution.md).

## Objetivo do MVP

**Entregar plataforma web funcional** onde um aluno brasileiro iniciante consegue:
1. Cadastrar-se e calibrar o nível.
2. Completar lessons com INPUT → OUTPUT → REVIEW.
3. Praticar speaking com tutor IA (pt-BR friendly, en-US alvo).
4. Receber feedback de pronúncia por palavra.
5. Ter revisão espaçada automática.
6. Acompanhar progresso em skills.

**Escopo de conteúdo**: 2 unidades completas no seed (Unit 01 Greetings + Unit 02 Food & Drinks) + infraestrutura para autores criarem as próximas 8.

**Público-alvo do launch**: 100 alunos beta fechado.

## Release plan

| Milestone | Objetivo | Entregável verificável | Duração alvo |
|---|---|---|---|
| **M0 — Foundation** | Infra, schema, auth | Dev pode criar conta e ver dashboard vazio | 2 semanas |
| **M1 — First lesson** | Player + autoria + 1 lesson completa no seed | Aluno completa uma lesson end-to-end (sem IA ainda) | 3 semanas |
| **M2 — Progression** | SRS + self-assessment + trilha + 2 unidades completas | Aluno avança trilha, faz revisões, submete self-assessment | 2 semanas |
| **M3 — AI features** | Speaking + Pronunciation + Recommender | Aluno tem experiência AI completa em en-US | 3 semanas |
| **M4 — Launch-ready** | Observabilidade + jobs + polish + LGPD | Produto recebe 100 primeiros alunos beta | 2 semanas |

**Total**: ~12 semanas (~3 meses). Estimativas são **ordens de grandeza** para planejamento, não commitments.

## Convenções

- **Prioridade**: `P0` (bloqueia milestone) · `P1` (importante mas adiável dentro do MVP) · `P2` (pós-MVP).
- **Estimativa**: dias de dev estimados (1 dev full-time). Sizing relativo; iterar após primeiras entregas.
- **Deps**: stories que precisam estar prontas antes.
- **Aceitação**: critério binário para considerar "done".
- Cada story tem link para UCs/ADRs/knowledges relevantes.

---

# M0 — Foundation (2 semanas)

**Objetivo**: Base técnica operacional. Sem isso, nada roda.

## Epic 1 — Scaffold do repositório

### 1.1 Inicializar Next.js 15 + TypeScript strict + Tailwind + shadcn
- **P**: P0 · **E**: 1d
- Estrutura de pastas conforme [ADR-011](adr/011-estrutura-do-repositorio.md).
- `tsconfig` strict, path alias `@/`.
- Tailwind configurado + dark mode.
- shadcn/ui com ~10 componentes base (Button, Input, Card, Tabs, Dialog, Toast, Progress, RadioGroup, Checkbox, Select).
- **Aceitação**: `pnpm dev` roda; página inicial renderiza; `pnpm build` passa sem erro.

### 1.2 Configurar ESLint, Prettier, Vitest, Playwright
- **P**: P0 · **E**: 0.5d · **Deps**: 1.1
- Configs mínimas; CI skeleton.
- **Aceitação**: `pnpm lint`, `pnpm test`, `pnpm test:e2e` executam (podem não ter testes ainda).

### 1.3 GitHub Actions CI básico
- **P**: P0 · **E**: 0.5d · **Deps**: 1.2
- Workflow: typecheck + lint + unit tests em PRs.
- **Aceitação**: PR mostra checks passando.

## Epic 2 — Infraestrutura Supabase

### 2.1 Supabase CLI local + link ao projeto `ucbbhymgflujbtcopaeb`
- **P**: P0 · **E**: 0.5d
- `supabase init`, `supabase link`.
- `.env.example` com shape de todas as chaves esperadas.
- **Aceitação**: `supabase start` sobe local; `supabase db pull` funciona.

### 2.2 Criar buckets Storage
- **P**: P0 · **E**: 0.3d · **Deps**: 2.1
- `tts-cache` (public), `stt-uploads` (privado, TTL 7d), `recordings` (privado, TTL 90d).
- Ver [ADR-019](adr/019-aws-auth.md) (buckets S3 da AWS) e Supabase Storage ([ADR-002](adr/002-backend-supabase.md)).
- **Decisão pendente**: TTS cache fica em Supabase Storage ou em S3 AWS? Recomendo Supabase Storage para TTS (CDN nativo, mesmo stack); S3 AWS só para STT uploads e recordings (necessário para Transcribe).
- **Aceitação**: buckets criados via migration; lifecycle policies configuradas.

## Epic 3 — Infraestrutura AWS (CDK)

### 3.1 CDK project + stack base us-east-1
- **P**: P0 · **E**: 1d
- CDK em TypeScript em `infra/`.
- Stack: buckets S3 (`w2-stt-uploads`, `w2-recordings`), IAM user `w2-edge-function-runtime` com policy de [ADR-019](adr/019-aws-auth.md).
- **Aceitação**: `cdk synth` gera template; deploy manual em conta dev funciona.

### 3.2 Validar acesso Bedrock e Transcribe
- **P**: P0 · **E**: 0.3d · **Deps**: 3.1
- Script `scripts/aws-smoke-test.ts` chama `InvokeModel` em Claude Haiku e `StartTranscriptionJob` com WAV de teste.
- **Aceitação**: smoke test passa.

### 3.3 Secrets rotation runbook
- **P**: P1 · **E**: 0.3d · **Deps**: 3.1
- Docs em `docs/operations/secrets-rotation.md`.
- **Aceitação**: runbook listado no calendário trimestral.

## Epic 4 — Schema e RLS

### 4.1 Migration `0001_extensions_and_enums.sql`
- **P**: P0 · **E**: 0.5d · **Deps**: 2.1
- Habilita `pg_cron`, `pgtap`, `moddatetime`. Cria enums de [knowledge/07](knowledge/07-modelo-de-dominio.md).
- **Aceitação**: `supabase db push` local aplica; `SELECT extname FROM pg_extension` mostra extensões.

### 4.2 Migration `0002_content_schema.sql`
- **P**: P0 · **E**: 1.5d · **Deps**: 4.1
- Tabelas `units`, `unit_objectives`, `unit_versions`, `lessons`, `lesson_sections`, `lesson_versions`, `vocabulary_items`, `phrase_patterns`, `grammar_points`, `dialog_lines`, `exercises`, joins `lesson_vocabulary` etc.
- Triggers `moddatetime` para `updated_at`.
- Ver [knowledge/07](knowledge/07-modelo-de-dominio.md) e [ADR-008](adr/008-conteudo-e-versionamento.md).
- **Aceitação**: schema criado; CRUD funcional via Studio; tipos TS gerados com `supabase gen types typescript`.

### 4.3 Migration `0003_user_schema.sql`
- **P**: P0 · **E**: 1d · **Deps**: 4.1
- Tabelas `profiles` (trigger para criar após `auth.users`), `learning_path_progress`, `unit_progress`, `lesson_progress`, `exercise_attempts`, `speaking_sessions`, `speaking_turns`, `pronunciation_attempts`, `reviews`, `self_assessments`, `self_assessment_items`, `skill_checkpoints`, `streaks`, `points_ledger`, `ai_usage`, `audit_log`.
- Índices de [knowledge/07](knowledge/07-modelo-de-dominio.md).
- **Aceitação**: cadastro novo cria `profiles` automaticamente; tabelas prontas.

### 4.4 Migration `0004_rls_policies.sql`
- **P**: P0 · **E**: 1.5d · **Deps**: 4.2, 4.3
- Todas as policies conforme [ADR-003](adr/003-rls-e-autorizacao.md).
- Conteúdo published: SELECT para `authenticated`. INSERT/UPDATE/DELETE por author/reviewer/admin.
- Dados do aluno: `user_id = auth.uid()`.
- Admin SELECT com audit.
- **Aceitação**: todas tabelas com RLS habilitada; nenhuma `USING (true)` solta.

### 4.5 Testes pgTAP para RLS
- **P**: P0 · **E**: 1.5d · **Deps**: 4.4
- Um arquivo de teste por tabela sensível em `supabase/tests/policies/`.
- Dois usuários sintéticos; testes cross-user esperados para falhar.
- Ver [ADR-014](adr/014-estrategia-de-testes.md).
- **Aceitação**: `supabase test db` passa; cobertura 100% das tabelas com RLS.

### 4.6 Funções SQL críticas
- **P**: P0 · **E**: 1d · **Deps**: 4.3
- `publish_lesson(lesson_id)`, `complete_lesson(user_id, lesson_version_id)`, `apply_review_grade(review_id, grade)`, `refresh_streak(user_id)`.
- Ver [knowledge/08](knowledge/08-regras-de-negocio.md), [UC-02](use-cases/UC-02-completar-lesson.md), [UC-05](use-cases/UC-05-revisao.md), [UC-08](use-cases/UC-08-publicar-lesson.md).
- **Aceitação**: funções criadas; testes pgTAP cobrem casos felizes e bordas.

## Epic 5 — Auth e middleware

### 5.1 Supabase Auth Next.js setup (`@supabase/ssr`)
- **P**: P0 · **E**: 1d · **Deps**: 4.3
- `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts` refresh de sessão.
- Ver [ADR-010](adr/010-estado-frontend.md).
- **Aceitação**: `getUser()` server-side funciona em Server Components.

### 5.2 Rotas `/signup`, `/login`, `/logout`, `/reset`
- **P**: P0 · **E**: 1d · **Deps**: 5.1
- Forms com React Hook Form + Zod.
- Email/senha + magic link.
- Aceite de termos (privacidade, gravações).
- **Aceitação**: cadastro → confirmação de email → login → redirect pra `/onboarding/welcome`.

### 5.3 Rota protection via middleware
- **P**: P0 · **E**: 0.3d · **Deps**: 5.1
- `/app/*` e `/admin/*` redirecionam para `/login` se não autenticado.
- **Aceitação**: aluno desconectado em `/dashboard` vai para login.

**M0 total estimado**: ~13 dias

---

# M1 — First lesson (3 semanas)

**Objetivo**: Aluno completa uma lesson end-to-end com exercícios interativos, sem IA ainda.

## Epic 6 — Onboarding e teste de nível

### 6.1 Fluxo de onboarding
- **P**: P0 · **E**: 2d · **Deps**: 5.2, 4.3 · **UC**: [UC-01](use-cases/UC-01-primeira-entrada.md)
- Telas `/onboarding/welcome`, `/onboarding/level-test`, `/onboarding/path`, `/onboarding/goal`, `/onboarding/microphone`.
- Teste de nível 5-8 perguntas (conteúdo seed fixo) calibrando A0/A1/A2.
- Meta semanal slider.
- Permissão de microfone via Web API.
- **Aceitação**: fluxo completo salva `cefr_level`, meta e `onboarded_at` em `profiles`.

### 6.2 Dashboard inicial vazio
- **P**: P0 · **E**: 1d · **Deps**: 6.1 · **UC**: [UC-07](use-cases/UC-07-acompanhar-progresso.md)
- `/dashboard` com header (nome, streak 0, pontos 0), card "Estudar hoje" com CTA para Unit 01 Lesson 01.
- **Aceitação**: aluno vê dashboard pós-onboarding com próxima lesson destacada.

## Epic 7 — Autoria mínima viável

### 7.1 Admin CRUD básico de units e lessons
- **P**: P0 · **E**: 3d · **Deps**: 4.2
- `/admin/units` (lista + criar/editar), `/admin/lessons/[id]/edit`.
- Editor estruturado por seção canônica ([knowledge/04](knowledge/04-anatomia-da-lesson.md)).
- Submit → `status='review'`.
- **Aceitação**: autor cria lesson draft com todas as 13 seções.

### 7.2 Fluxo de publicação
- **P**: P0 · **E**: 1d · **Deps**: 7.1, 4.6 · **UC**: [UC-08](use-cases/UC-08-publicar-lesson.md)
- `/admin/queue` para reviewer aprovar.
- Função `publish_lesson` cria `lesson_version`.
- **Aceitação**: lesson publicada fica visível pro aluno; progresso de quem estava na versão anterior não quebra.

### 7.3 Checagem de similaridade (anti-plagiarism)
- **P**: P1 · **E**: 1d · **Deps**: 7.1 · **UC**: [UC-08](use-cases/UC-08-publicar-lesson.md)
- Script que compara n-grams (7+ palavras) do draft contra `Apostila En.md` e flagea.
- Roda no submit-for-review.
- Ver [ADR-009](adr/009-copyright-e-ip.md), [knowledge/14](knowledge/14-guardrails-copyright.md).
- **Aceitação**: trecho copiado da apostila é flagado; trecho original passa.

### 7.4 Seed programático da Unit 01 Lesson 01
- **P**: P0 · **E**: 2d · **Deps**: 7.1
- Arquivo JSON em `supabase/seed/content/unit-01-greetings/lesson-01-hello-and-hi.json` + script que insere via API.
- **Conteúdo 100% original em en-US** — criado manualmente (ou com IA revisada) respeitando [knowledge/14](knowledge/14-guardrails-copyright.md).
- **Aceitação**: seed roda local; lesson visível como `published`.

## Epic 8 — Player de lesson (sem IA)

### 8.1 Shell do player
- **P**: P0 · **E**: 2d · **Deps**: 7.4, 4.3 · **UC**: [UC-02](use-cases/UC-02-completar-lesson.md)
- `/lesson/[slug]` com navegação entre 13 seções.
- PhaseBadge INPUT/OUTPUT/REVIEW ([knowledge/13](knowledge/13-ux-principios.md)).
- Progress bar.
- Zustand store local + persistência via Server Actions ([ADR-010](adr/010-estado-frontend.md)).
- **Aceitação**: aluno navega entre seções; estado salvo em `lesson_progress`.

### 8.2 Seções INPUT (Verbs, New Words, Handy Phrases, Grammar)
- **P**: P0 · **E**: 2d · **Deps**: 8.1
- Cards com áudio (placeholder até TTS real em M3), tradução toggle, interação mínima.
- Cria `reviews` com `stage='d1'` ao primeiro contato.
- **Aceitação**: aluno passa pelas 4 seções; reviews criadas.

### 8.3 Seção In context (diálogo)
- **P**: P0 · **E**: 1d · **Deps**: 8.1
- Diálogo com speakers distintos; áudio + tradução toggle.
- **Aceitação**: diálogo renderiza e áudio toca (placeholder).

### 8.4 Componentes de exercício (10 tipos)
- **P**: P0 · **E**: 5d · **Deps**: 8.1 · **Knowledge**: [05](knowledge/05-catalogo-de-exercicios.md)
- `multiple_choice`, `fill_blank`, `word_order`, `match_word_image`, `match_en_pt`, `short_answer` (validação regex no M1, LLM em M3), `build_sentence` (mesma), `review_quiz`, `listen_and_number`, `shadow_repeat` (placeholder sem STT no M1).
- Cada exercício grava `exercise_attempts` com grade.
- **Aceitação**: 10 tipos renderizam; grade persiste; feedback instantâneo.

### 8.5 Drill e Speak now (versão sem IA)
- **P**: P0 · **E**: 1.5d · **Deps**: 8.4
- Drill usa tipos de 8.4.
- Speak now em modo "texto livre" com validação exact/fuzzy-match até IA chegar em M3.
- **Aceitação**: aluno produz frases; grade calculado.

### 8.6 Recap e Self-check
- **P**: P0 · **E**: 1d · **Deps**: 8.4
- Recap quiz cumulativo.
- Self-check com 2-3 toggles "I can".
- **Aceitação**: seções funcionam; completude muda `lesson_progress.status`.

### 8.7 Tela de conclusão de lesson
- **P**: P0 · **E**: 0.5d · **Deps**: 8.6
- Celebração ≤ 1s, resumo (tempo, acertos), CTA próxima.
- **Aceitação**: aparece ao concluir; +50 pts registrados.

**M1 total estimado**: ~22 dias

---

# M2 — Progression (2 semanas)

**Objetivo**: Aluno avança pela trilha, revisa, submete self-assessment. 2 unidades completas no seed.

## Epic 9 — Revisão espaçada (SRS)

### 9.1 Algoritmo SM-2 simplificado
- **P**: P0 · **E**: 1.5d · **Deps**: 4.6 · **ADR**: [006](adr/006-spaced-repetition.md)
- `lib/srs/` com funções puras; testes unitários cobrindo todos os cases de grade 0-5.
- **Aceitação**: testes cobrem avanço, manutenção, regressão e masterização.

### 9.2 Criação automática de reviews
- **P**: P0 · **E**: 1d · **Deps**: 9.1, 4.6 · **UC**: [UC-02](use-cases/UC-02-completar-lesson.md), [UC-05](use-cases/UC-05-revisao.md)
- Trigger Postgres em `exercise_attempts`: grade ≤ 2 upserta `reviews` com `due_at=now`.
- Primeira exposição no player cria review `d1`.
- **Aceitação**: erro em drill cria review; item novo visto cria review futuro.

### 9.3 Review Center (UI)
- **P**: P0 · **E**: 2d · **Deps**: 9.2 · **UC**: [UC-05](use-cases/UC-05-revisao.md)
- `/review` hub + `/review/session` execução + `/review/complete` resumo.
- Breakdown por stage com cores.
- Limite diário 20 (configurável).
- **Aceitação**: aluno faz sessão completa; reviews atualizadas; +5pts por correto.

## Epic 10 — Trilha e unidades

### 10.1 Trilha visual `/trilha`
- **P**: P0 · **E**: 2d · **Deps**: 8.7 · **UC**: [UC-07](use-cases/UC-07-acompanhar-progresso.md)
- Mapa de 10 units (lock/current/done).
- Desbloqueio sequencial.
- **Aceitação**: trilha renderiza; estado reflete `learning_path_progress`.

### 10.2 Unit cover `/unit/[slug]`
- **P**: P0 · **E**: 1d · **Deps**: 10.1
- Objetivos "I can", lista de lessons, Recap link, Self-assessment link.
- **Aceitação**: aluno vê overview da unit; destravamento reflete lesson_progress.

### 10.3 Recap da Unit
- **P**: P0 · **E**: 1d · **Deps**: 9.1, 8.4
- Exercícios cumulativos + 1-2 tarefas de Fluency (placeholder sem IA).
- **Aceitação**: recap avalia; destrava Self-assessment.

## Epic 11 — Self-assessment

### 11.1 Self-assessment UI e submit
- **P**: P0 · **E**: 2d · **Deps**: 10.3 · **UC**: [UC-06](use-cases/UC-06-self-assessment.md)
- `/self-assessment/[unitSlug]` com checklist 3-state (can / not_sure / cant_yet).
- Submit: insere `self_assessments` + cria reviews imediatos/em 3d conforme respostas.
- +200 pts; destrava próxima unit.
- **Aceitação**: submit gera reviews esperados; unit_progress completa.

## Epic 12 — Seed completo de 2 unidades

### 12.1 Unit 01 Greetings (4 lessons + Recap + Self-assessment)
- **P**: P0 · **E**: 4d · **Deps**: 7.4
- Conteúdo original em en-US: vocab, phrases, grammar, diálogos, exercícios (drills + speak_now prompts), pronunciation targets.
- Checklist de copyright validado.
- **Aceitação**: aluno faz unit 01 inteira; todos os tipos de exercício aparecem ao menos 1×.

### 12.2 Unit 02 Food & Drinks (4 lessons + Recap + Self-assessment)
- **P**: P0 · **E**: 4d · **Deps**: 12.1
- Mesmo padrão, tema food.
- **Aceitação**: aluno transita unit 01 → 02 sem fricção.

## Epic 13 — Streaks e pontos

### 13.1 Sistema de streak com job diário
- **P**: P0 · **E**: 1d · **Deps**: 4.3 · **Knowledge**: [09](knowledge/09-gamificacao-e-progresso.md)
- `pg_cron` diário às 00:05 (UTC; por simplicidade MVP usa UTC, timezone local em fase 2).
- `streaks.current_count` reseta se sem atividade qualificante.
- Freeze tokens.
- **Aceitação**: streak incrementa; pula dia com freeze; reseta sem.

### 13.2 Points ledger e níveis de gamificação
- **P**: P0 · **E**: 1d · **Deps**: 4.3
- Escrita em `points_ledger` via triggers e nas funções SQL críticas.
- Cálculo de nível cosmético (Starter → Pro).
- **Aceitação**: pontos refletem eventos corretos; anti-farming (1× por exercise/dia).

**M2 total estimado**: ~20 dias

---

# M3 — AI features (3 semanas)

**Objetivo**: experiência de IA completa — speaking partner, pronunciation coach, corretor de frases, recomendador.

## Epic 14 — LLM client (Bedrock)

### 14.1 Interface `LlmClient` e `BedrockLlmClient`
- **P**: P0 · **E**: 2d · **Deps**: 3.2 · **ADR**: [017](adr/017-llm-amazon-bedrock.md)
- `lib/llm/client.ts` com `invoke(persona, variables, {stream})` → `{text, tokensIn, tokensOut, cacheHit, cost}`.
- Implementação via AWS SDK Bedrock Runtime.
- Prompt caching via `cachePoint` blocks.
- Logging em `ai_usage`.
- **Aceitação**: smoke call com tutor persona retorna resposta; ai_usage registrado.

### 14.2 Persona registry
- **P**: P0 · **E**: 1.5d · **Deps**: 14.1 · **Knowledge**: [10](knowledge/10-ai-personas-e-prompts.md)
- `lib/llm/prompts/` com arquivos TS exportando system prompt + metadados de cada persona (`tutor`, `speaking_partner`, `corrector`, `recommender`, `pronunciation_feedback`).
- Template engine simples para variáveis.
- **Aceitação**: cada persona chamável; prompts em arquivos revisáveis.

### 14.3 Eval harness
- **P**: P1 · **E**: 2d · **Deps**: 14.2 · **ADR**: [014](adr/014-estrategia-de-testes.md)
- `tests/evals/` com casos + rubric LLM-as-judge.
- Roda nightly + em PRs que tocam prompts.
- **Aceitação**: eval harness executa; degradação ≥ 5% dispara issue.

## Epic 15 — Speaking Practice

### 15.1 Edge Function `llm-invoke`
- **P**: P0 · **E**: 1.5d · **Deps**: 14.1 · **UC**: [UC-04](use-cases/UC-04-speaking-session.md)
- Deno runtime; chamadas Bedrock com credenciais AWS.
- Streaming (`ConverseStream`).
- **Aceitação**: cliente consome stream; persiste `speaking_turns`.

### 15.2 Chat UI `/speaking` + integração com Pair practice
- **P**: P0 · **E**: 3d · **Deps**: 15.1
- Hub com 4 modos (short_answer, open_conversation, role_play, fluency).
- Chat com streaming de resposta.
- Integração com Pair practice da lesson.
- Correção no hover (via JSON estruturado da Sonnet).
- **Aceitação**: aluno faz sessão de 5 turnos; correções renderizam; speaking_sessions persistido.

### 15.3 Limite diário de speaking
- **P**: P1 · **E**: 0.3d · **Deps**: 15.1
- 30 min/dia/aluno. Ver [knowledge/08](knowledge/08-regras-de-negocio.md).
- **Aceitação**: ao atingir, UI mostra "volta amanhã".

## Epic 16 — Pronunciation Coach

### 16.1 Edge Function `stt-prepare` (presigned URL)
- **P**: P0 · **E**: 0.5d · **Deps**: 3.1 · **UC**: [UC-03](use-cases/UC-03-pronunciation-attempt.md)
- Gera presigned PUT S3 `w2-stt-uploads`.
- **Aceitação**: cliente faz upload direto ao S3.

### 16.2 Edge Function `stt-transcribe`
- **P**: P0 · **E**: 2d · **Deps**: 16.1 · **ADR**: [016](adr/016-stt-amazon-transcribe.md)
- Amazon Transcribe com `EnableWordLevelConfidence`, custom vocabulary da lesson.
- Parse + alinhamento Levenshtein.
- Score combinado `WER × 0.8 + (1 - avg_confidence) × 40`.
- Chama persona `pronunciation_feedback` para dica em pt-BR.
- Move áudio para `w2-recordings` se score ≥ 60.
- **Aceitação**: gravação de 5s → JSON com score e problem_words em ≤ 8s.

### 16.3 UI Pronunciation coach
- **P**: P0 · **E**: 2d · **Deps**: 16.2 · **Knowledge**: [11](knowledge/11-pronunciation-coach.md)
- Botões 🔊 / 🐢 / 🎤, waveform, resultado com cores por palavra.
- Chunks sugeridos quando score < 80.
- Standalone `/pronunciation` + seção da lesson.
- **Aceitação**: aluno grava, recebe score colorido, pode tentar de novo.

### 16.4 Custom vocabulary Transcribe por lesson
- **P**: P1 · **E**: 1d · **Deps**: 16.2, 7.2
- Trigger pós-publish cria/atualiza vocabulary no Transcribe com vocabulário da lesson.
- **Aceitação**: palavra ensinada reconhecida melhor em teste A/B.

## Epic 17 — TTS pré-gerado

### 17.1 Edge Function `tts-pregen`
- **P**: P0 · **E**: 2d · **Deps**: 7.2 · **UC**: [UC-09](use-cases/UC-09-pregerar-tts.md)
- Acionada por fila (pgmq) pós-publish.
- Itera speakable strings, chama ElevenLabs, cacheia em Supabase Storage `tts-cache/`.
- Chave determinística por hash.
- **Aceitação**: publicar lesson gera todos os áudios; segunda publicação (mesmo texto) hit 100% cache.

### 17.2 Edge Function `tts-speak` (runtime fallback)
- **P**: P0 · **E**: 1d · **Deps**: 17.1
- Para áudios não pré-gerados (resposta dinâmica de tutor IA).
- **Aceitação**: retorna URL de áudio em < 3s.

### 17.3 Substituir placeholders de áudio no player
- **P**: P0 · **E**: 1d · **Deps**: 17.1, 8.2, 8.3
- AudioPlayer aponta para `audio_key` resolvido para URL pública.
- **Aceitação**: todas as seções da lesson tocam áudio real.

## Epic 18 — Corretor e recomendador

### 18.1 Edge Function `correct-sentence` (persona `corrector`)
- **P**: P0 · **E**: 1.5d · **Deps**: 14.1
- Avalia `short_answer` e `build_sentence` com grade + feedback JSON.
- Substitui validação regex de M1 em exercícios abertos.
- **Aceitação**: `build_sentence` usa LLM; feedback mostra correct_alternative e encouragement.

### 18.2 Edge Function `recommend-review-plan` (persona `recommender`)
- **P**: P1 · **E**: 1.5d · **Deps**: 14.1 · **UC**: [UC-06](use-cases/UC-06-self-assessment.md)
- Acionada pós-submit self-assessment.
- Gera plan JSON; salva em `user_reviews_plan`.
- **Aceitação**: self-assessment com "can't yet" gera plano com priority_items.

## Epic 19 — Skill checkpoints e radar

### 19.1 Cálculo de skill_checkpoints
- **P**: P1 · **E**: 1d · **Deps**: 4.6
- Trigger pós lesson_progress.completed_at + self_assessment: avalia critérios e cria checkpoint.
- **Aceitação**: concluir Unit 01 com "I can" em todos → checkpoint "greetings" criado.

### 19.2 Skills radar no `/profile`
- **P**: P1 · **E**: 2d · **Deps**: 19.1 · **UC**: [UC-07](use-cases/UC-07-acompanhar-progresso.md)
- Gráfico radar 6 dimensões.
- Média móvel últimos 14 dias.
- **Aceitação**: radar reflete atividade do aluno.

**M3 total estimado**: ~25 dias

---

# M4 — Launch-ready (2 semanas)

**Objetivo**: produto recebe 100 primeiros alunos beta — observável, privado, polido.

## Epic 20 — Observabilidade

### 20.1 Sentry (frontend + Edge Functions)
- **P**: P0 · **E**: 1d · **ADR**: [012](adr/012-observabilidade-e-analytics.md)
- **Aceitação**: erros em prod aparecem em Sentry; sample rate 10%.

### 20.2 PostHog + eventos pedagógicos
- **P**: P0 · **E**: 2d
- Helper `lib/analytics/track(event, props)`.
- Instrumentar todos os eventos obrigatórios dos UCs ([ADR-012](adr/012-observabilidade-e-analytics.md)).
- **Aceitação**: dashboard PostHog mostra funil onboarding + lesson completion.

### 20.3 Dashboard de custo IA
- **P**: P0 · **E**: 1d
- View SQL sobre `ai_usage` com custo por aluno/dia/mês.
- `/admin/ai-usage` simples.
- Alert se > US$ 1/aluno/mês.
- **Aceitação**: custo visível; threshold gatilha email manual.

## Epic 21 — Jobs operacionais

### 21.1 Job purge recordings (UC-10)
- **P**: P0 · **E**: 1d · **Deps**: 3.1 · **UC**: [UC-10](use-cases/UC-10-purgar-gravacoes.md)
- SQL function + Edge Function + pg_cron diário.
- S3 lifecycle 90d como defesa em profundidade.
- **Aceitação**: áudio > 90d deletado; metadata preservada.

### 21.2 Job recompute_due_reviews
- **P**: P1 · **E**: 0.5d · **Deps**: 9.1
- pg_cron a cada 6h — catch-up se algum trigger falhou.
- **Aceitação**: idempotente; count de reviews devidos bate.

### 21.3 AWS Budgets alert
- **P**: P0 · **E**: 0.3d · **Deps**: 3.1
- US$ 50/mês na conta AWS, email ao admin.
- **Aceitação**: alert configurado e testado via budget simulation.

## Epic 22 — Privacidade e LGPD

### 22.1 Política de privacidade e termos
- **P**: P0 · **E**: 1d
- Páginas estáticas `/privacy`, `/terms`.
- Revisão jurídica (externa no MVP se necessário).
- **Aceitação**: link visível em onboarding e footer.

### 22.2 Exclusão de conta manual (via ticket)
- **P**: P0 · **E**: 0.5d
- Formulário `/account/delete-request` envia email ao admin.
- Admin executa runbook `docs/operations/delete-account.md`.
- Fase 2: automatizar.
- **Aceitação**: fluxo funciona end-to-end.

### 22.3 Opt-in/out granular
- **P**: P0 · **E**: 1d
- `/settings/privacy` com toggles: analytics, keep_recordings_indefinitely, email_marketing.
- **Aceitação**: toggles persistem em `profiles`; analytics respeita.

## Epic 23 — Polish e launch checklist

### 23.1 Revisão de acessibilidade (WCAG AA)
- **P**: P0 · **E**: 2d
- axe-core em Playwright; correção de violações críticas.
- Teste manual por teclado de fluxos principais.
- **Aceitação**: zero violações críticas em UCs 01-07.

### 23.2 Testes e2e dos UCs P0
- **P**: P0 · **E**: 3d
- Um teste Playwright por UC do [use-cases/](use-cases/).
- IA mockada em fixtures.
- **Aceitação**: 10 testes passam em preview deploy.

### 23.3 Performance audit
- **P**: P1 · **E**: 1d
- Lighthouse mobile em páginas críticas; alvo: Performance ≥ 85.
- **Aceitação**: relatório entregue; otimizações Quick-Wins aplicadas.

### 23.4 Dark mode e mobile polish
- **P**: P1 · **E**: 1d · **Knowledge**: [13](knowledge/13-ux-principios.md)
- Toggle dark mode; teste em viewports mobile.
- **Aceitação**: todas as páginas legíveis em ambos os modos.

### 23.5 Launch checklist review
- **P**: P0 · **E**: 0.5d
- Checklist abaixo revisto com Diego.

**M4 total estimado**: ~15 dias

---

## Grafo de dependências (simplificado)

```
M0 (foundation) → M1 (lesson) → M2 (progression) → M3 (AI) → M4 (launch)

Dentro de M0:
  1.1 → 1.2 → 1.3
  2.1 → 2.2
  2.1 → 4.1 → 4.2, 4.3 → 4.4 → 4.5
                  4.3 → 4.6
  3.1 → 3.2, 3.3
  4.3 → 5.1 → 5.2 → 5.3

Dentro de M1:
  5.2 + 4.3 → 6.1 → 6.2
  4.2 → 7.1 → 7.2 (+ 4.6), 7.3
         7.1 → 7.4
  7.4 + 4.3 → 8.1 → 8.2, 8.3
              8.1 → 8.4 → 8.5, 8.6 → 8.7

Dentro de M2:
  4.6 → 9.1 → 9.2 → 9.3
  8.7 → 10.1 → 10.2
  9.1 + 8.4 → 10.3 → 11.1
  7.4 → 12.1 → 12.2
  4.3 → 13.1, 13.2

Dentro de M3:
  3.2 → 14.1 → 14.2 → 14.3
  14.1 → 15.1 → 15.2, 15.3
  3.1 → 16.1 → 16.2 → 16.3, 16.4
  7.2 → 17.1 → 17.2, 17.3
  14.1 → 18.1, 18.2
  4.6 → 19.1 → 19.2

Dentro de M4:
  (paralelo) 20.1, 20.2, 20.3
  3.1 → 21.1, 21.3; 9.1 → 21.2
  (paralelo) 22.1, 22.2, 22.3
  23.1, 23.2, 23.3, 23.4, 23.5
```

---

## Out of scope (pós-MVP)

Explicitamente **não** entram no MVP para manter escopo. Cada item é candidato a pós-launch:

| Categoria | Item |
|---|---|
| **Plataforma** | App nativo iOS/Android |
| **Pedagogia** | en-GB, outros idiomas da UI (es, en), níveis B1+ |
| **Social** | Turmas, ranking público, convites, messaging |
| **Conteúdo** | Units 03-10 completas (MVP entrega 1-2 + esqueletos) |
| **IA** | Nova Sonic (speech-to-speech ao vivo), Azure Pronunciation Assessment |
| **Autoria** | Editor visual rico, rejeição formal com comentários (MVP é manual), sugestões de drill por IA |
| **Monetização** | Planos, assinaturas, pagamento, paywall |
| **Certificação** | Certificado gerado, integração LinkedIn |
| **Gamificação** | Desafios semanais automáticos, badges extras, multiplayer |
| **Analytics** | Relatório semanal por email |
| **Operacional** | Exclusão automatizada (MVP é via ticket), Cognito+STS (MVP é IAM user), self-service de secrets |

---

## Risk register

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| **Custo IA > US$ 1/aluno/mês** | Média | Alto | Cache hit ≥ 80%; dashboard de custo (Epic 20.3); budget alert AWS (21.3); throttle por aluno ([knowledge/08](knowledge/08-regras-de-negocio.md)) |
| **Qualidade do scoring de pronúncia baixa para sotaque BR** | Média | Alto | Calibrar thresholds com alunos beta; fase 2 Azure Pronunciation Assessment |
| **Autores demoram pra criar 2 unidades originais** | Alta | Médio | Assistant de IA com supervisão ([ADR-008](adr/008-conteudo-e-versionamento.md)); template JSON bem definido; Diego pode ser autor inicial |
| **Bedrock delay de modelo novo Anthropic** | Baixa | Médio | Fallback Anthropic direta via mesma interface LlmClient |
| **Cache hit rate Bedrock abaixo do esperado** | Média | Médio | Monitorar; se < 70% em personas de alto volume, trocar para Anthropic direta |
| **RLS policy com bug vazando dados** | Baixa | Crítico | pgTAP obrigatório (Epic 4.5); code review focado |
| **IP infringement flag em conteúdo seed** | Baixa | Crítico | Similaridade check (7.3); checklist [knowledge/14](knowledge/14-guardrails-copyright.md); revisão humana |
| **LGPD compliance incompleta no launch** | Média | Alto | Epic 22 completa no M4; consentimento explícito desde onboarding |
| **UX mobile com problemas em iOS Safari** | Média | Alto | Teste em dispositivos reais no M4 polish; Web MediaRecorder quirks conhecidos |
| **Latência total speaking > 5s frustra aluno** | Média | Alto | Streaming habilitado; fallback otimista; medir e iterar |

---

## Launch checklist (M4 fim)

Antes de liberar para os 100 alunos beta:

### Produto
- [ ] 2 unidades completas publicadas e revisadas por humano.
- [ ] Todos os 10 UCs P0 testados end-to-end manualmente.
- [ ] Onboarding em < 5 min do clique inicial ao primeiro dashboard.
- [ ] Player de lesson completável em 10-15 min em mobile.
- [ ] Speaking de ao menos 5 turnos sem erro.
- [ ] Pronunciation coach com score em < 8s.
- [ ] Self-assessment com recommender gerando plano.

### Técnico
- [ ] CI passando em `main`.
- [ ] Testes e2e dos 10 UCs verdes.
- [ ] pgTAP de RLS passando.
- [ ] Sentry com zero erros críticos.
- [ ] Lighthouse mobile ≥ 85.
- [ ] Nenhuma violação WCAG crítica.
- [ ] Secrets AWS e providers atualizados e não expirados.

### Operacional
- [ ] pg_cron jobs rodando (streak, purge, recompute reviews).
- [ ] AWS Budgets alert configurado.
- [ ] Dashboard PostHog com eventos chegando.
- [ ] Dashboard custo IA acessível.
- [ ] Runbook de secrets rotation em `docs/operations/`.
- [ ] Runbook de exclusão de conta em `docs/operations/`.

### Legal e privacidade
- [ ] `/privacy` e `/terms` publicados e revisados.
- [ ] Consentimento no onboarding capturando aceite.
- [ ] Opt-in/out granular funcionando.
- [ ] LGPD: direito de exclusão operacional (via ticket).

### Constitution compliance
- [ ] Todos os 10 princípios respeitados em todos os fluxos.
- [ ] Checklist de copyright passado em todo conteúdo seed.
- [ ] Prompts IA incluem cláusula anti-plagiarism.
- [ ] Zero conteúdo derivado da apostila em produção.

---

## Governança do backlog

- Este documento é **vivo** — atualiza ao longo da execução.
- Stories concluídas: mover para "Done" no fim do arquivo OU trackear em tool externa (Linear/Jira/GitHub Projects). Recomendo **GitHub Projects** com labels M0-M4 e campos customizados refletindo as colunas desta doc.
- Reestimativas permitidas após cada milestone encerrado, baseadas no velocidade real.
- Mudanças de escopo durante MVP (adicionar story) exigem tirar outra de prioridade equivalente ou mover para pós-MVP — **total scope é fixo por milestone**.

## Referências

- [Constitution](constitution.md) — os 10 princípios.
- [ADR index](adr/README.md).
- [Knowledge index](knowledge/README.md).
- [Use Cases](use-cases/README.md).
