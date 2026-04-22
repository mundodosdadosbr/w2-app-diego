import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ElevenLabs — Rachel (en-US, American English)
const DEFAULT_VOICE_ID =
  Deno.env.get("ELEVENLABS_VOICE_ID") ?? "21m00Tcm4TlvDq8ikWAM";
const ELEVENLABS_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const TTS_BUCKET = "tts-cache";

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

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  // Valida JWT
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { error: authErr } = await userClient.auth.getUser();
  if (authErr) return json({ error: "Unauthorized" }, 401);

  const body = await req.json();
  const { text, voice_id } = body;
  if (!text || typeof text !== "string" || text.length > 1000) {
    return json({ error: "text required (max 1000 chars)" }, 400);
  }

  if (!ELEVENLABS_KEY) {
    return json({ error: "ELEVENLABS_API_KEY not configured" }, 503);
  }

  const voiceId = voice_id ?? DEFAULT_VOICE_ID;
  const cacheKey = `${await sha256Hex(text + voiceId)}.mp3`;

  // Service role para storage
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Verifica cache
  const { data: cached } = await admin.storage
    .from(TTS_BUCKET)
    .list("", { search: cacheKey, limit: 1 });
  if (cached && cached.length > 0) {
    const { data: { publicUrl } } = admin.storage
      .from(TTS_BUCKET)
      .getPublicUrl(cacheKey);
    return json({ url: publicUrl, cached: true });
  }

  // Gera via ElevenLabs
  const ttsRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );

  if (!ttsRes.ok) {
    const errText = await ttsRes.text();
    console.error("ElevenLabs error:", ttsRes.status, errText);
    return json({ error: "TTS generation failed" }, 502);
  }

  const audioBuffer = await ttsRes.arrayBuffer();

  const { error: uploadErr } = await admin.storage
    .from(TTS_BUCKET)
    .upload(cacheKey, audioBuffer, { contentType: "audio/mpeg", upsert: true });

  if (uploadErr) {
    return json({ error: uploadErr.message }, 500);
  }

  const { data: { publicUrl } } = admin.storage
    .from(TTS_BUCKET)
    .getPublicUrl(cacheKey);

  return json({ url: publicUrl, cached: false });
});
