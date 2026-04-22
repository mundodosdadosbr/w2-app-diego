---
name: Anatomia da Lesson
description: Estrutura da lesson — seções A-G, fluxo INPUT/OUTPUT/REVIEW, regras de navegação
---

# 04 — Anatomia da Lesson

Toda lesson segue uma sequência padronizada. A consistência ajuda o aluno (expectativa clara) e o autor (template mental firme).

## Sequência canônica

| Ordem | Seção | Fase | Obrigatória? | Tempo alvo |
|---|---|---|---|---|
| 1 | Intro & Objectives | Abertura | ✅ | 30s |
| 2 | Verbs | INPUT | ✅ | 1-2 min |
| 3 | New Words | INPUT | ✅ | 2-3 min |
| 4 | Handy phrases (Useful phrases) | INPUT | ✅ | 2 min |
| 5 | Grammar | INPUT | ✅ | 2-3 min |
| 6 | In context (Real Life) | Contextualização | ✅ | 2 min |
| 7 | Drill (Check it out) | Fixação | ✅ | 3-4 min |
| 8 | Speak now / Pair practice | OUTPUT | ✅ | 3-5 min |
| 9 | Listen & act (Listen, Number, Role-play) | OUTPUT | Quando houver diálogo | 3 min |
| 10 | Fluency | OUTPUT | Quando aplicável (nível ≥ A2) | 2-4 min |
| 11 | Pronunciation coach | OUTPUT / Pronúncia | ✅ em ≥ 50% das lessons | 2-3 min |
| 12 | Recap (Pinpoint) | REVIEW | ✅ | 2 min |
| 13 | Self-check | REVIEW | ✅ | 30s |

**Duração total alvo**: 10-15 minutos. Se passar de 18 min, a lesson precisa ser dividida.

## Descrição de cada seção

### 1. Intro & Objectives
- Título da lesson em EN + subtítulo pt-BR.
- 1-3 bullets "Nesta lesson você vai aprender a...".
- Ícone indicador da fase (INPUT/OUTPUT/REVIEW) que aparece em cada seção.
- Barra de progresso horizontal com 13 marcos clicáveis (UX).

### 2. Verbs
- Lista de 2-4 verbos novos.
- Cada verbo: infinitivo em EN + tradução pt-BR + áudio TTS + 1 exemplo curto em frase.
- Interação: clicar para ouvir; marcar "já conheço" para pular.

### 3. New Words
- 5-10 substantivos/adjetivos agrupados por campo semântico.
- Cada item: palavra EN + pt-BR + TTS + (opcional) imagem/ilustração + exemplo.
- Interação mínima: ouvir + repetir silenciosamente. Rapidinha.

### 4. Handy phrases
- 3-6 chunks funcionais prontos (ex.: "Can I have...?", "What do you do?").
- Cada chunk com função declarada: "pedir", "cumprimentar", "perguntar profissão".
- TTS + tradução pt-BR colapsável.

### 5. Grammar
- **Uma** estrutura principal (às vezes duas pequenas combinadas).
- Formato: 2-3 frases-modelo → explicação curta em pt-BR → padrão formal abstrato.
- Exemplo > regra. Explicação ≤ 100 palavras.
- Toggle "ver explicação em inglês" para níveis ≥ B1.

### 6. In context (Real Life)
- Mini-diálogo de 4-8 linhas entre personagens da plataforma.
- Áudio TTS com vozes distintas por personagem.
- Aluno ouve primeiro, depois lê, depois repete linha a linha.
- Tradução pt-BR em toggle.

### 7. Drill (Check it out)
- 3-6 exercícios curtos de fixação: substituição, transformação, completar, ordenar, associação. Ver [05](05-catalogo-de-exercicios.md).
- Feedback instantâneo por item.
- Alvo de acerto para prosseguir sem revisão: 70%+.

### 8. Speak now / Pair practice
- **Speak now**: produção guiada. Tela dá prompt pt-BR ("Diga que você não bebe café pela manhã"), aluno produz em EN por fala ou texto.
- **Pair practice**: conversa com tutor IA (modo "resposta curta" — 2-4 turnos). Tutor segue script semi-estruturado respeitando vocabulário já apresentado. Ver [10](10-ai-personas-e-prompts.md).

### 9. Listen & act
- Aluno ouve diálogo já conhecido em nova ordem/contexto.
- Numera a ordem correta OU identifica o falante.
- Em seguida, role-play: escolhe um dos papéis, grava suas falas.

### 10. Fluency
- Pergunta aberta relacionada à vida do aluno ("What do you usually have for breakfast?").
- Resposta livre por fala ou texto.
- Tutor IA oferece feedback curto (ver [10](10-ai-personas-e-prompts.md)).
- Opcional em A0/A1 inicial.

### 11. Pronunciation coach
- 2-4 frases-alvo da lesson.
- Aluno ouve → grava → recebe score + palavras-problema. Ver [11](11-pronunciation-coach.md).
- Sugestão de chunks para repetir.

### 12. Recap (Pinpoint)
- 3-5 itens cumulativos que cobrem os padrões principais da lesson + 1-2 itens puxados da lesson anterior (repetição espaçada implícita).
- Objetivo: consolidação rápida.

### 13. Self-check
- Mini-checklist "I can" só dos objetivos **desta** lesson (2-3 itens).
- Não é obrigatório para concluir, mas fortemente convidado.
- Alimenta o self-assessment da unit.

## Regras de fluxo

- **Sequência linear por padrão**. Aluno pode pular para qualquer seção já visitada, mas não adiantar seções não visitadas **na primeira vez**.
- **Salvamento contínuo** — ao sair da seção, progresso persiste. Retoma exatamente onde parou.
- **Critério de conclusão da lesson**:
  1. Todas as seções obrigatórias visitadas.
  2. OUTPUT concluído com ≥ 60% de acertos.
  3. Recap feito.
- **Sem critério de perfeição** — erro não trava progresso; gera review.

## Indicador visual INPUT/OUTPUT/REVIEW
No topo do player, sempre visível:
- 📘 **INPUT** (seções 2-5): fundo azul claro.
- 💬 **OUTPUT** (seções 6-11): fundo laranja claro.
- 🔁 **REVIEW** (seções 12-13): fundo verde claro.

Ajuda o aluno a sentir o movimento do ciclo.

## Autoria

Toda lesson autorada preenche template canônico em `supabase/seed/content/unit-XX-tema/lesson-YY.json`:

```json
{
  "slug": "introducing-yourself",
  "title_en": "Introducing yourself",
  "title_pt_br": "Se apresentando",
  "objectives_pt_br": ["Dizer meu nome e onde moro.", "Perguntar o nome de alguém."],
  "verbs": [...],
  "new_words": [...],
  "handy_phrases": [...],
  "grammar": {...},
  "in_context": {"dialog": [...]},
  "drills": [...],
  "speak_now_prompts": [...],
  "pair_practice_script": {...},
  "pronunciation_targets": [...],
  "recap_items": [...],
  "self_check_items": [...]
}
```

Schema completo em [07](07-modelo-de-dominio.md).

## Referências
- [02 — Metodologia](02-metodologia-pedagogica.md)
- [05 — Catálogo de exercícios](05-catalogo-de-exercicios.md)
- [10 — AI personas](10-ai-personas-e-prompts.md)
- [11 — Pronunciation coach](11-pronunciation-coach.md)
