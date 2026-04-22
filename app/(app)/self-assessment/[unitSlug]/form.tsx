"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, HelpCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitSelfAssessmentAction } from "./actions";

type Confidence = "i_can" | "not_sure" | "cant_yet";

type Objective = {
  id: string;
  order_index: number;
  i_can_pt_br: string;
  i_can_en: string | null;
  skill_tag: string | null;
};

const OPTIONS: Array<{
  value: Confidence;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}> = [
  {
    value: "i_can",
    label: "I can",
    icon: CheckCircle2,
    color: "emerald",
    description: "Consigo fazer com tranquilidade.",
  },
  {
    value: "not_sure",
    label: "I'm not sure",
    icon: HelpCircle,
    color: "amber",
    description: "Talvez, preciso revisar.",
  },
  {
    value: "cant_yet",
    label: "I can't yet",
    icon: XCircle,
    color: "rose",
    description: "Ainda não — volta para revisão.",
  },
];

export function SelfAssessmentForm({
  unitSlug,
  unitVersionId,
  objectives,
  existingResponses,
}: {
  unitSlug: string;
  unitVersionId: string;
  objectives: Objective[];
  existingResponses: Record<string, { confidence: Confidence; note: string | null }>;
}) {
  const [responses, setResponses] = useState<Record<string, Confidence>>(() =>
    Object.fromEntries(
      Object.entries(existingResponses).map(([k, v]) => [k, v.confidence]),
    ),
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const answered = Object.keys(responses).length;
  const total = objectives.length;
  const isComplete = answered === total;

  function select(objectiveId: string, confidence: Confidence) {
    setResponses((prev) => ({ ...prev, [objectiveId]: confidence }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete) return;
    setError(null);
    startTransition(async () => {
      const result = await submitSelfAssessmentAction(
        {
          unit_version_id: unitVersionId,
          items: objectives.map((obj) => ({
            unit_objective_id: obj.id,
            confidence: responses[obj.id]!,
          })),
        },
        unitSlug,
      );
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono uppercase tracking-wider">
          {answered} / {total} respondidas
        </span>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(answered / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Objectives */}
      <ol className="space-y-4">
        {objectives.map((obj, i) => (
          <li key={obj.id}>
            <ObjectiveRow
              index={i + 1}
              objective={obj}
              selected={responses[obj.id] ?? null}
              onSelect={(c) => select(obj.id, c)}
            />
          </li>
        ))}
      </ol>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="sticky bottom-4 flex flex-col gap-2 border-t border-border/60 bg-background/90 pt-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {isComplete
            ? "Todas respondidas — pode enviar."
            : `Responda as ${total - answered} restantes pra enviar.`}
        </p>
        <Button type="submit" disabled={!isComplete || isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar self-assessment
        </Button>
      </div>
    </form>
  );
}

function ObjectiveRow({
  index,
  objective,
  selected,
  onSelect,
}: {
  index: number;
  objective: Objective;
  selected: Confidence | null;
  onSelect: (c: Confidence) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-6 min-w-[1.75rem] items-center justify-center rounded-md border border-border bg-secondary/50 px-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {String(index).padStart(2, "0")}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium leading-snug">
            {objective.i_can_pt_br}
          </p>
          {objective.i_can_en && (
            <p className="mt-0.5 text-xs italic text-muted-foreground">
              {objective.i_can_en}
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={cn(
                "group flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                !isSelected &&
                  "border-border bg-secondary/30 hover:border-foreground/30",
                isSelected &&
                  opt.color === "emerald" &&
                  "border-emerald-500 bg-emerald-500/10",
                isSelected &&
                  opt.color === "amber" &&
                  "border-amber-500 bg-amber-500/10",
                isSelected &&
                  opt.color === "rose" &&
                  "border-rose-500 bg-rose-500/10",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    !isSelected && "text-muted-foreground",
                    isSelected && opt.color === "emerald" && "text-emerald-400",
                    isSelected && opt.color === "amber" && "text-amber-400",
                    isSelected && opt.color === "rose" && "text-rose-400",
                  )}
                />
                <span className="text-sm font-medium">{opt.label}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
