"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SnapshotExercise } from "@/lib/content/lesson-types";

export type ExerciseResult = {
  grade: 0 | 1 | 2 | 3 | 4 | 5;
  correct: boolean;
  response: Record<string, unknown>;
  timeMs: number;
};

export function MultipleChoiceExercise({
  exercise,
  onComplete,
}: {
  exercise: SnapshotExercise;
  onComplete: (result: ExerciseResult) => void;
}) {
  const options = (exercise.payload.options as string[]) ?? [];
  const correctIndex = (exercise.expected.correct_index as number) ?? 0;
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const correct = submitted && selected === correctIndex;

  function handleSubmit() {
    if (selected === null || submitted) return;
    setSubmitted(true);
    const grade: 0 | 1 | 2 | 3 | 4 | 5 = selected === correctIndex ? 5 : 1;
    onComplete({
      grade,
      correct: selected === correctIndex,
      response: { selected_index: selected },
      timeMs: Date.now() - startedAt,
    });
  }

  return (
    <div className="space-y-6">
      {exercise.prompt_pt_br && (
        <p className="text-lg font-medium">{exercise.prompt_pt_br}</p>
      )}
      {exercise.prompt_en && (
        <p className="text-base text-muted-foreground">{exercise.prompt_en}</p>
      )}

      <div className="grid gap-2">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = submitted && i === correctIndex;
          const isWrong = submitted && isSelected && !correct;
          return (
            <button
              key={i}
              type="button"
              disabled={submitted}
              onClick={() => setSelected(i)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-4 text-left text-sm transition-all",
                !submitted && isSelected && "border-primary bg-primary/5",
                !submitted &&
                  !isSelected &&
                  "border-border bg-secondary/30 hover:border-foreground/30",
                isCorrect && "border-emerald-500 bg-emerald-500/10",
                isWrong && "border-destructive bg-destructive/10",
                submitted && !isCorrect && !isWrong && "opacity-50",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  isCorrect
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isWrong
                      ? "border-destructive bg-destructive text-white"
                      : isSelected
                        ? "border-primary bg-primary"
                        : "border-border bg-background",
                )}
              >
                {isCorrect && <Check className="h-3 w-3" />}
                {isWrong && <X className="h-3 w-3" />}
                {!submitted && isSelected && (
                  <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                )}
              </span>
              <span className={cn(isCorrect && "font-medium")}>{opt}</span>
            </button>
          );
        })}
      </div>

      {!submitted && (
        <Button
          disabled={selected === null}
          onClick={handleSubmit}
          className="w-full"
        >
          Confirmar
        </Button>
      )}
      {submitted && (
        <div
          className={cn(
            "rounded-lg border p-3 text-sm",
            correct
              ? "border-emerald-500/40 bg-emerald-500/10"
              : "border-destructive/40 bg-destructive/10",
          )}
        >
          {correct
            ? "Correto! ✓"
            : `Resposta correta: ${options[correctIndex]}`}
        </div>
      )}
    </div>
  );
}
