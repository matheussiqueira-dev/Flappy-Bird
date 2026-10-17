# Relatório de validação — 17/10/2026

Registro da validação local, encerrado antes do pedido posterior de commit, push, merge e deploy. As referências abaixo à ausência de publicação descrevem aquele momento; o histórico Git e os registros GitHub/Vercel registram a publicação posterior.

Ambiente: Windows, PowerShell, Node 24.19.0, npm 11.17.0, Python 3.12.10 no ambiente existente `.venv312`. Base: `4740e99`, `feat/gesture-modes-e2e`. Servidor de teste próprio na porta 3107; serviços preexistentes preservados.

## Baseline executado antes das alterações

| Verificação | Resultado |
|---|---|
| `npm.cmd run verify` | Aprovado: tipagem, lint, 60 testes em 6 arquivos, build Next.js |
| `APP_URL=http://127.0.0.1:3107 npm.cmd run verify:browser` | Aprovado: cinco rotas, APIs, canvas e layout desktop/mobile; sem erro inesperado |
| `APP_URL=http://127.0.0.1:3107 npm.cmd run verify:gestures` | Aprovado: 15/15 verificações, câmera sintética Chromium |
| `npm.cmd audit --json` | Falhou: 5 pacotes de desenvolvimento altos, mesma cadeia; sem correção disponível no resultado |

## Revalidação

| Comando / escopo | Estado final | Evidência |
|---|---|---|
| `npm.cmd ci --prefix <diretório temporário isolado>` | Validado com ressalva | 373 pacotes instalados do mesmo package.json/lockfile, saída 0. Política atual do npm alertou que o postinstall de `unrs-resolver` não está autorizado; não foi liberado automaticamente |
| `npm.cmd run verify` | Validado | Tipagem, lint, **73 testes em 9 arquivos** e build Next.js aprovados |
| `npm.cmd run verify:browser` com APP_URL na porta 3107 | Validado | Cinco rotas, APIs, canvas, desktop/mobile; sem erro inesperado e sem overflow |
| `npm.cmd run verify:gestures` com APP_URL na porta 3107 | Validado no escopo sintético | **21/21 verificações**: pipeline, modo exclusivo, volta ao manual, viewport móvel, cancelamento pendente, erros de câmera e preferências |
| `npm.cmd run audit` | Validado no escopo de produção | 0 vulnerabilidades conhecidas no resultado npm de dependências de produção |
| `npm.cmd audit --json` | Falhou / risco registrado | 5 pacotes de desenvolvimento altos na cadeia de `braces`, sem correção disponível no resultado |
| `.venv312/Scripts/python.exe -m py_compile config.py game_logic.py gesture_mapping.py hand_tracking.py main.py` | Validado apenas sintaxe | Saída 0; não comprova operação física da engine |
| `git diff --check` | Validado | Sem erro de whitespace; avisos locais de conversão LF/CRLF |
| Webcam física e navegador móvel real | Não executado | Não houve sessão com mão humana nem captura física |
| Deploy/preview Vercel | Não executado | Build e configuração inspecionados; não foi criado ou vinculado projeto externo |

Incidentes resolvidos: a primeira execução teve 72 testes aprovados e um erro de tipagem no mock novo, corrigido para `() => void`; foi adicionado mais um teste de congelamento de posição/tempo. `npm ci` no checkout falhou com EPERM ao tentar remover um SWC em uso. As dependências locais foram recuperadas com `npm install --ignore-scripts`, sem diff de package.json/lockfile, e a instalação limpa foi confirmada separadamente. Nenhum processo preexistente foi encerrado para liberar o arquivo.

O teste de cancelamento retém a requisição do modelo na rede e confirma que os tracks reais da câmera sintética chegam a `ended` ao cancelar. O teste não substitui a validação de permissão ou precisão com hardware humano.

Screenshots locais, produzidos pelo script e inspecionados visualmente: `play-gestures-mobile.png` e `play-gestures-desktop.png` em `%TEMP%/flappy-gestures-verification/`. A captura móvel final desativa animações transitórias para registrar o estado estável do menu. Não são imagens de uma webcam humana.

## Limites e riscos residuais

- Câmera sintética gera um padrão sem mão. O pipeline real do modelo é executado, mas gestos humanos não são validados ponta a ponta.
- Unitários de landmarks sintéticos verificam regras; não medem a precisão do modelo em iluminação real.
- Sem benchmark comparativo de FPS/latência nesta rodada. O timestep fixo e o orçamento de inferência preexistentes são preservados.
- Auditoria dirigida aos módulos/configurações lidos; não houve scanner completo de segredos do histórico, pentest, varredura integral Python ou validação da infraestrutura externa.
- Cinco dependências de desenvolvimento com advisory, sem correção npm disponível na consulta. Não são cinco vulnerabilidades independentes.
- Sem commit, push, merge, preview ou deploy de produção nesta rodada.

## Comparação e resultado

| Dimensão | Antes | Depois |
|---|---|---|
| Build/tipos/lint | Aprovados | Aprovados |
| Testes unitários | 60 / 6 arquivos | 73 / 9 arquivos |
| Verificações gestuais de navegador | 15 | 21 |
| Input com câmera ligada | Manual e gesto misturados | Flap/reinício por gesto; pausa manual de segurança preservada |
| Perda prolongada de mão | Partida continuava | Pausa; nova transição fecha/abre para retomar |
| Cancelamento com modelo pendente | Espera por todas as promessas | Liberação imediata dos tracks e descarte de resultado tardio |
| Performance física/precisão | Não medidas nesta sessão | Não medidas; sem alegação de ganho |

**B — modernizado parcialmente.** As mudanças locais estão verificadas nos escopos acima; faltam validação gestual humana e matriz real de navegadores. A publicação depende de autorização específica. Código e documentos permanecem locais, sem commit automático.
