# Roadmap e continuidade

Atualizado em 17/10/2026. Ler este arquivo, o Git e [VALIDATION_REPORT.md](VALIDATION_REPORT.md) antes de continuar. Não refazer a engine/telemetria já existentes na base `4740e99`.

## Priorização

Notas de 1 a 5. Valor (V) 25%, diferenciação (D) 10%, portfólio (P) 10%, viabilidade (F) 15%, demonstração (E) 10%, manutenção (M) 10%, baixo risco (R) 15%, baixo custo (C) 5%. Em R/C, 5 representa menor risco/custo. Notas são julgamento de produto, não métricas observadas.

| Item | Nível | V/D/P/F/E/M/R/C | Pontuação /5 | Estado |
|---|---|---|---|---|
| Cancelamento/limpeza de câmera e modelo | P1 | 5/2/4/5/4/5/4/5 | 4,35 | Concluído no código e testes |
| Sessão gestual exclusiva e pausa por ausência | P2 | 5/4/5/5/5/5/4/5 | 4,75 | Concluído no código; validação física pendente |
| Worker de inferência | P2 | 4/4/5/3/4/3/3/5 | 3,75 | Pendente |
| Tutorial/calibração personalizada | P2 | 4/4/4/4/5/4/4/5 | 4,15 | Pendente |
| Leaderboard público | P3 | 2/2/3/2/4/2/2/3 | 2,35 | Descartado desta rodada |

P0: o baseline da aplicação web já instalável estava funcional; a tentativa de reinstalação encontrou bloqueio de arquivo no Windows, descrito no relatório. Não havia justificativa para reescrita geral.

## Sequência executada

- Concluído: descobrir a divergência entre `main` pública e checkout local; preservar branch e arquivos do usuário.
- Concluído: baseline de build, lint, tipos, unitários e scripts de navegador.
- Concluído: pesquisa oficial, revisão direcionada e escolha das duas entregas acima.
- Concluído: correções incrementais e testes de regressão.
- Concluído: instalação isolada, tipagem, lint, 73 testes, build e 21 verificações gestuais; auditoria de produção sem achados. Ressalvas do npm e advisory de desenvolvimento no relatório.
- Pendente: webcam real, precisão e latência física; revisão em mais navegadores/dispositivos.
- Pendente: publicação/preview Vercel mediante autorização específica. Nenhum link de deploy foi criado.

## Capacidades utilizadas

Skill formal: `engineering:debug`, para reproduzir, isolar causa, corrigir e prevenir regressão. Ferramentas: terminal PowerShell/Git/npm, Vitest, Playwright Chromium com câmera sintética e fontes web oficiais. Não foram ativados plugins pagos nem agentes adicionais.

Não houve instalação global, serviço pago, banco novo, substituição por mock no produto, commit automático ou push. Os mocks novos existem somente nos testes de falha e ciclo de vida.

## Próxima tarefa

Validar fisicamente o fluxo: permitir webcam; fechar/abrir para iniciar; perder a mão por mais de 600 ms; confirmar pausa; reaparecer aberto sem flap; fechar/abrir para retomar. Registrar iluminação, navegador, hardware e erros. Só então decidir calibração e Worker com medições comparáveis.
