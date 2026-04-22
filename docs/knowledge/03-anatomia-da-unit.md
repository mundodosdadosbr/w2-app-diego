---
name: Anatomia da Unit
description: Estrutura de uma unidade — objetivos I can, lessons, Recap, Self-assessment
---

# 03 — Anatomia da Unit

Uma **unit** é um bloco temático que entrega ao aluno **um conjunto coeso de habilidades comunicativas** ("I can"). É o nível acima de lesson e o nível abaixo de trilha.

## Estrutura canônica

```
Unit 03 — Languages & Countries
├── Cover (abertura)
│   ├── Título e tema
│   ├── "Ao final desta unidade, você será capaz de..."
│   ├── Lista de objetivos "I can"
│   ├── Estimativa de tempo total
│   └── Thumb da trilha com posição atual
│
├── Lesson 1 — [título curto]
├── Lesson 2 — [título curto]
├── Lesson 3 — [título curto]
├── Lesson 4 — [título curto]
├── (opcional) Lesson 5-6
│
├── Recap da Unidade
│   ├── Exercícios cumulativos do bloco
│   ├── Padrões destacados
│   └── Fluência: tarefa aberta de produção
│
├── Self-assessment
│   ├── Checklist "I can" para cada objetivo
│   ├── "I'm not sure if I can" / "I can't yet"
│   └── Recomendações automáticas de reforço
│
└── Fechamento (There and around)
    ├── Situação prática de síntese
    └── Preview da próxima unidade
```

## Componentes

### Cover — abertura
Primeira tela ao entrar na unit. Motiva e contextualiza.

- **Título** curto em pt-BR + subtítulo em EN quando couber (ex.: "Países e idiomas — Languages & countries").
- **Objetivos comunicativos** em formato "I can" **em pt-BR**, 4-8 itens:
  - ✓ "Falar que país e idioma eu conheço."
  - ✓ "Perguntar a alguém onde mora e que línguas fala."
  - ✓ "Apresentar um amigo ou familiar."
  - etc.
- **Tempo estimado** total da unit (ex.: "~75 min").
- **Posição na trilha** (unit 3 de 10).
- **Situação final** do There and around: "ao final, você consegue [descrever cenário real]".

### Lessons
- **4 a 6 lessons** por unit (sweet spot: 4).
- Ordenadas de forma que cada uma se apoie na anterior (nunca pular conceito).
- Cada lesson aborda **1-2 objetivos** do checklist, não mais.
- Naming das lessons: curto, conceitual, em EN (ex.: "Introducing yourself", "Talking about routine"), com subtítulo pt-BR se ajuda.

### Recap da Unidade (Pinpoint — nome interno: "Recap")
**Não é uma nova lesson** — é a **síntese** do que foi visto.

Conteúdo:
- 5-10 exercícios cumulativos mesclando vocabulário e estruturas das lessons da unit.
- 1-2 tarefas de **fluência** (produção aberta curta): "Grave-se respondendo: Where are you from? What languages do you speak?".
- Destaque dos padrões principais (no mais 4-5 bullets curtos).

Não há conteúdo novo no Recap — é consolidação.

### Self-assessment
Ao final do Recap, checklist obrigatório.

Para cada objetivo "I can" da unit, aluno escolhe:
- ✅ **I can** — domino, pronto.
- 🤔 **I'm not sure** — acho que sim, mas insegur@.
- ❌ **I can't yet** — ainda não.

**Consequências**:
- "I can't yet" → cria revisões imediatas da lesson-origem do objetivo + abre `/admin` flag para possível ajuste pedagógico.
- "I'm not sure" → cria revisões em 3 dias.
- "I can" → item fica dormindo; só volta em SRS normal.

O aluno pode revisitar o self-assessment a qualquer momento.

### There and around — fechamento
Breve "próximo passo":
- Uma situação real para praticar (ex.: "da próxima vez que conhecer alguém novo, pergunte de onde a pessoa é em inglês").
- Preview da próxima unit (1-2 frases).
- CTA para começar a próxima unit ou revisar.

## Regras

- **Unit não é concluída** até:
  1. Todas as lessons obrigatórias estarem concluídas.
  2. Recap ser feito.
  3. Self-assessment ser submetido.
- **Desbloqueio da próxima unit** acontece ao concluir a atual (salvo modo aberto, ver [08](08-regras-de-negocio.md)).
- **Tempo total**: alvo 60-90 minutos de engajamento ativo distribuído ao longo de dias. Nunca em sessão única (vai contra microaprendizado).

## Tamanho e densidade

| Métrica | Alvo | Max |
|---|---|---|
| Lessons por unit | 4 | 6 |
| Vocabulário novo por unit | 30-50 itens | 60 |
| Estruturas gramaticais novas | 3-5 | 6 |
| Handy phrases novas | 8-15 | 20 |
| Objetivos "I can" | 4-6 | 8 |
| Tempo ativo total | 60-90 min | 120 min |

## Schema (resumo)
Tabelas relacionadas: `units`, `unit_versions`, `unit_objectives`, `lessons`. Detalhes em [07](07-modelo-de-dominio.md).

## Exemplo
Ver seed inicial em `supabase/seed/content/unit-01-greetings/` e `unit-02-food-and-drinks/` (backlog MVP).

## Referências
- [02 — Metodologia](02-metodologia-pedagogica.md)
- [04 — Anatomia da Lesson](04-anatomia-da-lesson.md)
- [06 — Currículo inicial](06-curriculo-inicial.md)
