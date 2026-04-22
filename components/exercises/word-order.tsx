"use client";

import { useState, useMemo } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SnapshotExercise } from "@/lib/content/lesson-types";
import type { ExerciseResult } from "./multiple-choice";

/**
 * Exercício: ordenar palavras (word_order).
 * payload: { tokens: string[] } — palavras em qualquer ordem (embaralhadas)
 * expected: { order: string[] } — sequência correta
 *
 * Se payload.tokens vier vazio, gera tokens da own expected.order embaralhados.
 */
export function WordOrderExercise({
  exercise,
  onComplete,
}: {
  exercise: SnapshotExercise;
  onComplete: (result: ExerciseResult) => void;
}) {
  const expectedOrder = (exercise.expected.order as string[]) ?? [];
  const initialTokens = (exercise.payload.tokens as string[] | undefined) ?? expectedOrder;

  // Embaralha uma vez na montagem (estável entre rerenders)
  const shuffled = useMemo(() => shuffleStable(initialTokens), [initialTokens]);

  const [bank, setBank] = useState<Array<{ id: number; text: string }>>(() =>
    shuffled.map((t, i) => ({ id: i, text: t })),
  );
  const [assembled, setAssembled] = useState<Array<{ id: number; text: string }>>([]);
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState(() => Date.now());

  function pickFromBank(tokenId: number) {
    if (submitted) return;
    const token = bank.find((b) => b.id === tokenId);
    if (!token) return;
    setBank(bank.filter((b) => b.id !== tokenId));
    setAssembled([...assembled, token]);
  }

  function sendBack(tokenId: number) {
    if (submitted) return;
    const token = assembled.find((a) => a.id === tokenId);
    if (!token) return;
    setAssembled(assembled.filter((a) => a.id !== tokenId));
    setBank([...bank, token]);
  }

  function clearAll() {
    if (submitted) return;
    setBank([...bank, ...assembled]);
    setAssembled([]);
  }

  function handleSubmit() {
    if (submitted || assembled.length === 0) return;
    setSubmitted(true);

    const assembledTexts = assembled.map((a) => a.text);
    const allCorrect = arraysEqual(assembledTexts, expectedOrder);
    const positionsCorrect = assembledTexts.reduce(
      (acc, t, i) => (t === expectedOrder[i] ? acc + 1 : acc),
      0,
    );
    const oneSwapAway =
      !allCorrect && levenshteinArray(assembledTexts, expectedOrder) <= 1;

    const grade: 0 | 1 | 2 | 3 | 4 | 5 = allCorrect
      ? 5
      : oneSwapAway
        ? 3
        : positionsCorrect >= expectedOrder.length / 2
          ? 2
          : 1;

    onComplete({
      grade,
      correct: allCorrect,
      response: {
        assembled: assembledTexts,
        expected: expectedOrder,
        positions_correct: positionsCorrect,
      },
      timeMs: Date.now() - startedAt,
    });
  }

  const isComplete = bank.length === 0 && assembled.length === expectedOrder.length;

  return (
    <div className="space-y-6">
      {exercise.prompt_pt_br && (
        <p className="text-lg font-medium">{exercise.prompt_pt_br}</p>
      )}
      {exercise.prompt_en && (
        <p className="text-sm italic text-muted-foreground">
          {exercise.prompt_en}
        </p>
      )}

      {/* Linha montada */}
      <div
        className={cn(
          "flex min-h-[60px] flex-wrap items-start gap-2 rounded-lg border-2 border-dashed p-3",
          submitted
            ? arraysEqual(
                assembled.map((a) => a.text),
                expectedOrder,
              )
              ? "border-emerald-500/60 bg-emerald-500/5"
              : "border-destructive/60 bg-destructive/5"
            : "border-border bg-secondary/20",
        )}
      >
        {assembled.length === 0 ? (
          <span className="text-sm italic text-muted-foreground">
            Toque nas palavras abaixo para montar a frase
          </span>
        ) : (
          assembled.map((token) => (
            <button
              key={token.id}
              type="button"
              onClick={() => sendBack(token.id)}
              disabled={submitted}
              className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/60 disabled:opacity-70"
            >
              {token.text}
            </button>
          ))
        )}
      </div>

      {/* Banco de palavras disponíveis */}
      <div className="flex flex-wrap gap-2">
        {bank.map((token) => (
          <button
            key={token.id}
            type="button"
            onClick={() => pickFromBank(token.id)}
            disabled={submitted}
            className="rounded-md border border-border bg-secondary/30 px-3 py-1.5 text-sm transition-all hover:border-foreground/30 hover:bg-secondary/60 disabled:opacity-50"
          >
            {token.text}
          </button>
        ))}
      </div>

      {!submitted && (
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!isComplete}
            className="flex-1"
          >
            Confirmar
          </Button>
          {assembled.length > 0 && (
            <Button type="button" variant="ghost" onClick={clearAll}>
              Limpar
            </Button>
          )}
        </div>
      )}

      {submitted && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border p-3 text-sm",
            arraysEqual(
              assembled.map((a) => a.text),
              expectedOrder,
            )
              ? "border-emerald-500/40 bg-emerald-500/10"
              : "border-destructive/40 bg-destructive/10",
          )}
        >
          {arraysEqual(
            assembled.map((a) => a.text),
            expectedOrder,
          ) ? (
            <>
              <Check className="mt-0.5 h-4 w-4 text-emerald-400" />
              <span>Correto! ✓</span>
            </>
          ) : (
            <>
              <X className="mt-0.5 h-4 w-4 text-destructive" />
              <div>
                <div>Ordem correta:</div>
                <div className="mt-1 font-mono text-xs">
                  {expectedOrder.join(" ")}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function shuffleStable<T>(arr: T[]): T[] {
  const out = [...arr];
  // Fisher-Yates determinístico via seed simples (para o usuário ver sempre ordem diferente, mas não importa muito)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, i) => x === b[i]);
}

function levenshteinArray<T>(a: T[], b: T[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      );
    }
  }
  return dp[m]![n]!;
}
