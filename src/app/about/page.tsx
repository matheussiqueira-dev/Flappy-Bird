import { Code2, ExternalLink } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { developer, product } from "@/lib/constants";
import { architectureLayers } from "@/lib/mock-data";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata(
  "Sobre o projeto",
  "Arquitetura, decisões técnicas e visão de evolução do Flappy Bird com Gestos.",
  "/about",
);

export default function AboutPage() {
  return (
    <AppShell title="Sobre o projeto" eyebrow="Institucional">
      <div className="about-layout">
        <section className="panel panel--wide">
          <span className="eyebrow">Visão geral</span>
          <h2>{product.name}</h2>
          <p>
            O projeto nasceu como uma aplicação desktop de visão computacional e
            foi transformado em uma experiência web de portfólio, mantendo a
            engine original e adicionando uma superfície moderna para Vercel.
          </p>
          <div className="button-row">
            <a className="button button--primary" href={product.repository} target="_blank" rel="noreferrer">
              <Code2 size={16} aria-hidden />
              GitHub
            </a>
            <a className="button" href={developer.linkedin} target="_blank" rel="noreferrer">
              <ExternalLink size={16} aria-hidden />
              LinkedIn
            </a>
          </div>
        </section>

        <section className="panel">
          <span className="eyebrow">Créditos</span>
          <h2>{developer.credit}</h2>
          <p>
            Os créditos ficam visíveis na interface, documentados no README e
            centralizados em constantes reutilizáveis.
          </p>
          <a className="text-link" href={developer.portfolio} target="_blank" rel="noreferrer">
            {developer.portfolio}
          </a>
        </section>

        <section className="panel panel--wide">
          <span className="eyebrow">Arquitetura</span>
          <h2>Camadas preparadas para crescimento</h2>
          <div className="layer-table">
            {architectureLayers.map((layer) => (
              <article key={layer.name}>
                <strong>{layer.name}</strong>
                <span>{layer.detail}</span>
                <em>{layer.status}</em>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
