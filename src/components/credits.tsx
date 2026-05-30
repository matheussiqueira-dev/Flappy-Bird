import { ExternalLink } from "lucide-react";

import { developer } from "@/lib/constants";

type CreditsProps = {
  compact?: boolean;
};

export function Credits({ compact = false }: CreditsProps) {
  return (
    <a
      className={compact ? "credits credits--compact" : "credits"}
      href={developer.portfolio}
      target="_blank"
      rel="noreferrer"
      aria-label={`${developer.credit} - abrir portfólio`}
    >
      <span>{developer.credit}</span>
      {!compact ? <strong>{developer.portfolio}</strong> : null}
      <ExternalLink aria-hidden size={14} />
    </a>
  );
}
