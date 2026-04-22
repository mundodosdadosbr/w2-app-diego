import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export default async function SelfAssessmentCompletePage({
  params,
}: {
  params: Promise<{ unitSlug: string }>;
}) {
  const { unitSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: unit } = await supabase
    .from("units")
    .select(`id, title_en, order_index, published_version_id`)
    .eq("slug", unitSlug)
    .maybeSingle();

  if (!unit?.published_version_id) notFound();

  const { data: assessment } = await supabase
    .from("self_assessments")
    .select(
      `submitted_at, self_assessment_items(confidence)`,
    )
    .eq("user_id", user.id)
    .eq("unit_version_id", unit.published_version_id)
    .maybeSingle();

  const items = assessment?.self_assessment_items ?? [];
  const counts = {
    i_can: items.filter((i) => i.confidence === "i_can").length,
    not_sure: items.filter((i) => i.confidence === "not_sure").length,
    cant_yet: items.filter((i) => i.confidence === "cant_yet").length,
  };

  // Próxima unit destravada
  const { data: nextUnit } = await supabase
    .from("units")
    .select("slug, title_en, order_index")
    .eq("status", "published")
    .gt("order_index", unit.order_index)
    .order("order_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-lg space-y-8 text-center">
      <div className="space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 animate-fade-up">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <Badge variant="primary" className="animate-fade-up-delay-1">
          Unit concluída
        </Badge>
        <h1 className="animate-fade-up-delay-1 text-3xl font-semibold tracking-tight">
          {unit.title_en} — feito.
        </h1>
        <p className="animate-fade-up-delay-2 text-sm text-muted-foreground">
          +200 pts. Sua revisão foi atualizada com base no que você marcou.
        </p>
      </div>

      <div className="grid animate-fade-up-delay-2 grid-cols-3 gap-3">
        <StatBox
          label="I can"
          value={counts.i_can}
          colorClass="text-emerald-400"
        />
        <StatBox
          label="Not sure"
          value={counts.not_sure}
          colorClass="text-amber-400"
        />
        <StatBox
          label="Can't yet"
          value={counts.cant_yet}
          colorClass="text-rose-400"
        />
      </div>

      <div className="flex animate-fade-up-delay-3 flex-col gap-2">
        {nextUnit && (
          <Link
            href={`/unit/${nextUnit.slug}`}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground glow-primary-soft transition-all hover:translate-y-[-1px]"
          >
            Começar Unit {String(nextUnit.order_index).padStart(2, "0")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
        <Link
          href="/review"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-secondary/60 px-6 text-sm font-medium transition-colors hover:border-primary/40"
        >
          {counts.cant_yet + counts.not_sure > 0
            ? "Revisar o que ficou fraco"
            : "Ver fila de revisão"}
        </Link>
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 text-3xl font-semibold tabular-nums ${colorClass}`}>
        <CheckCircle2 className="mx-auto h-5 w-5" />
        {value}
      </div>
    </div>
  );
}
