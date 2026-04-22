"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExerciseRenderer } from "@/components/exercises/exercise-renderer";
import type { SnapshotExercise } from "@/lib/content/lesson-types";
import type { ExerciseResult } from "@/components/exercises/multiple-choice";

export function SectionExercises({
  exercises,
  lessonVersionId,
  onAllComplete,
  onAttempt,
}: {
  exercises: SnapshotExercise[];
  lessonVersionId: string;
  onAllComplete: () => void;
  onAttempt: (exerciseId: string, result: ExerciseResult) => Promise<void>;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<Record<string, ExerciseResult>>({});

  const current = exercises[currentIdx];
  const total = exercises.length;
  const done = Object.keys(results).length;

  async function handleComplete(exId: string, result: ExerciseResult) {
    setResults((prev) => ({ ...prev, [exId]: result }));
    await onAttempt(exId, result);
  }

  function next() {
    if (currentIdx + 1 < total) {
      setCurrentIdx(currentIdx + 1);
    } else {
      onAllComplete();
    }
  }

  if (!current) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhum exercício nesta seção.
      </div>
    );
  }

  const currentResult = results[current.id];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-[10px]">
          {done + (currentResult ? 0 : 0)} / {total}
        </Badge>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((currentIdx + (currentResult ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <ExerciseRenderer
          key={current.id}
          exercise={current}
          onComplete={(r) => handleComplete(current.id, r)}
        />
      </div>

      {currentResult && (
        <button
          onClick={next}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground glow-primary-soft transition-all hover:translate-y-[-1px] hover:glow-primary"
        >
          {currentIdx + 1 === total ? (
            <>
              Concluir seção
              <CheckCircle2 className="h-4 w-4" />
            </>
          ) : (
            "Próximo"
          )}
        </button>
      )}
    </div>
  );
}
