import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  MessageSquare,
  Mic,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import {
  AuroraGlow,
  GridBackground,
} from "@/components/layout/grid-background";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AuroraGlow />

      {/* Top nav */}
      <header className="relative z-10 border-b border-border/60 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 font-medium text-primary transition-all hover:border-primary/60 hover:bg-primary/15"
            >
              Criar conta
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <GridBackground className="top-0 h-[720px]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex justify-center animate-fade-up">
              <Badge variant="primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
                MVP · M0 Foundation
              </Badge>
            </div>

            <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl animate-fade-up-delay-1">
              Speak English.
              <span className="block text-gradient-primary">
                Not just understand it.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-up-delay-2">
              Trilha guiada com ciclo INPUT → OUTPUT → REVIEW, tutor IA
              gentil e pronunciation coach em{" "}
              <span className="font-mono text-foreground">en-US</span>.
              Pedagogia pensada para brasileiros iniciantes.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-up-delay-3">
              <Link
                href="/signup"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all glow-primary hover:translate-y-[-1px]"
              >
                Começar de graça
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background/40 px-6 text-sm font-medium backdrop-blur-sm transition-colors hover:border-foreground/30 hover:bg-secondary"
              >
                Já tenho conta
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wider text-muted-foreground animate-fade-up-delay-3">
              <span>Supabase · AWS Bedrock · ElevenLabs</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border/60 md:grid-cols-4">
            {[
              { label: "Unidades", value: "10", sub: "A0 → A2" },
              { label: "Lessons", value: "~45", sub: "10-15 min" },
              { label: "Revisão", value: "1/3/7/14/30", sub: "SM-2 ancorado" },
              { label: "Speaking", value: "AI", sub: "Claude via Bedrock" },
            ].map((stat) => (
              <div key={stat.label} className="bg-background p-6">
                <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  {stat.value}
                </div>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section className="relative z-10 border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <div className="mb-12 flex flex-col items-start gap-3">
            <Badge>Como funciona</Badge>
            <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Método em três fases.
              <span className="text-muted-foreground">
                {" "}
                Produção ativa sobre consumo passivo.
              </span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-6 md:grid-rows-2">
            <FeatureCard
              className="md:col-span-3 md:row-span-2"
              phase="input"
              icon={BookOpen}
              title="INPUT"
              description="Verbs, vocabulário, handy phrases e gramática funcional. Blocos curtos de 1–3 minutos, sempre com áudio en-US e tradução de apoio."
              tag="Microaprendizado"
              large
            />
            <FeatureCard
              className="md:col-span-3"
              phase="output"
              icon={MessageSquare}
              title="OUTPUT"
              description="Pair practice com tutor IA, speak now guiado, drills e listen-and-act. Você produz — não apenas lê."
              tag="40% do tempo da lesson"
            />
            <FeatureCard
              className="md:col-span-3"
              phase="review"
              icon={RotateCcw}
              title="REVIEW"
              description="Revisão espaçada ancorada em 1/3/7/14/30 dias. Errou? Volta pro d1. Acertou? Avança o stage."
              tag="SM-2 simplificado"
            />
          </div>

          {/* AI + Pronunciation */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FeatureCard
              icon={Sparkles}
              title="Speaking partner IA"
              description="Claude via Amazon Bedrock. Correção gentil, nunca ultrapassa o seu nível. American English e tom conversacional."
              tag="Constitution P8 · P9"
            />
            <FeatureCard
              icon={Mic}
              title="Pronunciation coach"
              description="Amazon Transcribe com confidence por palavra + WER alinhado. Feedback por chunk, foco em fonemas críticos para brasileiros."
              tag="/θ/ /r/ /æ/ flap"
            />
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="relative z-10 border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-4 font-mono uppercase tracking-wider">
            <span>© W2 App</span>
            <span className="opacity-40">·</span>
            <span>en-US content only</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacidade
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Termos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// FeatureCard
// ============================================================================

function FeatureCard({
  icon: Icon,
  title,
  description,
  tag,
  phase,
  className,
  large,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tag?: string;
  phase?: "input" | "output" | "review";
  className?: string;
  large?: boolean;
}) {
  const phaseAccent: Record<NonNullable<typeof phase>, string> = {
    input: "from-phase-input/10 to-transparent",
    output: "from-phase-output/10 to-transparent",
    review: "from-phase-review/10 to-transparent",
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40",
        className,
      )}
    >
      {phase && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br",
            phaseAccent[phase],
          )}
        />
      )}
      <div className="relative flex h-full flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/60">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          {tag && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {tag}
            </span>
          )}
        </div>
        <h3
          className={cn(
            "font-semibold tracking-tight text-foreground",
            large ? "text-2xl sm:text-3xl" : "text-lg",
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "mt-2 leading-relaxed text-muted-foreground",
            large ? "text-base" : "text-sm",
          )}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
