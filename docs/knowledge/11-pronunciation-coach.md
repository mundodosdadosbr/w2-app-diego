---
name: Pronunciation Coach
description: Fluxo, chunks, feedback, thresholds de score — como o aluno treina pronúncia
---

# 11 — Pronunciation Coach

Módulo dedicado a **pronúncia prática** — foco em sons, pares mínimos, ritmo e chunks (blocos de 2-5 palavras). Não ensina fonética acadêmica; ensina repetição com feedback acionável.

## Fluxo canônico

```
[1] Aluno vê a frase-alvo em inglês (en-US)
[2] Toca áudio em velocidade normal (ElevenLabs, voz en-US)
[3] Toca áudio em velocidade lenta (0.75x) — opcional
[4] Aluno grava sua versão (webm/opus, ≤ 30s)
[5] Upload para S3 staging (presigned URL via Edge Function)
[6] Amazon Transcribe (en-US, word-level confidence) transcreve
[7] Alinhamento palavra-a-palavra (Levenshtein) vs expected
[8] Score combinado: WER + (1 - avg_confidence)
[9] Bedrock Claude Haiku gera feedback curto em pt-BR
[10] UI destaca palavras por score/confidence (verde/amarelo/vermelho)
[11] Se score < 80: chunks sugeridos para repetir
[12] Aluno pode tentar de novo (até 5x consecutivas por frase)
```

Ver [ADR-007](../adr/007-pronunciation-scoring.md), [ADR-016](../adr/016-stt-amazon-transcribe.md), [ADR-017](../adr/017-llm-amazon-bedrock.md) para providers e scoring.

## Onde aparece

- **Seção Pronunciation** dentro da lesson (obrigatória em ≥ 50% das lessons).
- **Exercício standalone** tipo `pronunciation` em OUTPUT.
- **Módulo dedicado** `/pronunciation` fora da trilha — aluno escolhe frases para treinar.

## Seleção de frases-alvo

Para cada lesson, 2-4 frases-alvo em `pronunciation_targets` (sempre em **American English**):
- **Priorizar chunks funcionais** (handy phrases, não frases longas).
- **Inclua** ao menos uma frase com padrão sonoro desafiador para brasileiros em en-US:
  - /θ/ e /ð/ em "th" ("think", "this") — brasileiro tende a trocar por /t/, /d/, /f/.
  - /r/ **retroflexo americano** ("car", "water", "butter") — diferente do /r/ britânico ou do /ɾ/ português.
  - /ɪ/ vs /iː/ em pares mínimos ("ship/sheep", "bit/beat").
  - /æ/ ("cat", "bad") — vogal entre /a/ e /ɛ/, não existe em pt-BR.
  - **Flap americano** — /t/ entre vogais vira /ɾ/ ("water" → "wáɾɚ", "letter" → "léɾɚ"). Característica definitiva do en-US.
  - Consoantes finais surdas não aspiradas ("stop", "pit").
  - -ed do passado com 3 pronúncias (/t/, /d/, /ɪd/).
  - **Schwa** /ə/ em sílabas átonas ("banana" → "bə-NÆ-nə"). Brasileiro tende a pronunciar todas as vogais claramente.
- Variar de acordo com conteúdo da lesson.

## UI / UX

### Tela de treino
- **Frase em destaque** (~24-32pt).
- Tradução em toggle (padrão oculto em treino).
- **3 botões grandes**: 🔊 Normal | 🐢 Slow | 🎤 Record.
- Barra de áudio horizontal mostrando waveform do TTS.
- Após gravar: tela de resultado (abaixo).

### Tela de resultado
- **Grande indicador visual**:
  - ✅ Verde "Nice!" se score ≥ 80.
  - ⚠️ Amarelo "Almost there" se 60-79.
  - 🔁 Vermelho suave "Let's try again" se < 60.
- **Frase com palavras coloridas**:
  - Verde: palavra acertada.
  - Amarelo: palavra "quase" (substituição leve).
  - Vermelho: palavra errada ou omitida.
- **Chunks sugeridos** (quando score < 80): 2-3 mini-frases derivadas para repetir.
- Botão "Try again" e "Skip".
- Mensagem encorajadora gerada pela persona `pronunciation_feedback` (ver [10](10-ai-personas-e-prompts.md)).

## Scoring

Ver [ADR-007](../adr/007-pronunciation-scoring.md) para detalhes.

Resumo:
- **Sinal 1 — WER (Word Error Rate)** entre transcrição e esperado (alinhamento Levenshtein por palavra).
- **Sinal 2 — Confidence média** por palavra do Amazon Transcribe (quanto o motor "teve certeza" do que ouviu — proxy acústico razoável).
- Score combinado = `max(0, 100 - WER × 0.8 - (1 - avg_confidence) × 40)`.
- Thresholds:
  - ≥ 80 → grade 5 (verde, "Nice!")
  - 60-79 → grade 4 (se 1ª tentativa), grade 3 (2ª+) (amarelo, "Almost there")
  - 40-59 → grade 2 (vermelho suave, "Let's try again")
  - < 40 → grade 1
- Por palavra — a UI colore:
  - Acerto + confidence ≥ 0.85 → **verde**.
  - Acerto + confidence 0.6-0.85 → **amarelo** (dicção fraca mas acertou).
  - Substituição ou deleção → **vermelho** (palavra problema).
- Áudio vazio / baixa energia → "não conseguimos ouvir, grava de novo?" (não conta).

### Fase 2 (pós-MVP)
- Upgrade para Azure Pronunciation Assessment — accuracy/fluency/completeness por fonema.
- Interface `PronunciationScorer` permite swap sem mudar UI.

## Chunks e prática por chunk

Se `problem_words` tem 3+ palavras, dividir em chunks de 2-3 palavras:
- "I would like to have a coffee, please." → "I would like" | "to have" | "a coffee" | "please".
- Aluno repete cada chunk isolado antes de tentar a frase inteira.

Chunks são gerados por heurística simples:
1. Split por pontuação/vírgulas.
2. Cada pedaço > 4 palavras → re-split por preposição/conjunção.
3. Manter unidade fonética quando possível (ex.: "to have" junto).

## Regras de bom uso

- **Max 5 tentativas consecutivas** na mesma frase — evita frustração. Depois disso, oferecer "skip for now, revisit later" (cria review `d1`).
- **Não exigir pronúncia perfeita** para avançar na lesson. Score ≥ 60 é suficiente.
- **Listening first** — sempre ouvir 2× antes de gravar.
- **Opt-out** — aluno pode desabilitar Pronunciation coach em configurações (ex.: ambiente barulhento, aluno com dificuldade auditiva). Não bloqueia progresso da lesson.

## Dados salvos

Em `pronunciation_attempts` (ver [07](07-modelo-de-dominio.md)):
- `expected`, `transcribed`, `score`, `wer`, `problem_words`, `audio_key`.
- Audio em Storage com TTL 90 dias (ver [08](08-regras-de-negocio.md)).

## Integração com SRS

- Score ≤ 2 cria review de tipo `pronunciation_chunk` para os chunks problema.
- Revisão de pronúncia no Review Center aparece em cadência menor (porque exige áudio).

## Métricas

- Score médio por aluno / semana (tendência ≥ crescente é boa).
- % de aluno que desiste em < 2 tentativas (anti-meta: se > 30%, recalibrar thresholds).
- Pronúncia por palavra-problema: identificar padrões do público (brasileiros).

## Referências
- [ADR-005](../adr/005-tts-stt.md)
- [ADR-007](../adr/007-pronunciation-scoring.md)
- [10 — AI personas](10-ai-personas-e-prompts.md)
- [12 — Spaced repetition](12-spaced-repetition.md)
