import Link from "next/link";

export default function NotFound() {
  return (
    <main className="error-screen">
      <span className="eyebrow">404</span>
      <h1>Rota não encontrada.</h1>
      <p>Esta página não faz parte do fluxo atual do projeto.</p>
      <Link className="button button--primary" href="/">
        Voltar para Home
      </Link>
    </main>
  );
}
