"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const gradeSchema = z.object({
  review_id: z.string().uuid(),
  grade: z.number().int().min(0).max(5),
});

type Result =
  | { ok: true; new_stage: string; next_due_at: string }
  | { ok: false; error: string };

export async function applyReviewGradeAction(
  input: z.infer<typeof gradeSchema>,
): Promise<Result> {
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Payload inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirou." };

  const { data, error } = await supabase
    .rpc("apply_review_grade", {
      p_review_id: parsed.data.review_id,
      p_grade: parsed.data.grade,
    });

  if (error) return { ok: false, error: error.message };

  // RPC retorna reviews row completa
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, error: "Review não encontrada." };

  return {
    ok: true,
    new_stage: row.stage,
    next_due_at: row.due_at,
  };
}
