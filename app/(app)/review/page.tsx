import Link from "next/link";
import { ArrowRight, CheckCircle2, Flame, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export default async function ReviewCenterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const nowIso = new Date().toISOString();
  const { data: dueReviews, count } = await supabase
    .from("reviews")
    .select("id, item_type, stage, due_at", { count: "exact" })
    .eq("user_id", user.id)
    .neq("stage", "mastered")
    .lte("due_at", nowIso)
    .order("stage", { ascending: true })
    .order("due_at", { ascending: true })
    .limit(50);

  const byStage = (dueReviews ?? []).reduce<Record<string, number>>(
    (acc, r) => {
      acc[r.stage] = (acc[r.stage] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const total = count ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <Badge variant="outline">Review Center</Badge>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {total > 0 ? "Revisões para hoje" : "Você está em dia"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total > 0
            ? `${total} item${total > 1 ? "s" : ""} devido${total > 1 ? "s" : ""}. Estimativa: ~${Math.max(
                3,
                Math.round(total * 0.5),
              )} min.`
            : "Nenhum item na fila. Que tal uma lesson nova?"}
        </p>
      </div>

      {total === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(["d1", "d3", "d7", "d14", "d30"] as const).map((stage) => (
              <StageCard
                key={stage}
                stage={stage}
                count={byStage[stage] ?? 0}
              />
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Começar sessão</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Até 20 itens por sessão, ~{Math.max(3, Math.round(total * 0.5))}{" "}
              min. Revela a resposta, auto-avalia, a SRS ajusta o stage e a
              próxima data.
            </p>
            <Link
              href="/review/session"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-primary-soft transition-all hover:translate-y-[-1px]"
            >
              Começar sessão
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Fila crua */}
          <details className="rounded-xl border border-border bg-card">
            <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium">
              Ver fila ({total})
            </summary>
            <ul className="border-t border-border/60 divide-y divide-border/40">
              {dueReviews?.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-5 py-2.5 font-mono text-xs"
                >
                  <span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 uppercase">
                      {r.stage}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {r.item_type}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(r.due_at).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}

function StageCard({
  stage,
  count,
}: {
  stage: "d1" | "d3" | "d7" | "d14" | "d30";
  count: number;
}) {
  const color: Record<typeof stage, string> = {
    d1: "from-red-500/20",
    d3: "from-orange-500/20",
    d7: "from-yellow-500/20",
    d14: "from-emerald-500/20",
    d30: "from-blue-500/20",
  };
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-card p-4`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${color[stage]} to-transparent`}
      />
      <div className="relative">
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Stage {stage}
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{count}</div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10">
        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Fila vazia 🎯</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Itens de revisão aparecem conforme você termina lessons e erra
          exercícios. Volte amanhã ou faça uma lesson nova.
        </p>
      </div>
      <div className="flex gap-2">
        <Link
          href="/trilha"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Flame className="h-4 w-4" />
          Estudar lesson
        </Link>
      </div>
    </div>
  );
}
