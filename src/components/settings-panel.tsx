"use client";

import { Bell, Camera, Gauge, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

const runtimeSettings = [
  {
    id: "camera",
    label: "Câmera local",
    description: "Permissão preparada para futuras versões web com detecção gestual.",
    icon: Camera,
  },
  {
    id: "analytics",
    label: "Eventos de produto",
    description: "Cliques, partidas e game over enviados para a camada de analytics.",
    icon: Gauge,
  },
  {
    id: "alerts",
    label: "Alertas de performance",
    description: "Estrutura pronta para erro, FPS baixo e queda de detecção.",
    icon: Bell,
  },
];

export function SettingsPanel() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    camera: true,
    analytics: true,
    alerts: true,
  });

  return (
    <div className="settings-layout">
      <section className="panel profile-panel">
        <div className="avatar" aria-hidden>
          MS
        </div>
        <div>
          <span className="eyebrow">Perfil do projeto</span>
          <h2>Matheus Siqueira</h2>
          <p>
            Desenvolvedor responsável pela experiência original em Python e pela
            apresentação web preparada para portfólio técnico.
          </p>
        </div>
        <a
          className="button button--primary"
          href="https://www.matheussiqueira.dev"
          target="_blank"
          rel="noreferrer"
        >
          Portfólio
        </a>
      </section>

      <section className="panel" id="runtime">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Runtime</span>
            <h2>Configurações</h2>
          </div>
          <SlidersHorizontal size={20} aria-hidden />
        </div>
        <div className="toggle-list">
          {runtimeSettings.map((setting) => {
            const Icon = setting.icon;
            return (
              <label className="toggle-row" key={setting.id}>
                <span className="toggle-row__icon">
                  <Icon size={18} aria-hidden />
                </span>
                <span>
                  <strong>{setting.label}</strong>
                  <small>{setting.description}</small>
                </span>
                <input
                  type="checkbox"
                  checked={enabled[setting.id]}
                  onChange={(event) =>
                    setEnabled((current) => ({
                      ...current,
                      [setting.id]: event.target.checked,
                    }))
                  }
                  aria-label={setting.label}
                />
              </label>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Segurança</span>
            <h2>Controles ativos</h2>
          </div>
          <ShieldCheck size={20} aria-hidden />
        </div>
        <ul className="check-list">
          <li>Headers HTTP configurados no Next.js</li>
          <li>Variáveis públicas documentadas em `.env.example`</li>
          <li>Sem credenciais hardcoded</li>
          <li>Service worker com cache controlado</li>
        </ul>
      </section>
    </div>
  );
}
