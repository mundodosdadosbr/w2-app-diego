import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { SelfAssessmentForm } from "./form";

export default async function SelfAssessmentPage({
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

  // Unit + objetivos + version
  const { data: unit } = await supabase
    .from("units")
    .select(
      `id, slug, title_en, title_pt_br, order_index, published_version_id,
       unit_objectives(id, order_index, i_can_pt_br, i_can_en, skill_tag)`,
    )
    .eq("slug", unitSlug)
    .eq("status", "published")
    .maybeSingle();

  if (!unit || !unit.published_version_id) notFound();

  const objectives = (unit.unit_objectives ?? []).sort(
    (a, b) => a.order_index - b.order_index,
  );

  if (objectives.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <Badge variant="outline">Sem objetivos</Badge>
        <p className="mt-4 text-sm text-muted-foreground">
          Esta unit não tem objetivos cadastrados. Autoria em andamento.
        </p>
      </div>
    );
  }

  // Checa se já existe submissão prévia — pre-fill
  const { data: existing } = await supabase
    .from("self_assessments")
    .select(
      `id, submitted_at,
       self_assessment_items(unit_objective_id, confidence, note)`,
    )
    .eq("user_id", user.id)
    .eq("unit_version_id", unit.published_version_id)
    .maybeSingle();

  const existingByObjective = new Map(
    (existing?.self_assessment_items ?? []).map((i) => [
      i.unit_objective_id,
      { confidence: i.confidence, note: i.note },
    ]),
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href={`/unit/${unitSlug}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-3 w-3" />
          {unit.title_en}
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="primary">Self-assessment</Badge>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Unit {String(unit.order_index).padStart(2, "0")}
          </span>
          {existing && (
            <Badge variant="outline" className="text-[10px]">
              Já respondido
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Como você se sente sobre estes objetivos?
        </h1>
        <p className="text-sm text-muted-foreground">
          Sem reprovação — suas respostas só ajudam a personalizar a revisão.
          Seja honesto com você mesmo.
        </p>
      </div>

      <SelfAssessmentForm
        unitSlug={unitSlug}
        unitVersionId={unit.published_version_id}
        objectives={objectives}
        existingResponses={Object.fromEntries(existingByObjective)}
      />
    </div>
  );
}
