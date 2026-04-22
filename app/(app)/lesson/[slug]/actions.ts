"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/** Grava tentativa de exercício. Retorna grade calculado. */
const submitSchema = z.object({
  exercise_id: z.string().uuid(),
  lesson_version_id: z.string().uuid(),
  grade: z.number().int().min(0).max(5),
  is_correct: z.boolean().optional(),
  response: z.record(z.string(), z.unknown()),
  time_ms: z.number().int().optional(),
});

type Result = { ok: true; attempt_id: string } | { ok: false; error: string };

export async function submitAttemptAction(
  input: z.infer<typeof submitSchema>,
): Promise<Result> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Payload inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirou." };

  // Conta tentativas anteriores para attempt_number
  const { count } = await supabase
    .from("exercise_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("exercise_id", parsed.data.exercise_id);

  const { data, error } = await supabase
    .from("exercise_attempts")
    .insert({
      user_id: user.id,
      exercise_id: parsed.data.exercise_id,
      lesson_version_id: parsed.data.lesson_version_id,
      grade: parsed.data.grade,
      is_correct: parsed.data.is_correct ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response: parsed.data.response as any,
      time_ms: parsed.data.time_ms ?? null,
      attempt_number: (count ?? 0) + 1,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, attempt_id: data.id };
}

/** Avança marcador de seção no lesson_progress. */
const progressSchema = z.object({
  lesson_id: z.string().uuid(),
  lesson_version_id: z.string().uuid(),
  unit_version_id: z.string().uuid(),
  section_kind: z.string(),
  completed_section: z.boolean(),
});

export async function markSectionVisitedAction(
  input: z.infer<typeof progressSchema>,
): Promise<Result | { ok: true; completed: boolean }> {
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Payload inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirou." };

  // Upsert lesson_progress
  const { data: existing } = await supabase
    .from("lesson_progress")
    .select("id, sections_completed")
    .eq("user_id", user.id)
    .eq("lesson_version_id", parsed.data.lesson_version_id)
    .maybeSingle();

  const current = new Set(existing?.sections_completed ?? []);
  if (parsed.data.completed_section) {
    current.add(parsed.data.section_kind as never);
  }

  if (existing) {
    await supabase
      .from("lesson_progress")
      .update({
        current_section: parsed.data.section_kind as never,
        sections_completed: Array.from(current) as never,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("lesson_progress").insert({
      user_id: user.id,
      lesson_id: parsed.data.lesson_id,
      lesson_version_id: parsed.data.lesson_version_id,
      unit_version_id: parsed.data.unit_version_id,
      current_section: parsed.data.section_kind as never,
      sections_completed: Array.from(current) as never,
      status: "in_progress",
    });
  }

  return { ok: true, completed: false };
}

/** Chama complete_lesson() no banco. */
const completeSchema = z.object({
  lesson_version_id: z.string().uuid(),
});

export async function completeLessonAction(
  input: z.infer<typeof completeSchema>,
): Promise<Result> {
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Payload inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirou." };

  const { error } = await supabase.rpc("complete_lesson", {
    p_user_id: user.id,
    p_lesson_version_id: parsed.data.lesson_version_id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/trilha");
  return { ok: true, attempt_id: parsed.data.lesson_version_id };
}
