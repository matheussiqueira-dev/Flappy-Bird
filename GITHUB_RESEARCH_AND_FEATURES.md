# Pesquisa técnica e oportunidades

Consulta: 17/10/2026. Pesquisa direcionada à integração já existente; nenhuma cópia de código de terceiros nesta rodada.

| Referência | Inspeção | Feature / funcionamento | Licença | Aplicabilidade |
|---|---|---|---|---|
| [google-ai-edge/mediapipe-samples-web](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/hand-landmarker.worker.ts) | Código de `hand-landmarker.worker.ts` e LICENSE lidos | Worker recebe bitmap/timestamp, executa inferência, fecha bitmap e devolve landmarks/tempo ou erro | Apache-2.0, [licença](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/LICENSE) | Referência para futuro Worker; não adotado nesta rodada |

O exemplo oficial recebe a configuração do delegate e depende de `BaseWorker`. Não é um componente pronto para transplantar: seria necessário adaptar mensagens, bootstrap do WASM, descarte de quadros, CSP, encerramento e fallback CPU/GPU. Sua arquitetura foi analisada no arquivo indicado; os demais módulos do repositório não foram auditados.

## Fontes oficiais

- [Hand Landmarker web](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js): configuração VIDEO, landmarks e execução síncrona. Sustenta separar inferência do desenho quando houver orçamento para validar Worker.
- [getUserMedia / MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia): permissão e contexto seguro. A aplicação gerencia cancelamento local e libera streams entregues tardiamente; não tenta controlar o prompt do navegador.
- [Next.js na Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs): referência de hospedagem; documentação consultada, sem deploy executado.
- [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): advisory da cadeia de desenvolvimento informado pelo npm.

## Catálogo de decisões

1. **Sessão gestual exclusiva e pausa por perda de mão — implementado.** Reutiliza landmarks e domínio existentes; custo zero e sem serviços. Testes verificam rejeição de inputs manuais, validade temporal e retomada.
2. **Cancelamento de recursos — implementado.** A aquisição da câmera precede o modelo. O cancelamento rejeita a espera, encerra streams/modelos tardios e evita que callbacks antigos publiquem estado. Testado com recursos controlados.
3. **Worker de inferência — proposto.** Pode reduzir travamentos da thread principal; exige mensagens tipadas, uma inferência em voo, liberação de `ImageBitmap`, teste de CSP e comparação de desempenho. Complexidade média; medir em hardware real antes de prometer ganho.
4. **Calibração orientada — proposto.** Faixa útil personalizada e tutorial de abrir/fechar, sem salvar imagens. Testar esquerda/direita, luz e distâncias. Complexidade média; valor maior após validação humana.
5. **Leaderboard remoto — adiado.** Introduziria persistência, abuso de placar, gestão de dados e limites de hospedagem sem melhorar a proposta central.

Implementações próprias continuam sob a licença MIT do projeto. Reutilização futura de trechos Apache-2.0 deverá preservar atribuições e demais obrigações; a consulta conceitual atual não adicionou código licenciado de fora.
