import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { parseSnapshot, type LessonSnapshot } from "./lesson-types";

type SB = SupabaseClient<Database>;

export type LessonView = {
  lesson_id: string;
  lesson_version_id: string;
  unit_id: string;
  unit_version_id: string;
  unit_slug: string;
  unit_order_index: number;
  slug: string;
  title_en: string;
  title_pt_br: string;
  level: Database["public"]["Enums"]["cefr_level"];
  snapshot: LessonSnapshot;
};

/**
 * Carrega a lesson publicada pelo slug + a versão published, + snapshot já parsed.
 * Retorna null se lesson não existe, não está published, ou sem snapshot.
 */
export async function getLessonForPlayer(
  supabase: SB,
  slug: string,
): Promise<LessonView | null> {
  const { data, error } = await supabase
    .from("lessons")
    .select(
      `id, slug, title_en, title_pt_br, level, published_version_id, unit_id,
       units(slug, order_index, published_version_id),
       lesson_versions!lessons_published_version_fk(id, snapshot)`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  if (!data || !data.published_version_id || !data.lesson_versions) {
    return null;
  }

  const snapshot = parseSnapshot(data.lesson_versions.snapshot);
  if (!snapshot) return null;

  const unit = data.units;
  if (!unit?.published_version_id) return null;

  return {
    lesson_id: data.id,
    lesson_version_id: data.published_version_id,
    unit_id: data.unit_id,
    unit_version_id: unit.published_version_id,
    unit_slug: unit.slug,
    unit_order_index: unit.order_index,
    slug: data.slug,
    title_en: data.title_en,
    title_pt_br: data.title_pt_br,
    level: data.level,
    snapshot,
  };
}
