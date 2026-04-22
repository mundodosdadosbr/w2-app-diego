# UC-02 — Completar uma lesson

- **Ator**: Aluno
- **Objetivo**: Atravessar a lesson atual do começo ao fim, produzindo ativamente, e destravar a próxima
- **Prioridade MVP**: P0
- **Última revisão**: 2026-04-21

## Trigger
Aluno clica em "Estudar hoje" no dashboard, ou em uma lesson específica na trilha.

## Preconditions
- Aluno autenticado (`auth.uid()` presente).
- Lesson está `published` e destravada (lesson anterior da mesma unit `completed`, ou modo aberto ativado).
- `lesson_progress` pode existir (retomada) ou não (primeira vez).

## Main flow

1. Aluno abre `/lesson/[slug]`. Server Component carrega `lesson_version` (snapshot publicado) + progresso do aluno.
2. Se primeiro acesso: cria `lesson_progress` (`status='in_progress'`, `started_at=now`).
3. Player renderiza seções na ordem canônica ([knowledge/04](../knowledge/04-anatomia-da-lesson.md)).
4. **Intro & Objectives** (seção 1) — aluno lê objetivos "I can"; clica "Começar".
5. **Verbs** → **New Words** → **Handy phrases** → **Grammar** (INPUT, seções 2-5):
   - Cada palavra/frase tem áudio TTS (pré-gerado via pipeline UC-09).
   - Na primeira exposição, criar `reviews` com `stage='d1', due_at=now+1d` para cada item ([ADR-006](../adr/006-spaced-repetition.md)).
   - Interação mínima por item (clicar "ouvir", "já conheço", "próximo").
6. **In context** (seção 6) — diálogo curto, áudio com vozes distintas, aluno ouve → lê → pode ouvir de novo devagar.
7. **Drill** (seção 7) — 3-6 exercícios fechados (ver [knowledge/05](../knowledge/05-catalogo-de-exercicios.md)).
   - Cada resposta: `exercise_attempts` inserido com `grade` calculado.
   - `grade ≤ 2` → upsert em `reviews` com `due_at=now`.
   - Feedback visual instantâneo.
8. **Speak now / Pair practice** (seção 8) — produção oral/escrita guiada.
   - Speak now: prompt pt-BR, resposta livre (voz ou texto); corretor IA via Bedrock ([ADR-017](../adr/017-llm-amazon-bedrock.md)) devolve grade + feedback.
   - Pair practice: chat com tutor IA em modo short_answer, 2-4 turnos.
9. **Listen & act** (seção 9, se aplicável) — ordenar / role-play com diálogo.
10. **Fluency** (seção 10, se aplicável por nível) — pergunta aberta; corretor IA avalia.
11. **Pronunciation coach** (seção 11) — 2-4 frases-alvo ([UC-03](UC-03-pronunciation-attempt.md) embutido).
12. **Recap** (seção 12) — 3-5 itens cumulativos + 1-2 puxados de lesson anterior.
13. **Self-check** (seção 13) — mini-checklist "I can" dos objetivos da lesson.
14. Ao terminar seção 13, sistema avalia critério de conclusão ([knowledge/08](../knowledge/08-regras-de-negocio.md)):
    - Todas as seções obrigatórias visitadas ✅
    - `avg_grade` de OUTPUT ≥ 3.0 ✅
    - Recap feito ✅
15. Se critério atingido: `lesson_progress.status='completed', completed_at=now`, `avg_grade` calculado, +50 pts em `points_ledger`, próxima lesson destravada em `learning_path_progress`.
16. Tela de **Lesson completa** — celebração (≤ 1s de confetti/micro-animação), resumo (tempo, acertos, novos itens para revisar amanhã), CTA "próxima lesson" ou "fazer revisões agora".
17. Se critério **não** atingido em (14): UI sugere "Repetir OUTPUT" com exercícios regenerados. Aluno pode repetir ou seguir mesmo assim após 2ª tentativa (itens vão para SRS imediata).

## Alternative flows

- **AF-1 — Retomada**: `lesson_progress` já existe; player pula para `current_section` salva.
- **AF-2 — Sem microfone / opt-out**: seções Speak now, Pair practice e Pronunciation aceitam entrada por texto; grade calculado pelo corretor IA.
- **AF-3 — Falha de STT/LLM transient**: toast "Tente de novo"; exercício não conta como tentativa falha.
- **AF-4 — Aluno sai no meio**: estado persiste a cada transição de seção. Ao voltar, abre em `current_section`.
- **AF-5 — Lesson foi republicada** (nova `lesson_version`) enquanto aluno estava fazendo: aluno continua na versão que começou (`lesson_progress.lesson_version_id` é imutável); ao iniciar próxima lesson, usa versão mais recente.
- **AF-6 — 3 erros consecutivos no mesmo exercício**: UI mostra resposta correta + explicação curta (via tutor IA). Aluno avança sem tentar mais. Item vai para SRS com stage `d1`.

## Postconditions

- `lesson_progress.status='completed'` (no caminho feliz).
- `exercise_attempts` persistidos com `grades`.
- `reviews` criados para todos os itens novos (`d1`) + zerados para itens errados.
- `points_ledger` +50 pts.
- `streaks` atualizado se dia novo (ver UC-07).
- `skill_checkpoints` possivelmente atualizado se a lesson conclui contribui para um skill.
- `learning_path_progress.current_lesson_id` avança para próxima.

## Telemetry

- `lesson_started { lesson_id, unit_id, lesson_version_id }`
- `lesson_section_viewed { lesson_id, section, elapsed_ms_since_previous }`
- `exercise_attempted { exercise_id, type, grade, attempt_number, time_ms }`
- `exercise_completed { exercise_id, type, final_grade }`
- `lesson_completed { lesson_id, total_time_ms, avg_grade }`
- `lesson_abandoned { lesson_id, last_section, time_ms }` (se aluno fecha sem concluir)

Ver [ADR-012](../adr/012-observabilidade-e-analytics.md).

## References

- **Constitution**: P1 (pedagogia), P3 (produção ativa ≥ 40% do tempo), P4 (erro gera review, não punição), P6 (aluno entende por que a lesson não foi concluída se não foi), P9 (IA dentro do nível).
- **ADRs**: [006](../adr/006-spaced-repetition.md), [007](../adr/007-pronunciation-scoring.md), [008](../adr/008-conteudo-e-versionamento.md), [010](../adr/010-estado-frontend.md).
- **Knowledge**: [04](../knowledge/04-anatomia-da-lesson.md), [05](../knowledge/05-catalogo-de-exercicios.md), [08](../knowledge/08-regras-de-negocio.md), [12](../knowledge/12-spaced-repetition.md).

## Telas envolvidas
- `/lesson/[slug]` (player com 13 seções navegáveis).
- `/lesson/[slug]/complete` (tela de conclusão).
