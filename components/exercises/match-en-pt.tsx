"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SnapshotExercise } from "@/lib/content/lesson-types";
import type { ExerciseResult } from "./multiple-choice";

type Pair = { left: string; right: string };

export function MatchEnPtExercise({
  exercise,
  onComplete,
}: {
  exercise: SnapshotExercise;
  onComplete: (result: ExerciseResult) => void;
}) {
  const pairs = useMemo(
    () => (exercise.payload.pairs as Pair[]) ?? [],
    // exercise.payload is stable for the lifetime of this component
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.id],
  );
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const shuffledRights = useMemo(
    () => [...pairs].sort(() => Math.random() - 0.5).map((p) => p.right),
    [pairs],
  );

  const isComplete = Object.keys(matches).length === pairs.length;

  function handleLeft(left: string) {
    if (submitted) return;
    setSelectedLeft(left);
  }

  function handleRight(right: string) {
    if (submitted || !selectedLeft) return;
    // Remove qualquer match anterior do mesmo left/right
    const next = { ...matches };
    Object.entries(next).forEach(([k, v]) => {
      if (v === right) delete next[k];
    });
    next[selectedLeft] = right;
    setMatches(next);
    setSelectedLeft(null);
  }

  function handleSubmit() {
    if (submitted || !isComplete) return;
    setSubmitted(true);

    const allCorrect = pairs.every((p) => matches[p.left] === p.right);
    const correctCount = pairs.filter(
      (p) => matches[p.left] === p.right,
    ).length;

    const grade: 0 | 1 | 2 | 3 | 4 | 5 = allCorrect
      ? 5
      : correctCount >= pairs.length - 1
        ? 3
        : correctCount >= pairs.length / 2
          ? 2
          : 1;

    onComplete({
      grade,
      correct: allCorrect,
      response: { matches, correctCount, total: pairs.length },
      timeMs: Date.now() - startedAt,
    });
  }

  return (
    <div className="space-y-6">
      {exercise.prompt_pt_br && (
        <p className="text-lg font-medium">{exercise.prompt_pt_br}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            English
          </div>
          {pairs.map((p) => {
            const matched = matches[p.left];
            const isSelected = selectedLeft === p.left;
            const correct = submitted && matched === p.right;
            const wrong = submitted && matched && matched !== p.right;
            return (
              <button
                key={p.left}
                type="button"
                disabled={submitted}
                onClick={() => handleLeft(p.left)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left text-sm transition-all",
                  isSelected && "border-primary bg-primary/5",
                  !isSelected &&
                    !matched &&
                    "border-border bg-secondary/30 hover:border-foreground/30",
                  matched && !submitted && "border-primary/40 bg-primary/5",
                  correct && "border-emerald-500 bg-emerald-500/10",
                  wrong && "border-destructive bg-destructive/10",
                )}
              >
                <span>{p.left}</span>
                {matched && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    → {matched}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Português
          </div>
          {shuffledRights.map((right) => {
            const used = Object.values(matches).includes(right);
            return (
              <button
                key={right}
                type="button"
                disabled={submitted || !selectedLeft}
                onClick={() => handleRight(right)}
                className={cn(
                  "flex w-full items-center rounded-lg border p-3 text-left text-sm transition-all",
                  used && "border-primary/40 bg-primary/5 opacity-60",
                  !used &&
                    selectedLeft &&
                    "border-border bg-secondary/30 hover:border-primary hover:bg-primary/5",
                  !used && !selectedLeft && "border-border bg-secondary/20",
                )}
              >
                {right}
              </button>
            );
          })}
        </div>
      </div>

      {!submitted && (
        <Button
          disabled={!isComplete}
          onClick={handleSubmit}
          className="w-full"
        >
          Confirmar ({Object.keys(matches).length}/{pairs.length})
        </Button>
      )}
    </div>
  );
}
