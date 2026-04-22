import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame, LogOut } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/(auth)/actions";

/**
 * Layout da área autenticada. Middleware já bloqueia usuários sem sessão,
 * mas revalidamos aqui (defesa em profundidade) e redirecionamos para
 * onboarding se ainda não foi feito.
 */
export default async function AppLayout({
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
    .select("onboarded_at, display_name")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarded_at) {
    redirect("/onboarding/welcome");
  }
  const { data: streak } = await supabase
    .from("streaks")
    .select("current_count")
    .eq("user_id", user.id)
    .single();

  const displayName =
    profile?.display_name ?? user.email?.split("@")[0] ?? "você";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Logo href="/dashboard" showDot={false} />
          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/trilha">Trilha</NavLink>
            <NavLink href="/review">Revisão</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 font-mono text-[11px] text-muted-foreground sm:inline-flex">
              <Flame className="h-3 w-3 text-primary" />
              <span className="tabular-nums text-foreground">
                {streak?.current_count ?? 0}
              </span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                title={`Sair (${displayName})`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary/50 text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="sr-only">Sair</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}
    </Link>
  );
}
