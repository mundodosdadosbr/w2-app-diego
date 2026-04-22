"use client";

import { createClient } from "@/lib/supabase/client";
import { publicEnv } from "@/lib/env";

/** Chama uma Supabase Edge Function autenticada com o JWT do usuário atual. */
export async function callEdgeFn<T>(
  fnName: string,
  body: unknown,
): Promise<T | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const res = await fetch(
    `${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${fnName}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) return null;
  return res.json() as Promise<T>;
}
