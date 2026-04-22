---
name: Catálogo de Exercícios
description: Tipos de exercício suportados — entrada, saída, critério de acerto, UX, uso pedagógico
---

# 05 — Catálogo de Exercícios

Cada tipo de exercício tem:
- **Propósito pedagógico** — para que serve.
- **Fase do ciclo** — INPUT | OUTPUT | REVIEW.
- **Entrada** — o que o aluno recebe.
- **Saída** — o que o aluno produz.
- **Critério de acerto** — como calcular grade 0-5.
- **UX resumida**.
- **Onde aparece** — típicas seções da lesson.

## 1. Repetição de frase (Shadow repeat)
- **Fase**: OUTPUT / Pronúncia
- **Entrada**: frase-alvo em EN + áudio TTS
- **Saída**: gravação do aluno repetindo
- **Critério**: WER ≤ 20% → grade 5; 21-40% → 3; > 40% → 2. Ver [11](11-pronunciation-coach.md).
- **UX**: botão tocar → botão gravar → feedback por palavra.
- **Onde**: Pronunciation coach, Speak now.

## 2. Múltipla escolha
- **Fase**: INPUT / Drill / REVIEW
- **Entrada**: pergunta ou frase com lacuna + 3-4 opções
- **Saída**: seleção de uma opção
- **Critério**: correto → 5; incorreto → 1 (primeira tentativa); se opção "quase certa" (configurada) → 3.
- **UX**: cards grandes, tocáveis, feedback instantâneo (✓/✗ + explicação curta).
- **Onde**: Drill, Recap.

## 3. Completar lacunas (Fill in the blank)
- **Fase**: Drill / REVIEW
- **Entrada**: frase com lacuna + opções (múltipla) **ou** campo livre
- **Saída**: palavra/chunk
- **Critério**: match exato (case/acentos ignorados) → 5; com typo leve (Levenshtein ≤ 2) → 3 com dica; erro → 1.
- **UX**: input inline dentro da frase; mostrar tradução pt-BR abaixo quando livre.
- **Onde**: Drill, Recap.

## 4. Ordenar palavras (Word order)
- **Fase**: Drill
- **Entrada**: conjunto de "chips" (palavras embaralhadas) + frase-alvo em pt-BR como prompt
- **Saída**: sequência de chips formando a frase
- **Critério**: ordem exata → 5; uma troca → 3; mais que uma → 2. Se aluno pede dica (mostra primeira palavra), teto é 3.
- **UX**: drag-drop no desktop; tap-para-adicionar no mobile.
- **Onde**: Drill, Recap (útil para fixar word order em inglês).

## 5. Associação palavra-imagem
- **Fase**: INPUT / Drill
- **Entrada**: grid de imagens + lista de palavras em EN
- **Saída**: pares palavra↔imagem
- **Critério**: proporção de acertos na primeira tentativa define grade.
- **UX**: drag ou tap+tap.
- **Onde**: New Words em unidades concretas (food, places).

## 6. Associação EN ↔ pt-BR
- **Fase**: INPUT leve / REVIEW
- **Entrada**: duas colunas embaralhadas, n pares
- **Saída**: pares corretos
- **Critério**: proporção de acertos.
- **UX**: linhas conectadas ou cliques casados.
- **Onde**: New Words, Recap.

## 7. Pergunta curta (Short answer)
- **Fase**: OUTPUT
- **Entrada**: pergunta em EN por texto + TTS ("Where are you from?")
- **Saída**: resposta por texto ou fala (2-10 palavras)
- **Critério**: LLM corretor (ver [10](10-ai-personas-e-prompts.md)) avalia: (a) resposde à pergunta; (b) estrutura mínima correta; (c) vocabulário dentro do nível. Grade 0-5.
- **UX**: input dual (text + mic). Feedback do LLM com "você disse X; uma forma comum é Y".
- **Onde**: Fluency, Pair practice.

## 8. Montar frase (Build the sentence)
- **Fase**: OUTPUT
- **Entrada**: prompt em pt-BR ("Diga que você gosta de café, mas não de chá")
- **Saída**: frase em EN produzida livremente
- **Critério**: LLM corretor avalia; match-like com frase-modelo também conta.
- **UX**: input livre + botão "ouvir de volta (TTS)" após submit.
- **Onde**: Speak now, Drill avançado.

## 9. Role-play com IA
- **Fase**: OUTPUT
- **Entrada**: cenário ("Você está num restaurante pedindo um café"), role do aluno e do IA, turno inicial do IA
- **Saída**: conversa de 3-6 turnos
- **Critério**: completou os turnos + atingiu objetivo do cenário + vocabulário dentro do nível → grade por LLM.
- **UX**: chat com áudio TTS do IA, input text/voice do aluno, correção gentil inline ou ao final.
- **Onde**: Pair practice, Speaking Practice dedicada.

## 10. Shadowing
- **Fase**: OUTPUT / Pronúncia
- **Entrada**: áudio de diálogo com "espaços" onde o aluno fala junto
- **Saída**: gravação simultânea
- **Critério**: WER + timing (entrou no tempo certo?). Meio experimental; no MVP, scoring apenas por WER. Ver [11](11-pronunciation-coach.md).
- **UX**: player com forma de onda, botão de gravar, playback overlay.
- **Onde**: Pronunciation coach (opcional), In context avançado.

## 11. Pronúncia com gravação
- **Fase**: OUTPUT / Pronúncia
- **Entrada**: frase-alvo + áudio de referência (normal e slow)
- **Saída**: gravação do aluno
- **Critério**: score ver [11](11-pronunciation-coach.md).
- **UX**: 3 botões (ouvir normal, ouvir slow, gravar), feedback por palavra destacado em verde/amarelo/vermelho.
- **Onde**: Pronunciation coach.

## 12. Quiz de revisão (Review quiz)
- **Fase**: REVIEW
- **Entrada**: 5-10 itens misturando múltipla escolha, completar, associação
- **Saída**: respostas
- **Critério**: grade individual por item alimenta SRS; score total exibido ao aluno.
- **UX**: flow contínuo sem voltar, uma tela por item.
- **Onde**: Recap de lesson, Recap de unit, Review Center.

## 13. Listen and number (Ordenar trechos de diálogo)
- **Fase**: Compreensão + OUTPUT leve
- **Entrada**: trechos embaralhados + áudio original
- **Saída**: ordem correta
- **Critério**: ordem exata → 5; um swap → 3; mais → 2.
- **UX**: cards numeráveis, áudio tocando em loop.
- **Onde**: Listen & act.

## Campos comuns no schema `exercises`

```ts
type ExerciseType =
  | "shadow_repeat"
  | "multiple_choice"
  | "fill_blank"
  | "word_order"
  | "match_word_image"
  | "match_en_pt"
  | "short_answer"
  | "build_sentence"
  | "role_play"
  | "shadowing"
  | "pronunciation"
  | "review_quiz"
  | "listen_and_number";

interface Exercise {
  id: string;
  type: ExerciseType;
  lesson_version_id: string;
  section: LessonSection;
  prompt_pt_br?: string;
  prompt_en?: string;
  payload: Record<string, unknown>; // específico por type
  expected: Record<string, unknown>;
  scoring: ScoringRule;
  order: number;
}
```

## Scoring uniforme
Toda tentativa vira um `ExerciseAttempt` com `grade: 0..5`. A SRS ([12](12-spaced-repetition.md)) consome esses grades diretamente.

## Guidelines para autores

- **Não criar tipo novo sem necessidade pedagógica**. Se um existente serve, use.
- **Drill ≠ OUTPUT**. Drill tem resposta fechada previsível; OUTPUT exige produção semi-livre.
- **Tempo por item**: mantenha < 30s para drills, < 90s para exercícios abertos.
- **Nunca penalizar** por erro de digitação leve se claramente intencional — usar Levenshtein soft-match.

## Referências
- [02 — Metodologia](02-metodologia-pedagogica.md)
- [04 — Anatomia da Lesson](04-anatomia-da-lesson.md)
- [07 — Modelo de domínio](07-modelo-de-dominio.md)
- [12 — Spaced repetition](12-spaced-repetition.md)
