"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const submitSchema = z.object({
  unit_version_id: z.string().uuid(),
  items: z
    .array(
      z.object({
        unit_objective_id: z.string().uuid(),
        confidence: z.enum(["i_can", "not_sure", "cant_yet"]),
        note: z.string().optional().nullable(),
      }),
    )
    .min(1),
});

type Result = { ok: true } | { ok: false; error: string };

export async function submitSelfAssessmentAction(
  input: z.infer<typeof submitSchema>,
  unitSlug: string,
): Promise<Result> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Payload inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirou." };

  const { error } = await supabase.rpc("submit_self_assessment", {
    p_user_id: user.id,
    p_unit_version_id: parsed.data.unit_version_id,
    p_items: parsed.data.items,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/trilha");
  revalidatePath(`/unit/${unitSlug}`);
  redirect(`/self-assessment/${unitSlug}/complete`);
}
