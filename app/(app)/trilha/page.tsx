import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock, PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  listPublishedUnits,
  getUnitsProgress,
} from "@/lib/content/queries";
import { cn } from "@/lib/utils";

export default async function TrilhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [units, progress] = await Promise.all([
    listPublishedUnits(supabase),
    getUnitsProgress(supabase, user.id),
  ]);

  const { data: path } = await supabase
    .from("learning_path_progress")
    .select("current_unit_id, open_mode")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-8">
      <div>
        <Badge variant="outline">Trilha</Badge>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Sua jornada completa
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          10 unidades do A0 ao A2. Cada uma com 4-6 lessons + recap +
          self-assessment.
        </p>
      </div>

      {units.length === 0 ? (
        <EmptyState />
      ) : (
        <ol className="space-y-3">
          {units.map((unit, i) => {
            const isCompleted = progress.completedUnits.has(unit.id);
            const isCurrent = path?.current_unit_id === unit.id;
            const prevUnit = units[i - 1];
            const prevCompleted = prevUnit
              ? progress.completedUnits.has(prevUnit.id)
              : true;
            const isLocked =
              !path?.open_mode &&
              !isCompleted &&
              !isCurrent &&
              !prevCompleted;

            return (
              <li key={unit.id}>
                <UnitRow
                  order={unit.order_index}
                  slug={unit.slug}
                  titleEn={unit.title_en}
                  titlePtBr={unit.title_pt_br}
                  level={unit.level}
                  estimatedMin={unit.estimated_minutes ?? null}
                  status={
                    isCompleted
                      ? "completed"
                      : isCurrent
                        ? "current"
                        : isLocked
                          ? "locked"
                          : "unlocked"
                  }
                />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function UnitRow({
  order,
  slug,
  titleEn,
  titlePtBr,
  level,
  estimatedMin,
  status,
}: {
  order: number;
  slug: string;
  titleEn: string;
  titlePtBr: string;
  level: string;
  estimatedMin: number | null;
  status: "completed" | "current" | "unlocked" | "locked";
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
        "group relative flex items-center gap-4 rounded-xl border bg-card p-5 transition-all",
        status === "current" && "border-primary/50 bg-primary/5",
        status === "completed" && "border-border/60",
        status === "unlocked" &&
          "border-border hover:border-primary/40 hover:bg-secondary/40",
        status === "locked" && "border-border/40 opacity-60",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
          status === "completed"
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            : status === "current"
              ? "border-primary/50 bg-primary/15 text-primary"
              : status === "locked"
                ? "border-border bg-secondary text-muted-foreground"
                : "border-border bg-secondary/50 text-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Unit {String(order).padStart(2, "0")}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
            {level}
          </span>
          {status === "current" && (
            <Badge variant="primary" className="text-[10px]">
              Atual
            </Badge>
          )}
          {status === "completed" && (
            <Badge variant="outline" className="text-[10px]">
              Concluída
            </Badge>
          )}
        </div>
        <h3 className="mt-1 truncate text-base font-semibold">{titleEn}</h3>
        <p className="truncate text-xs text-muted-foreground">{titlePtBr}</p>
      </div>
      {estimatedMin && (
        <div className="hidden text-right font-mono text-[11px] text-muted-foreground sm:block">
          ~{estimatedMin} min
        </div>
      )}
      {status !== "locked" && (
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      )}
    </div>
  );

  if (status === "locked") return content;
  return <Link href={`/unit/${slug}`}>{content}</Link>;
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <Badge variant="outline">Sem conteúdo publicado</Badge>
      <p className="mt-4 text-sm text-muted-foreground">
        Nenhuma unit foi publicada ainda. O seed da Unit 01 será aplicado em
        breve.
      </p>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        M1 · Epic 12
      </p>
    </div>
  );
}
