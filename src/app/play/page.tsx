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
              <span className="eyebrow">Como jogar com gestos</span>
              <h2>Feche a mão, abra a mão, voe</h2>
            </div>
          </div>
          <ol className="steps-list">
            <li>Clique em &quot;Jogar com gestos&quot; e permita o acesso à câmera.</li>
            <li>Mostre uma mão para a câmera, a cerca de meio metro, com boa iluminação.</li>
            <li>Feche a mão e abra de novo: cada abertura é um flap. A primeira inicia a partida.</li>
          </ol>
          <p>
            O hand tracking roda inteiro no navegador com MediaPipe. Nenhuma imagem da câmera é
            enviada para servidor, e a câmera desliga ao sair da página ou clicar em &quot;Desligar
            gestos&quot;.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
