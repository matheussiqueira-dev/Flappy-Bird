import {
  ArrowRight,
  Camera,
  CirclePause,
  Hand,
  HandFist,
  Lightbulb,
  MoveVertical,
  Sun,
} from "lucide-react";

import type { ControlMode } from "@/features/game/domain/types";

type GestureGuideProps = {
  /** Modo em uso quando a câmera está ligada; destaca o cartão correspondente. */
  activeMode: ControlMode | null;
};

/**
 * Instruções de jogo por gestos, dentro do próprio console do jogo para que
 * apareçam tanto na landing quanto em /play. Fica aberto por padrão: quem
 * nunca jogou com gestos precisa ver o passo a passo antes de ligar a câmera.
 */
export function GestureGuide({ activeMode }: GestureGuideProps) {
  const cardClass = (mode: ControlMode) =>
    activeMode === mode ? "gesture-guide__mode gesture-guide__mode--active" : "gesture-guide__mode";

  return (
    <details className="gesture-guide" open>
      <summary>
        <Hand size={16} aria-hidden />
        Como jogar com gestos
      </summary>

      <div className="gesture-guide__body">
        <ol className="gesture-guide__setup">
          <li>
            <Camera size={16} aria-hidden />
            <span>
              Clique em <strong>Jogar com gestos</strong> e permita o acesso à câmera.
            </span>
          </li>
          <li>
            <Sun size={16} aria-hidden />
            <span>
              Fique a cerca de <strong>50 cm</strong>, com a mão inteira no quadro, a palma virada
              para a câmera e luz de frente.
            </span>
          </li>
          <li>
            <Lightbulb size={16} aria-hidden />
            <span>
              Espere o selo no canto do jogo mostrar <strong>Mão aberta</strong> ou{" "}
              <strong>Mão fechada</strong>: isso confirma que a câmera está vendo você.
            </span>
          </li>
        </ol>

        <div className="gesture-guide__modes">
          <section className={cardClass("flap")} aria-label="Modo abrir e fechar">
            <header>
              <span className="gesture-guide__gesture" aria-hidden>
                <HandFist size={22} />
                <ArrowRight size={14} />
                <Hand size={22} />
              </span>
              <h3>Abrir e fechar</h3>
              {activeMode === "flap" ? <em>em uso</em> : null}
            </header>
            <p>
              Feche a mão em punho e abra de novo: <strong>cada abertura é um flap</strong>. A
              primeira abertura começa a partida.
            </p>
            <p>
              Sem pressa: uma abertura a cada 1 ou 2 segundos mantém o pássaro no ar. Abra mais
              vezes para subir; espere para descer.
            </p>
          </section>

          <section className={cardClass("steer")} aria-label="Modo altura da mão">
            <header>
              <span className="gesture-guide__gesture" aria-hidden>
                <MoveVertical size={22} />
              </span>
              <h3>Altura da mão</h3>
              <span className="gesture-guide__tag">mais fácil</span>
              {activeMode === "steer" ? <em>em uso</em> : null}
            </header>
            <p>
              Feche e abra a mão uma vez para começar. Depois, <strong>suba e desça a mão</strong>:
              o pássaro acompanha.
            </p>
            <p>Não precisa ir até a borda: o meio da imagem já cobre a tela toda.</p>
          </section>
        </div>

        <ul className="gesture-guide__rules">
          <li>
            <CirclePause size={15} aria-hidden />
            Sem mão por mais de 1 segundo, o jogo pausa. Mostre a mão, feche e abra para retomar.
          </li>
          <li>
            <Lightbulb size={15} aria-hidden />
            Se o selo mostrar &quot;Ajustando…&quot;, abra bem os dedos ou feche o punho por
            completo.
          </li>
          <li>
            <Hand size={15} aria-hidden />
            Com a câmera ligada, a física fica mais suave (vão maior, canos mais lentos, o teto não
            derruba) e o recorde é separado do modo clássico.
          </li>
        </ul>
      </div>
    </details>
  );
}
