import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  showDot = true,
}: {
  className?: string;
  href?: string;
  showDot?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-sm font-semibold tracking-tight",
        className,
      )}
    >
      <span className="relative flex h-6 w-6 items-center justify-center rounded-md border border-primary/40 bg-primary/10 font-mono text-[11px] font-bold text-primary transition-all group-hover:border-primary/70 group-hover:bg-primary/15">
        W
      </span>
      <span className="text-foreground">
        w2<span className="text-primary">.</span>app
      </span>
      {showDot && (
        <span className="ml-1 hidden items-center gap-1.5 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            MVP · M0
          </span>
        </span>
      )}
    </Link>
  );
}
