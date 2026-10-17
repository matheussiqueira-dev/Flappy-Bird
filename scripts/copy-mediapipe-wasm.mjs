// Copia o runtime WASM do MediaPipe para public/ a partir do pacote instalado.
// Servir pela própria origem mantém o CSP restrito a 'self' e garante que a
// versão do WASM é exatamente a do lockfile, sem depender de CDN externa.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const target = path.join(root, "public", "mediapipe", "wasm");

// Variantes carregadas por FilesetResolver.forVisionTasks(path) sem módulos ES:
// SIMD quando o navegador suporta e fallback sem SIMD.
const files = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];

if (!fs.existsSync(source)) {
  console.error(`[mediapipe] Pacote não encontrado em ${source}. Rode npm install.`);
  process.exit(1);
}

fs.mkdirSync(target, { recursive: true });

let copied = 0;
for (const file of files) {
  const from = path.join(source, file);
  const to = path.join(target, file);
  const fromStat = fs.statSync(from);

  if (fs.existsSync(to)) {
    const toStat = fs.statSync(to);
    if (toStat.size === fromStat.size && toStat.mtimeMs >= fromStat.mtimeMs) continue;
  }

  fs.copyFileSync(from, to);
  copied += 1;
}

console.log(`[mediapipe] WASM pronto em public/mediapipe/wasm (${copied} arquivo(s) atualizado(s)).`);
