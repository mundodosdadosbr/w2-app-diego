import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3";
import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
} from "npm:@aws-sdk/client-transcribe";

const REGION = "us-east-1";
const STT_BUCKET = "w2-stt-uploads-dev";

const awsCreds = {
  accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID")!,
  secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
};

const s3 = new S3Client({ region: REGION, credentials: awsCreds });
const transcribe = new TranscribeClient({ region: REGION, credentials: awsCreds });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

/**
 * WER simplificado + lista de palavras problemáticas.
 * Retorna wer em [0, ∞) e problemWords (palavras da ref ausentes na hipótese).
 */
function computeWer(
  expected: string,
  transcribed: string,
): { wer: number; problemWords: string[] } {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const ref = norm(expected).split(/\s+/).filter(Boolean);
  const hyp = norm(transcribed).split(/\s+/).filter(Boolean);
  if (ref.length === 0) return { wer: 0, problemWords: [] };

  // DP edit distance
  const dp: number[][] = Array.from({ length: ref.length + 1 }, (_, i) =>
    Array.from({ length: hyp.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );
  for (let i = 1; i <= ref.length; i++) {
    for (let j = 1; j <= hyp.length; j++) {
      dp[i][j] =
        ref[i - 1] === hyp[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  const errors = dp[ref.length][hyp.length];
  const wer = errors / ref.length;
  const hypSet = new Set(hyp);
  const problemWords = ref.filter((w) => !hypSet.has(w));
  return { wer, problemWords };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  // verify_jwt: true no gateway já validou o JWT — extrai user_id do payload localmente.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const token = authHeader.replace("Bearer ", "");
  const [, payloadB64] = token.split(".");
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
  const userId: string = payload.sub;
  if (!userId) return json({ error: "Unauthorized" }, 401);

  // Cria objeto user-like para compatibilidade com o restante do código
  const user = { id: userId };

  const body = await req.json();
  const { audio_base64, expected, pronunciation_target_id, exercise_id, lesson_version_id, retry_number } = body;
  if (!audio_base64 || !expected) {
    return json({ error: "audio_base64 and expected are required" }, 400);
  }

  const audioBytes = Uint8Array.from(atob(audio_base64), (c) => c.charCodeAt(0));
  const jobName = `w2-${user.id.replace(/-/g, "")}-${Date.now()}`;
  const s3Key = `${user.id}/${jobName}.webm`;

  // Upload para S3
  await s3.send(
    new PutObjectCommand({
      Bucket: STT_BUCKET,
      Key: s3Key,
      Body: audioBytes,
      ContentType: "audio/webm",
    }),
  );

  // Inicia job Transcribe
  await transcribe.send(
    new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: "en-US",
      MediaFormat: "webm",
      Media: { MediaFileUri: `s3://${STT_BUCKET}/${s3Key}` },
      Settings: { ShowWordConfidence: true },
    }),
  );

  // Poll até completar (máx 60s)
  let transcript = "";
  type WordResult = { word: string; confidence: number };
  let words: WordResult[] = [];
  let avgConfidence = 0;
  let lowAudioQuality = false;

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const { TranscriptionJob: job } = await transcribe.send(
      new GetTranscriptionJobCommand({ TranscriptionJobName: jobName }),
    );
    const status = job?.TranscriptionJobStatus;
    if (status === "COMPLETED") {
      const resultUrl = job!.Transcript!.TranscriptFileUri!;
      const result = await fetch(resultUrl).then((r) => r.json());
      transcript = result.results.transcripts[0]?.transcript ?? "";
      words = (result.results.items as Array<Record<string, unknown>>)
        .filter((item) => item.type === "pronunciation")
        .map((item) => {
          const alt = (item.alternatives as Array<Record<string, string>>)[0];
          return { word: alt.content, confidence: parseFloat(alt.confidence) };
        });
      avgConfidence =
        words.length > 0
          ? words.reduce((s, w) => s + w.confidence, 0) / words.length
          : 0;
      lowAudioQuality = avgConfidence < 0.5;
      break;
    }
    if (status === "FAILED") {
      return json({ error: "Transcription failed" }, 500);
    }
  }

  if (!transcript) return json({ error: "Transcription timed out" }, 504);

  const { wer, problemWords } = computeWer(expected, transcript);
  // score = 100 - penalidade_WER - penalidade_confiança
  const score = Math.max(
    0,
    Math.round(100 - wer * 80 - (1 - avgConfidence) * 40),
  );

  // Salva no banco via service_role (bypassa RLS)
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const { data: attempt, error: dbErr } = await adminClient
    .from("pronunciation_attempts")
    .insert({
      user_id: user.id,
      expected,
      transcribed: transcript,
      words,
      score,
      wer,
      avg_confidence: avgConfidence,
      problem_words: problemWords,
      audio_key: s3Key,
      low_audio_quality: lowAudioQuality,
      lesson_version_id: lesson_version_id ?? null,
      exercise_id: exercise_id ?? null,
      pronunciation_target_id: pronunciation_target_id ?? null,
      retry_number: retry_number ?? 0,
    })
    .select("id")
    .single();

  if (dbErr) console.error("DB insert error:", dbErr.message);

  return json({
    id: attempt?.id ?? null,
    transcript,
    words,
    score,
    wer,
    avg_confidence: avgConfidence,
    problem_words: problemWords,
    low_audio_quality: lowAudioQuality,
  });
});
