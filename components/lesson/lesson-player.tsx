"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhaseBadge } from "@/components/lesson/phase-badge";
import { SectionIntro } from "@/components/lesson/section-intro";
import { SectionVocabulary } from "@/components/lesson/section-vocabulary";
import { SectionPhrases } from "@/components/lesson/section-phrases";
import { SectionExercises } from "@/components/lesson/section-exercises";
import {
  SECTION_LABELS,
} from "@/lib/content/section-labels";
import { cn } from "@/lib/utils";
import type {
  LessonSnapshot,
  SnapshotExercise,
  SnapshotSection,
} from "@/lib/content/lesson-types";
import type { ExerciseResult } from "@/components/exercises/multiple-choice";
import {
  submitAttemptAction,
  markSectionVisitedAction,
  completeLessonAction,
} from "@/app/(app)/lesson/[slug]/actions";

export function LessonPlayer({
  snapshot,
  lessonId,
  lessonVersionId,
  unitVersionId,
  unitSlug,
  titleEn,
  titlePtBr,
}: {
  snapshot: LessonSnapshot;
  lessonId: string;
  lessonVersionId: string;
  unitVersionId: string;
  unitSlug: string;
  titleEn: string;
  titlePtBr: string;
}) {
  const router = useRouter();
  const sections = useMemo(
    () => [...snapshot.sections].sort((a, b) => a.order_index - b.order_index),
    [snapshot.sections],
  );
  const [idx, setIdx] = useState(0);
  const [completedKinds, setCompletedKinds] = useState<Set<string>>(new Set());
  const [finishing, startFinishing] = useTransition();
  const [finishError, setFinishError] = useState<string | null>(null);

  const current = sections[idx];
  if (!current) return null;

  const label = SECTION_LABELS[current.kind];
  const progress = Math.round(((idx + 1) / sections.length) * 100);

  const exercisesForCurrent = snapshot.exercises
    .filter((e) => e.lesson_section_id === current.id)
    .sort((a, b) => a.order_index - b.order_index);

  async function recordAttempt(exId: string, result: ExerciseResult) {
    await submitAttemptAction({
      exercise_id: exId,
      lesson_version_id: lessonVersionId,
      grade: result.grade,
      is_correct: result.correct,
      response: result.response,
      time_ms: result.timeMs,
    });
  }

  async function markVisited(section: SnapshotSection, completed: boolean) {
    await markSectionVisitedAction({
      lesson_id: lessonId,
      lesson_version_id: lessonVersionId,
      unit_version_id: unitVersionId,
      section_kind: section.kind,
      completed_section: completed,
    });
  }

  async function handleNext() {
    await markVisited(current, true);
    setCompletedKinds((prev) => new Set(prev).add(current.kind));
    if (idx + 1 < sections.length) {
      setIdx(idx + 1);
    } else {
      finishLesson();
    }
  }

  function handlePrev() {
    if (idx > 0) setIdx(idx - 1);
  }

  function finishLesson() {
    setFinishError(null);
    startFinishing(async () => {
      const result = await completeLessonAction({
        lesson_version_id: lessonVersionId,
      });
      if (!result.ok) {
        setFinishError(result.error);
        return;
      }
      router.push(`/lesson/${unitSlug}/complete?v=${lessonVersionId}`);
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/unit/${unitSlug}`}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            ← {unitSlug}
          </Link>
          <Badge variant="outline" className="text-[10px]">
            Lesson
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {titleEn}
        </h1>
        <p className="text-sm text-muted-foreground">{titlePtBr}</p>

        {/* Progress */}
        <div className="flex items-center gap-3 pt-2">
          <PhaseBadge phase={label.phase} />
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {label.pt}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {idx + 1} / {sections.length}
            </span>
          </div>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Section content */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        {renderSection(current, {
          vocabulary: snapshot.vocabulary,
          phrases: snapshot.phrases,
          exercises: exercisesForCurrent,
          lessonVersionId,
          onAllExercisesComplete: handleNext,
          onAttempt: recordAttempt,
        })}
      </div>

      {finishError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <div className="font-medium">Não conseguimos concluir</div>
          <p className="mt-1 text-xs">
            {finishError === "OUTPUT avg grade below threshold: null"
              ? "Você ainda não respondeu exercícios de OUTPUT suficientes. Continue."
              : finishError}
          </p>
        </div>
      )}

      {/* Navigation footer */}
      {!hasBuiltInProgress(current) && (
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={idx === 0}
            className={cn(idx === 0 && "invisible")}
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            onClick={handleNext}
            disabled={finishing}
            className="glow-primary-soft"
          >
            {finishing && <Loader2 className="h-4 w-4 animate-spin" />}
            {idx + 1 === sections.length ? (
              <>
                Concluir lesson
                <CheckCircle2 className="h-4 w-4" />
              </>
            ) : (
              <>
                Próxima seção
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Seções com progresso interno (exercises) tem seu próprio botão Next. */
function hasBuiltInProgress(section: SnapshotSection): boolean {
  return ["drill", "recap"].includes(section.kind);
}

function renderSection(
  section: SnapshotSection,
  ctx: {
    vocabulary: LessonSnapshot["vocabulary"];
    phrases: LessonSnapshot["phrases"];
    exercises: SnapshotExercise[];
    lessonVersionId: string;
    onAllExercisesComplete: () => void;
    onAttempt: (exId: string, r: ExerciseResult) => Promise<void>;
  },
) {
  switch (section.kind) {
    case "intro":
      return <SectionIntro section={section} />;
    case "new_words":
    case "verbs":
      return (
        <SectionVocabulary
          items={ctx.vocabulary}
          lessonVersionId={ctx.lessonVersionId}
        />
      );
    case "handy_phrases":
      return (
        <SectionPhrases
          items={ctx.phrases}
          lessonVersionId={ctx.lessonVersionId}
        />
      );
    case "drill":
    case "recap":
      return (
        <SectionExercises
          exercises={ctx.exercises}
          lessonVersionId={ctx.lessonVersionId}
          onAllComplete={ctx.onAllExercisesComplete}
          onAttempt={ctx.onAttempt}
        />
      );
    case "self_check":
      return (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Como você se sente?</h2>
          <p className="text-sm text-muted-foreground">
            Self-check detalhado vem no self-assessment da unit. Por ora,
            clique em "Concluir".
          </p>
        </div>
      );
    default:
      return (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Seção <span className="font-mono">{section.kind}</span> em
          construção.
        </div>
      );
  }
}
