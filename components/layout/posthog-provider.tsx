"use client";

import { useEffect } from "react";
import Script from "next/script";
import { publicEnv } from "@/lib/env";

/**
 * PostHog provider client-side. No-op se a chave não estiver configurada —
 * permite dev local rodar sem warnings.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const key = publicEnv.NEXT_PUBLIC_POSTHOG_KEY;
  const host = publicEnv.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

  useEffect(() => {
    if (!key) return;
    // Inicialização acontece no script inline via posthog-js (carregado abaixo).
  }, [key]);

  return (
    <>
      {key && (
        <Script
          id="posthog-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('${key}', {
  api_host: '${host}',
  capture_pageview: true,
  autocapture: false,
  person_profiles: 'identified_only',
  loaded: (posthog) => {
    if (${process.env.NODE_ENV === "development"}) posthog.debug(false);
  }
});
            `,
          }}
        />
      )}
      {children}
    </>
  );
}
