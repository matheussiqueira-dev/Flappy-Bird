"use client";

import { RotateCcw } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="error-screen">
      <span className="eyebrow">Falha inesperada</span>
      <h1>Algo saiu do eixo.</h1>
      <p>A aplicação capturou o erro e pode tentar renderizar novamente.</p>
      <button className="button button--primary" type="button" onClick={reset}>
        <RotateCcw size={16} aria-hidden />
        Tentar novamente
      </button>
    </main>
  );
}
