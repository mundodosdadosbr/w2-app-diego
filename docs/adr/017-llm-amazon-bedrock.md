# ADR-017: LLM via Amazon Bedrock (Claude)

- **Status**: Accepted
- **Data**: 2026-04-21
- **Tags**: ia, aws, pedagogia, custos
- **Amends**: [ADR-004](004-provedor-ia.md)

## Contexto

Originalmente o [ADR-004](004-provedor-ia.md) optou pela API Anthropic direta. Diego pediu consolidar IA na AWS (com [ADR-016](016-stt-amazon-transcribe.md) e gerenciamento via MCP AWS). Bedrock hoje:

- Hospeda Claude Sonnet 4.5/4.6 e Haiku 4.5 em `us-east-1` (e cross-region inference).
- Suporta **prompt caching** para modelos Claude, com TTL e simplified cache management.
- Integra com IAM, VPC endpoints, CloudTrail, billing AWS.

Risco de migrar: Bedrock historicamente recebe modelos Anthropic com 1-4 semanas de delay e caching teve gaps iniciais. Hoje é maduro, mas verificar a cada upgrade de modelo.

## Decisão

**Claude via Amazon Bedrock Runtime API em `us-east-1`** é o caminho primário. Anthropic direta fica como **fallback de disponibilidade** via mesma interface `LlmClient`.

### Modelos e papéis
| Persona | Modelo | Uso |
|---|---|---|
| Tutor, Speaking partner | `anthropic.claude-sonnet-4-6` (ou equivalente) | conversa, tutoria |
| Corretor de frases | `anthropic.claude-opus-4-x` (via Bedrock quando disponível; se ainda não, fallback Sonnet) | correção profunda |
| Recomendador de revisão | `anthropic.claude-opus-4-x` | raciocínio sobre padrões |
| Pronunciation feedback | `anthropic.claude-haiku-4-5` | resposta curta, barata |

Usar **cross-region inference profile** quando disponível para um modelo, maximizando disponibilidade.

### Prompt caching
- Cacheamos: system prompt da persona, regras pedagógicas, lista de vocabulário permitido, histórico resumido do aluno.
- Apenas o turno atual fica não-cacheado.
- Usamos `cachePoint` blocks do Bedrock na estrutura do `InvokeModel`/`Converse`.
- Meta: **cache hit rate ≥ 80%** em produção (um pouco menor que alvo original de 85% por margem de segurança no Bedrock; ajustar após medir).
- Se cache hit rate persistir < 70%, avaliar voltar Anthropic direta para personas de alto volume (tutor + speaking).

### Streaming
- `ConverseStream` habilitado para tutor e speaking partner.
- Streaming masks ~120ms latência BR↔us-east-1 — imperceptível ao aluno.

### Orquestração
- Chamadas Bedrock em **Supabase Edge Function** `llm-invoke` com credenciais AWS (ver [ADR-019](019-aws-auth.md)).
- Cliente **nunca** chama Bedrock direto. Não há AWS SDK no frontend.
- Interface `LlmClient` abstrata: `invoke(persona, variables)` → `{ text, tokensIn, tokensOut, cacheHit, cost }`. Implementações: `BedrockLlmClient` (primário), `AnthropicLlmClient` (fallback).

### Observabilidade
- Toda invocação logada em `ai_usage` (ver [07](../knowledge/07-modelo-de-dominio.md)): `provider='bedrock'`, `model`, tokens, `cache_hit`, `latency_ms`, `cost_cents`.
- Bedrock CloudWatch metrics adicionadas ao dashboard interno.

### Guardrails
Bedrock Guardrails podem complementar os prompts:
- PII detection em entradas do aluno (embora não seja esperado).
- Topic filters: bloquear política, religião, conteúdo adulto — alinhado com [knowledge/10](../knowledge/10-ai-personas-e-prompts.md).
- **No MVP** guardrails ficam no prompt; Bedrock Guardrails são upgrade de fase 2 quando volume justificar.

## Alternativas consideradas

- **Anthropic API direta** (ADR-004 original) — caching mais maduro (5min TTL, até 4 blocos), modelos mais novos primeiro. Mantemos como fallback, não primário.
- **Google Vertex com Claude** — alternativa, mas fragmenta cloud (AWS para STT, GCP para LLM). Pior.
- **Multi-provider ativo** (Bedrock + Anthropic em A/B runtime) — complexidade cara para benefício duvidoso. Fica para quando tivermos dados.
- **Nova (AWS)** para alguma persona — qualidade em pt-BR ainda atrás de Claude; reavaliar depois.

## Consequências

### Positivas
- Stack AWS unificada (com [ADR-016](016-stt-amazon-transcribe.md)): um billing, um IAM, um CloudTrail.
- Residência de dados na conta AWS (LGPD-friendly se escolhermos região adequada no futuro, ou se VPC endpoints virarem requisito).
- MCP AWS disponível para operar e auditar o uso (via `aws-documentation`, `aws-iac`, `aws-pricing`).
- Fallback via Anthropic direta garante resiliência.

### Negativas / Custos aceitos
- **Delay de modelos**: upgrades Anthropic chegam 1-4 semanas depois no Bedrock. Aceitável.
- **Prompt caching amadurecendo no Bedrock** — monitorar cache hit rate. Mitigação: fallback para Anthropic direta se cache hit cair.
- Custo de Bedrock historicamente foi ~idêntico à Anthropic direta; variações pequenas. Reavaliar trimestralmente.

### Neutras / Impactos
- [ADR-004](004-provedor-ia.md) fica amendado (status atualizado para "Amended by ADR-017").
- Interface `LlmClient` em `lib/llm/` — ver estrutura em [ADR-011](011-estrutura-do-repositorio.md).
- Auth AWS em [ADR-019](019-aws-auth.md).
- Observabilidade em [ADR-012](012-observabilidade-e-analytics.md).

## Referências
- https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html
- https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-3-5-haiku.html
- `Converse` / `InvokeModel` APIs do Bedrock Runtime.
