"use client";

import { useState } from "react";
import { Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTts } from "@/lib/hooks/use-tts";
import { PronunciationCard } from "@/components/lesson/pronunciation-card";
import type { SnapshotPhrase } from "@/lib/content/lesson-types";

export function SectionPhrases({
  items,
  lessonVersionId,
}: {
  items: SnapshotPhrase[];
  lessonVersionId?: string;
}) {
  const { play, isLoading } = useTts();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Ouça e repita cada chunk. Toque na frase para ver a tradução.
      </p>
      {items.map((p) => (
        <div
          key={p.id}
          className="rounded-lg border border-border bg-card transition-colors hover:border-primary/20"
        >
          {/* Linha principal: TTS + frase clicável */}
          <div className="flex items-start gap-3 p-4">
            <button
              type="button"
              title="Ouvir pronúncia"
              onClick={() => play(p.en)}
              disabled={isLoading(p.en)}
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
            >
              {isLoading(p.en) ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setRevealed((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
              }
              className="min-w-0 flex-1 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-medium">{p.en}</span>
                {p.function_tag && (
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {p.function_tag}
                  </span>
                )}
              </div>
              <div
                className={cn(
                  "mt-1 text-sm text-muted-foreground transition-[filter]",
                  revealed[p.id] ? "" : "select-none blur-sm",
                )}
              >
                {p.pt_br}
              </div>
            </button>
          </div>

          {/* Pronúncia inline */}
          <div className="border-t border-border/40 px-4 py-3">
            <PronunciationCard
              expected={p.en}
              lessonVersionId={lessonVersionId}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
