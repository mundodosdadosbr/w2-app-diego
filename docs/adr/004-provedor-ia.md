# ADR-004: Provedor de IA — Anthropic Claude via API

- **Status**: Accepted — **Amended by [ADR-017](017-llm-amazon-bedrock.md)** em 2026-04-21
- **Data**: 2026-04-21
- **Tags**: ia, backend, pedagogia

> **Nota de atualização (2026-04-21):** o acesso aos modelos Claude passou a ser **via Amazon Bedrock** em `us-east-1`. A escolha do provedor (Anthropic Claude) e a seleção dos modelos por persona permanecem válidas; muda apenas o **gateway**. Anthropic API direta fica como fallback de disponibilidade. Detalhes em [ADR-017](017-llm-amazon-bedrock.md).

## Contexto

A plataforma usa LLM para:

1. **Tutor IA** — responder dúvidas do aluno, explicar gramática em português quando necessário, encorajar prática.
2. **Speaking partner** — conduzir conversa em inglês no nível do aluno, com correção gentil.
3. **Corretor de frases** — avaliar se a frase produzida pelo aluno está adequada, sugerir correção, explicar erro em português.
4. **Recomendador de revisão** — analisar padrões de erro para sugerir reforço espaçado prioritário.

Requisitos:
- Qualidade alta em instrução estruturada e pedagogia multilíngue (inglês + português).
- Latência baixa em conversa (speaking).
- Custo previsível com alta alavancagem via prompt caching.
- Controle forte sobre **nunca sair do nível do aluno** (não usar vocabulário avançado com iniciante).
- Respeitar guardrails de copyright — nunca reproduzir a apostila (ver [ADR-009](009-copyright-e-ip.md)).

## Decisão

Adotamos **Anthropic Claude via API** como provedor primário de LLM.

- **Opus 4.7** (ou Sonnet 4.6 quando custo importar mais que profundidade) para: corretor de frases com explicação pedagógica detalhada, recomendador de revisão, geração de conteúdo pelos autores.
- **Sonnet 4.6** para: tutor, speaking partner em conversa aberta.
- **Haiku 4.5** para: classificadores rápidos (ex.: detectar idioma, classificar intenção), expansão de respostas curtas em role-play drills.

**Prompt caching obrigatório** em todas as chamadas estruturadas: system prompt da persona, regras pedagógicas, nível do aluno, vocabulário permitido — tudo cached. Só a mensagem do turno atual é "quente". Meta de cache hit rate ≥ 85% em produção.

**Orquestração**: chamadas à API rodam em **Supabase Edge Functions** com a chave `ANTHROPIC_API_KEY` protegida. O cliente nunca fala com a Anthropic diretamente.

**Streaming** habilitado para todas as respostas conversacionais (tutor e speaking) para reduzir sensação de latência.

**Guardrails**:
- Nível do aluno (`a1`, `a2`, `b1`…) injetado no system prompt com lista explícita de estruturas e vocabulário permitidos/proibidos.
- Política anti-plágio: prompt proíbe reproduzir trechos de apostilas conhecidas; temperature baixa (≤ 0.4) em conteúdo instrucional gerado; revisão humana obrigatória para qualquer conteúdo gerado por IA que entre no `published`.
- Correção "gentil": prompt exige começar pela intenção correta do aluno, elogiar, e só depois corrigir.

Prompts detalhados em [knowledge/10-ai-personas-e-prompts.md](../knowledge/10-ai-personas-e-prompts.md).

## Alternativas consideradas

- **OpenAI GPT-4o / GPT-4.1** — qualidade comparável, bom em function calling. Porém, a experiência de prompt caching e tool use atual na Anthropic alinha melhor com nossa abordagem de personas com system prompt longo e estável.
- **Gemini 2.x** — excelente custo em contextos longos, mas nossa necessidade é de personas estruturadas, não contextos gigantes. Reavaliar em 12 meses.
- **Modelos open-source self-hosted (Llama 3.x, Mistral)** — custo operacional alto para time pequeno, qualidade em português ainda aquém. Rejeitado no MVP; revisar quando volume justificar.
- **Múltiplos provedores desde o dia 1** — sobrecarga operacional. Começamos com Claude e mantemos a camada de LLM atrás de uma interface simples (`LlmClient`) para permitir troca futura sem refatoração ampla.

## Consequências

### Positivas
- Controle centralizado dos prompts das personas.
- Prompt caching reduz custo em 5-10× em conversas repetidas com mesma persona.
- Qualidade consistente em pt-BR + EN.
- Streaming nativo melhora percepção de velocidade em speaking.

### Negativas / Custos aceitos
- Dependência de um provedor. Mitigação: `LlmClient` abstrai chamada; segundo provedor pode ser adicionado em 1-2 sprints se necessário.
- Custo em dólar — precisamos monitorar tokens por aluno ativo. Meta: ≤ US$ 1/aluno ativo/mês em IA no MVP.
- Latência varia por região. Streaming + cache mitigam.

### Neutras / Impactos
- Personas e prompts em [knowledge/10-ai-personas-e-prompts.md](../knowledge/10-ai-personas-e-prompts.md).
- TTS/STT em [ADR-005](005-tts-stt.md) — independentes do provedor de LLM.
- Observabilidade de custos e qualidade em [ADR-012](012-observabilidade-e-analytics.md).

## Referências
- https://docs.anthropic.com/
- Prompt caching: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
