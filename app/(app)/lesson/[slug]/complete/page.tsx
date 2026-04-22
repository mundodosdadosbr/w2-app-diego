import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export default async function LessonCompletePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { slug } = await params;
  const { v: lessonVersionId } = await searchParams;
  if (!lessonVersionId) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("avg_grade, total_time_ms, completed_at")
    .eq("user_id", user.id)
    .eq("lesson_version_id", lessonVersionId)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-lg space-y-8 text-center">
      <div className="space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 animate-fade-up">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <Badge variant="primary" className="animate-fade-up-delay-1">
          Lesson concluída
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight animate-fade-up-delay-1">
          Mandou bem.
        </h1>
        <p className="text-sm text-muted-foreground animate-fade-up-delay-2">
          {progress?.avg_grade
            ? `Nota média dos exercícios: ${Number(progress.avg_grade).toFixed(1)}/5.`
            : "Seu progresso foi salvo."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 animate-fade-up-delay-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            +50 pts
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            <CheckCircle2 className="inline h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Streak
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            +1d
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 animate-fade-up-delay-3">
        <Link
          href="/dashboard"
          className="group inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground glow-primary-soft transition-all hover:translate-y-[-1px]"
        >
          Voltar pro dashboard
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/trilha"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-secondary/60 px-6 text-sm font-medium transition-colors hover:border-primary/40"
        >
          Ver trilha
        </Link>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {slug}
      </p>
    </div>
  );
}
