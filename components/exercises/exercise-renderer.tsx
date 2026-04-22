"use client";

import type { SnapshotExercise } from "@/lib/content/lesson-types";
import { MultipleChoiceExercise, type ExerciseResult } from "./multiple-choice";
import { MatchEnPtExercise } from "./match-en-pt";
import { FillBlankExercise } from "./fill-blank";
import { WordOrderExercise } from "./word-order";
import { Badge } from "@/components/ui/badge";

/**
 * Roteador de tipos de exercício. Tipos ainda não implementados caem em
 * placeholder com botão "pular (M1 em construção)".
 */
export function ExerciseRenderer({
  exercise,
  onComplete,
}: {
  exercise: SnapshotExercise;
  onComplete: (result: ExerciseResult) => void;
}) {
  switch (exercise.type) {
    case "multiple_choice":
    case "review_quiz":
      return (
        <MultipleChoiceExercise exercise={exercise} onComplete={onComplete} />
      );
    case "match_en_pt":
      return <MatchEnPtExercise exercise={exercise} onComplete={onComplete} />;
    case "fill_blank":
      return <FillBlankExercise exercise={exercise} onComplete={onComplete} />;
    case "word_order":
      return <WordOrderExercise exercise={exercise} onComplete={onComplete} />;
    default:
      return (
        <div className="space-y-4 rounded-lg border border-dashed border-border bg-secondary/30 p-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Em construção</Badge>
            <span className="font-mono text-xs text-muted-foreground">
              {exercise.type}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Este tipo de exercício ainda não tem componente implementado —
            vem em M1/M3.
          </p>
          <button
            onClick={() =>
              onComplete({
                grade: 3,
                correct: true,
                response: { skipped: true },
                timeMs: 0,
              })
            }
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-secondary"
          >
            Pular (grade 3)
          </button>
        </div>
      );
  }
}
