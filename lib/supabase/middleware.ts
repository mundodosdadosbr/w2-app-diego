/**
 * Helper para refresh de sessão no middleware do Next.js.
 * Chamado uma vez por request em rotas autenticadas — renova o token se
 * próximo de expirar e sincroniza cookies com o response.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Chamada obrigatória: refresca o JWT se expirando.
  // Não confiar em getSession() aqui por causa de advisories do Supabase
  // — getUser() valida contra o servidor.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
