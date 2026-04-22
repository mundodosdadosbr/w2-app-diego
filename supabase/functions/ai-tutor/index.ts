import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
} from "npm:@aws-sdk/client-bedrock-runtime";

const MODEL_ID =
  Deno.env.get("BEDROCK_MODEL_ID") ??
  "us.anthropic.claude-haiku-4-5-20251001-v1:0";

const REGION = "us-east-1";

const bedrock = new BedrockRuntimeClient({
  region: REGION,
  credentials: {
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID")!,
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
  },
});

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

const BASE_SYSTEM = `You are Alex, a friendly and encouraging American English tutor helping a Brazilian Portuguese speaker practice English.

Guidelines:
- Speak only in English (respond in English always)
- Keep responses concise (2-4 sentences max for conversation turns)
- Correct grammar gently — acknowledge what was said, then model the correct form
- Use simple, everyday American English vocabulary unless the lesson context calls for more
- Be warm, patient, and encouraging
- If the user writes in Portuguese, gently remind them to try in English and offer a hint`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  const body = await req.json();
  const {
    messages,
    system: customSystem,
    context,
  }: {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    system?: string;
    context?: { lesson_slug?: string; unit_slug?: string; topic?: string };
  } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return json({ error: "messages array required" }, 400);
  }

  let system = customSystem ?? BASE_SYSTEM;
  if (context?.topic) {
    system += `\n\nLesson context: The student is currently studying "${context.topic}"`;
    if (context.lesson_slug) system += ` (lesson: ${context.lesson_slug})`;
    system += ". Relate your responses to this topic when relevant.";
  }

  const bedrockMessages: Message[] = messages.map((m) => ({
    role: m.role,
    content: [{ text: m.content }],
  }));

  if (bedrockMessages[0].role !== "user") {
    return json({ error: "First message must be from user" }, 400);
  }

  const cmd = new ConverseCommand({
    modelId: MODEL_ID,
    system: [{ text: system }],
    messages: bedrockMessages,
    inferenceConfig: { maxTokens: 512, temperature: 0.7 },
  });

  const result = await bedrock.send(cmd);
  const responseText = result.output?.message?.content?.[0]?.text ?? "";

  // Rastreia uso de AI (fire-and-forget)
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  adminClient
    .from("ai_usage")
    .insert({
      user_id: user.id,
      model: MODEL_ID,
      tokens_in: result.usage?.inputTokens ?? 0,
      tokens_out: result.usage?.outputTokens ?? 0,
      purpose: "speaking_partner",
      provider: "bedrock",
    })
    .then(({ error }) => {
      if (error) console.error("ai_usage insert:", error.message);
    });

  return json({
    message: responseText,
    usage: {
      input_tokens: result.usage?.inputTokens ?? 0,
      output_tokens: result.usage?.outputTokens ?? 0,
    },
  });
});
