import type { Database } from "@/types/database";

type Kind = Database["public"]["Enums"]["lesson_section_kind"];

export const SECTION_LABELS: Record<Kind, { pt: string; phase: "input" | "output" | "review" | "meta" }> = {
  intro: { pt: "Introdução", phase: "meta" },
  verbs: { pt: "Verbos", phase: "input" },
  new_words: { pt: "Vocabulário", phase: "input" },
  handy_phrases: { pt: "Handy Phrases", phase: "input" },
  grammar: { pt: "Gramática", phase: "input" },
  in_context: { pt: "Na prática", phase: "input" },
  drill: { pt: "Drill", phase: "output" },
  speak_now: { pt: "Speak now", phase: "output" },
  pair_practice: { pt: "Pair practice", phase: "output" },
  listen_and_act: { pt: "Listen & act", phase: "output" },
  fluency: { pt: "Fluency", phase: "output" },
  pronunciation: { pt: "Pronunciation", phase: "output" },
  recap: { pt: "Recap", phase: "review" },
  self_check: { pt: "Self-check", phase: "review" },
};

export function phaseColor(phase: "input" | "output" | "review" | "meta") {
  switch (phase) {
    case "input":
      return "bg-phase-input/50 text-foreground border-phase-input";
    case "output":
      return "bg-phase-output/50 text-foreground border-phase-output";
    case "review":
      return "bg-phase-review/50 text-foreground border-phase-review";
    default:
      return "bg-secondary text-muted-foreground border-border";
  }
}
