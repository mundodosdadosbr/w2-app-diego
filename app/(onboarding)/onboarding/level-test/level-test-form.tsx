"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LevelTestQuestion } from "@/lib/onboarding/level-test-questions";
import { submitLevelTestAction } from "./actions";

export function LevelTestForm({
  questions,
}: {
  questions: LevelTestQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const answered = Object.values(answers).filter((a) => a !== null).length;
  const progress = Math.round((answered / questions.length) * 100);

  function selectAnswer(qId: string, idx: number) {
    setAnswers((prev) => ({ ...prev, [qId]: idx }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitLevelTestAction({
        answers: Object.fromEntries(
          Object.entries(answers).filter(([, v]) => v !== null),
        ) as Record<string, number>,
      });
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono uppercase tracking-wider">
            {answered} / {questions.length}
          </span>
          <span className="tabular-nums">{progress}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, qi) => (
          <fieldset key={q.id} className="space-y-3">
            <legend className="text-sm">
              <span className="mr-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {String(qi + 1).padStart(2, "0")}
              </span>
              <span className="font-medium">{q.question}</span>
            </legend>
            <div className="grid gap-2">
              {q.options.map((opt, idx) => {
                const selected = answers[q.id] === idx;
                return (
                  <label
                    key={idx}
                    className={cn(
                      "group flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-all",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-secondary/30 hover:border-foreground/30",
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={selected}
                      onChange={() => selectAnswer(q.id, idx)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        selected
                          ? "border-primary bg-primary"
                          : "border-border bg-background group-hover:border-foreground/40",
                      )}
                    >
                      {selected && (
                        <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                      )}
                    </span>
                    <span
                      className={cn(
                        selected
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      {opt}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs">
          {error}
        </div>
      )}

      <div className="sticky bottom-4 flex flex-col gap-2 border-t border-border/60 bg-card/90 pt-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {answered === questions.length
            ? "Todas respondidas — boa!"
            : `Pode pular e continuar — respondemos ${answered} de ${questions.length}.`}
        </p>
        <Button type="submit" disabled={isPending} className="sm:w-auto">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Ver resultado
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
