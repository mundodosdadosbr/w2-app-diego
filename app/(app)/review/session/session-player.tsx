"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { applyReviewGradeAction } from "./actions";

export type ReviewItem =
  | {
      reviewId: string;
      kind: "vocab";
      stage: string;
      en: string;
      pt_br: string;
      example_en: string | null;
      part_of_speech: string | null;
    }
  | {
      reviewId: string;
      kind: "phrase";
      stage: string;
      en: string;
      pt_br: string;
      function_tag: string | null;
    }
  | {
      reviewId: string;
      kind: "grammar";
      stage: string;
      title_pt_br: string;
      rule_pattern: string | null;
      examples: unknown;
    };

type Feedback = {
  reviewId: string;
  grade: 0 | 1 | 2 | 3 | 4 | 5;
  newStage: string;
  nextDueAt: string;
};

/**
 * Player simples: mostra item escondido, revela tradução ao toque,
 * aluno auto-avalia (errou/quase/acertou) → grade 2 / 4 / 5.
 * Padrão Anki-like. Para vocab/phrase é direto; grammar mostra padrão + exemplos.
 */
export function ReviewSessionPlayer({ items }: { items: ReviewItem[] }) {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isPending, startTransition] = useTransition();

  const total = items.length;
  const current = items[idx];
  const done = idx >= total;

  if (done) {
    return <SessionSummary feedback={feedback} router={router} />;
  }

  if (!current) return null;

  function handleGrade(grade: 2 | 4 | 5) {
    if (isPending) return;
    startTransition(async () => {
      const result = await applyReviewGradeAction({
        review_id: current.reviewId,
        grade,
      });
      if (!result.ok) {
        alert(result.error);
        return;
      }
      setFeedback((prev) => [
        ...prev,
        {
          reviewId: current.reviewId,
          grade,
          newStage: result.new_stage,
          nextDueAt: result.next_due_at,
        },
      ]);
      setRevealed(false);
      setIdx((i) => i + 1);
    });
  }

  const progress = Math.round((idx / total) * 100);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono uppercase tracking-wider">
            {idx + 1} / {total}
          </span>
          <span className="font-mono tabular-nums">{progress}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card do item */}
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {current.kind}
          </Badge>
          <Badge variant="primary" className="text-[10px]">
            Stage {current.stage}
          </Badge>
        </div>

        <ItemFront item={current} />

        {revealed ? (
          <>
            <div className="my-6 border-t border-border/60" />
            <ItemBack item={current} />

            <div className="mt-8 space-y-3">
              <p className="text-center text-xs text-muted-foreground">
                Como foi? Seja honesto — isso calibra a revisão.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <GradeButton
                  grade={2}
                  label="Errei"
                  sub="d1 novamente"
                  colorClass="rose"
                  disabled={isPending}
                  onClick={() => handleGrade(2)}
                />
                <GradeButton
                  grade={4}
                  label="Quase"
                  sub="mantém stage"
                  colorClass="amber"
                  disabled={isPending}
                  onClick={() => handleGrade(4)}
                />
                <GradeButton
                  grade={5}
                  label="Fácil"
                  sub="avança stage"
                  colorClass="emerald"
                  disabled={isPending}
                  onClick={() => handleGrade(5)}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="mt-8">
            <Button
              onClick={() => setRevealed(true)}
              variant="outline"
              className="w-full"
            >
              Revelar resposta
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Tente lembrar antes de tocar.
            </p>
          </div>
        )}
      </div>

      {/* Histórico rápido */}
      {feedback.length > 0 && (
        <details className="rounded-xl border border-border/60 bg-card/50">
          <summary className="cursor-pointer select-none px-4 py-2 text-xs text-muted-foreground">
            Histórico desta sessão ({feedback.length})
          </summary>
          <ul className="border-t border-border/60 px-4 py-2 text-xs">
            {feedback.slice(-5).reverse().map((f) => (
              <li
                key={f.reviewId}
                className="flex items-center gap-2 py-1 font-mono"
              >
                {f.grade >= 5 ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : f.grade >= 4 ? (
                  <Check className="h-3 w-3 text-amber-400" />
                ) : (
                  <X className="h-3 w-3 text-rose-400" />
                )}
                <span className="text-muted-foreground">→ {f.newStage}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function ItemFront({ item }: { item: ReviewItem }) {
  if (item.kind === "vocab") {
    return (
      <div className="space-y-2">
        <div className="text-3xl font-semibold tracking-tight">
          {item.en}
        </div>
        {item.part_of_speech && (
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {item.part_of_speech}
          </div>
        )}
      </div>
    );
  }
  if (item.kind === "phrase") {
    return (
      <div className="space-y-2">
        <div className="text-2xl font-medium tracking-tight">{item.en}</div>
        {item.function_tag && (
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {item.function_tag}
          </div>
        )}
      </div>
    );
  }
  if (item.kind === "grammar") {
    return (
      <div className="space-y-2">
        <div className="text-xl font-medium">{item.title_pt_br}</div>
        {item.rule_pattern && (
          <div className="font-mono text-sm text-muted-foreground">
            {item.rule_pattern}
          </div>
        )}
      </div>
    );
  }
  return null;
}

function ItemBack({ item }: { item: ReviewItem }) {
  if (item.kind === "vocab") {
    return (
      <div className="space-y-2">
        <div className="text-lg font-medium text-primary">{item.pt_br}</div>
        {item.example_en && (
          <div className="mt-4 rounded-lg border border-border/60 bg-secondary/30 p-3 text-sm">
            <div className="italic">{item.example_en}</div>
          </div>
        )}
      </div>
    );
  }
  if (item.kind === "phrase") {
    return <div className="text-lg font-medium text-primary">{item.pt_br}</div>;
  }
  if (item.kind === "grammar") {
    const examples = Array.isArray(item.examples)
      ? (item.examples as Array<{ en?: string; pt_br?: string }>)
      : [];
    return (
      <div className="space-y-2">
        {examples.map((ex, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-sm"
          >
            {ex.en && <div className="italic">{ex.en}</div>}
            {ex.pt_br && (
              <div className="mt-1 text-xs text-muted-foreground">
                {ex.pt_br}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function GradeButton({
  label,
  sub,
  colorClass,
  disabled,
  onClick,
}: {
  grade: number;
  label: string;
  sub: string;
  colorClass: "rose" | "amber" | "emerald";
  disabled: boolean;
  onClick: () => void;
}) {
  const classes = {
    rose: "border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400",
    amber:
      "border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400",
    emerald:
      "border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400",
  }[colorClass];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg border p-3 transition-all hover:translate-y-[-1px] disabled:opacity-50",
        classes,
      )}
    >
      <span className="text-sm font-semibold">{label}</span>
      <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
        {sub}
      </span>
    </button>
  );
}

function SessionSummary({
  feedback,
  router,
}: {
  feedback: Feedback[];
  router: ReturnType<typeof useRouter>;
}) {
  const correct = feedback.filter((f) => f.grade >= 4).length;
  const advanced = feedback.filter(
    (f) => f.grade >= 5 && f.newStage !== "d1",
  ).length;

  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 animate-fade-up">
        <CheckCircle2 className="h-7 w-7 text-primary" />
      </div>
      <div className="animate-fade-up-delay-1">
        <Badge variant="primary">Sessão concluída</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Mandou bem.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {correct} / {feedback.length} acertos. {advanced > 0 && `${advanced} avançaram de stage.`}
        </p>
      </div>

      <div className="flex animate-fade-up-delay-2 flex-col gap-2">
        <Button
          onClick={() => router.push("/review")}
          className="glow-primary-soft"
        >
          Voltar ao Review Center
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Ir para dashboard
        </Link>
      </div>
    </div>
  );
}
