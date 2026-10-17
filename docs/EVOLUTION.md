# Documento Master de Evolução

**Projeto:** Flappy Bird com Gestos
**Responsável:** Matheus Siqueira · [matheussiqueira.dev](https://www.matheussiqueira.dev)
**Data:** 15 de outubro de 2026
**Branch:** `feat/enterprise-evolution`

Este documento registra o diagnóstico, as decisões e o que foi implementado nesta rodada, e serve de roteiro para as próximas. Cada item diz se está **implementado** (no código e verificado) ou **proposto** (com guia de implementação). Ele complementa a [auditoria anterior](AUDIT.md).

---

## 1. Sumário executivo

### Ponto de partida

O repositório tinha duas superfícies:

- **Engine Python** (Pygame, OpenCV, MediaPipe): o produto original, com controle por gestos via webcam. Roda só localmente.
- **Aplicação web** (Next.js 16, React 19, TypeScript strict): landing page, demo em canvas, dashboard, PWA, SEO, headers de segurança, health check e CI.

A camada web estava bem montada para um portfólio, mas o diagnóstico encontrou cinco problemas que um avaliador técnico notaria:

| # | Problema | Impacto |
|---|----------|---------|
| 1 | **A proposta central não existia na web.** "Controle por gestos" estava no nome, mas a demo web só aceitava clique e teclado. | O visitante não vê o diferencial do produto. |
| 2 | **Física dependente da taxa de quadros.** O loop avançava por frame com delta limitado a `[0.6, 2]`: a 144 Hz o jogo rodava cerca de 44% mais rápido, e abaixo de 30 FPS ficava em câmera lenta. | O jogo muda de dificuldade conforme o monitor. |
| 3 | **Dashboard 100% simulado, apresentado como métrica.** "1.284 sessões" e "FPS médio 58,7" eram constantes. | Risco de credibilidade com CTOs, que identificam dados falsos de imediato. |
| 4 | **Componente monolítico.** `game-demo.tsx` (430 linhas) misturava física, colisão, renderização, input, persistência e analytics, sem nenhum teste. | Impossível evoluir ou testar a lógica do jogo isoladamente. |
| 5 | **Dependências vulneráveis.** `next` com vulnerabilidade crítica e `postcss` travado numa versão vulnerável pelo próprio `overrides` do projeto. | Bloqueio em qualquer auditoria de segurança. |

Também apareceram bugs menores: o layout de `/play` quebrado (o jogo espremido numa coluna de cerca de 156 px), o canvas deformado no celular, a tecla Espaço sequestrando o scroll da landing page e um evento de analytics disparado a cada flap.

### Estado atual

| Dimensão | Antes | Depois |
|----------|-------|--------|
| Controle por gestos na web | Inexistente | MediaPipe Hand Landmarker no navegador, com GPU/WebGL e fallback para CPU |
| Física | Por frame (varia com o monitor) | Timestep fixo de 60 Hz com limite anti-travamento |
| Arquitetura da demo | 1 componente de 430 linhas | Camadas `domain` / `render` / `infrastructure` / `ui` em `src/features` |
| Testes automatizados | 0 | 39 testes (Vitest) cobrindo engine, gestos, telemetria, env e API |
| Dados do dashboard | Só simulados, sem rótulo | Telemetria real por navegador + dataset de amostra rotulado |
| API | Try/catch duplicado, formatos de erro distintos | Handler único com request ID, logs e envelope de erro padrão |
| Variáveis de ambiente | Lidas cruas, GA ID interpolado num script inline sem validação | Validadas e com fallback seguro |
| Vulnerabilidades de produção | 1 crítica, 3 altas, 2 moderadas | **0** |
| CI | Node 22, sem testes | Node 24, testes, auditoria de dependências, jobs web e Python separados |

---

## 2. Skills e capacidades ativadas

A seleção seguiu o diagnóstico, não uma lista fixa. Para ser transparente, a tabela separa as skills carregadas formalmente das capacidades nativas usadas.

| Skill / capacidade | Tipo | Por que foi usada | Impacto na entrega |
|--------------------|------|-------------------|--------------------|
| **`vercel:nextjs`** | Skill carregada | O projeto está no Next.js 16, em que convenções mudaram (`proxy.ts`, RSC, regras do React Compiler). | Fronteiras Server/Client respeitadas: `DashboardOverview` segue Server Component, e só `SessionInsights` e `GameDemo` são Client Components. |
| **Análise de código e arquitetura** | Capacidade nativa | Ler o código inteiro antes de mudar qualquer coisa (exigência do `AGENTS.md`). | Achou os 5 problemas acima, inclusive 2 bugs de layout anteriores a este trabalho. |
| **Design de sistemas** | Capacidade nativa | Separar engine, renderer, input e telemetria com portas bem definidas. | O engine não conhece React, canvas nem câmera; gestos são só mais uma `InputSource`. |
| **Visão de produto** | Capacidade nativa | Reposicionar o projeto e decidir o que vale construir agora. | Prioridade ao gesto no navegador (o diferencial) e a dados honestos no dashboard. |
| **Engenharia de performance e UI** | Capacidade nativa | Timestep fixo, carregamento sob demanda, canvas em alta densidade de pixels. | MediaPipe fora do bundle inicial; jogo idêntico em qualquer taxa de atualização. |
| **Navegador integrado + Playwright** | Ferramentas | Ver o resultado em vez de supor. | Encontrou o layout quebrado de `/play`, o canvas deformado no mobile e a telemetria do Google bloqueada pelo CSP. |
| **Redação técnica** | Capacidade nativa | Este documento e o README. | Roteiro com status honesto de cada item. |

---

## 3. Melhorias implementadas

### 3.1 Arquitetura da demo web

Estrutura nova em `src/features`, com dependências apontando só para dentro (o domínio não importa nada de fora):

```text
src/features/
  game/
    domain/        types.ts, config.ts, engine.ts (+ engine.test.ts)   puro, sem DOM
    render/        canvas-renderer.ts                                   só desenha
  gesture/
    domain/        hand-pose.ts, gesture-mapper.ts (+ testes)           puro
    infrastructure/hand-tracker.ts                                      câmera + MediaPipe
    ui/            use-gesture-control.ts                               hook React
  telemetry/
    domain/        session.ts (agregações)                              puro
    infrastructure/session-repository.ts                                localStorage validado
```

O componente `game-demo.tsx` virou uma camada fina, que liga input, engine, renderer e efeitos colaterais. O engine devolve **eventos de domínio** (`started`, `flapped`, `scored`, `game-over`), e um único `handleEvents` decide o que persistir, rastrear e gravar. Para adicionar um efeito novo, como um som ao pontuar ou o envio de placar, basta reagir a um evento, sem tocar na física.

### 3.2 Timestep fixo

`advance(state, elapsedMs)` acumula tempo real e executa ticks de 1000/60 ms. O mesmo intervalo de tempo produz a mesma trajetória em qualquer monitor. Duas salvaguardas:

- **Limite de 5 ticks por frame**: depois de um travamento (aba em segundo plano, GC longo), o jogo não tenta recuperar segundos de simulação de uma vez.
- **Tolerância de ponto flutuante**: os testes mostraram que subtrair `1000/60` repetidamente fazia o loop perder um tick de vez em quando. Corrigido com um epsilon de 1e-6 ms.

### 3.3 Controle por gestos no navegador

- **Pose da mão:** `classifyHand` compara a distância da ponta e da articulação de cada dedo até o pulso. A engine Python compara só o eixo Y, que falha com a mão inclinada; a distância não depende da rotação (há teste para isso). Três ou mais dedos estendidos contam como mão aberta, até um como fechada, e o meio-termo é "incerto", uma histerese que evita oscilação.
- **Mapeamento:** `GestureMapper` reproduz o modo discreto do Python (abrir a mão depois de fechá-la gera um flap), exigindo 2 leituras iguais para trocar de pose e com cooldown de 180 ms.
- **Infraestrutura:** `startHandTracker` abre câmera e modelo em paralelo, tenta GPU (WebGL) e cai para CPU, converte erros de câmera em códigos tipados (`permission-denied`, `no-camera`, `camera-busy`, `unsupported`, `model-failed`) e libera câmera e modelo ao parar ou desmontar. Falhas depois do início (câmera desconectada ou exceção na inferência) desligam o rastreamento e aparecem na UI, em vez de deixar a câmera ligada com o loop parado.
- **Privacidade:** a inferência roda 100% no navegador. O WASM é servido pela própria origem, copiado do pacote instalado por `scripts/copy-mediapipe-wasm.mjs`. O MediaPipe tenta enviar telemetria de uso para `odml.pa.googleapis.com` e não oferece opção pública para desligar; **o CSP bloqueia esse envio de propósito**.
- **Peso:** a biblioteca (152 KB de JS), o WASM (~11 MB) e o modelo (~7,8 MB) só são baixados quando o usuário clica em "Jogar com gestos". O chunk do MediaPipe não aparece no HTML de `/play`.
- **UI:** preview espelhado da câmera com o esqueleto da mão desenhado por cima, um selo de pose e FPS, e mensagens de erro acionáveis.

### 3.4 Telemetria real e dashboard honesto

- Cada partida grava `{ id, endedAt, durationMs, score, flaps por input }` em `localStorage`, limitado a 50 registros.
- **Tudo que é lido do storage é validado**: registros adulterados, corrompidos ou de versões antigas são descartados. Sem storage (modo privado, cota cheia), o repositório funciona em memória.
- O dashboard abre com **"Suas partidas"**: partidas, melhor pontuação, média com tendência, tempo jogado, percentual de flaps por gesto e um gráfico das últimas 12 pontuações. Tem estado vazio com chamada para jogar, botão para limpar os dados e sincronização entre abas (`useSyncExternalStore` + evento `storage`).
- O dataset simulado continua, mas com o rótulo **"Dataset de amostra"** e a explicação de que ele é o contrato para dados futuros.
- O evento `game_flap`, disparado a cada flap, foi removido: gerava dezenas de eventos por partida no Vercel Analytics. Os dados agregados agora vão no `game_over`.

### 3.5 Segurança e confiabilidade

- **Dependências:** `next` 16.2.6 → 16.3.8 (fecha a vulnerabilidade crítica sem trocar de versão principal); override do `postcss` 8.5.15 → 8.5.28; `npm audit fix` nas transitivas. Produção: **0 vulnerabilidades**. Restam 5 altas só em ferramentas de desenvolvimento (`braces`, pela cadeia do `eslint-config-next`), sem correção que não exija rebaixar a versão principal. Por isso o script `audit` passou a usar `--omit=dev`.
- **`src/lib/env.ts`:** o `NEXT_PUBLIC_GA_ID` era interpolado direto num `<script>` inline; agora precisa casar com `^G-[A-Z0-9]{4,16}$`. A URL do site aceita só HTTPS (ou `localhost`), e o webhook de erros só HTTPS.
- **`src/lib/http/route-handler.ts`:** request ID propagado no header `X-Request-Id`, logs estruturados de início e fim com latência e status, `ApiError` para erros 4xx com mensagem pública, e erros inesperados viram 500 com mensagem genérica (há teste garantindo que detalhes internos não vazam).
- **CSP:** acrescentados só `'wasm-unsafe-eval'` (compila WebAssembly, mas não libera `eval` de JS) e o host do modelo. `'unsafe-eval'` continua restrito ao modo de desenvolvimento.
- **Service worker:** `/mediapipe/` fica fora do cache-first. Como o WASM não tem hash no nome, o cache poderia servir um runtime antigo junto de um bundle novo. Versão do cache incrementada para v3.

### 3.6 UX e acessibilidade

- Espaço e seta para cima só controlam o jogo quando ele ocupa ao menos 50% da tela; antes, Espaço bloqueava o scroll da landing page inteira.
- Teclas ignoradas quando o foco está num botão ou campo, o que evitava flap duplo ao apertar Espaço num botão focado.
- Pausa automática ao trocar de aba.
- Status em português ("Pronto", "Jogando", "Pausado", "Fim de jogo"), botão de pausa com rótulo dinâmico, `aria-pressed` no botão de gestos e erros com `role="alert"`.
- Canvas renderizado com `devicePixelRatio` (até 2x), nítido em telas Retina.
- **Bugs de layout anteriores corrigidos:** o `.panel` com `span 4` dentro de `.workspace-stack` criava 4 colunas implícitas e espremia o jogo em `/play`; no mobile, o viewport 4:3 esticava o canvas 16:9.

### 3.7 CI/CD

`.github/workflows/quality.yml` foi dividido em dois jobs paralelos. O job **web** (Node 24) roda typecheck, lint, testes, build e auditoria de produção; o job **python** (3.12) compila a engine. Também ganhou `concurrency` para cancelar execuções obsoletas. O `main` não tem branch protection, então a troca de nomes dos jobs não bloqueia merges.

---

## 4. Propostas (não implementadas) com guias táticos

Ordenadas por relação entre valor e esforço.

### P1. Reposicionamento de produto: de jogo a plataforma de interação sem toque

**Tese:** o Flappy Bird é a vitrine; o ativo de verdade é o pipeline `câmera → pose → comando`, que roda no navegador sem instalação e sem enviar imagens a servidor. Esse pipeline atende mercados com demanda real:

| Segmento | Caso de uso | Por que o pipeline serve |
|----------|-------------|--------------------------|
| Saúde e reabilitação | Exercícios de mão gamificados para fisioterapia, com registro de amplitude e repetições | Telemetria por sessão já existe; o dado clínico seria `extendedFingers` ao longo do tempo |
| Varejo e eventos | Quiosques e vitrines interativas sem toque | Roda num navegador comum, sem hardware dedicado |
| Acessibilidade | Controles alternativos para quem não usa mouse ou teclado | `InputSource` já trata gesto como input de primeira classe |
| Educação | Atividades motoras para crianças | Funciona em Chromebooks e tablets |

**Implementação:** extrair `src/features/gesture` como pacote (`@flappy-gestures/gesture-input`), com a API `startHandTracker` + `GestureMapper` + `onCommand`. A demo passa a consumir o pacote como qualquer cliente. **Justificativa de negócio:** transforma um projeto de portfólio numa tese de produto defensável numa entrevista com CEO.

### P2. Ingestão de eventos reais no servidor (dashboard agregado)

Hoje a telemetria real fica só no navegador de cada pessoa. O próximo passo é agregar entre usuários.

- **Banco:** Postgres pela Vercel Marketplace (Neon), provisionado com `vercel integration`. A Vercel não oferece mais Postgres próprio.
- **Rota:** `POST /api/events`, usando o mesmo `createRouteHandler`, com validação estrita e limite de tamanho (o código está na seção 5.4).
- **Proteção contra abuso:** limitar requisições com Vercel Firewall (regra de rate limit em `/api/events`), além do teto de tamanho do payload.
- **Privacidade:** nenhum dado pessoal. Usar um ID anônimo por navegador, gerado no cliente, e manter a política "nenhuma imagem sai do dispositivo".
- **Dashboard:** `getDashboardSnapshot` passa a ler agregados (`source: "live"`) e mantém o contrato `DashboardSnapshot` atual, então os componentes não mudam.

### P3. Leaderboard global

Depende de P2. Uma tabela `scores` com índice em `(score DESC, created_at)`. O cliente envia pontuação e duração. **Validação antitrapaça no servidor:** recusar pontuação incompatível com a duração. Pelo engine, um cano a cada 96 ticks (1,6 s) dá um teto de cerca de `durationMs / 1600 + 1` pontos. Apelido opcional, moderado e limitado a 20 caracteres.

### P4. Modo contínuo (altura da mão)

A engine Python tem o modo em que a altura da mão define a altura do pássaro. **Implementação:** adicionar `centerY` ao `HandFrame` (média dos landmarks 0, 5, 9, 13 e 17, como em `_get_hand_center`); criar uma ação `steer(state, targetY)` no engine que interpola `birdY` (o Python usa suavização de 0.15 com zona morta de 0.02); oferecer um seletor de modo na UI. Os testes seguem o padrão dos já existentes.

### P5. CSP com nonce (remover `'unsafe-inline'`)

O `script-src` ainda tem `'unsafe-inline'`, necessário para os scripts inline do Next e do GA4. **Implementação:** gerar um nonce por requisição em `proxy.ts` (no Next 16, `middleware.ts` virou `proxy.ts`) e repassá-lo via header `x-nonce` ao `<Script nonce>`. **Trade-off:** páginas com nonce viram dinâmicas e perdem a renderização estática, então vale medir o impacto no TTFB antes de adotar.

### P6. Testes E2E de gestos com câmera falsa

Hoje o fluxo de gestos foi verificado até o carregamento do modelo (grafo do MediaPipe iniciado na GPU), mas não com a mão de verdade, porque o navegador de verificação bloqueia câmera. **Implementação:** Playwright com `--use-fake-device-for-media-stream --use-file-for-fake-video-capture=mao.y4m`, gravando um vídeo curto de mão abrindo e fechando, e checando que o status vira "Jogando" sem clique.

### P7. Engine Python

- Portar a classificação por distância ao pulso para `hand_tracking.py` (mesmo ganho de robustez).
- Migrar de `mp.solutions` para MediaPipe Tasks (`HandLandmarker`), o que remove a fixação `mediapipe<0.10.30` e libera Python 3.13+.
- Na inicialização, detectar caminho com caracteres não ASCII e mostrar uma mensagem clara, em vez do `FileNotFoundError` do MediaPipe.
- Adicionar `pytest` para `GestureMapper` e `TemporalFilter`.

### P8. Observabilidade dedicada

Trocar o webhook genérico por Sentry (SDK `@sentry/nextjs`) ou pelo dreno de logs da Vercel para Datadog. O `reportServerError` já centraliza o ponto de integração. No cliente, `error.tsx` deveria reportar o `digest` do erro.

---

## 5. Blocos de código críticos, por domínio

Os blocos 5.1 a 5.3 já estão aplicados no repositório; são os trechos centrais de cada camada. O 5.4 é a proposta P2 pronta para uso.

### 5.1 Engine: timestep fixo (`src/features/game/domain/engine.ts`)

```ts
export function advance(
  state: GameState,
  elapsedRealMs: number,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): GameEvent[] {
  if (!Number.isFinite(elapsedRealMs) || elapsedRealMs <= 0) {
    return [];
  }

  const maxBacklog = config.tickMs * config.maxTicksPerFrame;
  state.accumulatorMs = Math.min(state.accumulatorMs + elapsedRealMs, maxBacklog);

  const events: GameEvent[] = [];

  // A tolerância absorve o erro de ponto flutuante de 1000/60, que sem ela
  // descartaria um tick de vez em quando.
  while (state.accumulatorMs + TICK_EPSILON_MS >= config.tickMs) {
    state.accumulatorMs = Math.max(0, state.accumulatorMs - config.tickMs);
    events.push(...stepTick(state, config));
  }

  return events;
}
```

### 5.2 Gestos: pose estável com cooldown (`src/features/gesture/domain/gesture-mapper.ts`)

```ts
update({ pose, timestampMs }: GestureObservation): GestureOutput {
  if (pose === null || pose === "uncertain") {
    this.candidatePose = null;
    this.candidateFrames = 0;
    return { shouldFlap: false, stablePose: this.stablePose };
  }

  if (pose === this.candidatePose) {
    this.candidateFrames += 1;
  } else {
    this.candidatePose = pose;
    this.candidateFrames = 1;
  }

  if (this.candidateFrames < this.options.stableFrames || pose === this.stablePose) {
    return { shouldFlap: false, stablePose: this.stablePose };
  }

  const previous = this.stablePose;
  this.stablePose = pose;

  const opened = previous === "closed" && pose === "open";
  const cooledDown = timestampMs - this.lastFlapAt >= this.options.cooldownMs;
  const shouldFlap = opened && cooledDown;

  if (shouldFlap) {
    this.lastFlapAt = timestampMs;
  }

  return { shouldFlap, stablePose: this.stablePose };
}
```

### 5.3 API: handler padronizado (`src/lib/http/route-handler.ts`)

Uma rota inteira passa a ter três linhas:

```ts
export const GET = createRouteHandler("/api/dashboard", () =>
  jsonNoStore(getDashboardSnapshot()),
);
```

Todo erro sai no mesmo envelope:

```json
{ "error": { "code": "internal_error", "message": "Não foi possível processar a requisição.", "requestId": "…" } }
```

### 5.4 Proposta P2: ingestão de partidas (`src/app/api/events/route.ts`, ainda não criado)

Reaproveita o handler padrão e o validador de sessões que já existem. A única peça nova é a persistência, injetada como dependência:

```ts
import { ApiError, createRouteHandler, jsonNoStore } from "@/lib/http/route-handler";
import { parseSessions } from "@/features/telemetry/infrastructure/session-repository";
import { saveSession } from "@/server/sessions"; // repositório Postgres (a criar)

export const runtime = "nodejs";

const MAX_BODY_BYTES = 2_048;
/** Um cano a cada 96 ticks de 1000/60 ms: ~1,6 s por ponto no melhor caso. */
const MS_PER_POINT = 1_600;

export const POST = createRouteHandler("/api/events", async (request) => {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    throw new ApiError(413, "payload_too_large", "Evento grande demais.");
  }

  const body: unknown = await request.json().catch(() => {
    throw new ApiError(400, "invalid_json", "Corpo da requisição inválido.");
  });

  const [session] = parseSessions([body]);
  if (!session) {
    throw new ApiError(422, "invalid_session", "Formato de partida inválido.");
  }

  if (session.score > Math.floor(session.durationMs / MS_PER_POINT) + 1) {
    throw new ApiError(422, "implausible_score", "Pontuação incompatível com a duração.");
  }

  await saveSession(session);
  return jsonNoStore({ accepted: true }, { status: 202 });
});
```

---

## 6. Validação executada

| Verificação | Resultado |
|-------------|-----------|
| `npm run typecheck` | Sem erros |
| `npm run lint` (ESLint + regras do React Compiler) | Sem erros |
| `npm test` | 39 testes passando (4 arquivos) |
| `npm run build` (produção) | Sucesso; 14 rotas (12 estáticas, 2 dinâmicas) |
| `npm run verify:browser` (Playwright, contra `next start`) | 5 rotas sem overflow e sem erro de console; `/api/health` e `/api/dashboard` OK; canvas renderizando; Flap inicia a partida; dashboard mobile sem overflow |
| Teste manual no navegador integrado (build de produção) | Partida completa até o game over; sessão gravada e exibida no dashboard; tendência e gráfico corretos com 12 partidas; "Limpar dados" volta ao estado vazio; layout mobile do jogo |
| Gestos | WASM e modelo carregam sem bloqueio de CSP e o grafo do MediaPipe inicia na GPU (WebGL 2). Câmera negada mostra o erro correto e restaura a UI. **Não verificado:** rastreamento com uma mão real, porque o navegador de verificação bloqueia a câmera (ver P6). |
| `npm audit --omit=dev` | 0 vulnerabilidades |
| Headers | `X-Request-Id` propagado, `no-store` na API, CSP com `wasm-unsafe-eval`, WASM com `Content-Type: application/wasm` e cache de 1 dia |

### Revisão pós-implementação

Uma segunda passada de revisão e testes encontrou e corrigiu:

- **Falha silenciosa no rastreamento:** uma exceção em `detectForVideo` (por exemplo, perda do contexto WebGL) matava o loop dentro do `requestAnimationFrame` com a câmera ainda ligada e a UI dizendo "ativo". Agora o rastreador chama `onError`, desliga a câmera e a UI mostra o erro. O mesmo vale para a câmera desconectada (evento `ended` da trilha de vídeo).
- **Esqueleto da mão desalinhado:** o canvas do overlay era fixo em 4:3. Câmeras que entregam 16:9 eram recortadas pelo `object-fit: cover`, e o desenho saía deslocado. O overlay agora assume a resolução real do vídeo.
- **Textos desatualizados:** `/play` ainda apresentava os gestos no navegador como "evolução natural"; a landing, o dataset de amostra e as configurações também tinham textos anteriores à mudança.
- **`append` dependente de `this`:** quebrava se o método fosse desestruturado. Coberto por teste.
- **Aviso do Vitest:** a configuração ESM foi renomeada para `vitest.config.mts`.

## 7. Limitações conhecidas

- O controle por gestos precisa ser testado com uma câmera real antes de uma demo ao vivo.
- Ao ativar os gestos, o console mostra dois erros de CSP da telemetria do Google bloqueada. É esperado e não afeta o funcionamento.
- A telemetria real é por navegador; o agregado entre usuários depende de P2.
- Os KPIs de amostra do dashboard continuam simulados, agora rotulados como tal.
- O `'unsafe-inline'` no CSP continua (ver P5).
- Os interruptores da página de configurações são visuais: não alteram câmera, analytics nem alertas. Ou se conectam ao comportamento real, ou deveriam sair da interface.
- A engine Python só recebeu a fixação de versão do MediaPipe (ver P7).
