import { CheckCircle2, CircleAlert, Code2, DatabaseZap } from "lucide-react";

import { productionSignals } from "@/lib/constants";

export function StatusGrid() {
  return (
    <section className="status-grid" aria-label="Status de produção">
      {productionSignals.map((signal, index) => {
        const Icon = [CheckCircle2, Code2, DatabaseZap, CircleAlert][index % 4];
        return (
          <article className="status-card" key={signal}>
            <Icon size={18} aria-hidden />
            <strong>{signal}</strong>
            <span>ativo</span>
          </article>
        );
      })}
    </section>
  );
}
