"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTts } from "@/lib/hooks/use-tts";
import { PronunciationCard } from "@/components/lesson/pronunciation-card";
import type { SnapshotVocab } from "@/lib/content/lesson-types";

export function SectionVocabulary({
  items,
  lessonVersionId,
}: {
  items: SnapshotVocab[];
  lessonVersionId?: string;
}) {
  const { play, isLoading } = useTts();
  const [revealed, setRevealed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.id, true])),
  );

  function toggle(id: string) {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Ouça cada palavra e grave sua pronúncia. Toque em{" "}
        <Eye className="inline h-3.5 w-3.5" /> para ocultar a tradução.
      </p>
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center gap-4">
            {/* TTS */}
            <button
              type="button"
              title="Ouvir pronúncia"
              onClick={() => play(item.en)}
              disabled={isLoading(item.en)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
            >
              {isLoading(item.en) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>

            {/* Palavra + tradução */}
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold">{item.en}</div>
              <div
                className={cn(
                  "text-sm transition-[filter,opacity]",
                  revealed[item.id]
                    ? "text-muted-foreground"
                    : "select-none blur-sm",
                )}
                aria-live="polite"
              >
                {item.pt_br}
                {item.part_of_speech && (
                  <span className="ml-2 font-mono text-[10px] uppercase tracking-wider opacity-70">
                    {item.part_of_speech}
                  </span>
                )}
              </div>
              {item.example_en && (
                <div className="mt-1 text-xs text-muted-foreground/70">
                  <span className="italic">{item.example_en}</span>
                  {item.example_pt_br && (
                    <span className="ml-2">· {item.example_pt_br}</span>
                  )}
                </div>
              )}
            </div>

            {/* Toggle tradução */}
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
              aria-label={
                revealed[item.id] ? "Ocultar tradução" : "Mostrar tradução"
              }
            >
              {revealed[item.id] ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Pronúncia inline */}
          <PronunciationCard
            expected={item.en}
            lessonVersionId={lessonVersionId}
            className="mt-3"
          />
        </div>
      ))}
    </div>
  );
}
