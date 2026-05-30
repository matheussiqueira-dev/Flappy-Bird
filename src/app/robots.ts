import type { MetadataRoute } from "next";

import { product } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${product.siteUrl}/sitemap.xml`,
  };
}
