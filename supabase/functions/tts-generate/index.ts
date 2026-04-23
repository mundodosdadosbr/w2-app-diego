import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const REGION = "us-east-1";
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

function decodeJwtSub(authHeader: string): string | null {
  try {
    const token = authHeader.replace("Bearer ", "");
    const [, b64] = token.split(".");
    const payload = JSON.parse(atob(b64.replace(/-/g, "+").replace(/_/g, "/")));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  const authHeader = req.headers.get("Authorization");
  const userId = authHeader ? decodeJwtSub(authHeader) : null;
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const body = await req.json();
  const { text, voice_id } = body;
  if (!text || typeof text !== "string" || text.length > 1000) {
    return json({ error: "text required (max 1000 chars)" }, 400);
  }

  // voice_id: "Ruth" (generative, en-US) | qualquer VoiceId do Polly
  const voiceId = (voice_id as string | undefined) ?? "Ruth";
  // rate: velocidade da fala em % — 90% é levemente mais devagar, bom para aprendizado
  const rate = (body.rate as string | undefined) ?? "90%";
  const cacheKey = `${await sha256Hex(text + voiceId + rate)}.mp3`;
  // Escapa caracteres XML especiais para uso seguro em SSML
  const xmlText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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

  const aws = new AwsClient({
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID")!,
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
    region: REGION,
    service: "polly",
  });

  // Tenta engine generative primeiro (mais natural); fallback para neural
  let pollyRes = await aws.fetch(
    `https://polly.${REGION}.amazonaws.com/v1/speech`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Text: `<speak><prosody rate="${rate}">${xmlText}</prosody></speak>`,
        TextType: "ssml",
        OutputFormat: "mp3",
        VoiceId: voiceId,
        Engine: "generative",
        LanguageCode: "en-US",
      }),
    },
  );

  // Se generative não estiver disponível para essa voz, tenta neural
  if (!pollyRes.ok) {
    const errText = await pollyRes.text();
    if (pollyRes.status === 400 && errText.includes("engine")) {
      pollyRes = await aws.fetch(
        `https://polly.${REGION}.amazonaws.com/v1/speech`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Text: `<speak><prosody rate="${rate}">${xmlText}</prosody></speak>`,
            TextType: "ssml",
            OutputFormat: "mp3",
            VoiceId: voiceId,
            Engine: "neural",
            LanguageCode: "en-US",
          }),
        },
      );
    } else {
      console.error("Polly error:", pollyRes.status, errText);
      return json({ error: "TTS generation failed", detail: errText }, 502);
    }
  }

  if (!pollyRes.ok) {
    const errText = await pollyRes.text();
    console.error("Polly fallback error:", pollyRes.status, errText);
    return json({ error: "TTS generation failed", detail: errText }, 502);
  }

  const audioBuffer = new Uint8Array(await pollyRes.arrayBuffer());

  const { error: uploadErr } = await admin.storage
    .from(TTS_BUCKET)
    .upload(cacheKey, audioBuffer, { contentType: "audio/mpeg", upsert: true });

  if (uploadErr) {
    console.error("Upload error:", uploadErr.message);
    return json({ error: uploadErr.message }, 500);
  }

  const { data: { publicUrl } } = admin.storage
    .from(TTS_BUCKET)
    .getPublicUrl(cacheKey);

  return json({ url: publicUrl, cached: false });
});
