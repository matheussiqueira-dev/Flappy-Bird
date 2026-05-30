import Link from "next/link";

import { Credits } from "@/components/credits";
import { developer, product } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>{product.name}</strong>
        <p>Visão computacional, experiência web e engenharia de produto.</p>
      </div>
      <nav aria-label="Links do rodapé">
        <Link href="/about">Projeto</Link>
        <Link href="/dashboard">Dashboard</Link>
        <a href={developer.linkedin} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
      </nav>
      <Credits />
    </footer>
  );
}
