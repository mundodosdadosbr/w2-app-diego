# UC-04 — Sessão de speaking com tutor IA

- **Ator**: Aluno
- **Objetivo**: Conversar em inglês com o speaking partner IA, produzindo pelo menos 3 turnos, recebendo correção gentil e ficando mais confortável com o nível
- **Prioridade MVP**: P0
- **Última revisão**: 2026-04-21

## Trigger
- Seção **Pair practice** dentro de uma lesson (UC-02 passo 8), **ou**
- Tela dedicada `/speaking` — aluno escolhe modo (short_answer | open_conversation | role_play | fluency).

## Preconditions
- Aluno autenticado.
- `profiles.cefr_level` definido.
- Edge Function `llm-invoke` operacional ([ADR-017](../adr/017-llm-amazon-bedrock.md)).

## Main flow

1. Aluno abre tela de speaking (lesson ou standalone).
2. UI apresenta:
   - **Modo** (em standalone; em lesson é fixo `short_answer` ou `role_play`).
   - **Cenário/tópico** (em role_play).
   - Primeiro turno do **Alex** (persona speaking partner, voz ElevenLabs en-US) em chat bubble + áudio TTS.
3. Aluno responde:
   - Por voz: `MediaRecorder` → upload → Transcribe (`en-US`) → texto (similar a UC-03 mas mais simples, sem scoring detalhado).
   - Por texto: digita direto.
4. Cliente envia para Edge Function `llm-invoke` com payload:
   - `persona='speaking_partner'`
   - `session_id`, `turn_index`, `user_text`, `mode`, `scenario?`
   - `allowed_list` derivada do `cefr_level` e histórico ([knowledge/10](../knowledge/10-ai-personas-e-prompts.md)).
   - System prompt cacheado em Bedrock ([ADR-017](../adr/017-llm-amazon-bedrock.md)) — `cachePoint` na definição da persona + regras pedagógicas + allowed_list.
5. Edge Function invoca Bedrock Claude Sonnet com streaming (`ConverseStream`).
6. Resposta chega em duas partes:
   - **Texto conversacional** em EN (streaming para UI) — aparece letra por letra.
   - **Bloco JSON estruturado** no final (não renderizado):
     ```json
     {
       "user_said": "...",
       "has_error": true,
       "severity": "minor",
       "suggested_en": "...",
       "explanation_pt_br": "..."
     }
     ```
7. UI mostra a resposta de Alex + (se `severity >= minor`) uma aba/hover com a correção.
8. TTS de resposta: Edge Function `tts-speak` (ElevenLabs) gera áudio da resposta de Alex e retorna URL para cliente. Toca automaticamente.
9. Persistência:
   - `speaking_sessions` (se primeiro turno da sessão): `mode`, `lesson_version_id`, `scenario`, `level`, `started_at`.
   - `speaking_turns` (turno do aluno): `text_en=user_text`, `audio_key` se por voz, `tokens_*`, `cache_hit`, `latency_ms`, `correction` JSON.
   - `speaking_turns` (turno do AI): `text_en=ai_text`, `audio_key`.
   - `ai_usage` atualizado (ADR-012).
10. Aluno continua — 3-8 turnos típicos. Alex sempre termina com pergunta contextual.
11. Ao fechar sessão (`End session` ou 20 turnos — limite duro), `speaking_sessions.ended_at=now`, `turn_count`, `avg_user_words`.
12. Edge Function gera `feedback_summary` curta (persona `tutor` com histórico da sessão) e salva.
13. UI mostra tela resumo: turnos, correções relevantes (lista das com `severity >= minor`), encorajamento.
14. Se sessão ≥ 3 turnos úteis: +20 pts em `points_ledger`; atualiza `skill_checkpoints` envolvidos via EMA.

## Alternative flows

- **AF-1 — Aluno responde em português** (esperado acontecer): Alex responde em inglês simples com tradução em parêntese, puxa de volta para inglês.
- **AF-2 — Aluno fala off-topic** (especialmente em role_play): Alex reconduz gentil — "That's interesting! Let's stick with our scenario — ..."
- **AF-3 — Streaming falha no meio**: buffer parcial mostrado ao aluno + retry; se falha persiste, toast "Alex tá pensando demais — tente de novo".
- **AF-4 — Latência alta** (> 5s): spinner com mensagem "Alex está digitando...".
- **AF-5 — Aluno entra em frustração** (3 turnos muito curtos, "I don't know"): Alex simplifica — oferece opção múltipla escolha encoberta em pergunta ("Do you prefer coffee or tea?").
- **AF-6 — Limite diário de speaking atingido** (30 min/dia, [knowledge/08](../knowledge/08-regras-de-negocio.md)): UI mostra "Você atingiu o limite de speaking hoje — volta amanhã! 🎯". Anti-custo IA.
- **AF-7 — Opt-out de microfone**: só texto disponível. Não bloqueia.
- **AF-8 — Cenário "prohibido"** (prompt injection, pedido de opinião política/religiosa): Claude recusa via system prompt; Alex devolve ao tópico pedagógico.

## Postconditions

- `speaking_sessions` criado/finalizado.
- `speaking_turns` com todos os turnos persistidos.
- `ai_usage` atualizado (tokens + custo).
- (Se ≥ 3 turnos) `points_ledger` +20.
- `skill_checkpoints` atualizado via EMA das competências envolvidas no cenário.
- Áudios do aluno em `w2-recordings` sujeitos a TTL 90d (UC-10).

## Telemetry

- `speaking_session_started { mode, level, scenario?, lesson_version_id? }`
- `speaking_turn { turn_index, speaker, tokens_in, tokens_out, cache_hit, user_words, latency_ms, severity }`
- `speaking_session_completed { turn_count, avg_user_words, duration_ms, had_corrections }`
- `speaking_session_abandoned { turn_count, reason: 'closed'|'timeout'|'limit' }`

## References

- **Constitution**: P3 (produção ativa — speaking é o cume), P8 (correção gentil), P9 (dentro do nível, sem vocab surpresa), P6 (aluno entende correções).
- **ADRs**: [004](../adr/004-provedor-ia.md), [005](../adr/005-tts-stt.md) (TTS ElevenLabs), [016](../adr/016-stt-amazon-transcribe.md), [017](../adr/017-llm-amazon-bedrock.md), [019](../adr/019-aws-auth.md).
- **Knowledge**: [10](../knowledge/10-ai-personas-e-prompts.md) (persona `speaking_partner` com prompt completo), [08](../knowledge/08-regras-de-negocio.md) (limite 30 min/dia).

## Telas envolvidas
- `/speaking` (hub com modos).
- `/speaking/session/[sessionId]` (chat ativo).
- Seção Pair practice em `/lesson/[slug]`.
