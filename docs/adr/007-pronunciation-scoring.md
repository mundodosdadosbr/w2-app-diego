# ADR-007: Estratégia de pronunciation scoring

- **Status**: Accepted — **Amended 2026-04-21** (pipeline AWS Transcribe + confidence por palavra)
- **Data**: 2026-04-21
- **Tags**: audio, ia, pedagogia

> **Nota de atualização (2026-04-21):** o pipeline abaixo continua válido, com duas mudanças materiais:
>
> 1. **STT agora é Amazon Transcribe** ([ADR-016](016-stt-amazon-transcribe.md)), não Whisper. Isso traz `confidence` estruturado por palavra.
> 2. **Score combinado**: em vez de só WER, calculamos `score = max(0, 100 - WER × 0.8 - (1 - avg_confidence) × 40)`. A confidence do Transcribe vira sinal pedagógico adicional — "ouvimos a palavra X com baixa certeza" é informação acionável.
> 3. **Feedback por palavra** gerado pela persona `pronunciation_feedback` via **Bedrock Claude Haiku** ([ADR-017](017-llm-amazon-bedrock.md)), recebendo `{expected, transcribed, problem_words_with_confidence}`.
>
> A fase 2 (Azure Pronunciation Assessment) permanece como path de upgrade se o sinal WER+confidence se mostrar insuficiente em produção.

## Contexto

O Pronunciation Coach precisa devolver ao aluno:

1. Sensação imediata — "sua pronúncia está boa / precisa melhorar".
2. Quais **palavras** saíram problemáticas.
3. Sugestão de prática (repetir chunk específico).

Construir um modelo acústico próprio (forced alignment, GOP score, phonetic distance) é caro e fora do MVP. Precisamos de uma abordagem **simples, boa o suficiente e evoluível**.

## Decisão

**Duas fases**, MVP e pós-MVP.

### Fase 1 — MVP: STT + alinhamento textual
1. Aluno grava a frase-alvo.
2. STT (Whisper, ver [ADR-005](005-tts-stt.md)) devolve transcrição + timestamps por palavra.
3. Normalizar expected e transcribed (lowercase, trim, remover pontuação).
4. Calcular **Word Error Rate (WER)** por alinhamento dinâmico (Levenshtein de palavras):
   - substitutions, deletions, insertions.
5. Score simples 0-100 = `max(0, 100 - WER% × 1.2)`.
6. Feedback ao aluno:
   - **Pronúncia boa** (score ≥ 80): ✓ verde, "nice!".
   - **Precisa melhorar** (60-79): ⚠ amarelo, destacar palavras diff como chunks para repetir.
   - **Tente de novo** (< 60): 🔁 vermelho, convite a ouvir de novo e repetir devagar.
7. Palavras-problema = substitutions + deletions detectadas no alinhamento.
8. Salvar em `pronunciation_attempts` com: `expected`, `transcribed`, `score`, `problem_words`, `audio_url`.

### Fase 2 — pós-MVP: avaliação acústica
Integrar **Azure Speech Pronunciation Assessment** (accuracy, fluency, completeness por fonema) ou **SpeechSuper API**. Mantém a mesma interface `PronunciationScorer`, só troca implementação. Usar quando:
- Volume justificar custo adicional por avaliação.
- Time tiver capacidade de tunar thresholds por sotaque brasileiro.

### Heurística anti-ruído (ambas as fases)
- Se STT devolve vazio ou < 50% do comprimento esperado → "Não conseguimos ouvir bem, grava de novo?" (não conta como tentativa negativa).
- Se o aluno leu em voz muito baixa (energia média do áudio < threshold), mesma mensagem.

## Alternativas consideradas

- **Modelo acústico próprio (Kaldi / Wav2Vec2 + alinhamento)** — qualidade alta, mas custo e operação altos. Fora do MVP.
- **Só Azure Pronunciation Assessment desde o início** — ótima qualidade, mas acoplamento precoce + custo por minuto. Começar com WER nos dá baseline comparável.
- **Simplesmente binário "ouvi/ouvi errado"** — insuficiente para motivar (aluno não sabe o que melhorar).

## Consequências

### Positivas
- Implementação simples: alinhamento de strings é trivial.
- Feedback por palavra habilita "repeat chunk" pedagógico (alinha com a metodologia de pronúncia por chunks).
- Interface `PronunciationScorer` permite upgrade sem refatorar UI.

### Negativas / Custos aceitos
- WER **não mede pronúncia real** — mede o quanto o STT "entendeu". Aluno pode pronunciar errado e o STT acertar por contexto, ou pronunciar certo e o STT errar. Mitigação:
  - Usar modelo STT que expõe `logprobs` por palavra quando disponível; baixo `logprob` em palavra acertada pode ser sinal de dicção fraca.
  - Linguagem do feedback conservadora: "o que ouvimos foi X" — nunca afirmar que está "errado" quando só o STT falhou.
- Sotaque brasileiro pode inflar WER. Calibrar thresholds em campo com os primeiros alunos beta.

### Neutras / Impactos
- Depende de STT — ver [ADR-005](005-tts-stt.md).
- Tabela `pronunciation_attempts` e schema em [knowledge/07-modelo-de-dominio.md](../knowledge/07-modelo-de-dominio.md).
- UX do Pronunciation Coach em [knowledge/11-pronunciation-coach.md](../knowledge/11-pronunciation-coach.md).

## Referências
- WER: https://en.wikipedia.org/wiki/Word_error_rate
- Azure Pronunciation Assessment: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment
