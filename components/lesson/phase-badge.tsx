import { cn } from "@/lib/utils";

export function PhaseBadge({
  phase,
}: {
  phase: "input" | "output" | "review" | "meta";
}) {
  const styles: Record<typeof phase, { label: string; className: string }> = {
    input: {
      label: "INPUT",
      className: "bg-phase-input/50 text-foreground border-phase-input",
    },
    output: {
      label: "OUTPUT",
      className: "bg-phase-output/50 text-foreground border-phase-output",
    },
    review: {
      label: "REVIEW",
      className: "bg-phase-review/50 text-foreground border-phase-review",
    },
    meta: {
      label: "INTRO",
      className: "bg-secondary text-muted-foreground border-border",
    },
  };
  const style = styles[phase];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
        style.className,
      )}
    >
      {style.label}
    </span>
  );
}
