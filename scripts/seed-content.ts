/**
 * Importa/atualiza conteúdo pedagógico a partir de JSONs em
 * supabase/seed/content/. Usa service_role (bypassa RLS).
 *
 * Uso:
 *   pnpm seed:content
 *   pnpm seed:content unit-01-greetings
 *   pnpm seed:content unit-01-greetings lesson-02-whats-your-name
 *
 * Idempotente: usa `slug` como chave para upsert.
 * Ao final, invoca publish_lesson() e publish_unit() RPCs.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { config as loadDotenv } from "dotenv";
import type { Database } from "../types/database";

// ---- env ----
loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "✗ Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  console.error("  Add them to .env or .env.local");
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const CONTENT_DIR = "supabase/seed/content";

// ---- types do JSON (subset do schema) ----
type UnitJson = {
  slug: string;
  order_index: number;
  title_en: string;
  title_pt_br: string;
  theme?: string;
  level: "a0" | "a1" | "a2" | "b1" | "b2" | "c1" | "c2";
  estimated_minutes?: number;
  objectives: Array<{
    i_can_pt_br: string;
    i_can_en?: string;
    skill_tag?: string;
    linked_lesson_slug?: string;
  }>;
};

type SectionJson = {
  kind: string;
  order_index: number;
  title?: string;
  required?: boolean;
  payload?: Record<string, unknown>;
  exercises?: Array<{
    type: string;
    prompt_pt_br?: string;
    prompt_en?: string;
    payload?: Record<string, unknown>;
    expected?: Record<string, unknown>;
    scoring?: Record<string, unknown>;
  }>;
};

type LessonJson = {
  slug: string;
  order_index: number;
  title_en: string;
  title_pt_br: string;
  level: "a0" | "a1" | "a2" | "b1" | "b2" | "c1" | "c2";
  estimated_minutes?: number;
  vocabulary?: Array<{
    en: string;
    pt_br: string;
    part_of_speech?: string;
    example_en?: string;
    example_pt_br?: string;
    tags?: string[];
  }>;
  phrases?: Array<{
    en: string;
    pt_br: string;
    function_tag?: string;
  }>;
  grammar?: Array<{
    title_pt_br: string;
    title_en?: string;
    explanation_pt_br: string;
    explanation_en?: string;
    rule_pattern?: string;
    examples: Array<{ en: string; pt_br: string }>;
  }>;
  sections: SectionJson[];
  pronunciation_targets?: Array<{
    text_en: string;
    focus_phonemes?: string[];
  }>;
};

// ---- helpers ----
function log(msg: string, icon = "·") {
  console.log(`  ${icon} ${msg}`);
}

async function upsertUnit(u: UnitJson): Promise<string> {
  const { data, error } = await supabase
    .from("units")
    .upsert(
      {
        slug: u.slug,
        order_index: u.order_index,
        title_en: u.title_en,
        title_pt_br: u.title_pt_br,
        theme: u.theme ?? null,
        level: u.level,
        estimated_minutes: u.estimated_minutes ?? null,
        status: "draft",
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (error) throw new Error(`units upsert failed: ${error.message}`);
  log(`unit "${u.slug}" upserted`, "✓");

  // Objectives — replace all
  await supabase.from("unit_objectives").delete().eq("unit_id", data.id);
  if (u.objectives.length > 0) {
    const { error: objError } = await supabase.from("unit_objectives").insert(
      u.objectives.map((o, i) => ({
        unit_id: data.id,
        order_index: i + 1,
        i_can_pt_br: o.i_can_pt_br,
        i_can_en: o.i_can_en ?? null,
        skill_tag: o.skill_tag ?? null,
      })),
    );
    if (objError) throw new Error(`objectives insert: ${objError.message}`);
    log(`${u.objectives.length} objectives`);
  }

  return data.id;
}

async function upsertLesson(l: LessonJson, unitId: string): Promise<string> {
  const { data: lesson, error } = await supabase
    .from("lessons")
    .upsert(
      {
        unit_id: unitId,
        slug: l.slug,
        order_index: l.order_index,
        title_en: l.title_en,
        title_pt_br: l.title_pt_br,
        level: l.level,
        estimated_minutes: l.estimated_minutes ?? 12,
        status: "draft",
      },
      { onConflict: "unit_id,slug" },
    )
    .select("id")
    .single();

  if (error) throw new Error(`lesson upsert: ${error.message}`);
  log(`lesson "${l.slug}"`, "✓");

  // Vocabulary — upsert per-lesson scope
  const vocabIds: string[] = [];
  if (l.vocabulary && l.vocabulary.length > 0) {
    for (const v of l.vocabulary) {
      const { data: existing } = await supabase
        .from("vocabulary_items")
        .select("id")
        .eq("en", v.en)
        .eq("level", l.level)
        .maybeSingle();

      if (existing) {
        vocabIds.push(existing.id);
        continue;
      }

      const { data: newV, error: e } = await supabase
        .from("vocabulary_items")
        .insert({
          en: v.en,
          pt_br: v.pt_br,
          part_of_speech: v.part_of_speech ?? null,
          example_en: v.example_en ?? null,
          example_pt_br: v.example_pt_br ?? null,
          level: l.level,
          tags: v.tags ?? [],
          status: "published",
        })
        .select("id")
        .single();
      if (e) throw new Error(`vocab insert: ${e.message}`);
      vocabIds.push(newV.id);
    }
    log(`${vocabIds.length} vocab items linked`);
  }

  // Link vocab → lesson
  await supabase.from("lesson_vocabulary").delete().eq("lesson_id", lesson.id);
  if (vocabIds.length > 0) {
    await supabase.from("lesson_vocabulary").insert(
      vocabIds.map((id, i) => ({
        lesson_id: lesson.id,
        vocabulary_item_id: id,
        order_index: i + 1,
      })),
    );
  }

  // Phrases
  const phraseIds: string[] = [];
  if (l.phrases && l.phrases.length > 0) {
    for (const p of l.phrases) {
      const { data: existing } = await supabase
        .from("phrase_patterns")
        .select("id")
        .eq("en", p.en)
        .eq("level", l.level)
        .maybeSingle();
      if (existing) {
        phraseIds.push(existing.id);
        continue;
      }
      const { data: newP, error: e } = await supabase
        .from("phrase_patterns")
        .insert({
          en: p.en,
          pt_br: p.pt_br,
          function_tag: p.function_tag ?? null,
          level: l.level,
          status: "published",
        })
        .select("id")
        .single();
      if (e) throw new Error(`phrase insert: ${e.message}`);
      phraseIds.push(newP.id);
    }
    log(`${phraseIds.length} phrases linked`);
  }
  await supabase.from("lesson_phrases").delete().eq("lesson_id", lesson.id);
  if (phraseIds.length > 0) {
    await supabase.from("lesson_phrases").insert(
      phraseIds.map((id, i) => ({
        lesson_id: lesson.id,
        phrase_pattern_id: id,
        order_index: i + 1,
      })),
    );
  }

  // Grammar
  const grammarIds: string[] = [];
  if (l.grammar && l.grammar.length > 0) {
    for (const g of l.grammar) {
      const { data: existing } = await supabase
        .from("grammar_points")
        .select("id")
        .eq("title_pt_br", g.title_pt_br)
        .eq("level", l.level)
        .maybeSingle();
      if (existing) {
        grammarIds.push(existing.id);
        continue;
      }
      const { data: newG, error: e } = await supabase
        .from("grammar_points")
        .insert({
          title_pt_br: g.title_pt_br,
          title_en: g.title_en ?? null,
          explanation_pt_br: g.explanation_pt_br,
          explanation_en: g.explanation_en ?? null,
          rule_pattern: g.rule_pattern ?? null,
          examples: g.examples,
          level: l.level,
          status: "published",
        })
        .select("id")
        .single();
      if (e) throw new Error(`grammar insert: ${e.message}`);
      grammarIds.push(newG.id);
    }
    log(`${grammarIds.length} grammar points linked`);
  }
  await supabase.from("lesson_grammar").delete().eq("lesson_id", lesson.id);
  if (grammarIds.length > 0) {
    await supabase.from("lesson_grammar").insert(
      grammarIds.map((id, i) => ({
        lesson_id: lesson.id,
        grammar_point_id: id,
        order_index: i + 1,
      })),
    );
  }

  // Sections (replace all) + exercises
  await supabase.from("lesson_sections").delete().eq("lesson_id", lesson.id);
  for (const sec of l.sections) {
    const { data: secRow, error: e } = await supabase
      .from("lesson_sections")
      .insert({
        lesson_id: lesson.id,
        order_index: sec.order_index,
        kind: sec.kind as never,
        title: sec.title ?? null,
        required: sec.required ?? true,
        payload: sec.payload ?? {},
      })
      .select("id")
      .single();
    if (e) throw new Error(`section insert: ${e.message}`);

    if (sec.exercises && sec.exercises.length > 0) {
      await supabase.from("exercises").insert(
        sec.exercises.map((ex, i) => ({
          lesson_section_id: secRow.id,
          type: ex.type as never,
          order_index: i + 1,
          prompt_pt_br: ex.prompt_pt_br ?? null,
          prompt_en: ex.prompt_en ?? null,
          payload: ex.payload ?? {},
          expected: ex.expected ?? {},
          scoring: ex.scoring ?? { method: "standard" },
        })),
      );
    }
  }
  log(`${l.sections.length} sections + exercises`);

  // Pronunciation targets
  await supabase
    .from("pronunciation_targets")
    .delete()
    .eq("lesson_id", lesson.id);
  if (l.pronunciation_targets && l.pronunciation_targets.length > 0) {
    await supabase.from("pronunciation_targets").insert(
      l.pronunciation_targets.map((pt, i) => ({
        lesson_id: lesson.id,
        text_en: pt.text_en,
        focus_phonemes: pt.focus_phonemes ?? [],
        order_index: i + 1,
      })),
    );
    log(`${l.pronunciation_targets.length} pronunciation targets`);
  }

  return lesson.id;
}

async function publishLesson(lessonId: string) {
  const { error } = await supabase.rpc("publish_lesson", {
    p_lesson_id: lessonId,
  });
  if (error) throw new Error(`publish_lesson: ${error.message}`);
  log("published", "✓");
}

async function publishUnit(unitId: string) {
  const { error } = await supabase.rpc("publish_unit", {
    p_unit_id: unitId,
  });
  if (error) throw new Error(`publish_unit: ${error.message}`);
  log("unit published", "✓");
}

// ---- walker ----

async function processUnit(unitDir: string, filterLesson?: string) {
  const unitPath = join(CONTENT_DIR, unitDir);
  const unitFile = join(unitPath, "_unit.json");

  if (!existsSync(unitFile)) {
    console.warn(`! ${unitDir} missing _unit.json — skipping`);
    return;
  }

  const unitJson: UnitJson = JSON.parse(readFileSync(unitFile, "utf-8"));
  console.log(`\n▶ Unit: ${unitDir}`);

  const unitId = await upsertUnit(unitJson);

  // Lessons
  const lessonFiles = readdirSync(unitPath)
    .filter((f) => f.startsWith("lesson-") && f.endsWith(".json"))
    .filter((f) => (filterLesson ? f.startsWith(filterLesson) : true))
    .sort();

  let lessonsProcessed = 0;
  for (const lessonFile of lessonFiles) {
    const lessonJson: LessonJson = JSON.parse(
      readFileSync(join(unitPath, lessonFile), "utf-8"),
    );
    const lessonId = await upsertLesson(lessonJson, unitId);
    await publishLesson(lessonId);
    lessonsProcessed++;
  }

  if (lessonsProcessed > 0 && !filterLesson) {
    await publishUnit(unitId);
  } else if (lessonsProcessed > 0) {
    log("(skipping unit publish — partial import)", "i");
  }
}

// ---- main ----

async function main() {
  const [filterUnit, filterLesson] = process.argv.slice(2);

  if (!existsSync(CONTENT_DIR)) {
    console.error(`✗ ${CONTENT_DIR} not found`);
    process.exit(1);
  }

  const unitDirs = readdirSync(CONTENT_DIR)
    .filter((d) => {
      const p = join(CONTENT_DIR, d);
      return statSync(p).isDirectory() && !d.startsWith(".");
    })
    .filter((d) => (filterUnit ? d === filterUnit : true))
    .sort();

  if (unitDirs.length === 0) {
    console.warn(
      `! No unit directories found${
        filterUnit ? ` matching "${filterUnit}"` : ""
      }`,
    );
    process.exit(0);
  }

  console.log(
    `\nSeeding ${unitDirs.length} unit${unitDirs.length > 1 ? "s" : ""}...`,
  );

  for (const unitDir of unitDirs) {
    try {
      await processUnit(unitDir, filterLesson);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${unitDir}: ${msg}`);
      process.exit(1);
    }
  }

  console.log("\n✓ Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
