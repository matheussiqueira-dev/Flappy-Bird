# Diagnóstico técnico

Inspeção de 17/10/2026, base `4740e99`. Escopo: superfícies web/Python, configuração, testes e integrações gestuais. Sem pentest externo ou auditoria exaustiva de todo o histórico.

## Inventário e baseline

- Next.js 16.3.8, React 19, TypeScript strict, npm e lockfile; MediaPipe Tasks Vision carregado no cliente.
- Python/Pygame/OpenCV/MediaPipe legado, em módulos separados na raiz. Ambiente local Python 3.12 disponível.
- Rotas `/`, `/play`, `/dashboard`, `/settings`, `/about`, APIs de saúde/dashboard, PWA e analytics opcionais.
- Domínio da engine, gestos, preferências e histórico local com Vitest; scripts Playwright e GitHub Actions existentes.
- Git inicialmente sem alterações rastreadas; `.claude/`, `.cto-toolkit/` e `.venv312/` não rastreados foram preservados.
- Baseline executado: tipagem, lint, 60 testes e build aprovados; smoke de cinco páginas e 15 verificações gestuais aprovados.

## Achados e tratamento

| Achado | Prioridade | Impacto e evidência | Tratamento / risco residual |
|---|---|---|---|
| `Promise.allSettled` aguardava modelo e câmera mesmo com falha/cancelamento | Alta | `hand-tracker.ts`: câmera obtida podia permanecer aberta enquanto o modelo pendia | Aquisição cancelável, limpeza tardia e testes de ciclo de vida; prompt do navegador é controlado pelo navegador |
| Input manual continuava permitido com gestos ligados | Alta | `game-demo.tsx`: handlers de pointer/keydown sem política gestual | Política central `applyPlayerFlap`, botões indisponíveis durante a sessão e regressão E2E |
| Perder a mão não pausava e uma pose antiga podia sobreviver | Alta | Mapper preservava estado sem validade temporal; engine continuava avançando | Presença com prazo de 600 ms, pausa e nova transição para retomar |
| Inicialização cancelada podia publicar referências tardias | Média | Hook atribuía diretamente o resultado assíncrono a `sessionRef` | Identidade do controlador checada e sessão tardia encerrada |
| Cinco pacotes de desenvolvimento afetados por um advisory | Alta | `npm audit --json`: cadeia braces → micromatch → fast-glob → plugin/config ESLint | Sem correção disponível no inventário consultado; não removemos o linter nem usamos override incompatível |
| Modelo externo e inferência síncrona | Média | URL Google no tracker; chamadas na thread principal com orçamento adaptativo | Preservados, com Worker no backlog e validação humana pendente |

Correções novas têm escopo pequeno e reversível. A aquisição sequencial elimina downloads desnecessários quando a câmera é negada, mas pode aumentar o tempo total de inicialização; não foi feito benchmark comparativo desse tempo.

## Observações de segurança e dados

`Permissions-Policy` permite câmera da própria origem, sem microfone. CSP existente libera WASM e o bucket do modelo, bloqueando deliberadamente o endpoint de telemetria do MediaPipe. Essa configuração não garante ausência universal de transmissão por toda a aplicação: analytics opcionais continuam sendo uma integração separada.

Dashboard distingue dados locais e dataset de amostra; `/api/dashboard` ainda tem `source: mock`. Preservados os controles de privacidade e formatos atuais. Nenhuma imagem foi capturada de webcam física nesta rodada.

Instalação/revalidação e limitações atuais: [VALIDATION_REPORT.md](VALIDATION_REPORT.md). O documento histórico [docs/AUDIT.md](docs/AUDIT.md) descreve outra base e não substitui esta verificação.
