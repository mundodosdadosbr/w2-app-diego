import { Logo } from "@/components/layout/logo";
import {
  AuroraGlow,
  GridBackground,
} from "@/components/layout/grid-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <AuroraGlow />
      <GridBackground variant="sm" className="top-0 h-[560px] mask-linear-fade" />

      <header className="relative z-10 border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <Logo showDot={false} />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-fade-up">{children}</div>
      </main>
    </div>
  );
}
