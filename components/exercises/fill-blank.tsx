"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SnapshotExercise } from "@/lib/content/lesson-types";
import type { ExerciseResult } from "./multiple-choice";

export function FillBlankExercise({
  exercise,
  onComplete,
}: {
  exercise: SnapshotExercise;
  onComplete: (result: ExerciseResult) => void;
}) {
  const expected = (exercise.expected.answer as string) ?? "";
  const acceptable =
    (exercise.expected.acceptable as string[] | undefined) ?? [];
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [startedAt] = useState(() => Date.now());

  function normalize(s: string) {
    return s.trim().toLowerCase().replace(/[.,!?]/g, "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitted || !value.trim()) return;

    const normalized = normalize(value);
    const expectedN = normalize(expected);
    const acceptableN = acceptable.map(normalize);
    const isCorrect =
      normalized === expectedN || acceptableN.includes(normalized);

    // Levenshtein leve para typo (grade 3 em vez de 5)
    const close = levenshtein(normalized, expectedN) <= 2;

    setCorrect(isCorrect);
    setSubmitted(true);

    const grade: 0 | 1 | 2 | 3 | 4 | 5 = isCorrect
      ? 5
      : close
        ? 3
        : 1;
    onComplete({
      grade,
      correct: isCorrect,
      response: { value, normalized, close },
      timeMs: Date.now() - startedAt,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {exercise.prompt_pt_br && (
        <p className="text-lg font-medium">{exercise.prompt_pt_br}</p>
      )}
      {exercise.prompt_en && (
        <p className="text-xl tracking-tight">
          {exercise.prompt_en.replace(/_+/g, "_____")}
        </p>
      )}

      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={submitted}
        placeholder="Sua resposta"
        className={cn(
          "text-base",
          submitted && correct && "border-emerald-500",
          submitted && !correct && "border-destructive",
        )}
        aria-label="Resposta"
      />

      {!submitted && (
        <Button type="submit" disabled={!value.trim()} className="w-full">
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
          {correct ? (
            "Correto! ✓"
          ) : (
            <>
              Resposta esperada:{" "}
              <span className="font-mono font-semibold text-foreground">
                {expected}
              </span>
            </>
          )}
        </div>
      )}
    </form>
  );
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      );
    }
  }
  return dp[m]![n]!;
}
