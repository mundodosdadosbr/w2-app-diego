/**
 * Helper de analytics. No MVP, envia para PostHog se a chave pública estiver
 * configurada — senão é no-op. Em servidor, só loga em console (pode ser
 * extendido para PostHog server-side depois).
 */
import { publicEnv } from "@/lib/env";

export type PedagogicalEvent =
  | "onboarding_started"
  | "onboarding_step_viewed"
  | "level_test_completed"
  | "onboarding_completed"
  | "lesson_started"
  | "lesson_section_viewed"
  | "exercise_attempted"
  | "exercise_completed"
  | "lesson_completed"
  | "lesson_abandoned"
  | "review_session_started"
  | "review_item_attempted"
  | "review_session_completed"
  | "speaking_session_started"
  | "speaking_turn"
  | "speaking_session_completed"
  | "pronunciation_attempted"
  | "self_assessment_submitted"
  | "streak_milestone"
  | "streak_lost"
  | "dashboard_viewed"
  | "profile_viewed"
  | "trilha_viewed";

type Props = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    posthog?: {
      capture: (event: string, props?: Props) => void;
      identify: (id: string, props?: Props) => void;
    };
  }
}

export function track(event: PedagogicalEvent, props?: Props): void {
  if (typeof window === "undefined") {
    // Server-side — no-op no MVP. Em M4 podemos plugar PostHog server.
    return;
  }
  if (!publicEnv.NEXT_PUBLIC_POSTHOG_KEY) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[analytics]", event, props);
    }
    return;
  }
  window.posthog?.capture(event, props);
}

export function identify(userId: string, props?: Props): void {
  if (typeof window === "undefined") return;
  window.posthog?.identify(userId, props);
}
