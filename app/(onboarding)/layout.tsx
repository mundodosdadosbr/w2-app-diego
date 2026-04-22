import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import {
  AuroraGlow,
  GridBackground,
} from "@/components/layout/grid-background";
import { createClient } from "@/lib/supabase/server";

/**
 * Layout do onboarding. Garante que:
 * 1. Usuário está autenticado (middleware já protege, mas defesa em profundidade).
 * 2. Quem já está onboarded não fica preso aqui — redirect para /dashboard.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .single();

  if (profile?.onboarded_at) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <AuroraGlow />
      <GridBackground
        variant="sm"
        className="top-0 h-[640px] mask-linear-fade"
      />
      <header className="relative z-10 border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Logo showDot={false} />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Onboarding
          </span>
        </div>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
