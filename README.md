# Flappy Bird com Gestos

Aplicação web profissional de portfólio que transforma um Flappy Bird controlado por gestos em uma experiência moderna com Next.js, dashboard inteligente, PWA, SEO técnico, observabilidade e deploy pronto para Vercel.

Desenvolvido por [Matheus Siqueira](https://www.matheussiqueira.dev)  
LinkedIn: [matheussiqueira-dev](https://www.linkedin.com/in/matheussiqueira-dev)

## Visão Geral

O projeto original é uma engine desktop em Python com Pygame, OpenCV e MediaPipe para controle por gestos via webcam. A versão atual preserva essa engine local e adiciona uma aplicação web completa para apresentação pública, validação técnica e evolução futura.

Principais entregas:

- Landing page responsiva com identidade visual própria
- Demo jogável em Canvas no navegador
- Dashboard inteligente com KPIs, tendências, comparativos, alertas e insights
- API versionada para dados do dashboard
- Perfil, configurações, página institucional, sidebar, topbar e rodapé
- PWA instalável com service worker, manifesto, ícones e fallback offline
- SEO técnico com metadata, canonical, Open Graph, Twitter Card, sitemap, robots e structured data
- Vercel Analytics, Speed Insights, GA4 opcional e logs estruturados
- Headers de segurança, health check e CI de qualidade

## Arquitetura

```text
Usuário
  -> Next.js App Router
  -> Landing / Play / Dashboard / Settings / About
  -> Analytics Provider
  -> Vercel Analytics, Speed Insights e GA4 opcional

Dashboard
  -> src/lib/dashboard-data.ts
  -> /api/dashboard
  -> Componentes analíticos desacoplados

Observabilidade
  -> src/lib/observability.ts
  -> /api/health
  -> logs estruturados
  -> ERROR_WEBHOOK_URL opcional

Engine original
  -> main.py
  -> hand_tracking.py
  -> gesture_mapping.py
  -> game_logic.py
  -> config.py
```

## Stack

Web:

- Next.js App Router
- React
- TypeScript strict
- Canvas API
- Lucide React
- Vercel Analytics
- Vercel Speed Insights
- PWA com service worker

Engine local:

- Python
- Pygame
- OpenCV
- MediaPipe Hands
- NumPy

## Estrutura do Projeto

```text
src/
  app/                    Rotas, metadata, APIs, manifest, sitemap e páginas
  components/             Shell, dashboard, demo canvas, gráficos e UI
  lib/                    Constantes, SEO, analytics, dados e observabilidade
public/
  icons/                  Ícones PWA
  sw.js                   Service worker
docs/
  AUDIT.md                Diagnóstico técnico e decisões
.github/workflows/
  quality.yml             Quality gate para GitHub
main.py                   Entrada da engine Python
hand_tracking.py          Rastreamento de mão
gesture_mapping.py        Interpretação de gestos
game_logic.py             Física e renderização Pygame
config.py                 Configurações locais
```

## Execução Web Local

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

Validações recomendadas:

```bash
npm run typecheck
npm run lint
npm run build
npm run verify
npm run audit
```

Em PowerShell com política restritiva, use `npm.cmd`:

```bash
npm.cmd run build
```

## Execução da Engine Python

Recomendado: Python 3.10 a 3.12 para melhor compatibilidade com MediaPipe.

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Controles principais:

- `M`: alternar modo discreto/contínuo
- `D`: alternar debug
- `C`: mostrar ou ocultar preview da câmera
- `P`: pausar
- `R`: reiniciar
- `ESC` ou `Q`: sair

## Variáveis de Ambiente

Copie `.env.example` para `.env.local` quando precisar configurar integrações.

```bash
NEXT_PUBLIC_SITE_URL=https://flappy-bird-gestos.vercel.app
NEXT_PUBLIC_GA_ID=
ERROR_WEBHOOK_URL=
```

`NEXT_PUBLIC_GA_ID` é opcional para GA4. `ERROR_WEBHOOK_URL` é opcional e permite encaminhar erros server-side para uma ferramenta externa.

## APIs

`GET /api/health`

Retorna status operacional sem expor segredos:

```json
{
  "status": "ok",
  "service": "flappy-bird-gestos",
  "runtime": "nextjs"
}
```

`GET /api/dashboard`

Retorna o contrato atual do dashboard:

```json
{
  "schemaVersion": "2026-05-30",
  "source": "mock",
  "kpis": [],
  "trends": [],
  "alerts": []
}
```

## Deploy na Vercel

O projeto está preparado para deploy zero-config.

1. Importe o repositório na Vercel.
2. Framework preset: Next.js.
3. Install command: `npm install`.
4. Build command: `npm run build`.
5. Configure `NEXT_PUBLIC_SITE_URL` com a URL final.
6. Opcionalmente configure `NEXT_PUBLIC_GA_ID` e `ERROR_WEBHOOK_URL`.
7. Publique.

Via CLI:

```bash
npm install -g vercel
vercel
vercel --prod
```

## Qualidade, Segurança e Observabilidade

Implementado:

- TypeScript strict
- ESLint com Core Web Vitals
- Build limpo com Next.js
- GitHub Actions para typecheck, lint, build e compile Python
- Content Security Policy
- HSTS, Referrer Policy, X-Frame-Options e Permissions Policy
- Health check com logs estruturados
- Vercel Analytics e Speed Insights
- GA4 opcional
- Vercel Insights ativado apenas no runtime Vercel, evitando erros `/_vercel` em builds locais
- Error webhook opcional
- Service worker com cache de navegação e proteção para APIs
- Auditoria técnica em `docs/AUDIT.md`

## Roadmap Futuro

- Persistir eventos reais em banco analítico
- Integrar MediaPipe Tasks Vision no navegador
- Criar leaderboard online
- Adicionar testes E2E completos com Playwright
- Exportar eventos de analytics para warehouse
- Adicionar error tracking dedicado via Sentry, Datadog ou similar

## Créditos Permanentes

Desenvolvido por [Matheus Siqueira](https://www.matheussiqueira.dev).

Este crédito faz parte do produto e deve permanecer visível, clicável, responsivo e integrado ao design em versões futuras.

## Licença

MIT. Consulte [LICENSE](LICENSE).

Autoria: Matheus Siqueira
Website: https://www.matheussiqueira.dev/
