/**
 * Validação de variáveis de ambiente via Zod.
 *
 * IMPORTANTE: Next.js só faz inline-replace de `process.env.NEXT_PUBLIC_XXX`
 * quando aparece como expressão literal no código. Por isso, listamos cada
 * variável explicitamente — passar `process.env` inteiro ao Zod não funciona
 * em Client Components (o objeto fica sem as keys no bundle do cliente).
 *
 * - `publicEnv`: seguro em Client Components (prefixo NEXT_PUBLIC_).
 * - `serverEnv`: só em Server Components / Server Actions / Edge Functions.
 */
import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

function parseOrThrow<T>(
  schema: z.ZodType<T>,
  source: Record<string, string | undefined>,
  label: string,
): T {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `[env] Invalid ${label} environment variables:\n${issues}`,
    );
  }
  return result.data;
}

/**
 * Client-safe env. Cada variável é referenciada literalmente para permitir
 * inline-replacement do Next.js durante o bundle do cliente.
 */
export const publicEnv = parseOrThrow(
  publicSchema,
  {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
  "public",
);

/**
 * Server-only env. Lança se acessado em código cliente.
 * Nota: em Client Components, esses campos não estão disponíveis —
 * acessar levanta em runtime (não em parse time).
 */
export const serverEnv =
  typeof window === "undefined"
    ? parseOrThrow(
        serverSchema,
        {
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
          SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
        },
        "server",
      )
    : (new Proxy({} as z.infer<typeof serverSchema>, {
        get() {
          throw new Error(
            "[env] serverEnv cannot be accessed from client code.",
          );
        },
      }) as z.infer<typeof serverSchema>);
