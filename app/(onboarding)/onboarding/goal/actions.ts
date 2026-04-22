"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  weekly_goal_minutes: z.number().int().min(0).max(600),
});

type Input = z.infer<typeof schema>;
type Result = { ok: true } | { ok: false; error: string };

export async function completeOnboardingAction(
  input: Input,
): Promise<Result> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Meta inválida." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirou." };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      weekly_goal_minutes: parsed.data.weekly_goal_minutes,
      onboarded_at: now,
      terms_accepted_at: now,
      privacy_accepted_at: now,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  // learning_path_progress.current_unit_id fica NULL até aluno entrar na trilha.
  // Quando tiver conteúdo publicado, um trigger ou query server-side preenche.

  revalidatePath("/", "layout");
  redirect("/dashboard?onboarded=1");
}
