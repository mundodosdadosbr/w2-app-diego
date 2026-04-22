import { cn } from "@/lib/utils";

/**
 * Grid pattern de fundo com fade radial. Use como irmão da content
 * (posicionamento absolute fixed) em hero/landing sections.
 */
export function GridBackground({
  className,
  variant = "md",
}: {
  className?: string;
  variant?: "sm" | "md";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 mask-radial-fade",
        variant === "md" ? "bg-grid" : "bg-grid-sm",
        className,
      )}
    />
  );
}

/**
 * Glow "aurora" colocado atrás do hero.
 */
export function AuroraGlow({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[720px] w-[1200px] -translate-x-1/2 -translate-y-1/2",
        className,
      )}
    >
      <div className="absolute left-1/2 top-1/2 h-[440px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[120px]" />
      <div className="absolute left-1/3 top-1/3 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
    </div>
  );
}
