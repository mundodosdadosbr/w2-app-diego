"use client";

import { Loader2, Mic, RefreshCw, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStt } from "@/lib/hooks/use-stt";

type Props = {
  expected: string;
  lessonVersionId?: string;
  exerciseId?: string;
  pronunciationTargetId?: string;
  className?: string;
};

/** Card compacto de gravação + scoring de pronúncia. */
export function PronunciationCard({
  expected,
  lessonVersionId,
  exerciseId,
  pronunciationTargetId,
  className,
}: Props) {
  const { state, result, error, startRecording, stopRecording, reset } =
    useStt();

  function handleClick() {
    if (state === "idle" || state === "done" || state === "error") {
      if (state !== "idle") {
        reset();
      } else {
        startRecording({
          expected,
          lessonVersionId,
          exerciseId,
          pronunciationTargetId,
        });
      }
    } else if (state === "recording") {
      stopRecording();
    }
  }

  function handleRetry() {
    reset();
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-dashed border-border/60 px-3 py-2",
        className,
      )}
    >
      {/* Botão principal */}
      <button
        type="button"
        onClick={
          state === "done" || state === "error" ? handleRetry : handleClick
        }
        disabled={state === "processing"}
        title={
          state === "recording"
            ? "Parar gravação"
            : state === "done"
              ? "Gravar novamente"
              : "Gravar pronúncia"
        }
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors",
          state === "recording"
            ? "animate-pulse border-red-500/60 text-red-500"
            : state === "done"
              ? "border-primary/40 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
          state === "processing" && "opacity-60",
        )}
      >
        {state === "processing" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : state === "recording" ? (
          <Square className="h-3 w-3 fill-current" />
        ) : state === "done" ? (
          <RefreshCw className="h-3 w-3" />
        ) : (
          <Mic className="h-3 w-3" />
        )}
      </button>

      {/* Status / feedback */}
      <div className="min-w-0 flex-1 text-xs">
        {state === "idle" && (
          <span className="text-muted-foreground">Grave sua pronúncia</span>
        )}
        {state === "recording" && (
          <span className="text-red-500">Gravando… toque para parar</span>
        )}
        {state === "processing" && (
          <span className="text-muted-foreground">Analisando…</span>
        )}
        {state === "error" && (
          <span className="text-red-500">{error}</span>
        )}
        {state === "done" && result && (
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span
              className={cn(
                "font-semibold",
                result.score >= 85
                  ? "text-green-500"
                  : result.score >= 70
                    ? "text-primary"
                    : result.score >= 50
                      ? "text-yellow-500"
                      : "text-red-500",
              )}
            >
              {result.score}/100
            </span>
            <span className="text-muted-foreground">
              {result.score >= 85
                ? "Excelente!"
                : result.score >= 70
                  ? "Muito bem!"
                  : result.score >= 50
                    ? "Continue praticando"
                    : "Tente novamente"}
            </span>
            {result.problem_words.length > 0 && (
              <span className="text-muted-foreground">
                ·{" "}
                <span className="font-mono text-yellow-500">
                  {result.problem_words.join(", ")}
                </span>
              </span>
            )}
            {result.low_audio_quality && (
              <span className="text-muted-foreground/60">
                (qualidade de áudio baixa)
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
