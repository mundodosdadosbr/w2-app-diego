# UC-06 — Submeter self-assessment de unit

- **Ator**: Aluno
- **Objetivo**: Declarar confiança em cada objetivo comunicativo ("I can" / "I'm not sure" / "I can't yet") ao final da unit, alimentando recomendações de reforço
- **Prioridade MVP**: P0
- **Última revisão**: 2026-04-21

## Trigger
- Aluno concluiu todas as lessons obrigatórias da unit + Recap da unit.
- UI destrava `/self-assessment/[unitSlug]` e convida explicitamente.

## Preconditions
- Todas as `lesson_progress` das lessons obrigatórias da unit estão `completed`.
- Recap da unit concluído.
- `unit_objectives` da unit definidos ([knowledge/03](../knowledge/03-anatomia-da-unit.md)).

## Main flow

1. Aluno abre `/self-assessment/[unitSlug]`.
2. Server Component carrega `unit_objectives` + `unit_version` publicada que o aluno consumiu.
3. UI apresenta intro curta: "Vamos conferir o que você sente que dominou nesta unidade."
4. Para cada objetivo, um card com:
   - Texto do objetivo em pt-BR ("Dizer meu nome e onde moro").
   - Três botões grandes: ✅ **I can** · 🤔 **I'm not sure** · ❌ **I can't yet**.
   - (Opcional) mini-exemplo em EN do que a competência significa.
5. Aluno marca cada objetivo. Nenhum padrão — obriga decisão consciente.
6. (Opcional) Campo de nota livre por objetivo — pt-BR.
7. CTA "Finalizar autoavaliação" só habilita quando todos foram respondidos.
8. Submit → Edge Function `submit-self-assessment`:
   - Cria `self_assessments` (unique por `user_id + unit_version_id`).
   - Cria `self_assessment_items` com `unit_objective_id + confidence + note`.
   - Para cada `confidence = 'cant_yet'`: cria reviews **imediatas** (`due_at = now()`) para todos os `vocabulary_items`, `phrase_patterns`, `grammar_points` das lessons-origem do objetivo ([knowledge/08](../knowledge/08-regras-de-negocio.md)).
   - Para cada `confidence = 'not_sure'`: cria reviews com `due_at = now() + 3 days`.
   - Para `confidence = 'i_can'`: não cria nada; se havia review `mastered` em candidato, mantém.
   - Marca `unit_progress.status = 'completed', completed_at = now()` (se ainda estava `in_progress`).
   - +200 pts em `points_ledger`.
   - Destrava próxima unit em `learning_path_progress`.
9. Dispara Edge Function `recommend-review-plan` (persona `recommender` via Bedrock Claude Opus, [knowledge/10](../knowledge/10-ai-personas-e-prompts.md)):
   - Input: respostas do self-assessment + últimas 50 `exercise_attempts` + reviews em aberto.
   - Output: plan JSON com `priority_items`, `suggested_daily_minutes`, `message_pt_br`.
   - Salva em `user_reviews_plan` (cache curto, TTL 7 dias).
10. Tela de **conclusão** com:
    - Celebração (unit completa, +200 pts, badge "Full unit" se tudo "I can").
    - Resumo: X "I can", Y "not sure", Z "can't yet".
    - Mensagem personalizada do recommender em pt-BR.
    - CTA "Começar próxima unit" ou "Fazer revisões recomendadas agora".

## Alternative flows

- **AF-1 — Aluno entra cedo** (lessons não completas): rota redireciona para dashboard com toast "Complete as lessons primeiro".
- **AF-2 — Aluno marca todos "can't yet"**: sistema ainda registra + manda para recommender; `message_pt_br` calibrada para não soar derrotista ("vamos reforçar juntos o que está menos confortável").
- **AF-3 — Aluno quer revisitar**: pode abrir `/self-assessment/[unitSlug]` de novo e resubmeter; sobrescreve `self_assessments` e seus `items` (mantém histórico em `audit_log`). Não cria reviews duplicados para os mesmos items.
- **AF-4 — Falha ao chamar recommender**: submit funciona mesmo assim; tela de conclusão mostra versão estática ("revise os itens marcados como 'não tenho certeza' no Review Center"). Plano é gerado em background retry.
- **AF-5 — Aluno sai no meio**: estado parcial em `localStorage` por 24h; não submete até todos respondidos. Não cria registros parciais no banco.

## Postconditions

- `self_assessments` + `self_assessment_items` persistidos.
- `unit_progress.status='completed'`.
- Reviews criados/puxados conforme respostas.
- Próxima unit destravada em `learning_path_progress`.
- `points_ledger` +200.
- `user_reviews_plan` atualizado (se recommender succeeded).
- Badge "Full unit" se aplicável.

## Telemetry

- `self_assessment_started { unit_id, unit_version_id, objective_count }`
- `self_assessment_submitted { unit_id, confidence_map: {can: X, not_sure: Y, cant_yet: Z} }`
- `self_assessment_reviewed { unit_id }` (se aluno revisitar)
- `review_plan_generated { unit_id, priority_items_count, suggested_daily_minutes, llm_cache_hit }`

## References

- **Constitution**: P6 (aluno entende — cada "can't yet" vira plano visível), P7 (skill mensurável), P8 (IA gentil na mensagem do recommender), P4 (não punitivo — "can't yet" gera revisão, não reprovação).
- **ADRs**: [006](../adr/006-spaced-repetition.md), [017](../adr/017-llm-amazon-bedrock.md).
- **Knowledge**: [03](../knowledge/03-anatomia-da-unit.md), [08](../knowledge/08-regras-de-negocio.md), [10](../knowledge/10-ai-personas-e-prompts.md) (persona `recommender`), [12](../knowledge/12-spaced-repetition.md).

## Telas envolvidas
- `/self-assessment/[unitSlug]`.
- `/self-assessment/[unitSlug]/complete`.
