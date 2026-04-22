import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Badge } from "@/components/ui/badge";

/**
 * Placeholder de termos de uso. Redação jurídica final em M4 story 22.1.
 */
export default function TermsPage() {
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
        <h1 className="text-3xl font-semibold tracking-tight">Termos de uso</h1>
        <p className="text-sm text-muted-foreground">
          Última atualização: 2026-04-22 · versão preliminar
        </p>

        <div className="prose prose-invert max-w-none space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Ao usar o W2 App, você concorda em (1) estudar o conteúdo oferecido
            apenas para fins pedagógicos, (2) não redistribuir conteúdo, (3)
            respeitar os outros alunos nas interações do sistema.
          </p>
          <p>
            O produto está em MVP — pode haver indisponibilidades, mudanças de
            UI e evolução de funcionalidades. Gravações e progresso são
            preservados em todos esses casos.
          </p>
          <p>
            Versão definitiva dos termos será publicada antes do launch comercial
            e passará por revisão jurídica (LGPD + Código Civil).
          </p>
        </div>
      </main>
    </div>
  );
}
