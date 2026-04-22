# ADR-016: STT com Amazon Transcribe em en-US

- **Status**: Accepted
- **Data**: 2026-04-21
- **Tags**: audio, ia, aws, pedagogia, pronúncia
- **Supersedes parcial**: [ADR-005](005-tts-stt.md) (parte de STT)

## Contexto

O Pronunciation Coach e o Speaking depende de STT que entregue, além da transcrição:

- **Timestamps por palavra** (para destacar palavras problema na UI).
- **Confidence por palavra** (sinal de quanto o motor "tem certeza" do que ouviu — pedagogicamente crítico).
- **Transcrição conservadora** — em STT para pronúncia, o motor **não deve "consertar" áudio ambíguo**. Se o aluno pronunciou de forma inteligível mas imperfeita, queremos isso na transcrição, não uma versão idealizada.

Diego decidiu unificar backend de IA na AWS (Bedrock — ver [ADR-017](017-llm-amazon-bedrock.md)). Faz sentido pegar STT também na AWS para consolidar auth, observabilidade e billing.

## Decisão

Adotamos **Amazon Transcribe** em `en-US` como provedor único de STT do MVP.

### Configuração padrão
- **Região**: `us-east-1` (consistente com Bedrock — ver [ADR-017](017-llm-amazon-bedrock.md)).
- **Modo**: `batch` (transcrição de gravações curtas 2-15s) via `StartTranscriptionJob` para pronúncia. `streaming` via `StartStreamTranscription` reservado para Speaking Practice com resposta ao vivo (fase 2).
- **Idioma**: `en-US` hard-coded. Ver [ADR-015](015-i18n.md) (atualizado).
- **Settings habilitadas**:
  - `ShowAlternatives: true` + `MaxAlternatives: 2` — útil quando aluno chegou perto.
  - `EnableWordLevelConfidence: true` — sinal primário do scoring.
  - `VocabularyFilterName`: filtro mínimo de profanidade (opcional).
  - **Custom vocabulary** (por lesson): carregar o vocabulário-alvo da lesson como `Vocabulary` no Transcribe para melhorar reconhecimento de palavras ensinadas.
- **Audio**: ingest em webm/opus (Web MediaRecorder) ou wav; Transcribe aceita ambos via S3.
- **Sample rate**: 16 kHz mono é o sweet spot para voz.

### Pipeline
1. Cliente grava áudio (Web MediaRecorder, webm/opus, ≤ 30s por frase).
2. Upload direto para S3 (bucket `w2-stt-uploads`, TTL 7 dias) via presigned PUT gerada pela Edge Function `stt-prepare`.
3. Edge Function `stt-transcribe` chama `StartTranscriptionJob` e aguarda (polling curto até 10s) ou registra callback. Para áudios ≤ 15s, latência típica 2-4s.
4. Parse do JSON: palavras, timestamps, confidence, alternatives.
5. Escrita em `pronunciation_attempts` com `transcribed`, `words: [{token, start, end, confidence}]`, junto do score calculado (ver [ADR-007](007-pronunciation-scoring.md)).
6. Áudio original vai para bucket `w2-recordings` com TTL 90 dias (ver [08](../knowledge/08-regras-de-negocio.md)).

### Por que Transcribe e não Whisper
- **Transcribe é mais conservador** — produz transcrição mais próxima do literal, preservando hesitações e erros. Whisper tende a "completar" para inglês plausível, o que infla score falso de pronúncia.
- **Word-level confidence** vem estruturada na resposta, sem logprobs processing.
- **Custom vocabulary** nativo por lesson melhora reconhecimento do que está sendo ensinado.
- **Stack AWS única** — alinha com Bedrock, reduz surface de auth.

### Fase 2 (não no MVP)
- Avaliar **Azure AI Pronunciation Assessment** — é o padrão-ouro (accuracy/fluency/completeness por fonema, usado por Duolingo/ELSA). Se o score puramente baseado em WER+confidence não for suficiente pós-launch, trocar só a função `PronunciationScorer` mantendo Transcribe para transcrição.
- **Streaming** para Speaking Practice em tempo real (Nova Sonic ou Transcribe streaming).

## Alternativas consideradas

- **OpenAI Whisper** (original de ADR-005) — agressivo em "completar" inglês; impacta negativamente scoring de pronúncia.
- **Deepgram Nova** — latência menor, ótimo para streaming. Mantemos em view para fase 2 de conversa ao vivo; não justifica fragmentar STT no MVP.
- **Azure Speech (com Pronunciation Assessment embutido)** — qualidade superior para pronúncia, mas multi-cloud complica auth, billing e ops. Se o score Transcribe+WER mostrar gaps, avaliamos para fase 2.
- **Whisper self-hosted** — custo fixo de GPU, operação cara. Descartado.

## Consequências

### Positivas
- Stack AWS consolidada (com [ADR-017](017-llm-amazon-bedrock.md) e [ADR-019](019-aws-auth.md)).
- Confidence por palavra é sinal pedagógico real — habilita feedback "nós ouvimos X com certeza baixa" em vez de só WER.
- Custom vocabulary por lesson melhora UX (palavra ensinada reconhecida corretamente).
- Billing AWS unificado.

### Negativas / Custos aceitos
- Custo em `batch` en-US: ~US$ 0.024/minuto. Em MVP (até 50 attempts/aluno/dia de até 10s = ~8min/dia = ~US$ 0.20/aluno/dia no teto). Cabe no orçamento de US$ 1/aluno/mês se uso for razoável.
- Latência 2-4s em batch — aceitável para pronúncia (não é conversa em tempo real). Para speaking ao vivo, fase 2 precisará de streaming.
- Dependência AWS para função crítica do produto. `SttClient` interface permite swap futuro.

### Neutras / Impactos
- Scoring em [ADR-007](007-pronunciation-scoring.md) — atualizar pipeline para usar `confidence`.
- Auth em [ADR-019](019-aws-auth.md).
- Locale travado em en-US — [ADR-015](015-i18n.md).
- UX e mensagens do Pronunciation coach em [knowledge/11](../knowledge/11-pronunciation-coach.md).

## Referências
- https://docs.aws.amazon.com/transcribe/latest/dg/how-input.html
- https://docs.aws.amazon.com/transcribe/latest/dg/custom-language-models.html
- Transcribe word-level confidence: resposta JSON padrão do `GetTranscriptionJob`.
