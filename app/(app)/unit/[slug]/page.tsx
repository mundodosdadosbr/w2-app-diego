import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  getUnitBySlug,
  getUnitsProgress,
} from "@/lib/content/queries";
import { cn } from "@/lib/utils";

export default async function UnitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const unit = await getUnitBySlug(supabase, slug);
  if (!unit) notFound();

  const { completedLessons, completedUnits } = await getUnitsProgress(
    supabase,
    user.id,
  );
  const unitCompleted = completedUnits.has(unit.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Link
            href="/trilha"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            ← Trilha
          </Link>
          <Badge variant="primary" className="text-[10px]">
            Unit {String(unit.order_index).padStart(2, "0")} · {unit.level}
          </Badge>
          {unitCompleted && (
            <Badge variant="outline" className="text-[10px]">
              Concluída
            </Badge>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {unit.title_en}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {unit.title_pt_br}
          {unit.estimated_minutes && ` · ~${unit.estimated_minutes} min`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Lessons */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Lessons
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {unit.lessons.length}
            </span>
          </h2>

          {unit.lessons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Sem lessons publicadas ainda.
            </div>
          ) : (
            <ol className="space-y-2">
              {unit.lessons.map((lesson, i) => {
                const done = completedLessons.has(lesson.id);
                const prev = unit.lessons[i - 1];
                const locked = !done && prev && !completedLessons.has(prev.id);
                return (
                  <li key={lesson.id}>
                    <LessonRow
                      order={lesson.order_index}
                      slug={lesson.slug}
                      titleEn={lesson.title_en}
                      titlePtBr={lesson.title_pt_br}
                      estimatedMin={lesson.estimated_minutes ?? null}
                      status={done ? "completed" : locked ? "locked" : "open"}
                    />
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Objectives */}
        <aside className="rounded-xl border border-border bg-card p-5">
          <Badge variant="outline" className="text-[10px]">
            I can
          </Badge>
          <h2 className="mt-3 text-base font-semibold">
            Ao concluir você será capaz de
          </h2>
          {unit.objectives.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Objetivos ainda não definidos.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {unit.objectives.map((obj) => (
                <li
                  key={obj.id}
                  className="flex items-start gap-2 text-sm leading-snug"
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                  <span>{obj.i_can_pt_br}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

function LessonRow({
  order,
  slug,
  titleEn,
  titlePtBr,
  estimatedMin,
  status,
}: {
  order: number;
  slug: string;
  titleEn: string;
  titlePtBr: string;
  estimatedMin: number | null;
  status: "completed" | "open" | "locked";
}) {
  const Icon =
    status === "completed"
      ? CheckCircle2
      : status === "locked"
        ? Lock
        : PlayCircle;

  const content = (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-lg border bg-card p-4 transition-all",
        status === "open" && "hover:border-primary/40 hover:bg-secondary/40",
        status === "completed" && "border-border/60",
        status === "locked" && "opacity-60",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
          status === "completed"
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            : "border-border bg-secondary/50",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            L{String(order).padStart(2, "0")}
          </span>
        </div>
        <div className="truncate text-sm font-medium">{titleEn}</div>
        <div className="truncate text-xs text-muted-foreground">
          {titlePtBr}
        </div>
      </div>
      {estimatedMin && (
        <span className="font-mono text-[10px] text-muted-foreground">
          {estimatedMin}m
        </span>
      )}
      {status !== "locked" && (
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      )}
    </div>
  );

  if (status === "locked") return content;
  return <Link href={`/lesson/${slug}`}>{content}</Link>;
}
