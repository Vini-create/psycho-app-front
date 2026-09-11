/* Sobe o servidor de desenvolvimento da landing.

   Existe por causa de um detalhe de topologia: `landing/` está fora do
   `pnpm-workspace.yaml` de propósito — a pasta foi tirada de `apps/*` para
   não entrar no workspace — e portanto tem `node_modules` e lockfile
   próprios, instalados com npm.

   Consequência prática: quem clona o repositório e roda `pnpm install` na
   raiz instala os dois apps e os pacotes compartilhados, mas NÃO a landing.
   Sem este guarda, o `dev:design` da raiz morreria com um "vite: not found"
   que não explica nada e ainda derrubaria a leitura do log dos outros dois
   processos rodando em paralelo.

   Então: se faltar, instala uma vez, avisando o que está fazendo. */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      /* Ctrl+C no terminal chega aqui como sinal, não como código de erro.
         Tratar isso como falha encheria o log de stack trace toda vez que
         alguém encerra o `dev:design`. */
      if (signal) resolve(0);
      else if (code === 0) resolve(0);
      else reject(new Error(`${command} ${args.join(" ")} saiu com código ${code}`));
    });
  });
}

if (!existsSync(join(ROOT, "node_modules", "vite"))) {
  console.log("[landing] dependências ausentes — instalando uma vez com npm...");
  console.log("[landing] (a landing fica fora do workspace pnpm e tem lockfile próprio)");
  await run(npm, ["install", "--no-fund", "--no-audit"]);
}

/* Sem passar porta: ela é da `vite.config.ts`, para que rodar daqui e
   rodar de dentro de `landing/` dêem exatamente no mesmo lugar. */
await run(npm, ["run", "dev"]);
