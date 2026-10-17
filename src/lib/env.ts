/**
 * Leitura centralizada e validada das variáveis de ambiente.
 *
 * As variáveis `NEXT_PUBLIC_*` precisam ser acessadas de forma literal
 * (`process.env.NEXT_PUBLIC_X`) para o Next.js embuti-las no bundle do cliente.
 * Um valor inválido é descartado com fallback seguro, em vez de chegar ao
 * HTML: o GA ID, por exemplo, é interpolado num script inline.
 */

const DEFAULT_SITE_URL = "https://flappy-bird-gestos.vercel.app";
const GA_ID_PATTERN = /^G-[A-Z0-9]{4,16}$/;

export function parseSiteUrl(value: string | undefined): string {
  if (!value) return DEFAULT_SITE_URL;

  try {
    const url = new URL(value);
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol === "https:" || (url.protocol === "http:" && isLocal)) {
      return url.origin;
    }
  } catch {
    // URL malformada: cai no padrão.
  }

  return DEFAULT_SITE_URL;
}

export function parseGaId(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && GA_ID_PATTERN.test(trimmed) ? trimmed : null;
}

/** Webhooks só por HTTPS, para não vazar stack traces em texto claro. */
export function parseWebhookUrl(value: string | undefined): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const publicEnv = {
  siteUrl: parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  gaId: parseGaId(process.env.NEXT_PUBLIC_GA_ID),
} as const;

/** Somente no servidor: nunca importe em Client Components. */
export function getServerEnv() {
  return {
    errorWebhookUrl: parseWebhookUrl(process.env.ERROR_WEBHOOK_URL),
    vercelEnv: process.env.VERCEL_ENV,
    vercelRegion: process.env.VERCEL_REGION,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA,
    isVercel: process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV),
  };
}
