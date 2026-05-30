import type { Metadata } from "next";

import { developer, product } from "@/lib/constants";

export function createMetadata(
  title: string,
  description = product.description,
  path = "/",
): Metadata {
  const url = new URL(path, product.siteUrl);

  return {
    title,
    description,
    alternates: {
      canonical: url.toString(),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: product.name,
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: `@${developer.name.replace(/\s+/g, "")}`,
    },
  };
}
