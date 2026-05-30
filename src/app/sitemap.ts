import type { MetadataRoute } from "next";

import { product } from "@/lib/constants";

const routes = ["/", "/play", "/dashboard", "/settings", "/about"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${product.siteUrl}${route}`,
    lastModified: new Date("2026-05-29"),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.8,
  }));
}
