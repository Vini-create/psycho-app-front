"use client";

import type { CSSProperties } from "react";
import { folderShape } from "./folder-shape";

/* A matéria do papel — e por que ela é uma imagem, não um filtro.

   A primeira versão desta pilha desenhava o granulado com um `feTurbulence`
   do tamanho de cada folha, e a folha tem a altura da página inteira. Eram
   quatro pastas × dois filtros × alguns milhões de pixels, refeitos toda vez
   que o conteúdo crescia e mudava a altura — ou seja, exatamente no frame em
   que a troca de pasta começava. Medido: quatro frames acima de 24ms por
   navegação, o pior em 121ms.

   O ruído, porém, é homogêneo: não há informação nenhuma em calculá-lo duas
   vezes. Aqui ele é um ladrilho costurado (`stitchTiles`), rasterizado uma
   vez pelo pipeline de imagens do navegador e repetido. O custo deixa de
   crescer com a área da página e vira constante.

   O ladrilho ser uma IMAGEM, e não um `<pattern>` SVG, é o que garante o
   requisito duro do sistema: a faixa da aba e o corpo da folha são pintados
   por mecanismos diferentes (clip-path e border-radius), e só usando o mesmo
   recurso de imagem, na mesma fase, a granulação atravessa a junção sem
   ruptura. Dois rasterizadores do mesmo SVG não dão essa garantia. */

const TILE = 320;

/* Duas frequências no mesmo ladrilho: o grão fino, que é a fibra, e uma
   variação larga, que impede a folha de ler como `background-color` chapado.
   Juntas em um recurso só — assim cada superfície gasta uma camada, não duas.

   As proporções entre elas não são estéticas, são a diferença entre papel e
   sujeira, e as duas se movem em direções opostas. A fibra fina pode subir à
   vontade: ela é o que se quer ver, e por ser quase per-pixel não produz
   forma nenhuma. A variação larga não pode — em 0.45 ela virava nuvem, com
   manchas de uns 60px que o §11 proíbe nominalmente. Em 0.1 ela faz só o que
   precisa, que é tirar a folha do `background-color` chapado, e nesse nível
   a repetição do ladrilho de 320px também fica imperceptível. */
const TILE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='${TILE}' height='${TILE}' viewBox='0 0 ${TILE} ${TILE}'>
<filter id='g' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>
<feTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/>
<feColorMatrix type='saturate' values='0'/></filter>
<filter id='m' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>
<feTurbulence type='fractalNoise' baseFrequency='0.015' numOctaves='3' stitchTiles='stitch'/>
<feColorMatrix type='saturate' values='0'/></filter>
<rect width='${TILE}' height='${TILE}' filter='url(%23g)' opacity='0.85'/>
<rect width='${TILE}' height='${TILE}' filter='url(%23m)' opacity='0.1'/></svg>`;

/* Aspas simples no SVG, e só nele: o ladrilho vira o conteúdo de um
   `url("...")` e um `"` interno encerraria o token cedo demais. O sintoma é
   silencioso — `background-image` inteiro cai para `none`, sem erro em lugar
   nenhum —, e foi exatamente o que aconteceu na primeira tentativa. */

export const PAPER_TILE = `url("data:image/svg+xml;utf8,${TILE_SVG.replace(
  /\n/g,
  "",
)}")`;

/** Valor "textura desligada": uma camada válida que não pinta nada.
    `none` não serve — invalida a lista inteira de `background-image`. */
export const PAPER_TILE_OFF = "linear-gradient(#0000, #0000)";

export type FolderTone = "dark" | "sage" | "lavender" | "clay";

const TONE_FILL: Record<FolderTone, string> = {
  dark: "var(--folder-dark)",
  sage: "var(--folder-sage)",
  lavender: "var(--folder-lavender)",
  clay: "var(--folder-clay)",
};

/* Quanto de preto cobre uma pasta que não está na frente. É o que faz a
   folha recuar para o fundo sem mudar de cor — pigmento na sombra, não
   outra tinta. */
const RESTING_SCRIM: Record<FolderTone, number> = {
  dark: 0.44,
  sage: 0.42,
  lavender: 0.42,
  clay: 0.42,
};

export function toneFill(tone: FolderTone): string {
  return TONE_FILL[tone];
}

export function restingScrim(tone: FolderTone): number {
  return RESTING_SCRIM[tone];
}

/**
 * A superfície da pasta: cor pigmentada, granulado e véu de repouso.
 *
 * Devolve exatamente as mesmas camadas para a faixa de topo e para o corpo,
 * mudando só a fase vertical do ladrilho. É essa igualdade — mesmo recurso,
 * mesma ordem, mesmo blend — que faz aba e corpo serem indistinguíveis na
 * junção, apesar de serem dois elementos.
 *
 * `offsetY` é a posição do elemento dentro da folha: a faixa começa em 0, o
 * corpo começa embaixo da aba, e o ladrilho continua de onde parou.
 *
 * `scrim` permite aliviar o véu de repouso. Existe por causa da doca: no
 * desktop as pastas fechadas recuam contra a folha aberta, que é clara o
 * bastante para elas continuarem visíveis; na doca as quatro ficam sobre a
 * bancada quase preta, e com o véu cheio a pasta escura simplesmente some no
 * fundo. Mesmo véu, contexto diferente.
 */
export function paperSurface(
  tone: FolderTone,
  active: boolean,
  offsetY: number,
  scrimOverride?: number,
): CSSProperties {
  const scrim = active ? 0 : (scrimOverride ?? RESTING_SCRIM[tone]);
  /* `overlay` nos dois tons, e não `multiply` no pastel: multiply com ruído
     cinza médio escurece a superfície inteira antes de texturizá-la, e a
     pasta clara perdia pigmento. Overlay modula em torno do meio-tom — a
     cor do papel continua sendo a cor do papel. */
  const blend = "overlay";

  return {
    backgroundColor: TONE_FILL[tone],
    /* O ladrilho vem de uma variável para que base.css possa desligá-lo em
       `prefers-reduced-transparency` sem derrubar o véu de repouso junto —
       um é acabamento, o outro é hierarquia. */
    "--folder-tile": PAPER_TILE,
    backgroundImage: `linear-gradient(rgb(0 0 0 / ${scrim}), rgb(0 0 0 / ${scrim})), var(--folder-tile)`,
    backgroundPosition: `0 0, 0 ${-offsetY}px`,
    backgroundSize: `auto, ${TILE}px ${TILE}px`,
    backgroundRepeat: "no-repeat, repeat",
    backgroundBlendMode: `normal, ${blend}`,
  } as CSSProperties;
}

export { folderShape };
