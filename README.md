# Flappy Bird com Gestos

Aplicação web profissional de portfólio que transforma um Flappy Bird controlado por gestos em uma experiência moderna com Next.js, dashboard inteligente, PWA, SEO técnico, observabilidade e deploy pronto para Vercel.

Desenvolvido por [Matheus Siqueira](https://www.matheussiqueira.dev)  
LinkedIn: [matheussiqueira-dev](https://www.linkedin.com/in/matheussiqueira-dev)

## Visão Geral

O projeto original é uma engine desktop em Python com Pygame, OpenCV e MediaPipe para controle por gestos via webcam. A versão atual preserva essa engine local e adiciona uma aplicação web completa para apresentação pública, validação técnica e evolução futura.

Principais entregas:

- Landing page responsiva com identidade visual própria
- Demo jogável em Canvas no navegador, com física em timestep fixo (mesma velocidade em 60 Hz, 144 Hz ou com quedas de FPS)
- Controle por gestos direto no navegador com MediaPipe Hand Landmarker, em dois modos: "Abrir e fechar" (cada abertura da mão é um flap) e "Altura da mão" (o pássaro acompanha a mão). Sem instalar nada e sem enviar imagens para servidor
- Preferências reais em `/settings`: desligar o controle por gestos e opt-out de analytics (Vercel Analytics, Speed Insights e GA4)
- Telemetria real de partidas no dashboard (pontuação, duração, input usado), separada do dataset de amostra
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

Demo web (src/features)
  -> game/domain       engine puro e testável (física, colisão, eventos)
  -> game/render       renderer canvas 2D
  -> gesture/domain    classificação de pose e mapeamento gesto -> flap
  -> gesture/infra     câmera + MediaPipe Tasks Vision (WASM servido pela própria origem)
  -> telemetry         repositório validado de sessões + agregações

Dashboard
  -> src/lib/dashboard-data.ts
  -> /api/dashboard
  -> Componentes analíticos desacoplados

Observabilidade
  -> src/lib/http/route-handler.ts (request ID, logs, envelope de erro)
  -> src/lib/env.ts (variáveis validadas)
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
- MediaPipe Tasks Vision (hand tracking no navegador)
- Vitest
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
  features/               Domínio da demo: game, gesture e telemetry (com testes)
  lib/                    Constantes, SEO, analytics, env, HTTP, dados e observabilidade
public/
  icons/                  Ícones PWA
  sw.js                   Service worker
docs/
  AUDIT.md                Diagnóstico técnico e decisões
  EVOLUTION.md            Documento master de evolução (arquitetura, produto e roadmap)
scripts/
  copy-mediapipe-wasm.mjs Copia o runtime WASM do MediaPipe para public/ (predev/prebuild)
  verify-browser.mjs      Verificação ponta a ponta com Playwright
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
npm test
npm run build
npm run verify
npm run audit
```

`npm run verify:browser` e `npm run verify:gestures` rodam as verificações ponta a ponta com Playwright contra um servidor já iniciado (`APP_URL`, padrão `http://127.0.0.1:3000`). Na primeira vez, instale o navegador com `npx playwright install --only-shell chromium`. O `verify:gestures` usa a câmera falsa do Chromium para testar câmera, modelo e detecção sem webcam.

O controle por gestos precisa de HTTPS ou `localhost` (exigência do navegador para câmera). O runtime WASM do MediaPipe é copiado para `public/mediapipe/` automaticamente antes de `dev` e `build`; o modelo de mão (~7,8 MB) é baixado do bucket oficial do Google só quando o usuário ativa os gestos.

Em PowerShell com política restritiva, use `npm.cmd`:

```bash
npm.cmd run build
```

## Execução da Engine Python

Recomendado: Python 3.10 a 3.12. O `requirements.txt` fixa `mediapipe<0.10.30`, porque versões mais novas removeram a API `mp.solutions` usada pela engine.

No Windows, o MediaPipe não carrega os próprios modelos quando o caminho do ambiente virtual tem acentos (por exemplo, `Programação`). Nesse caso, crie o venv num caminho só com ASCII, como `C:\Users\voce\.venvs\flappy-bird`.

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

### Rodada local de 17/10/2026

Com os gestos ligados, flap e reinício usam exclusivamente a mão; toque e teclado
continuam disponíveis na demo manual quando a câmera está desligada. Perder a mão
por 1 s pausa a partida; mostre a mão, feche e abra para retomar.

Com a câmera ligada, o jogo usa uma física assistida (`GESTURE_GAME_CONFIG`):
gravidade e queda mais suaves, vão de 240 px, canos mais lentos e espaçados, e o
teto não encerra a partida. O recorde do modo gestual é separado do clássico. As
instruções de jogo ficam no painel "Como jogar com gestos", dentro do console do
jogo. Permissão da
câmera continua sendo concedida pela interface do navegador. O botão de pausa é
um controle de segurança; retomar durante a sessão gestual usa a mão.

O cancelamento libera câmera e modelo, inclusive quando a inicialização termina
tarde. A engine Python e as rotas existentes foram preservadas.

Documentação atual: [plano](MASTER_EVOLUTION_PLAN.md),
[diagnóstico](REPOSITORY_TECHNICAL_AUDIT.md),
[pesquisa](GITHUB_RESEARCH_AND_FEATURES.md),
[prioridades](ROADMAP_AND_SKILLS.md),
[validação e limites](VALIDATION_REPORT.md) e [changelog](CHANGELOG.md).

Validação em webcam física e publicação Vercel permanecem pendentes. Testes com
câmera sintética não demonstram precisão com uma mão humana.

### Próximas evoluções

- Persistir eventos reais em banco analítico
- Criar leaderboard online
- Adicionar testes E2E completos com Playwright
- Inferência do hand tracking num Web Worker
- Ver roadmap detalhado em [docs/EVOLUTION.md](docs/EVOLUTION.md)
- Exportar eventos de analytics para warehouse
- Adicionar error tracking dedicado via Sentry, Datadog ou similar

## Créditos Permanentes

Desenvolvido por [Matheus Siqueira](https://www.matheussiqueira.dev).

Este crédito faz parte do produto e deve permanecer visível, clicável, responsivo e integrado ao design em versões futuras.

## Licença

MIT. Consulte [LICENSE](LICENSE).

Autoria: Matheus Siqueira
Website: https://www.matheussiqueira.dev/
