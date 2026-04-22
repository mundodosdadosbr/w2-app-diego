# UC-10 — Purgar gravações expiradas (90 dias)

- **Ator**: Sistema (job agendado)
- **Objetivo**: Garantir que gravações de áudio do aluno sejam deletadas após 90 dias, exceto opt-in "manter histórico", em conformidade com a política de retenção e LGPD
- **Prioridade MVP**: P0 (obrigatório legalmente)
- **Última revisão**: 2026-04-21

## Trigger
- `pg_cron` diário às 02:00 (TZ do projeto Supabase) executa função `purge_expired_recordings()`.
- Também dispará manualmente via `/admin/ops/purge-now` em emergência.

## Preconditions
- `pg_cron` habilitado no Supabase ([ADR-013](../adr/013-hosting-e-deploy.md)).
- Edge Function `purge-recordings` deployada com credenciais AWS (permissão `s3:DeleteObject` em `w2-recordings`, [ADR-019](../adr/019-aws-auth.md)).

## Main flow

1. Cron executa `purge_expired_recordings()` (SQL function).
2. Function busca candidatos:
   ```sql
   SELECT id, audio_key, user_id
   FROM pronunciation_attempts
   WHERE audio_key IS NOT NULL
     AND created_at < now() - interval '90 days'
     AND user_id NOT IN (
       SELECT id FROM profiles WHERE keep_recordings_indefinitely = true
     );
   ```
   Idem para `speaking_turns.audio_key`.
3. Function chama Edge Function `purge-recordings` com lista batch de S3 keys (chunked 1000 por chamada — limite `DeleteObjects` API).
4. Edge Function:
   - Autentica na AWS ([ADR-019](../adr/019-aws-auth.md)).
   - Executa `s3:DeleteObjects` em batch no bucket `w2-recordings`.
   - Para cada sucesso, volta ao Postgres e atualiza `audio_key = NULL` nas linhas pertinentes (mantém metadados — WER, score — indefinidamente).
   - Registra em `audit_log` (`action='recordings.purged'`, `metadata={count, oldest_created_at, newest_created_at}`).
5. Se algum objeto falhou (ex.: já deletado, permissão): log individual com razão; se é `NotFound` (S3 lifecycle chegou antes), update do `audio_key=NULL` mesmo assim — estado consistente.
6. Emite evento interno `recordings_purged { count, total_bytes_freed, duration_ms }`.
7. Em caso de erro massivo (> 5% falha): alerta Sentry + entrada em `purge_failures` para investigação.

## Alternative flows

- **AF-1 — Aluno com opt-in "keep recordings"**: excluído da query; gravações ficam indefinidamente. Coluna `profiles.keep_recordings_indefinitely` respeitada.
- **AF-2 — Aluno solicitou exclusão de conta (UC-F3)**: gravações dele deletadas imediatamente por trigger específico, não esperam os 90 dias.
- **AF-3 — Bucket S3 lifecycle já deletou** (política AWS redundante):
  - S3 lifecycle `DeleteObject` em `w2-recordings` está configurado para **90 dias** também, como defesa em profundidade.
  - Se S3 chegou primeiro, `purge-recordings` recebe `NotFound` ao tentar deletar — trata como sucesso benigno e atualiza banco.
- **AF-4 — `w2-stt-uploads`** (staging, TTL 7 dias): lifecycle S3 cuida sozinho; nada para este job fazer.
- **AF-5 — Gravação sem `audio_key` (NULL)**: já purgada anteriormente; query natural exclui.
- **AF-6 — Execução parcial por falha de rede**: próxima execução do cron pega os restantes. Idempotente.
- **AF-7 — Detectar "zombie keys"** (S3 tem objeto mas Postgres não referencia): job extra semanal de reconciliação `reconcile_recordings_bucket()` — só loga; nunca deleta automaticamente baseado em S3 sozinho (risco de apagar recém-uploads).

## Postconditions

- Arquivos em S3 com `created_at < now() - 90 days` (e sem opt-in) deletados.
- Colunas `audio_key` correspondentes = NULL.
- Metadados (score, WER, problem_words, transcribed) permanecem para análise pedagógica e histórico do aluno.
- `audit_log` com execução registrada.

## Telemetry

- `recordings_purge_started { candidate_count }`
- `recordings_purge_completed { deleted_count, freed_bytes, duration_ms, failures_count }`
- `recordings_purge_failure { key, reason }`

## References

- **Constitution**: P5 (privacidade inegociável — retenção é limite absoluto).
- **ADRs**: [013](../adr/013-hosting-e-deploy.md) (pg_cron), [019](../adr/019-aws-auth.md) (S3 permissions).
- **Knowledge**: [08](../knowledge/08-regras-de-negocio.md) (política de retenção).
- **Legal**: LGPD Art. 15 (término do tratamento), Art. 16 (eliminação).

## Observações operacionais
- **Defesa em profundidade**: bucket `w2-recordings` tem lifecycle S3 nativo com `ExpirationInDays=90`. Mesmo se este job falhar indefinidamente, AWS deleta.
- **Sanity check**: toda semana, log de "quantos arquivos < 90d, quantos > 90d" — desvios sinalizam bug.
- **Recovery**: se por erro metadata foi perdida com áudio ainda em S3, possível restaurar criando linha com `audio_key` apontando (não ideal, mas viável). Nunca apagamos metadata pedagógica.
