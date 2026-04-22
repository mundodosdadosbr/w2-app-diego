"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  LEVEL_TEST_QUESTIONS,
  scoreToLevel,
} from "@/lib/onboarding/level-test-questions";

const schema = z.object({
  answers: z.record(z.string(), z.number().int().min(0)),
});

type Input = z.infer<typeof schema>;
type Result = { ok: true } | { ok: false; error: string };

export async function submitLevelTestAction(input: Input): Promise<Result> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Respostas inválidas." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirou." };

  // Score
  let score = 0;
  for (const q of LEVEL_TEST_QUESTIONS) {
    const answer = parsed.data.answers[q.id];
    if (answer !== undefined && answer === q.correctIndex) score++;
  }
  const level = scoreToLevel(score);

  const { error } = await supabase
    .from("profiles")
    .update({ cefr_level: level })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(
    `/onboarding/goal?level=${level}&score=${score}&total=${LEVEL_TEST_QUESTIONS.length}`,
  );
}
