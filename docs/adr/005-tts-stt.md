# ADR-005: Provedor de TTS e STT

- **Status**: Accepted — **STT parcialmente superseded por [ADR-016](016-stt-amazon-transcribe.md)** em 2026-04-21
- **Data**: 2026-04-21
- **Tags**: audio, ia, backend, pedagogia

> **Nota de atualização (2026-04-21):** a parte de **STT** foi movida para **Amazon Transcribe** em `en-US` (ver [ADR-016](016-stt-amazon-transcribe.md)). Whisper deixou de ser o primário — ficou demonstrado que seu comportamento de "completar" áudio ambíguo infla score falso de pronúncia para não-nativos. A parte de **TTS** permanece: **ElevenLabs primário, OpenAI TTS fallback/bulk** — ElevenLabs tem prosódia mais natural em inglês conversacional, o que é pedagogicamente importante (aluno imita o modelo). Polly foi avaliado e descartado no MVP por esta razão.

## Contexto

Áudio é essencial ao produto:

- **TTS (Text-to-Speech)** — tocar frases, drills e diálogos com voz natural em inglês (americano padrão). O aluno precisa ouvir muitas vezes sem fadiga.
- **STT (Speech-to-Text)** — capturar fala do aluno para exercícios de speaking, role-play e pronunciation coach.

Requisitos:
- Voz TTS natural em inglês (primário: en-US; desejável: en-GB).
- TTS com SSML/controle de velocidade para chunks lentos em pronúncia.
- Custo por minuto baixo e cacheável (TTS de conteúdo publicado é idempotente).
- STT com timestamps por palavra para alinhar ao texto esperado e destacar palavras problemáticas.
- STT tolerante a sotaque brasileiro.
- Possibilidade de rodar 100% server-side para não vazar chaves.

## Decisão

### TTS
**Provedor primário: ElevenLabs** (voz natural, multilíngue, SSML-like via `voice_settings` e `pronunciation_dictionaries`).
**Fallback / bulk: OpenAI TTS** (mais barato, qualidade alta, bom para pré-gerar áudio em lote).

Estratégia:
1. **Pré-gerar TTS** para todo conteúdo publicado (frases, diálogos, vocab) durante build/seed, salvando em Supabase Storage com chave `tts/{locale}/{voice}/{sha256(texto)}.mp3`. Isso zera custo em runtime para conteúdo estável.
2. **Runtime TTS** só para frases dinâmicas (resposta do tutor IA em conversa aberta, por exemplo).
3. **Velocidades**: gerar versão normal e slow (0.75×) para chunks de pronúncia.

### STT
**Provedor primário: OpenAI Whisper (`gpt-4o-transcribe` ou `whisper-large-v3` via API)** — qualidade alta em inglês falado por não-nativos, bom com sotaque brasileiro, timestamps por palavra.
**Avaliação paralela: Deepgram Nova** — latência menor, útil para speaking em tempo real. Reavaliar após MVP.

Fluxo de STT:
1. Cliente grava áudio (Web MediaRecorder, webm/opus).
2. Upload para Supabase Storage em bucket `stt-uploads/{user_id}/{session_id}/{timestamp}.webm` com expiração 24h.
3. Edge Function chama provedor STT e recebe transcrição com timestamps.
4. Resultado alimenta scoring de pronúncia. Ver [ADR-007](007-pronunciation-scoring.md).

### Orquestração
Tudo em Edge Functions (`tts-generate`, `stt-transcribe`) com chaves protegidas. Cliente nunca chama provedores direto.

## Alternativas consideradas

- **Google Cloud Speech / TTS** — maduro, mas vozes TTS menos naturais que ElevenLabs em inglês conversacional.
- **Azure Speech** — comparável, com pronunciation assessment embutido (atrativo). Mantemos como candidato forte para pronunciation scoring em fase 2. Ver [ADR-007](007-pronunciation-scoring.md).
- **Web Speech API (navegador)** — gratuito, mas qualidade e cobertura cross-browser ruins; iOS Safari com limitações; sem timestamps por palavra confiáveis.
- **Whisper self-hosted** — custo fixo de GPU, complexidade operacional alta. Não se paga no MVP.

## Consequências

### Positivas
- TTS de conteúdo estável **praticamente grátis em runtime** via cache em Storage.
- STT com timestamps por palavra habilita pronunciation scoring significativo sem inventar modelo próprio.
- Dois provedores de TTS permitem trocar preço/qualidade por tipo de uso.

### Negativas / Custos aceitos
- Dependência de provedores externos. `TtsClient` e `SttClient` abstratos permitem swap.
- Pré-gerar TTS exige rodar job quando conteúdo novo é publicado. Um worker simples (GitHub Action ou Edge Function acionada por trigger) cobre isso.
- Latência de STT (~1-3s para Whisper) limita conversa ao vivo. Para role-play em tempo real, investigar Deepgram streaming no pós-MVP.

### Neutras / Impactos
- Pronunciation scoring em [ADR-007](007-pronunciation-scoring.md).
- Cache de áudio e custos em [ADR-012](012-observabilidade-e-analytics.md).
- Armazenamento das gravações do aluno e retenção em [ADR-012](012-observabilidade-e-analytics.md) e [knowledge/08-regras-de-negocio.md](../knowledge/08-regras-de-negocio.md).

## Referências
- https://elevenlabs.io/docs
- https://platform.openai.com/docs/guides/speech-to-text
- https://platform.openai.com/docs/guides/text-to-speech
- https://developers.deepgram.com/docs
