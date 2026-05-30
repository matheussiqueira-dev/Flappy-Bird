import { AppShell } from "@/components/app-shell";
import { SettingsPanel } from "@/components/settings-panel";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata(
  "Perfil e configurações",
  "Perfil do desenvolvedor, configurações do runtime e controles de segurança.",
  "/settings",
);

export default function SettingsPage() {
  return (
    <AppShell title="Perfil e configurações" eyebrow="Admin">
      <SettingsPanel />
    </AppShell>
  );
}
