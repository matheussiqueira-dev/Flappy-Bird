import type { NextConfig } from "next";

const unsafeEval = process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : "";

// MediaPipe (controle por gestos): o runtime WASM é servido pela própria origem
// e precisa de 'wasm-unsafe-eval', que libera apenas a compilação de WebAssembly,
// não eval de JavaScript. O modelo de mão vem do bucket oficial do Google.
// O MediaPipe também tenta enviar telemetria de uso para odml.pa.googleapis.com,
// sem opção pública para desligar. Esse host fica de fora de propósito: o CSP
// bloqueia o envio, o rastreamento continua funcionando e nenhum dado sai do
// navegador. Efeito colateral: dois erros de CSP no console ao ativar gestos.
const mediapipeModelOrigin = "https://storage.googleapis.com";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${unsafeEval} https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://www.google-analytics.com https://*.vercel-insights.com https://vitals.vercel-insights.com https://va.vercel-scripts.com ${mediapipeModelOrigin}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/mediapipe/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
