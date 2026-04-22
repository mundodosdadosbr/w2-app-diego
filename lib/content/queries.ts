/**
 * Queries de conteúdo consumidas pela área autenticada.
 * Todas passam por RLS — só retornam o que o aluno pode ver.
 * Usar em Server Components / Server Actions (cliente `@/lib/supabase/server`).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type SB = SupabaseClient<Database>;

/** Lista units publicadas na ordem da trilha. */
export async function listPublishedUnits(supabase: SB) {
  const { data, error } = await supabase
    .from("units")
    .select("id, slug, order_index, title_en, title_pt_br, level, estimated_minutes")
    .eq("status", "published")
    .order("order_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Unit publicada por slug + objetivos + lessons publicadas. */
export async function getUnitBySlug(supabase: SB, slug: string) {
  const { data: unit, error } = await supabase
    .from("units")
    .select(
      `id, slug, order_index, title_en, title_pt_br, level, estimated_minutes, theme, status,
       unit_objectives(id, order_index, i_can_pt_br, i_can_en, skill_tag),
       lessons(id, slug, order_index, title_en, title_pt_br, level, estimated_minutes, status)`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!unit) return null;

  // Filtra lessons publicadas + ordena
  const lessons = (unit.lessons ?? [])
    .filter((l) => l.status === "published")
    .sort((a, b) => a.order_index - b.order_index);
  const objectives = (unit.unit_objectives ?? []).sort(
    (a, b) => a.order_index - b.order_index,
  );

  return { ...unit, lessons, objectives };
}

/**
 * Progresso do aluno agregado por unit.
 * Retorna Map<unit_id, { completed: number, total: number, unit_completed: boolean }>
 */
export async function getUnitsProgress(supabase: SB, userId: string) {
  const [{ data: unitProgress }, { data: lessonProgress }] = await Promise.all(
    [
      supabase
        .from("unit_progress")
        .select("unit_id, status")
        .eq("user_id", userId),
      supabase
        .from("lesson_progress")
        .select("lesson_id, status")
        .eq("user_id", userId),
    ],
  );

  const completedLessons = new Set(
    (lessonProgress ?? [])
      .filter((lp) => lp.status === "completed")
      .map((lp) => lp.lesson_id),
  );
  const completedUnits = new Set(
    (unitProgress ?? [])
      .filter((up) => up.status === "completed")
      .map((up) => up.unit_id),
  );

  return { completedLessons, completedUnits };
}

/** Próxima lesson a fazer (seguindo current_lesson_id do path_progress). */
export async function getNextLesson(supabase: SB, userId: string) {
  const { data: path } = await supabase
    .from("learning_path_progress")
    .select("current_unit_id, current_lesson_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!path?.current_lesson_id) {
    // Fallback: primeira lesson da primeira unit publicada
    const { data: first } = await supabase
      .from("lessons")
      .select(
        "id, slug, title_en, title_pt_br, unit_id, units!inner(slug, order_index)",
      )
      .eq("status", "published")
      .order("order_index", { ascending: true })
      .limit(1)
      .maybeSingle();
    return first;
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select(
      "id, slug, title_en, title_pt_br, unit_id, units!inner(slug, order_index)",
    )
    .eq("id", path.current_lesson_id)
    .maybeSingle();
  return lesson;
}

/** Count de reviews devidas (due_at <= now, não mastered). */
export async function getDueReviewsCount(supabase: SB, userId: string) {
  const { count } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("stage", "mastered")
    .lte("due_at", new Date().toISOString());
  return count ?? 0;
}
