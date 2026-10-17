"use client";

import { Camera, Gauge, ShieldCheck, SlidersHorizontal } from "lucide-react";

import {
  getPreferencesStore,
  type Preferences,
} from "@/features/preferences/preferences-store";
import { usePreferences } from "@/features/preferences/use-preferences";

const runtimeSettings: Array<{
  id: keyof Preferences;
  label: string;
  description: string;
  icon: typeof Camera;
}> = [
  {
    id: "gestures",
    label: "Controle por gestos",
    description:
      "Permite ativar a câmera na demo. O processamento é local; desligado, a câmera é liberada na hora.",
    icon: Camera,
  },
  {
    id: "analytics",
    label: "Eventos de produto",
    description:
      "Envia page views, partidas e game over para Vercel Analytics e GA4. Desligado, nada é enviado.",
    icon: Gauge,
  },
];

export function SettingsPanel() {
  const preferences = usePreferences();

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
            <span className="eyebrow">Privacidade</span>
            <h2>Preferências</h2>
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
                  checked={preferences[setting.id]}
                  onChange={(event) => getPreferencesStore().set(setting.id, event.target.checked)}
                  aria-label={setting.label}
                />
              </label>
            );
          })}
        </div>
        <p className="settings-note">Preferências salvas só neste navegador.</p>
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
