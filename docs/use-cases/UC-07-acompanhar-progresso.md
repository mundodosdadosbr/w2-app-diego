# UC-07 — Acompanhar progresso e skills

- **Ator**: Aluno
- **Objetivo**: Ver de forma clara onde está na trilha, que skills destravou, qual o streak, e onde precisa reforçar
- **Prioridade MVP**: P0
- **Última revisão**: 2026-04-21

## Trigger
- Aluno acessa `/dashboard` (após login ou a qualquer momento), **ou**
- Aluno acessa `/profile` para visão detalhada, **ou**
- Aluno acessa `/trilha` para visão mapa da jornada.

## Preconditions
- Aluno autenticado.
- `profiles`, `learning_path_progress`, `streaks` existem.

## Main flow

### Dashboard (`/dashboard`)

1. Server Component carrega em paralelo:
   - `profiles` (nome, CEFR level, pontos, meta semanal).
   - `streaks` (current, longest, freeze tokens, last_active_date).
   - `learning_path_progress` (current unit + lesson).
   - Contagem de `reviews` com `due_at ≤ now`.
   - Minutos estudados hoje + acumulados na semana corrente (TZ do aluno).
   - Últimos `skill_checkpoints` destravados.
2. UI renderiza:
   - **Header**: nome, streak (flame + número), pontos totais, avatar.
   - **Card "Estudar hoje"** — proeminente, mostra trilha sugerida:
     - Revisões devidas (até 10 min) — "Você tem N revisões".
     - Lesson atual (título + posição na unit) — "Continue: Lesson 3 da Unit 02".
     - Bônus opcional (speaking session de 3-5 min) se ainda resta tempo na meta.
   - **Anéis de progresso**:
     - Streak diário (completou atividade hoje?).
     - Meta semanal (minutos estudados/meta).
     - Fila de revisão (N/limite diário).
   - **Últimas conquistas** (3 skills mais recentes + badges novos).
   - **Atalhos**: Review Center, Speaking Practice, Pronunciation, Perfil.
3. Aluno interage clicando em qualquer card/atalho → disparador de outros UCs.

### Perfil (`/profile`)

4. Aluno abre `/profile`.
5. UI apresenta:
   - **Identity**: nome, email, level CEFR, gamification level (Starter → Pro).
   - **Skills radar** — gráfico radar com 6 dimensões (Vocabulary, Grammar, Listening, Speaking, Pronunciation, Conversation).
     - Cada dimensão 0-100, calculada como média móvel dos últimos 14 dias de `exercise_attempts + pronunciation_attempts + speaking_sessions` agrupados por tag.
     - Clicável → drill-down de lessons/reviews que reforçam aquela área.
   - **Skill checkpoints** — grid de competências destravadas ("Order food", "Introduce yourself", ...) com ✓, progresso parcial, ou trancado. Cada um com fonte (unit que destravou, evidência).
   - **Badges** conquistadas.
   - **Streak history** — heatmap GitHub-like dos últimos 60 dias.
   - **Pontos acumulados** + histórico recente de `points_ledger`.

### Trilha (`/trilha`)

6. Aluno abre `/trilha`.
7. UI mostra mapa visual das 10 units:
   - Units concluídas (✓ verde com self-assessment summary).
   - Unit atual (destaque, com mini-progress das lessons).
   - Units destravadas mas não iniciadas.
   - Units ainda trancadas (com tooltip "conclua a Unit X para destravar").
8. Click em unit abre `/unit/[slug]` com overview + lessons.

## Alternative flows

- **AF-1 — Primeiro dia / sem dados**: dashboard mostra "Você está começando — vamos lá!" com CTA direto para primeira lesson. Skill radar inicializa com zeros sem parecer negativo.
- **AF-2 — Sem revisões hoje**: card "Estudar hoje" mostra só lesson + bônus; Review Center card mostra "Você está em dia! 🎯".
- **AF-3 — Aluno perdeu streak**: toast discreto + oferta de freeze token se acumulado ≥ 1. Streak reseta para 0 se sem freeze.
- **AF-4 — Meta semanal não atingida no último domingo**: dashboard mostra "Semana anterior: X/Y min — quer ajustar sua meta?" sem culpar. Constitution P4.
- **AF-5 — Aluno pediu exclusão de conta** (pendente): dashboard mostra banner "Sua exclusão está agendada para DD/MM — cancelar?".
- **AF-6 — Modo aberto ativo**: trilha mostra todas as units destravadas; CTA muda para "Explorar".

## Postconditions

- Estado apenas exibido; nenhum estado novo criado (exceto page_view analytics).

## Telemetry

- `dashboard_viewed { today_plan_has_review: bool, today_plan_lesson_id, streak_count }`
- `profile_viewed`
- `trilha_viewed { current_unit_index }`
- `skill_radar_dimension_clicked { dimension }`
- `streak_lost { previous_count }` (quando job noturno reseta)
- `streak_milestone { count }` (7, 14, 30, 60, 100, 365)

## References

- **Constitution**: P6 (aluno entende estado), P7 (skills > pontos), P4 (sem culpa em meta não atingida), P1 (UX serve pedagogia).
- **ADRs**: [010](../adr/010-estado-frontend.md).
- **Knowledge**: [01](../knowledge/01-visao-do-produto.md), [09](../knowledge/09-gamificacao-e-progresso.md), [13](../knowledge/13-ux-principios.md).

## Telas envolvidas
- `/dashboard`.
- `/profile`.
- `/trilha`.
