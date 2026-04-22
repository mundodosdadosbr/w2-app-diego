/**
 * Middleware global: refresca sessão Supabase em toda request e protege
 * rotas sob `/app/*` e `/admin/*`. Rotas públicas (/, /login, /signup, etc.)
 * não exigem autenticação mas ainda passam pelo refresh de cookies.
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Rotas que exigem usuário autenticado.
const PROTECTED_PREFIXES = ["/dashboard", "/trilha", "/lesson", "/speaking", "/pronunciation", "/review", "/self-assessment", "/profile", "/settings", "/admin"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const ALLOWED_EMAIL = "diego.morais@mundodosdadosbr.com";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Bloqueia qualquer sessão que não seja do dono do app
  if (user && user.email?.toLowerCase() !== ALLOWED_EMAIL) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    response.cookies.delete("sb-access-token");
    response.cookies.delete("sb-refresh-token");
    return NextResponse.redirect(redirectUrl);
  }

  if (isProtected(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Usuário logado acessando /login ou /signup → manda pro dashboard
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Todas as rotas exceto estáticos, imagens otimizadas e favicon.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|mp4|webm)$).*)",
  ],
};
