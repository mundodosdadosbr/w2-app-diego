import Link from "next/link";
import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { ReviewSessionPlayer, type ReviewItem } from "./session-player";

const MAX_ITEMS = 20;

export default async function ReviewSessionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const nowIso = new Date().toISOString();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, item_type, item_id, stage, due_at")
    .eq("user_id", user.id)
    .neq("stage", "mastered")
    .lte("due_at", nowIso)
    .order("stage", { ascending: true })
    .order("due_at", { ascending: true })
    .limit(MAX_ITEMS);

  if (!reviews || reviews.length === 0) {
    return <EmptyState />;
  }

  // Hydrate cada review com os dados do item (vocab, phrase, grammar).
  // Fazer em paralelo por tipo para reduzir round-trips.
  const vocabIds = reviews
    .filter((r) => r.item_type === "vocab")
    .map((r) => r.item_id);
  const phraseIds = reviews
    .filter((r) => r.item_type === "phrase")
    .map((r) => r.item_id);
  const grammarIds = reviews
    .filter((r) => r.item_type === "grammar")
    .map((r) => r.item_id);

  const [vocabs, phrases, grammars] = await Promise.all([
    vocabIds.length > 0
      ? supabase
          .from("vocabulary_items")
          .select("id, en, pt_br, example_en, example_pt_br, part_of_speech")
          .in("id", vocabIds)
      : Promise.resolve({ data: [] as never[] }),
    phraseIds.length > 0
      ? supabase
          .from("phrase_patterns")
          .select("id, en, pt_br, function_tag")
          .in("id", phraseIds)
      : Promise.resolve({ data: [] as never[] }),
    grammarIds.length > 0
      ? supabase
          .from("grammar_points")
          .select("id, title_pt_br, rule_pattern, examples")
          .in("id", grammarIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const vocabById = new Map((vocabs.data ?? []).map((v) => [v.id, v]));
  const phraseById = new Map((phrases.data ?? []).map((p) => [p.id, p]));
  const grammarById = new Map((grammars.data ?? []).map((g) => [g.id, g]));

  const items = (reviews.map((r) => {
      if (r.item_type === "vocab") {
        const v = vocabById.get(r.item_id);
        if (!v) return null;
        return {
          reviewId: r.id,
          kind: "vocab" as const,
          stage: r.stage,
          en: v.en,
          pt_br: v.pt_br,
          example_en: v.example_en,
          part_of_speech: v.part_of_speech,
        };
      }
      if (r.item_type === "phrase") {
        const p = phraseById.get(r.item_id);
        if (!p) return null;
        return {
          reviewId: r.id,
          kind: "phrase" as const,
          stage: r.stage,
          en: p.en,
          pt_br: p.pt_br,
          function_tag: p.function_tag,
        };
      }
      if (r.item_type === "grammar") {
        const g = grammarById.get(r.item_id);
        if (!g) return null;
        return {
          reviewId: r.id,
          kind: "grammar" as const,
          stage: r.stage,
          title_pt_br: g.title_pt_br,
          rule_pattern: g.rule_pattern,
          examples: g.examples,
        };
      }
      return null;
  }).filter(Boolean)) as ReviewItem[];

  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="primary">
            <Flame className="h-3 w-3" />
            Sessão de revisão
          </Badge>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {items.length} item{items.length > 1 ? "s" : ""} para revisar
          </h1>
        </div>
        <Link
          href="/review"
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Sair
        </Link>
      </div>

      <ReviewSessionPlayer items={items} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <Badge variant="outline">Fila vazia</Badge>
      <p className="mt-4 text-sm text-muted-foreground">
        Não há itens devidos agora.
      </p>
      <Link
        href="/review"
        className="mt-4 inline-block text-sm text-primary underline-offset-4 hover:underline"
      >
        Voltar ao Review Center
      </Link>
    </div>
  );
}
