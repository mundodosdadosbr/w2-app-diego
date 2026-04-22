"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { completeOnboardingAction } from "./actions";

const OPTIONS = [
  { minutes: 30, label: "30 min", sub: "~2 lessons / sem", tag: "Leve" },
  { minutes: 60, label: "60 min", sub: "~4 lessons / sem", tag: "Sugerido" },
  { minutes: 120, label: "120 min", sub: "~8 lessons / sem", tag: "Sério" },
  { minutes: 180, label: "180 min", sub: "~12 lessons / sem", tag: "Intenso" },
];

export function GoalForm() {
  const [selected, setSelected] = useState(60);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await completeOnboardingAction({
        weekly_goal_minutes: selected,
      });
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const isActive = opt.minutes === selected;
          return (
            <label
              key={opt.minutes}
              className={cn(
                "group flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-4 transition-all",
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary/30 hover:border-foreground/30",
              )}
            >
              <div>
                <div className="text-lg font-semibold tabular-nums">
                  {opt.label}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {opt.sub}
                </div>
              </div>
              <div
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-border/60 text-muted-foreground",
                )}
              >
                {opt.tag}
              </div>
              <input
                type="radio"
                name="goal"
                value={opt.minutes}
                checked={isActive}
                onChange={() => setSelected(opt.minutes)}
                className="sr-only"
              />
            </label>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Finalizar e ir pro dashboard
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
