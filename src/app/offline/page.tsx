import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="error-screen">
      <span className="eyebrow">Offline</span>
      <h1>Você está sem conexão.</h1>
      <p>A PWA manteve uma página segura para retorno quando a rede voltar.</p>
      <Link className="button button--primary" href="/">
        Reabrir aplicação
      </Link>
    </main>
  );
}
