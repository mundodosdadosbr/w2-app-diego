---
name: Metodologia Pedagógica
description: Ciclo INPUT → OUTPUT → REVIEW, princípios, microaprendizado, repetição com variação
---

# 02 — Metodologia Pedagógica

A metodologia é **a espinha dorsal do produto**. Toda decisão de UX, conteúdo, exercício e IA obedece aos princípios descritos aqui.

## O ciclo central: INPUT → OUTPUT → REVIEW

Toda exposição a conteúdo novo segue três momentos (dentro de uma lesson **e** ao longo do tempo entre lessons):

### 1. INPUT — Recebimento ativo
Aluno **recebe** novo conteúdo em blocos pequenos e bem delimitados:
- **Verbs** — verbos novos, forma infinitiva + tradução + exemplo curto.
- **New Words** — vocabulário novo agrupado por campo semântico.
- **Handy phrases** (Useful phrases) — chunks prontos para uso real.
- **Grammar** — estrutura funcional com 1-2 frases-modelo; explicação curta e em pt-BR quando necessário.

**Como é ativo, não passivo?** Cada item traz áudio (TTS), tradução-toggle, e micro-interação obrigatória (clicar para revelar, repetir, marcar "já conheço"). Nunca uma parede de texto.

### 2. OUTPUT — Produção do aluno
Aluno **produz** com o que acabou de ver. Essa é a etapa mais importante do produto.
- **In context (Real Life)** — mini-diálogo contextualizado.
- **Drill (Check it out)** — substituição, transformação, completar, associação.
- **Speak now** — produção oral guiada de frases aprendidas.
- **Pair practice** (Talk to your friend) — conversa simulada com IA.
- **Listen and Practice** / **Listen & act** — compreensão + role-play.
- **Fluency** — perguntas abertas que encadeiam respostas livres.
- **Pronunciation coach** — prática oral com feedback por palavra.

O aluno **não passa de lesson sem produzir** (regra dura: [08](08-regras-de-negocio.md)).

### 3. REVIEW — Fixação e retenção
Cobre dois níveis:
- **Dentro da lesson**: seção **Recap** (Pinpoint) — exercícios curtos cumulativos + **Self-assessment** (checklist "I can" / "I'm not sure if I can").
- **Ao longo do tempo**: fila de **revisão espaçada** (1/3/7/14/30 dias) gerenciada pela SRS. Ver [12](12-spaced-repetition.md).

Se o aluno marca "I'm not sure if I can", o sistema agenda revisão automática da lesson-origem daquele objetivo.

## Princípios pedagógicos

### Microaprendizado
- Cada lesson tem duração-alvo de **10-15 minutos**.
- Cada seção dentro da lesson cabe em **1-3 minutos**.
- Vocabulário novo por lesson: **5-10 itens** (não sobrecarregar).
- Uma estrutura gramatical por lesson (às vezes duas pequenas combinadas).

### Repetição com variação
- Item novo aparece na lesson em **pelo menos 3 contextos diferentes** (ex.: New Words → Handy phrase → In context → Drill).
- Entre lessons, volta na SRS.
- Repetição literal é evitada — varia contexto, combinação, modalidade (ouvir vs ler vs falar).

### Uso imediato
- Introduziu vocabulário? Primeiro drill na mesma lesson **usa** esse vocabulário.
- Introduziu estrutura? Speak now **forma frases** com a estrutura.
- Não introduzir e adiar uso.

### Progressão do simples para o complexo
- Primeira exposição: forma afirmativa.
- Depois: forma negativa.
- Depois: forma interrogativa.
- Depois: combinação com outras estruturas.
- Cada unidade escala um passo; nunca pula.

### Vocabulário sempre contextualizado
- Nunca listar palavras soltas sem uso. Toda palavra em New Words vem acompanhada de exemplo curto em frase.
- Tradução pt-BR ao lado no momento de INPUT; toggle nos momentos de OUTPUT.

### Gramática funcional
- Explicações em pt-BR para nível inicial; transição para EN em B1+.
- Foco em **para que serve** e **quando se usa**, não em nomenclatura terminológica.
- Exemplo > regra. Regra curta aparece depois de 2-3 exemplos.

### Muita produção ativa
- O tempo mínimo de produção ativa por lesson é **≥ 40% do tempo total** (OUTPUT + Pronunciation).
- Se métricas mostrarem < 40%, a lesson precisa ser redesenhada.

### Revisão cumulativa
- Cada lesson traz 1-2 itens de revisão da lesson anterior, de forma implícita (Speak now reutiliza estrutura antiga com novo vocab, por exemplo).
- Recap agrega os padrões principais do bloco.

### Autoavaliação ao final de cada ciclo
- Self-assessment por unit com checklist "I can" / "I'm not sure if I can" / "I can't yet".
- Os "not sure" e "can't yet" alimentam recomendações automáticas de reforço.

## Como isso se traduz em decisões concretas

| Decisão | Regra derivada |
|---|---|
| Ordem das seções da lesson | Verbs → New Words → Handy phrases → Grammar → In context → Drill → Speak now → Pair practice → Pronunciation → Recap → Self-assessment. Ver [04](04-anatomia-da-lesson.md). |
| Número de exercícios por lesson | 6-12, dependendo do tamanho do vocab introduzido. |
| Quando criar review | Item novo visto no INPUT → cria review `d1`. Item errado em qualquer exercício → puxa review para "hoje". |
| Quando lesson conta como concluída | Todas as seções obrigatórias completadas + pelo menos 60% de acertos em OUTPUT. Ver [08](08-regras-de-negocio.md). |
| Tom do tutor IA | Gentil, positivo, foco em comunicação antes de perfeição. Ver [10](10-ai-personas-e-prompts.md). |
| Dificuldade do speaking | Limitada ao vocabulário e estruturas que o aluno **já viu** (não introduz surpresa). |

## O que evitar

- **Conteúdo sem output**: lesson só de leitura/video não existe. Toda lesson exige produção.
- **Tradução como muleta**: tradução permanentemente visível em OUTPUT vira leitura, não produção.
- **Gamificação enganosa**: pontuação alta por cliques/passividade. Pontos vêm de output e acertos, não de "ver".
- **Explicação gramatical longa**: > 150 palavras em uma caixa de texto. Se for maior, quebrar em exemplos.
- **Surpresa negativa**: exercício que pede produção com vocabulário nunca apresentado. Tolerado só em Fluency/conversa livre, com andaime claro.

## Referências
- Baseado no prompt do produto (`prompot-sistema.txt`).
- Alinha com CEFR action-oriented approach.
- Guardrails contra reprodução de apostila: [14](14-guardrails-copyright.md).
