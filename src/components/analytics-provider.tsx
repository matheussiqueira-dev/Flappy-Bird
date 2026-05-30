"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { useEffect } from "react";

export function AnalyticsProvider() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
            `}
          </Script>
        </>
      ) : null}
      <Analytics />
      <SpeedInsights />
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
