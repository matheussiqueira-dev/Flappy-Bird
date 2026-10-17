"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { useEffect } from "react";

import { getPreferencesStore, PREFERENCES_STORAGE_KEY } from "@/features/preferences/preferences-store";
import { usePreferences } from "@/features/preferences/use-preferences";
import { publicEnv } from "@/lib/env";

type AnalyticsProviderProps = {
  enableVercelInsights: boolean;
};

/** Lido no momento do envio, então desligar nas configurações vale na hora. */
function analyticsAllowed(): boolean {
  return getPreferencesStore().get().analytics;
}

function dropWhenOptedOut<T extends { type: string } | BeforeSendEvent>(event: T): T | null {
  return analyticsAllowed() ? event : null;
}

export function AnalyticsProvider({ enableVercelInsights }: AnalyticsProviderProps) {
  const { gaId } = publicEnv;
  const { analytics } = usePreferences();

  // Flag oficial do gtag para suspender o GA4 sem recarregar a página.
  useEffect(() => {
    if (!gaId) return;
    (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = !analytics;
  }, [gaId, analytics]);

  return (
    <>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          {/* O opt-out é lido do storage antes do primeiro config, para que o
              page view inicial também respeite a preferência. */}
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              try {
                var prefs = JSON.parse(localStorage.getItem('${PREFERENCES_STORAGE_KEY}') || '{}');
                if (prefs.analytics === false) window['ga-disable-${gaId}'] = true;
              } catch (e) {}
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}
      {enableVercelInsights ? (
        <>
          <Analytics beforeSend={dropWhenOptedOut} />
          <SpeedInsights beforeSend={dropWhenOptedOut} />
        </>
      ) : null}
      <PwaRegistration />
    </>
  );
}

function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // A falha de cache offline não deve afetar a experiência principal.
    });
  }, []);

  return null;
}
