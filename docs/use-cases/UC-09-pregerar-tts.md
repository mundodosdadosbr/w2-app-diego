# UC-09 — Pré-gerar TTS pós-publicação

- **Ator**: Sistema (job)
- **Objetivo**: Gerar e cachear todos os áudios TTS determinísticos de uma lesson recém-publicada, para que o aluno consuma áudio com custo runtime ~zero
- **Prioridade MVP**: P0
- **Última revisão**: 2026-04-21

## Trigger
- Publicação de lesson (UC-08 passo 15) insere um job em `pgmq` (ou similar), ouvido por Edge Function `tts-pregen` agendada.
- (Alternativa) `pg_cron` executa `tts-pregen` a cada 15 min catch-up.

## Preconditions
- Lesson em `status='published'` com `lesson_versions` snapshot populado.
- Edge Function `tts-pregen` deployada, com credenciais ElevenLabs em secret.
- Bucket `tts-cache` existe com política `public-read` (ou URL privada via CDN, TBD na fase deploy).

## Main flow

1. Job `tts-pregen` é acionado com payload `{lesson_version_id}`.
2. Edge Function:
   - Carrega `lesson_versions.snapshot`.
   - Extrai todos os **speakable strings**:
     - `vocabulary_items.en` + `example_en`.
     - `phrase_patterns.en`.
     - `dialog_lines.en` (cada linha do diálogo In context).
     - `grammar_points.examples[].en`.
     - `exercises.payload` de tipos áudio (prompt spoken, frase-alvo de pronunciation, etc.).
     - `pronunciation_targets`.
   - Monta lista única por `voice + text + speed`. Vozes en-US: `Rachel` (default feminina), `Adam` (default masculina), + voz do "Alex" (speaking partner).
   - Para pronunciation targets, gerar em `1.0×` e `0.75×` (slow).
3. Para cada item:
   - Computa `key = sha256(voice + text + speed + model_version)`.
   - Verifica se já existe em `s3://tts-cache/tts/{locale}/{voice}/{speed}/{key}.mp3` (idempotência).
   - Se existe → pula; atualiza FK `audio_key` no registro pertinente.
   - Se não existe:
     - Chama ElevenLabs API (`/v1/text-to-speech/{voice_id}` com `voice_settings`, `pronunciation_dictionaries` en-US).
     - Recebe MP3 binary.
     - Upload para S3 com `Content-Type: audio/mpeg`, `Cache-Control: public, max-age=31536000, immutable`.
     - Persiste `audio_key` no registro (`vocabulary_items.audio_key`, etc.).
     - Registra uso em `ai_usage` (`provider='elevenlabs', purpose='tts', cost_cents`).
4. Ao completar todos os itens da lesson:
   - Marca `lesson_versions.tts_ready = true`.
   - Emite evento interno `tts_pregen_completed { lesson_version_id, items_count, cache_hits, new_generations }`.
5. Se alguma geração falhou (rate limit, API down):
   - Item fica sem `audio_key`.
   - Job tenta de novo na próxima janela (retry com backoff exponencial — até 5 tentativas em 24h).
   - Após 5 falhas, alerta em Sentry + entrada em `tts_pregen_failures` para triagem manual.

## Alternative flows

- **AF-1 — Item com `audio_key` já preenchido manualmente** (autor upload direto): job respeita e pula.
- **AF-2 — Texto muito longo** (> 500 chars, raro em lesson): warning em log — provável erro de autoria, itens spoken devem ser curtos. Gera mesmo assim.
- **AF-3 — Voice ID inválido/removido do ElevenLabs**: job falha com erro explícito + alerta. Mitigação: prender `model_version` e `voice_id` no código das Edge Functions, versionar cuidadosamente.
- **AF-4 — Orçamento ElevenLabs atingido** (quota mensal): job pausa; chaveia para **OpenAI TTS** como fallback bulk ([ADR-005](../adr/005-tts-stt.md)). `ai_usage` registra provider alternativo.
- **AF-5 — Aluno toca áudio antes do pre-gen terminar**: cliente detecta `audio_key=null` → chama Edge Function `tts-speak` runtime (mesma lógica, só que síncrona) + aquece cache para próximo aluno. Custo extra, aceito para não punir primeiro aluno.
- **AF-6 — Republicação (nova version)**: job dispara para a nova version; cache compartilhado por hash (se o texto não mudou, não regenera).
- **AF-7 — Lesson archived**: job ignora; áudios permanecem em cache (referenciados por versions ainda consumidas por alunos em voo).

## Postconditions

- Todos os `speakable strings` da lesson têm `audio_key` válido apontando para S3.
- `lesson_versions.tts_ready = true`.
- `ai_usage` contabiliza custo de geração (fonte para dashboard de custo por aluno).
- Futuras reproduções servidas diretamente de S3/CDN, sem custo runtime de TTS.

## Telemetry

- `tts_pregen_started { lesson_version_id, items_total }`
- `tts_pregen_item_generated { key, voice, speed, provider, cost_cents, bytes }`
- `tts_pregen_item_cache_hit { key }`
- `tts_pregen_completed { lesson_version_id, items_total, new_generations, cache_hits, total_cost_cents, duration_ms }`
- `tts_pregen_failed { key, reason, attempt_number }`

## References

- **Constitution**: P1 (qualidade de áudio = modelo que aluno imita), P10 (vozes en-US).
- **ADRs**: [005](../adr/005-tts-stt.md) (TTS ElevenLabs primário), [008](../adr/008-conteudo-e-versionamento.md) (pipeline pós-publish), [012](../adr/012-observabilidade-e-analytics.md), [019](../adr/019-aws-auth.md) (S3 buckets).
- **Knowledge**: [07](../knowledge/07-modelo-de-dominio.md) (`audio_key` fields), [14](../knowledge/14-guardrails-copyright.md) (áudio original — voz ElevenLabs com texto nosso).

## Observações operacionais
- `tts-cache` bucket deve ter **lifecycle** de retenção longo (≥ 1 ano) — o áudio é idempotente e reutilizado indefinidamente; deletar custa mais que armazenar.
- Monitorar cache hit rate por lesson em fase 2 — reutilização cross-lesson pode ser alta para handy phrases comuns ("How are you?").
