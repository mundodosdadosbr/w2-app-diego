"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  signupSchema,
  loginSchema,
  resetRequestSchema,
  resetPasswordSchema,
} from "@/schemas/auth";
import { publicEnv } from "@/lib/env";

async function getAppUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return publicEnv.NEXT_PUBLIC_APP_URL;
}

type ActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Signup com email/senha. Supabase envia email de confirmação por padrão.
 * Em dev: habilitar auto-confirm no dashboard para evitar fricção.
 */
export async function signupAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    display_name: formData.get("display_name") || undefined,
    accept_terms: formData.get("accept_terms") === "on" || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Confira os campos abaixo.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${await getAppUrl()}/auth/callback`,
      data: parsed.data.display_name
        ? { display_name: parsed.data.display_name }
        : undefined,
    },
  });

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  // Marca aceite de termos quando sessão já foi criada (auto-confirm ligado).
  if (data.user) {
    await supabase
      .from("profiles")
      .update({
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
        display_name: parsed.data.display_name ?? null,
      })
      .eq("id", data.user.id);
  }

  // Se Supabase exige email confirmation (default), não há sessão ainda.
  if (!data.session) {
    return {
      ok: true,
      message:
        "Enviamos um email de confirmação. Clique no link para ativar sua conta.",
    };
  }

  // Auto-confirm ativo — vai direto para onboarding.
  revalidatePath("/", "layout");
  redirect("/onboarding/welcome");
}

export async function loginAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Confira os campos abaixo.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  const next = (formData.get("next") as string) || "/dashboard";
  revalidatePath("/", "layout");
  redirect(next);
}

const ALLOWED_EMAIL = "diego.morais@mundodosdadosbr.com";

export async function requestMagicLinkAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get("email");
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return { ok: false, error: "Email inválido.", fieldErrors: { email: ["Email inválido."] } };
  }
  if (email.trim().toLowerCase() !== ALLOWED_EMAIL) {
    return { ok: false, error: "Acesso restrito." };
  }
  const displayName = formData.get("display_name");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${await getAppUrl()}/auth/callback`,
      data: displayName && typeof displayName === "string" ? { display_name: displayName } : undefined,
    },
  });

  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }
  return {
    ok: true,
    message: "Verifique seu email — enviamos um link de acesso.",
  };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordResetAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetRequestSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Email inválido.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${await getAppUrl()}/auth/callback?type=recovery` },
  );
  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }
  return {
    ok: true,
    message:
      "Se o email existir na base, você receberá um link para redefinir a senha.",
  };
}

export async function updatePasswordAction(
  _prev: ActionState | null,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Confira os campos abaixo.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { ok: false, error: translateAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// ----------------------------------------------------------------------------

function translateAuthError(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes("invalid login credentials")) return "Email ou senha inválidos.";
  if (msg.includes("email not confirmed")) return "Confirme seu email antes de entrar.";
  if (msg.includes("user already registered")) return "Já existe uma conta com esse email.";
  if (msg.includes("password should be at least")) return "Senha muito curta.";
  if (msg.includes("email rate limit exceeded")) return "Muitas tentativas — tente de novo em alguns minutos.";
  return raw;
}
