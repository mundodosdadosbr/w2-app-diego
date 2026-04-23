import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handler do callback de email do Supabase Auth.
 * - Confirmação de email após signup → redireciona pra /onboarding/welcome.
 * - Password recovery (type=recovery) → redireciona pra /auth/update-password.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const nextParam = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=invalid_callback`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/auth/update-password`);
  }

  if (nextParam) {
    return NextResponse.redirect(`${origin}${nextParam}`);
  }

  // Verifica se onboarding já foi concluído
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.onboarded_at) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/onboarding/welcome`);
}
