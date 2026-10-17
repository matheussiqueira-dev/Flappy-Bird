import { AppShell } from "@/components/app-shell";
import { GameDemo } from "@/components/game-demo";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata(
  "Demo jogável",
  "Jogue Flappy Bird no navegador com toque, teclado ou gestos da mão pela webcam.",
  "/play",
);

export default function PlayPage() {
  return (
    <AppShell title="Demo jogável" eyebrow="Produto">
      <div className="workspace-stack">
        <GameDemo />
        <section className="panel">
          <div className="panel__header">
            <div>
              <span className="eyebrow">Privacidade e requisitos</span>
              <h2>A câmera fica no seu navegador</h2>
            </div>
          </div>
          <p>
            O hand tracking roda inteiro no navegador com MediaPipe. Nenhuma imagem da câmera é
            enviada para servidor, e a câmera desliga ao sair da página ou clicar em &quot;Desligar
            gestos&quot;. O passo a passo para jogar está no painel &quot;Como jogar com
            gestos&quot;, logo abaixo do jogo.
          </p>
          <p>
            Funciona em navegadores atuais com webcam, em HTTPS ou localhost. Com a câmera ligada,
            só gestos controlam a partida: teclado e toque ficam desativados até você desligar os
            gestos.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
