import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary/50 text-foreground",
        info: "border-primary/30 bg-primary/10 text-foreground",
        success: "border-emerald-500/30 bg-emerald-500/10 text-foreground",
        error:
          "border-destructive/40 bg-destructive/10 text-destructive-foreground [&_*]:text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Alert({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants>) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}
