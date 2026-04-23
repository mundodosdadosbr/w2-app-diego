import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const DEV_EMAIL = "diego.morais@mundodosdadosbr.com";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    return new NextResponse("SUPABASE_SERVICE_ROLE_KEY não configurada", { status: 500 });
  }

  // Admin client (service role) — gera token sem enviar email
  const admin = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: DEV_EMAIL,
  });

  if (error || !data?.properties?.hashed_token) {
    return new NextResponse(`Erro ao gerar token: ${error?.message}`, { status: 500 });
  }

  // Troca o token por sessão e grava nos cookies via SSR client
  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: "magiclink",
  });

  if (verifyError) {
    return new NextResponse(`Erro ao verificar token: ${verifyError.message}`, { status: 500 });
  }

  const origin = new URL(request.url).origin;

  // Vai pro dashboard se já fez onboarding, senão pro onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .maybeSingle();
  const dest = profile?.onboarded_at ? "/dashboard" : "/onboarding/welcome";
  return NextResponse.redirect(`${origin}${dest}`);
}
