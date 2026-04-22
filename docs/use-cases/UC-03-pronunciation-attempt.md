# UC-03 — Praticar pronúncia de uma frase

- **Ator**: Aluno
- **Objetivo**: Produzir oralmente uma frase-alvo em en-US e receber feedback acionável por palavra
- **Prioridade MVP**: P0
- **Última revisão**: 2026-04-21

## Trigger
- Seção **Pronunciation coach** dentro de uma lesson (UC-02 passo 11), **ou**
- Tela dedicada `/pronunciation` com frases escolhidas pelo aluno.

## Preconditions
- Aluno deu permissão de microfone (se não, UC diferente: CTA para habilitar).
- Frase-alvo existe em `lesson_version.pronunciation_targets` ou em `phrase_patterns`.
- Edge Functions `stt-prepare` e `stt-transcribe` deployadas ([ADR-019](../adr/019-aws-auth.md)).

## Main flow

1. UI exibe frase-alvo em EN com destaque visual grande (24-32pt).
2. Aluno toca **🔊 Normal** — TTS pré-gerado reproduz versão en-US em velocidade padrão ([ADR-005](../adr/005-tts-stt.md)).
3. (Opcional) Aluno toca **🐢 Slow** — TTS 0.75×.
4. Aluno toca **🎤 Record**:
   - Browser inicia `MediaRecorder` em webm/opus, 16 kHz mono.
   - UI mostra waveform ao vivo e timer.
   - Aluno fala (≤ 30s); toca "stop" ou auto-stop em 30s.
5. Cliente chama Edge Function `stt-prepare` → recebe presigned PUT URL para `s3://w2-stt-uploads/{user_id}/{session_id}/{uuid}.webm`.
6. Cliente faz PUT do áudio diretamente ao S3.
7. Cliente chama Edge Function `stt-transcribe` com `{s3_key, expected_text, lesson_id?}`.
8. Edge Function:
   - Chama **Amazon Transcribe** (`StartTranscriptionJob`, `LanguageCode='en-US'`, `EnableWordLevelConfidence=true`, `ShowAlternatives=true, MaxAlternatives=2`, custom vocabulary da lesson se aplicável) ([ADR-016](../adr/016-stt-amazon-transcribe.md)).
   - Polling curto até 10s ou webhook.
   - Parse do resultado: `{ transcribed, words: [{token, start, end, confidence}] }`.
   - Se resultado vazio / avg_confidence < 0.3 → retorna `low_audio_quality: true`.
   - Calcula alinhamento Levenshtein word-by-word vs `expected`.
   - Calcula score: `score = max(0, 100 - WER × 0.8 - (1 - avg_confidence) × 40)` ([knowledge/11](../knowledge/11-pronunciation-coach.md)).
   - Identifica `problem_words` (substitutions, deletions, ou correct-but-low-confidence).
   - Chama **Bedrock Claude Haiku** persona `pronunciation_feedback` para dica curta em pt-BR sobre a palavra mais problemática.
   - Insere em `pronunciation_attempts`: `expected, transcribed, score, wer, avg_confidence, problem_words, audio_key, created_at`.
   - Move áudio de `w2-stt-uploads` para `w2-recordings` (TTL 90d) se score ≥ 60; senão descarta (evita storage de áudio inútil).
   - Se score ≤ 2 (grade): cria/zera reviews de `pronunciation_chunk` para cada palavra-problema.
   - Retorna JSON ao cliente.
9. UI mostra resultado:
   - Indicador grande colorido (verde ≥ 80, amarelo 60-79, vermelho < 60).
   - Frase com cada palavra colorida:
     - Verde = acerto + confidence ≥ 0.85
     - Amarelo = acerto + confidence 0.6-0.85 (dicção fraca)
     - Vermelho = substituição, deleção, ou confidence < 0.6
   - Mensagem encorajadora + dica específica da Haiku.
   - Se score < 80: **chunks sugeridos** para repetir (split por preposição/conjunção).
10. Aluno pode: **Try again** (até 5 consecutivas na mesma frase), **Next phrase**, **Skip**.
11. Dentro de lesson (UC-02): após concluir as 2-4 frases-alvo, avança para seção seguinte. Standalone: retorna à lista.

## Alternative flows

- **AF-1 — Áudio vazio / baixa energia**: UI mostra "Não conseguimos ouvir bem — grava de novo?" (energia RMS do webm abaixo de threshold, ou Transcribe retorna 0 palavras). **Não conta como tentativa negativa**. Constitution P8.
- **AF-2 — 5 tentativas consecutivas sem atingir 60**: UI oferece "revisit later" — cria review `d1` do chunk e avança. Não bloqueia lesson.
- **AF-3 — Erro de rede no upload/transcribe**: retry automático 1×; se falhar, toast "sem conexão" + botão manual. Áudio fica em IndexedDB local até sucesso ou descarte explícito.
- **AF-4 — Aluno fecha antes do score chegar**: cliente marca como abandonada localmente; Edge Function ainda processa e persiste para histórico.
- **AF-5 — Aluno em opt-out de retenção de áudio**: `w2-recordings` PUT pula; só metadata fica persistida.
- **AF-6 — Ambiente barulhento** (confidence média < 0.5 em 3 tentativas seguidas): UI sugere "ambiente mais silencioso" sem penalizar.

## Postconditions

- Linha em `pronunciation_attempts` com métricas.
- (Opcional) Áudio em `w2-recordings` sujeito a TTL 90d (UC-10).
- (Opcional) Reviews criados/atualizados em `reviews` para chunks problemáticos.
- `points_ledger` +15 pts se score ≥ 80 (só 1× por exercise_id/dia, anti-farming).
- `skill_checkpoints` agregado atualizado se a frase contribuía para skill específica.

## Telemetry

- `pronunciation_attempted { expected, wer, avg_confidence, score, problem_words_count, retry_number, low_audio_quality }`
- `pronunciation_completed { final_score, retries, outcome: 'passed'|'skipped'|'abandoned' }`
- `ai_usage { provider: 'aws-transcribe' | 'aws-bedrock', purpose: 'stt' | 'pronunciation_feedback', ... }` (ADR-012).

## References

- **Constitution**: P3 (produção ativa), P4 (erro gera review), P8 (não afirmar "errado" quando é o STT), P10 (en-US hard-coded).
- **ADRs**: [005](../adr/005-tts-stt.md), [007](../adr/007-pronunciation-scoring.md), [016](../adr/016-stt-amazon-transcribe.md), [017](../adr/017-llm-amazon-bedrock.md), [019](../adr/019-aws-auth.md).
- **Knowledge**: [10](../knowledge/10-ai-personas-e-prompts.md) (persona pronunciation_feedback), [11](../knowledge/11-pronunciation-coach.md).

## Telas envolvidas
- Seção Pronunciation embutida em `/lesson/[slug]` (player).
- `/pronunciation` (standalone).
