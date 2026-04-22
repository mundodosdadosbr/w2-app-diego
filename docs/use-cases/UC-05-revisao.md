# UC-05 — Sessão de revisão (Review Center)

- **Ator**: Aluno
- **Objetivo**: Consumir a fila de itens devidos pela SRS, avançando stages nos que acertou e reciclando os que errou
- **Prioridade MVP**: P0
- **Última revisão**: 2026-04-21

## Trigger
- Aluno clica em "Revisões (N)" no header do dashboard, **ou**
- Card "Revisar hoje" na seção "Estudar hoje", **ou**
- Atalho na barra inferior `/review`.

## Preconditions
- Aluno autenticado.
- Existe ≥ 1 linha em `reviews` com `due_at ≤ now()` para o `user_id`.

## Main flow

1. Aluno abre `/review`.
2. Server Component consulta `reviews WHERE user_id = auth.uid() AND due_at <= now() AND stage != 'mastered'` ordenado por:
   - `stage` ascendente (`d1` primeiro).
   - `last_grade` ascendente (itens errados recentemente primeiro).
   - `due_at` ascendente (mais atrasados primeiro).
   - `LIMIT` padrão 20 (configurável até 50, [knowledge/08](../knowledge/08-regras-de-negocio.md)).
3. UI mostra hub:
   - **N itens para hoje** com breakdown por stage (cores).
   - Tempo estimado.
   - CTA "Start review".
4. Aluno clica; sessão começa.
5. **Por item**:
   - Formato adaptado ao `item_type` ([knowledge/12](../knowledge/12-spaced-repetition.md)):
     - `vocab`: múltipla escolha EN↔pt-BR + áudio + (opcional) dizer em voz alta.
     - `phrase`: completar lacuna com chunk certo + ouvir.
     - `grammar`: mini-drill (ordenar/transformar) + 2 exemplos.
     - `chunk`: pronunciation attempt (delega a UC-03).
   - Resposta → cliente calcula grade 0-5 ou chama Edge Function para itens com LLM.
   - `exercise_attempts` (quando o item tem exercício embutido) **não** é persistido aqui (a SRS não é uma lesson); em vez disso, o próprio `reviews` é atualizado:
6. **Atualização de review** via function SQL `apply_review_grade(review_id, grade)` ([ADR-006](../adr/006-spaced-repetition.md)):
   - `grade ≥ 4`: avança stage; `interval_days = stage_anchor` novo; `ease_factor += 0.1` (clamp 3.0); `consecutive_passes += 1`; se d30 com 3 passes → `mastered`.
   - `grade = 3`: mantém stage; `interval_days = stage_anchor × ease_factor`.
   - `grade ≤ 2`: regride 1 stage (min d1); `interval_days = 1`; `ease_factor -= 0.2` (clamp 1.3); `consecutive_passes = 0`; `due_at = now()+1 day`.
   - `last_grade = grade`, `last_reviewed_at = now()`, `due_at = now() + interval_days`.
7. Feedback instantâneo por item:
   - ✅ "Avançou para d3" / "Mastered!" / "Mantido em d7".
   - ❌ "Volta para d1 — vamos ver de novo amanhã".
8. Próximo item carrega.
9. Ao concluir todos (ou aluno para): `points_ledger` recebe +5 por item com `grade ≥ 3`.
10. Tela de **resumo da sessão**:
    - N itens feitos, X acertos, Y avançados de stage, Z que voltaram.
    - Tempo total.
    - Próxima revisão sugerida (horário dependendo do menor `due_at` futuro).
    - Celebração proporcional ao desempenho.

## Alternative flows

- **AF-1 — Fila vazia**: UI mostra "Você está em dia! 🎯 Que tal uma lesson?" com CTA para "Estudar hoje". Não é erro.
- **AF-2 — Aluno para no meio**: progresso por item já persistido; retomada abre na fila restante.
- **AF-3 — Item `chunk` sem microfone**: pula para versão sem áudio (múltipla escolha da frase) ou marca "pular" sem penalidade.
- **AF-4 — Item errado 3× consecutivas na mesma sessão**: mostrar resposta + explicação curta da Haiku; conta como grade 1; item volta amanhã.
- **AF-5 — Falha de rede durante `apply_review_grade`**: retry automático; se persiste, o grade fica em queue local (IndexedDB) e é flushed em reconexão.
- **AF-6 — Aluno aumentou limite para 50 itens** em configurações: fila renderiza 50; restante fica para próximo dia.
- **AF-7 — Revisão de `grammar`** com LLM corretor: segue pipeline do UC-02 passo 8 (corretor via Bedrock).

## Postconditions

- Linhas em `reviews` atualizadas com novos stage, interval, due_at, ease_factor.
- `points_ledger` incrementado.
- `skill_checkpoints` possivelmente atualizado (mastered vira sinal de skill destravada).
- `streaks` atualizado se a sessão qualifica como atividade do dia (≥ 5 itens).

## Telemetry

- `review_session_started { due_count, breakdown: { d1, d3, d7, d14, d30 } }`
- `review_item_attempted { item_type, item_id, stage_before, stage_after, grade }`
- `review_session_completed { items_done, correct, advanced, regressed, duration_ms }`
- `review_session_abandoned { items_done, reason }`

## References

- **Constitution**: P4 (erro gera review, não punição), P6 (aluno entende motivo de cada item), P7 (mastered destrava skill).
- **ADRs**: [006](../adr/006-spaced-repetition.md).
- **Knowledge**: [08](../knowledge/08-regras-de-negocio.md), [12](../knowledge/12-spaced-repetition.md).

## Telas envolvidas
- `/review` (hub com fila + CTA).
- `/review/session` (execução da fila).
- `/review/complete` (resumo).
