# Flappy Bird com Gestos

Aplicação profissional de portfólio que une uma engine original em Python para controle por gestos com uma experiência web moderna em Next.js, pronta para deploy na Vercel.

Desenvolvido por [Matheus Siqueira](https://www.matheussiqueira.dev)  
LinkedIn: [matheussiqueira-dev](https://www.linkedin.com/in/matheussiqueira-dev)

## Visão Geral

O projeto original é um Flappy Bird controlado por gestos usando webcam, OpenCV, MediaPipe e Pygame. Esta versão preserva essa engine local e adiciona uma camada web completa para apresentação pública:

- Landing page profissional
- Demo jogável em canvas no navegador
- Dashboard inteligente com KPIs, tendências, alertas e insights
- Sidebar, topbar, perfil e configurações
- PWA instalável com service worker e modo offline
- SEO técnico com sitemap, robots, Open Graph e structured data
- Vercel Analytics, Speed Insights e Google Analytics opcional
- Headers de segurança e health check
- Documentação de arquitetura, execução e deploy

## Arquitetura

```text
Flappy-Bird/
├── src/
│   ├── app/                  # Next.js App Router
│   ├── components/           # UI, dashboard, game canvas e shell
│   └── lib/                  # Constantes, SEO, analytics e mock data
├── public/                   # Service worker e ícones PWA
├── docs/                     # Auditoria técnica
├── main.py                   # Entrada da aplicação Python original
├── hand_tracking.py          # Rastreamento de mão com MediaPipe
├── gesture_mapping.py        # Conversão de gestos em comandos
├── game_logic.py             # Engine Pygame
├── config.py                 # Configurações locais
├── requirements.txt          # Dependências Python
├── package.json              # Aplicação web
├── next.config.ts            # Next.js e headers de segurança
└── vercel.json               # Configuração de deploy Vercel
```

## Stack

Web:

- Next.js App Router
- React
- TypeScript strict
- Canvas API
- Vercel Analytics
- Vercel Speed Insights
- PWA com service worker

Engine original:

- Python
- Pygame
- OpenCV
- MediaPipe Hands
- NumPy

## Execução Local da Aplicação Web

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
npm run verify:browser
```

## Execução Local da Engine Python

Recomendado: Python 3.10 a 3.12 para melhor compatibilidade com MediaPipe.

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Controles principais da versão Python:

- `M`: alternar modo discreto/contínuo
- `D`: alternar debug
- `C`: mostrar ou ocultar preview da câmera
- `P`: pausar
- `R`: reiniciar
- `ESC` ou `Q`: sair

## Variáveis de Ambiente

Copie `.env.example` para `.env.local` quando precisar sobrescrever valores públicos.

```bash
NEXT_PUBLIC_SITE_URL=https://flappy-bird-gestos.vercel.app
NEXT_PUBLIC_GA_ID=
```

`NEXT_PUBLIC_GA_ID` é opcional. Quando definido, o projeto envia eventos também para GA4.

## Deploy na Vercel

O projeto está preparado para deploy zero-config na Vercel.

1. Importe o repositório na Vercel.
2. Framework preset: Next.js.
3. Build command: `npm run build`.
4. Install command: `npm install`.
5. Configure `NEXT_PUBLIC_SITE_URL` com a URL final do projeto.
6. Publique.

Também é possível usar a Vercel CLI:

```bash
npm install -g vercel
vercel
vercel --prod
```

## Rotas Web

- `/`: landing page e visão de produto
- `/play`: demo jogável
- `/dashboard`: dashboard inteligente
- `/settings`: perfil e configurações
- `/about`: página institucional
- `/api/health`: health check
- `/offline`: fallback PWA

## SEO, PWA e Observabilidade

Implementado:

- Metadata centralizada
- Canonical URLs
- Open Graph image dinâmica
- Twitter Card
- Structured data `SoftwareApplication`
- `sitemap.xml`
- `robots.txt`
- `manifest.webmanifest`
- Ícones PWA
- Service worker
- Página offline
- Vercel Analytics
- Vercel Speed Insights
- Google Analytics opcional
- Tracking desacoplado em `src/lib/analytics.ts`

## Segurança

Implementado:

- `Content-Security-Policy`
- `Referrer-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Permissions-Policy`
- Sem credenciais hardcoded
- Variáveis públicas documentadas
- Health check sem exposição de dados sensíveis

## Dashboard Inteligente

O dashboard usa mock data isolado em `src/lib/mock-data.ts`, preparado para futura troca por:

- Banco de dados analítico
- Eventos do Vercel Analytics
- GA4
- API própria
- Pipeline de visão computacional

Indicadores atuais:

- Sessões demo
- FPS médio
- Confiança gestual
- Quedas detectadas
- Tendência de performance
- Estabilidade
- Alertas e recomendações

## Auditoria Técnica

O diagnóstico completo está em [docs/AUDIT.md](docs/AUDIT.md).

Resumo dos principais problemas encontrados:

- Projeto original não era uma aplicação web
- Não havia `package.json`, build web, rotas, SEO, PWA ou Vercel config
- Não havia dashboard, analytics ou observabilidade
- README anterior tinha problemas de apresentação e link de clone incorreto
- Configuração de assets podia ser prejudicada pelo `.gitignore`
- Engine Python dependia de câmera e bibliotecas nativas, sem compatibilidade direta com serverless

## Roadmap

- Persistir eventos reais em banco analítico
- Integrar hand tracking no navegador com MediaPipe Tasks Vision
- Criar leaderboard online
- Adicionar testes E2E com Playwright
- Criar pipeline CI/CD com preview deployments
- Publicar métricas reais de Core Web Vitals

## Créditos Permanentes

Desenvolvido por [Matheus Siqueira](https://www.matheussiqueira.dev).

Este crédito faz parte do produto e deve permanecer visível, clicável e integrado ao design em versões futuras.

## Licença

MIT. Consulte [LICENSE](LICENSE).
