"use client";

import { createClient } from "@/lib/supabase/client";

/** Chama uma Supabase Edge Function autenticada com o JWT do usuário atual. */
export async function callEdgeFn<T>(
  fnName: string,
  body: unknown,
): Promise<T | null> {
  const supabase = createClient();

  // Log do token enviado para debug
  const { data: { session } } = await supabase.auth.getSession();
  console.log(`[callEdgeFn] ${fnName} — session:`, session ? `OK (exp ${new Date(session.expires_at! * 1000).toISOString()})` : "NULL");

  const { data, error } = await supabase.functions.invoke<T>(fnName, {
    body: body as Record<string, unknown>,
  });

  if (error) {
    // data ainda pode conter o body JSON retornado pela função mesmo em erro
    console.error(`[callEdgeFn] ${fnName} error:`, error.message, "| data:", JSON.stringify(data));
    return null;
  }

  return data;
}
