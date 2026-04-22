import Link from "next/link";
import { ArrowRight, BookOpen, Mic, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function WelcomePage() {
  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm">
      <div className="space-y-1 border-b border-border/60 p-6">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="primary">Passo 1 / 3</Badge>
          <span className="font-mono text-[11px] text-muted-foreground">
            ~3 min
          </span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Bem-vindo à sua trilha
        </h1>
        <p className="text-sm text-muted-foreground">
          Em 3 passos rápidos vamos calibrar seu nível e sua meta.
        </p>
      </div>

      <div className="space-y-4 p-6">
        <div className="space-y-3">
          <WelcomeStep
            icon={BookOpen}
            title="Teste de nível"
            description="8 perguntas rápidas para mandar você pra unit certa."
          />
          <WelcomeStep
            icon={Target}
            title="Meta semanal"
            description="Defina quanto quer estudar por semana — pode ajustar depois."
          />
          <WelcomeStep
            icon={Mic}
            title="Microfone (opcional)"
            description="Usado no Pronunciation Coach. Pode pular e habilitar depois."
          />
        </div>

        <div className="pt-4">
          <Link
            href="/onboarding/level-test"
            className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all glow-primary-soft hover:translate-y-[-1px]"
          >
            Vamos lá
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
      <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background/60">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {description}
        </div>
      </div>
    </div>
  );
}
