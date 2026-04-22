/**
 * Teste de nível do onboarding — questões hardcoded para MVP.
 * Constitution P2 (conteúdo original): perguntas construídas do zero,
 * usando vocabulário CEFR básico sem referência a nenhuma apostila específica.
 * Constitution P10: en-US (spelling e usos americanos).
 *
 * Scoring simples: cada acerto = 1 ponto.
 *   0-2 corretas → a0
 *   3-5 corretas → a1
 *   6-8 corretas → a2
 *
 * A expansão (CAT adaptativo, items com dificuldade calibrada) fica para
 * pós-MVP. Ver knowledge/08, UC-01.
 */

export type LevelTestQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  /** A0 | A1 | A2 para ordenar por dificuldade. */
  difficulty: "a0" | "a1" | "a2";
};

export const LEVEL_TEST_QUESTIONS: LevelTestQuestion[] = [
  {
    id: "q1",
    question: "Choose the correct greeting for someone you just met in a professional setting.",
    options: ["Hey!", "Nice to meet you.", "What's up?", "See you!"],
    correctIndex: 1,
    difficulty: "a0",
  },
  {
    id: "q2",
    question: "I _____ from Brazil.",
    options: ["are", "is", "am", "be"],
    correctIndex: 2,
    difficulty: "a0",
  },
  {
    id: "q3",
    question: "Which sentence asks for someone's name?",
    options: [
      "How are you?",
      "Where are you from?",
      "What's your name?",
      "How old are you?",
    ],
    correctIndex: 2,
    difficulty: "a0",
  },
  {
    id: "q4",
    question: "She _____ coffee every morning.",
    options: ["drink", "drinks", "drinking", "is drink"],
    correctIndex: 1,
    difficulty: "a1",
  },
  {
    id: "q5",
    question: "Choose the correct question: \"_____ do you live?\"",
    options: ["What", "How", "Where", "When"],
    correctIndex: 2,
    difficulty: "a1",
  },
  {
    id: "q6",
    question: "I need _____ apple and _____ orange.",
    options: ["a / a", "an / an", "a / an", "an / a"],
    correctIndex: 3,
    difficulty: "a1",
  },
  {
    id: "q7",
    question: "At a café, you want to order a small coffee. Which sounds most natural?",
    options: [
      "Give me coffee small.",
      "I want small one coffee.",
      "Can I have a small coffee, please?",
      "Please for a coffee small.",
    ],
    correctIndex: 2,
    difficulty: "a2",
  },
  {
    id: "q8",
    question: "\"I _____ to the gym yesterday.\" (past tense)",
    options: ["go", "goes", "went", "going"],
    correctIndex: 2,
    difficulty: "a2",
  },
];

export function scoreToLevel(score: number): "a0" | "a1" | "a2" {
  if (score <= 2) return "a0";
  if (score <= 5) return "a1";
  return "a2";
}
