"use client";

import { useCallback, useRef, useState } from "react";
import { callEdgeFn } from "@/lib/edge-fn";

export type SttState = "idle" | "recording" | "processing" | "done" | "error";

export type SttResult = {
  score: number;
  transcript: string;
  problem_words: string[];
  low_audio_quality: boolean;
};

type RecordingOptions = {
  expected: string;
  lessonVersionId?: string;
  exerciseId?: string;
  pronunciationTargetId?: string;
};

/**
 * Grava áudio via MediaRecorder, converte em base64 e envia para a
 * Edge Function stt-score. Retorna score e palavras problemáticas.
 */
export function useStt() {
  const [state, setState] = useState<SttState>("idle");
  const [result, setResult] = useState<SttResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const optionsRef = useRef<RecordingOptions | null>(null);

  const startRecording = useCallback(
    async (opts: RecordingOptions) => {
      if (state === "recording" || state === "processing") return;
      optionsRef.current = opts;
      setResult(null);
      setError(null);
      chunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const recorder = new MediaRecorder(stream, { mimeType });
        recorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          streamRef.current?.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });

          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64 = (reader.result as string).split(",")[1];
            setState("processing");
            try {
              const o = optionsRef.current!;
              const res = await callEdgeFn<SttResult & { error?: string }>(
                "stt-score",
                {
                  audio_base64: base64,
                  expected: o.expected,
                  lesson_version_id: o.lessonVersionId,
                  exercise_id: o.exerciseId,
                  pronunciation_target_id: o.pronunciationTargetId,
                },
              );
              if (!res || res.error) {
                setError(res?.error ?? "Erro ao processar áudio.");
                setState("error");
              } else {
                setResult(res);
                setState("done");
              }
            } catch {
              setError("Erro de conexão.");
              setState("error");
            }
          };
        };

        recorder.start(100);
        setState("recording");
      } catch {
        setError("Microfone não disponível. Verifique as permissões.");
        setState("error");
      }
    },
    [state],
  );

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setResult(null);
    setError(null);
  }, []);

  return { state, result, error, startRecording, stopRecording, reset };
}
