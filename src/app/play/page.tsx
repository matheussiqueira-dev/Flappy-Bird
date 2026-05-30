import { AppShell } from "@/components/app-shell";
import { GameDemo } from "@/components/game-demo";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata("Demo jogável", "Jogue a versão web do Flappy Bird com telemetria de produto.", "/play");

export default function PlayPage() {
  return (
    <AppShell title="Demo jogável" eyebrow="Produto">
      <div className="workspace-stack">
        <GameDemo />
        <section className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Roadmap web</span>
              <h2>Integração gestual no navegador</h2>
            </div>
          </div>
          <p>
            A versão web mantém o gameplay demonstrável sem dependências nativas.
            A evolução natural é conectar um modelo browser-side de hand tracking
            ao mesmo contrato de eventos usado pelo dashboard.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
