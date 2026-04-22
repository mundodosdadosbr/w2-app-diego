import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import type { SnapshotSection } from "@/lib/content/lesson-types";

export function SectionIntro({ section }: { section: SnapshotSection }) {
  const objectives =
    (section.payload.objectives as string[] | undefined) ?? [];
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10">
        <BookOpen className="h-6 w-6 text-primary" />
      </div>
      <div>
        <Badge variant="primary">Objetivos desta lesson</Badge>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">
          Nesta lesson você vai aprender a
        </h2>
      </div>
      <ul className="mx-auto inline-block text-left">
        {objectives.map((obj, i) => (
          <li
            key={i}
            className="mb-2 flex items-start gap-2 text-sm text-muted-foreground"
          >
            <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-primary" />
            <span>{obj}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
