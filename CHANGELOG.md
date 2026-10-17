# Changelog

## Não publicado

### Adicionado

- Política de sessão gestual exclusiva, com modo manual preservado ao desligar a câmera.
- Pausa por perda de rastreamento por 600 ms e retomada por nova transição fechar/abrir.
- Testes de ciclo de vida dos recursos da câmera/modelo e de política de input.
- Documentos de diagnóstico, pesquisa, plano, prioridades e validação da rodada de 17/10/2026.

### Corrigido

- Espera por modelo mesmo após a câmera ser negada.
- Recursos entregues após o cancelamento permanecendo em aberto.
- Callback de sessão cancelada substituindo referência mais recente.
- Pose antiga gerando flap quando a mão reaparecia após ausência longa.

### Segurança

- Mantidos os headers, opt-out e inferência local existentes. Advisory de desenvolvimento e limites de revisão registrados em `VALIDATION_REPORT.md`.

Nenhuma versão ou publicação é declarada por este registro.
