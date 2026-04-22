# Content seed

Arquivos JSON com o conteúdo pedagógico. Cada unit tem sua pasta; cada lesson tem seu JSON. Importe via `scripts/seed-content.ts`.

## Estrutura

```
supabase/seed/content/
├── unit-01-greetings/
│   ├── _unit.json          ← metadata da unit + objetivos
│   ├── lesson-01-hello-and-hi.json
│   ├── lesson-02-whats-your-name.json
│   └── ...
├── unit-02-food/
│   ├── _unit.json
│   └── ...
```

## Schema de unit (`_unit.json`)

```jsonc
{
  "slug": "greetings-and-introductions",
  "order_index": 1,
  "title_en": "Greetings & Introductions",
  "title_pt_br": "Cumprimentos e apresentações",
  "theme": "social",
  "level": "a0",
  "estimated_minutes": 60,
  "objectives": [
    { "i_can_pt_br": "Cumprimentar formal e informalmente.", "i_can_en": "...", "skill_tag": "greetings" },
    ...
  ]
}
```

## Schema de lesson (`lesson-XX-slug.json`)

```jsonc
{
  "slug": "hello-and-hi",
  "order_index": 1,
  "title_en": "Hello and hi",
  "title_pt_br": "Formas de cumprimentar",
  "level": "a0",
  "estimated_minutes": 12,

  "vocabulary": [
    {
      "en": "hello",
      "pt_br": "olá",
      "part_of_speech": "interjection",
      "example_en": "Hello!",
      "example_pt_br": "Olá!",
      "tags": ["greeting"]
    }
  ],

  "phrases": [
    {
      "en": "How are you?",
      "pt_br": "Como você está?",
      "function_tag": "ask_wellbeing"
    }
  ],

  "grammar": [
    {
      "title_pt_br": "Verb to be — afirmativa",
      "explanation_pt_br": "...",
      "rule_pattern": "SUBJECT + am/is/are + ADJECTIVE",
      "examples": [
        { "en": "I am happy.", "pt_br": "Estou feliz." }
      ]
    }
  ],

  "sections": [
    {
      "kind": "intro",
      "order_index": 1,
      "title": "Intro",
      "required": true,
      "payload": { "objectives": ["Greet formally and informally"] }
    },
    { "kind": "new_words", "order_index": 2, "required": true },
    { "kind": "handy_phrases", "order_index": 3, "required": true },
    {
      "kind": "drill",
      "order_index": 4,
      "required": true,
      "exercises": [
        {
          "type": "multiple_choice",
          "prompt_pt_br": "Qual é a forma formal?",
          "payload": { "options": ["Hey!", "Good morning.", "Hi!", "What's up?"] },
          "expected": { "correct_index": 1 }
        },
        {
          "type": "fill_blank",
          "prompt_pt_br": "Complete: \"Good _____!\"",
          "prompt_en": "Good _____!",
          "payload": {},
          "expected": { "answer": "morning", "acceptable": ["afternoon", "evening"] }
        },
        {
          "type": "word_order",
          "prompt_pt_br": "Monte: \"Como você está?\"",
          "payload": { "tokens": ["you", "How", "?", "are"] },
          "expected": { "order": ["How", "are", "you", "?"] }
        },
        {
          "type": "match_en_pt",
          "prompt_pt_br": "Relacione.",
          "payload": {
            "pairs": [
              { "left": "Hi", "right": "Oi" },
              { "left": "Goodbye", "right": "Tchau" }
            ]
          },
          "expected": { "all_pairs_correct": true }
        }
      ]
    },
    { "kind": "recap", "order_index": 5, "required": true, "exercises": [] },
    { "kind": "self_check", "order_index": 6, "required": false }
  ],

  "pronunciation_targets": [
    { "text_en": "Hello, how are you?", "focus_phonemes": ["/h/", "/r/"] }
  ]
}
```

## Como importar

```bash
# 1. Garantir que SUPABASE_SERVICE_ROLE_KEY está no .env (server-only)
# 2. Rodar:
pnpm seed:content              # importa todas as units/lessons
pnpm seed:content unit-01      # só uma unit
pnpm seed:content unit-01 lesson-02   # só uma lesson
```

O script é **idempotente**: usa `slug` como chave. Re-rodar atualiza em vez de duplicar. Ao final publica (gera `lesson_versions` e `unit_versions`).

## Guardrails (Constitution P2)

- **Nunca** copie texto/diálogos/exercícios de apostilas publicadas (Wizard, Cambridge, etc.). Tudo original.
- Vocabulário CEFR básico comum (hello, coffee, water) é domínio público — pode usar.
- Spelling americano (P10): color/center/organize.
- Exemplos devem ser naturais ao brasileiro de 2026, não traduções literais.
