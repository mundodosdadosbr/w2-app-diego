/**
 * Supabase client para **Server Components**, **Server Actions** e route handlers.
 * Lê cookies do request atual via `next/headers`.
 *
 * Nota importante: em Server Components, gravar cookies só é possível
 * dentro de Server Actions ou Route Handlers. O catch abaixo ignora
 * falhas silenciosamente quando chamado em SC puro (refresh de sessão
 * é responsabilidade do middleware).
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component context — cookies são imutáveis aqui.
            // Middleware cuida do refresh de sessão.
          }
        },
      },
    },
  );
}
