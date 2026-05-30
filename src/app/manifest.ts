import type { MetadataRoute } from "next";

import { product } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: product.name,
    short_name: product.shortName,
    description: product.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f6f8f7",
    theme_color: "#111417",
    categories: ["games", "productivity", "education"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
