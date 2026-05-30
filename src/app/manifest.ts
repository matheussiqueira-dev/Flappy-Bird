import type { MetadataRoute } from "next";

import { product } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: product.name,
    short_name: product.shortName,
    description: product.description,
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#f6f8f7",
    theme_color: "#111417",
    categories: ["games", "productivity", "education"],
    shortcuts: [
      {
        name: "Jogar demo",
        short_name: "Jogar",
        description: "Abrir a versão web jogável.",
        url: "/play",
        icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Dashboard",
        short_name: "Métricas",
        description: "Ver KPIs e insights do produto.",
        url: "/dashboard",
        icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
    screenshots: [
      {
        src: "/opengraph-image",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "wide",
      },
    ],
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
