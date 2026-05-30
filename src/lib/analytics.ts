"use client";

import { track } from "@vercel/analytics";

type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsPayload = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config",
      eventName: string,
      params?: AnalyticsPayload,
    ) => void;
  }
}

export function trackProductEvent(
  eventName: string,
  payload: AnalyticsPayload = {},
) {
  track(eventName, payload);

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, payload);
  }
}
