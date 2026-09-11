/* Baixa as quatro famílias do §05 do Google Fonts e as auto-hospeda.

   Rodar com `npm run fonts`. Reescreve `public/fonts/*.woff2` e
   `src/styles/fonts.css` — os dois são versionados, então o build e o deploy
   nunca dependem da rede.

   Rode de novo quando mudar peso, estilo ou família usados na página. O
   `src/styles/fonts.css` é gerado: editar à mão é trabalho que o próximo
   `npm run fonts` apaga. */

import { writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FONTS_DIR = join(ROOT, "public", "fonts");

/* A API do Google só devolve woff2 para um UA que o suporte. Com o UA padrão
   do Node ela responde com ttf, que é ~3× maior. */
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

/* O português cabe inteiro em latin + latin-ext. cyrillic, greek e
   vietnamese seriam peso morto no repositório. */
const SUBSETS = new Set(["latin", "latin-ext"]);

const FAMILIES = [
  /* Variáveis onde existem: um arquivo cobre a faixa inteira de pesos. */
  { css: "Archivo:wght@400..900", slug: "archivo" },
  { css: "Instrument+Sans:wght@400..700", slug: "instrument-sans" },
  {
    /* Newsreader variável ganha da estática por medição, não por gosto: os
       pesos que a página usa somam 480kB em 10 arquivos estáticos, contra
       272kB em 2 variáveis. */
    css: "Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700",
    slug: "newsreader",
  },
  /* IBM Plex Mono não tem versão variável no Google Fonts. */
  { css: "IBM+Plex+Mono:wght@400;500;600", slug: "ibm-plex-mono" },
];

const HEADER = `/* ==========================================================================
   Siouve — as quatro famílias do §05, auto-hospedadas

   GERADO por \`npm run fonts\`. Não editar à mão.

   Os apps usam \`next/font\`, que hospeda no build e nunca toca num CDN em
   runtime. A landing chega ao mesmo lugar por outro caminho, porque não tem
   Next: os \`.woff2\` vivem em \`public/fonts/\` e este arquivo os declara.

   O que isso resolve, além de privacidade: uma requisição a um terceiro na
   primeira dobra é uma conexão a mais (DNS + TLS) antes de a primeira letra
   aparecer, e é um ponto de falha fora do nosso controle numa página cujo
   conteúdo É tipografia.

   O \`unicode-range\` de cada bloco garante que o navegador baixe só o subset
   de que precisa.
   ========================================================================== */

`;

const field = (block, name, fallback) =>
  (block.match(new RegExp(`${name}:\\s*([^;]+)`)) ?? [, fallback])[1].trim();

async function main() {
  await rm(FONTS_DIR, { recursive: true, force: true });
  await mkdir(FONTS_DIR, { recursive: true });

  let css = HEADER;
  let bytes = 0;
  let files = 0;

  for (const family of FAMILIES) {
    const url = `https://fonts.googleapis.com/css2?family=${family.css}&display=swap`;
    const response = await fetch(url, { headers: { "User-Agent": UA } });
    if (!response.ok) {
      throw new Error(`Google Fonts respondeu ${response.status} para ${family.slug}`);
    }

    /* O CSS vem como uma sequência de `/* subset *​/` seguido do @font-face
       correspondente. Cortar pelo comentário é o que dá o nome do subset. */
    for (const raw of (await response.text()).split("/*").slice(1)) {
      const subset = raw.slice(0, raw.indexOf("*/")).trim();
      if (!SUBSETS.has(subset)) continue;

      const block = raw.slice(raw.indexOf("*/") + 2);
      const source = block.match(/url\((https:[^)]+\.woff2)\)/);
      if (!source) continue;

      const style = field(block, "font-style", "normal");
      const weight = field(block, "font-weight", "400");
      const name = `${family.slug}-${style}-${weight.replace(/\s+/g, "-")}-${subset}.woff2`;

      const file = Buffer.from(
        await fetch(source[1], { headers: { "User-Agent": UA } }).then((r) =>
          r.arrayBuffer(),
        ),
      );
      await writeFile(join(FONTS_DIR, name), file);
      bytes += file.length;
      files += 1;

      css +=
        `@font-face {\n` +
        `  font-family: ${field(block, "font-family", `"${family.slug}"`)};\n` +
        `  font-style: ${style};\n` +
        `  font-weight: ${weight};\n` +
        `  font-display: swap;\n` +
        `  src: url("/fonts/${name}") format("woff2");\n` +
        `  unicode-range: ${field(block, "unicode-range", "U+0-10FFFF")};\n` +
        `}\n\n`;

      console.log(`  ${name.padEnd(48)} ${(file.length / 1024).toFixed(1)}kB`);
    }
  }

  await writeFile(join(ROOT, "src", "styles", "fonts.css"), css);
  console.log(`\n${files} arquivos, ${(bytes / 1024).toFixed(1)}kB em public/fonts/`);
  console.log("src/styles/fonts.css reescrito.");
}

await main();
