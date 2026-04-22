"use client";

import { useCallback, useRef, useState } from "react";
import { callEdgeFn } from "@/lib/edge-fn";

/** Reproduz TTS via Edge Function tts-generate com cache automático. */
export function useTts() {
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(
    async (text: string) => {
      if (loadingText) return;
      setLoadingText(text);
      try {
        const res = await callEdgeFn<{ url: string }>("tts-generate", { text });
        if (!res?.url) return;
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
        audioRef.current = new Audio(res.url);
        audioRef.current.play();
      } finally {
        setLoadingText(null);
      }
    },
    [loadingText],
  );

  const isLoading = useCallback(
    (text: string) => loadingText === text,
    [loadingText],
  );

  return { play, isLoading };
}
