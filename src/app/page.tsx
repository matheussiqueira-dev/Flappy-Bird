import { ArrowRight, BarChart3, Code2, Play } from "lucide-react";
import Link from "next/link";

import { Credits } from "@/components/credits";
import { GameDemo } from "@/components/game-demo";
import { SiteFooter } from "@/components/site-footer";
import { StatusGrid } from "@/components/status-grid";
import { developer, product } from "@/lib/constants";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata(product.name);

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    author: {
      "@type": "Person",
      name: developer.name,
      url: developer.portfolio,
    },
    url: product.siteUrl,
    codeRepository: product.repository,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="site">
        <header className="landing-header">
          <Link href="/" className="brand-mark">
            <span aria-hidden>FB</span>
            <strong>{product.shortName}</strong>
          </Link>
          <nav aria-label="Navegação">
            <Link href="/play">Jogar</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/about">Projeto</Link>
          </nav>
          <Credits compact />
        </header>

        <section className="hero">
          <div className="hero__scene" aria-hidden>
            <span className="hero__cloud hero__cloud--one" />
            <span className="hero__cloud hero__cloud--two" />
            <span className="hero__pipe hero__pipe--one" />
            <span className="hero__pipe hero__pipe--two" />
            <span className="hero__bird" />
          </div>
          <div className="hero__content">
            <span className="eyebrow">Portfolio production build</span>
            <h1>{product.name}</h1>
            <p>
              Uma demo de visão computacional evoluída para produto web:
              jogável, instalável, observável e pronta para Vercel.
            </p>
            <div className="hero__actions">
              <Link className="button button--primary" href="/play">
                <Play size={16} aria-hidden />
                Abrir demo
              </Link>
              <Link className="button" href="/dashboard">
                <BarChart3 size={16} aria-hidden />
                Ver dashboard
              </Link>
              <a className="icon-button" href={product.repository} target="_blank" rel="noreferrer" aria-label="Abrir repositório">
                <Code2 size={18} aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <StatusGrid />

        <section className="section section--tight">
          <div className="section__header">
            <span className="eyebrow">Experiência jogável</span>
            <h2>Canvas web com telemetria de produto</h2>
            <Link href="/play">
              Tela completa
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <GameDemo />
        </section>

        <section className="product-bands">
          <article>
            <span>01</span>
            <h2>Engine original preservada</h2>
            <p>
              O núcleo Python com Pygame, OpenCV e MediaPipe continua disponível
              para execução local com webcam.
            </p>
          </article>
          <article>
            <span>02</span>
            <h2>Camada web escalável</h2>
            <p>
              Next.js App Router, TypeScript, SEO, PWA e observabilidade foram
              adicionados para apresentação pública.
            </p>
          </article>
          <article>
            <span>03</span>
            <h2>Dashboard inteligente</h2>
            <p>
              KPIs, tendências, alertas e insights estão isolados em mock data
              substituível por fontes reais.
            </p>
          </article>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
