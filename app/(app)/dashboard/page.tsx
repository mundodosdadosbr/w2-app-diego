import Link from "next/link";
import { ArrowRight, BookOpen, RotateCcw, Target, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  getDueReviewsCount,
  getNextLesson,
} from "@/lib/content/queries";
import { cn } from "@/lib/utils";

/**
 * Dashboard vivo: lê profile, streak, próxima lesson e reviews devidas.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: streak }, nextLesson, dueReviews] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name, cefr_level, weekly_goal_minutes, onboarded_at, points_total",
        )
        .eq("id", user.id)
        .single(),
      supabase
        .from("streaks")
        .select("current_count, longest_count, freeze_tokens")
        .eq("user_id", user.id)
        .single(),
      getNextLesson(supabase, user.id),
      getDueReviewsCount(supabase, user.id),
    ]);

  const firstName = profile?.display_name?.split(" ")[0] ?? "aluno";
  const cefr = (profile?.cefr_level ?? "a0").toUpperCase();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-1 animate-fade-up">
        <Badge variant="outline" className="self-start">
          Dashboard
        </Badge>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Bom te ver,{" "}
          <span className="text-primary">{firstName}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {nextLesson
            ? "Sua próxima lesson está pronta."
            : "Conteúdo publicado em breve — seed Unit 01 em progresso."}
        </p>
      </div>

      {/* Bento principal */}
      <div className="grid gap-4 md:grid-cols-6 md:grid-rows-2 animate-fade-up-delay-1">
        {/* Estudar hoje — hero card */}
        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:col-span-4 md:row-span-2">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent"
          />
          <div className="relative flex h-full flex-col">
            <div className="mb-6 flex items-center justify-between">
              <Badge variant="primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
                Estudar hoje
              </Badge>
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                ~15 min
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-8">
              <div>
                {nextLesson ? (
                  <>
                    <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      Unit {String(nextLesson.units.order_index).padStart(2, "0")}
                    </div>
                    <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                      {nextLesson.title_en}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {nextLesson.title_pt_br}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                      Preparando sua trilha
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      O conteúdo da primeira unidade será publicado em breve.
                      Enquanto isso, explore os docs.
                    </p>
                  </>
                )}
              </div>

              {nextLesson ? (
                <Link
                  href={`/lesson/${nextLesson.slug}`}
                  className="group inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all glow-primary-soft hover:translate-y-[-1px] hover:glow-primary"
                >
                  Começar lesson
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <Link
                  href="/trilha"
                  className="group inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-secondary/60 px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-secondary"
                >
                  Ver trilha
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Stats column */}
        <StatCard
          className="md:col-span-2"
          icon={Target}
          label="Seu nível"
          value={cefr}
          sub="CEFR"
        />
        <StatCard
          className="md:col-span-2"
          icon={Trophy}
          label="Pontos"
          value={(profile?.points_total ?? 0).toLocaleString("pt-BR")}
          sub={`Meta ${profile?.weekly_goal_minutes ?? 60} min/sem`}
        />
      </div>

      {/* Secondary bento */}
      <div className="grid gap-4 md:grid-cols-3 animate-fade-up-delay-2">
        <InfoCard
          icon={RotateCcw}
          title="Revisão"
          description={
            dueReviews > 0
              ? `${dueReviews} item${dueReviews > 1 ? "s" : ""} para revisar hoje.`
              : "Nenhuma revisão pendente. Você está em dia 🎯"
          }
          status={`${streak?.current_count ?? 0} d streak`}
          href="/review"
        />
        <InfoCard
          icon={BookOpen}
          title="Speaking"
          description="Pair practice com tutor IA (Claude via Bedrock)."
          status="M3"
        />
        <InfoCard
          icon={Target}
          title="Pronunciation"
          description="Feedback por palavra com Amazon Transcribe."
          status="M3"
        />
      </div>

      <div className="animate-fade-up-delay-3 border-t border-border/60 pt-6 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        M0 · scaffold + auth + onboarding · storage buckets criados ·{" "}
        <span className="text-foreground">9 migrations aplicadas</span>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      <div className="mt-1 font-mono text-[11px] text-muted-foreground">
        {sub}
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
  status,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  status: string;
  href?: string;
}) {
  const content = (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
      <div className="mb-4 flex items-center justify-between">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/60">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {status}
        </span>
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
