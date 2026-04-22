import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";

/**
 * Placeholder de política de privacidade. Versão jurídica final deve
 * ser redigida por advogado antes do launch (M4 story 22.1).
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Logo showDot={false} />
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 space-y-6">
        <Badge variant="outline">Rascunho · aguarda revisão jurídica</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Política de privacidade
        </h1>
        <p className="text-sm text-muted-foreground">
          Última atualização: 2026-04-22 · versão preliminar
        </p>

        <div className="prose prose-invert max-w-none space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold">O que coletamos</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Dados de conta (email, nome opcional, senha armazenada como hash
              via Supabase Auth).
            </li>
            <li>
              Progresso pedagógico (lessons feitas, exercícios tentados,
              notas).
            </li>
            <li>
              Gravações de áudio quando você usa Pronunciation Coach ou
              Speaking Practice — deletadas automaticamente em 90 dias, exceto
              se você opt-in para histórico.
            </li>
            <li>
              Analytics de uso (PostHog) — opt-out disponível em Configurações.
            </li>
          </ul>

          <h2 className="text-lg font-semibold">Como usamos</h2>
          <p className="text-muted-foreground">
            Exclusivamente para operar a plataforma, calcular seu progresso,
            personalizar revisões e melhorar o método. Não vendemos dados. Não
            treinamos modelos externos com suas gravações.
          </p>

          <h2 className="text-lg font-semibold">Retenção</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Gravações de áudio: 90 dias (ou indefinido se opt-in).</li>
            <li>
              Metadados pedagógicos (WER, scores, progresso): enquanto você
              tiver conta.
            </li>
            <li>Logs técnicos: 30 dias.</li>
          </ul>

          <h2 className="text-lg font-semibold">LGPD — Seus direitos</h2>
          <p className="text-muted-foreground">
            Você pode solicitar exclusão de conta, exportação de dados, ou
            retificação escrevendo para{" "}
            <a
              href="mailto:privacy@w2app.example"
              className="text-primary underline-offset-4 hover:underline"
            >
              privacy@w2app.example
            </a>
            . Efetivação em até 7 dias.
          </p>

          <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-4">
            <strong>Nota:</strong> este é um texto preliminar enquanto o MVP
            está em construção. A versão definitiva passará por revisão
            jurídica antes do launch.
          </div>
        </div>
      </main>
    </div>
  );
}
