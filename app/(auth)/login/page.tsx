import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm">
      <div className="space-y-1 border-b border-border/60 p-6">
        <div className="mb-3">
          <Badge variant="primary">
            <Mail className="h-3 w-3" />
            Login / Signup
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Entrar na sua trilha
        </h1>
        <p className="text-sm text-muted-foreground">
          Sem senha. A gente manda um link no seu email e você entra direto.
        </p>
      </div>

      <div className="space-y-4 p-6">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs">
            {decodeURIComponent(error)}
          </div>
        )}

        <LoginForm next={next} />
      </div>
    </div>
  );
}
