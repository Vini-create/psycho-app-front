import type { CSSProperties } from "react";

/* A matéria do papel — cópia de `packages/ui/src/components/shell/FolderPaper.tsx`.

   Esta é a peça que faltava para a pilha da landing parecer com a do
   aplicativo. A versão anterior pintava cada pasta com um `fill` chapado, e
   o resultado era plástico: sem fibra, sem véu, sem o degrau de luz na
   aresta da aba. Uma pasta do produto tem TRÊS camadas sobre a cor, e é a
   soma delas que faz a coisa ler como papel.

   Também vêm de lá as cores. O produto usa os quatro tons de PASTA — que são
   pastéis claros, inclusive no dark — e não os pastéis profundos de
   superfície. A razão é o §09: "a cor pertence à aba física, nunca à
   página". A pasta é um objeto pousado sobre a mesa escura; ela não muda de
   cor porque a sala está escura.

   Por que ladrilho de imagem e não filtro SVG: o comentário original explica
   que `feTurbulence` do tamanho da folha custava frames de 24ms a 121ms na
   troca de pasta. Aqui o ruído é rasterizado uma vez e repetido, então o
   custo para de crescer com a área. E, o que mais importa para a forma: a
   faixa da aba e o corpo são pintados por mecanismos diferentes (clip-path e
   border-radius), e só o mesmo recurso de imagem garante que a granulação
   atravesse a junção sem ruptura. */

const TILE = 320;

/* Duas frequências no mesmo ladrilho: o grão fino, que é a fibra, e uma
   variação larga, que tira a folha do `background-color` chapado. As
   proporções não são gosto — em 0.45 a variação larga vira nuvem, com
   manchas de ~60px que o §11 proíbe nominalmente. */
const TILE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='${TILE}' height='${TILE}' viewBox='0 0 ${TILE} ${TILE}'>
<filter id='g' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>
<feTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/>
<feColorMatrix type='saturate' values='0'/></filter>
<filter id='m' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>
<feTurbulence type='fractalNoise' baseFrequency='0.015' numOctaves='3' stitchTiles='stitch'/>
<feColorMatrix type='saturate' values='0'/></filter>
<rect width='${TILE}' height='${TILE}' filter='url(%23g)' opacity='0.85'/>
<rect width='${TILE}' height='${TILE}' filter='url(%23m)' opacity='0.1'/></svg>`;

/* Aspas simples dentro do SVG, e só nele: o ladrilho vira o conteúdo de um
   `url("...")`, e uma aspa dupla interna encerraria o token cedo demais. O
   sintoma é silencioso — o `background-image` inteiro cai para `none` sem
   erro em lugar nenhum. */
export const PAPER_TILE = `url("data:image/svg+xml;utf8,${TILE_SVG.replace(/\n/g, "")}")`;

export type FolderTone = "dark" | "sage" | "lavender" | "clay";

/** Os quatro tons de pasta do produto, §09. */
export const TONE_FILL: Record<FolderTone, string> = {
  dark: "#2a2826",
  sage: "#aeb9a2",
  lavender: "#c8b9d8",
  clay: "#d49a82",
};

/* Quanto de preto cobre uma pasta que não está na frente. É o que faz a
   folha recuar para o fundo sem mudar de cor — pigmento na sombra, não
   outra tinta. Era exatamente isto que faltava na landing. */
const RESTING_SCRIM: Record<FolderTone, number> = {
  dark: 0.44,
  sage: 0.42,
  lavender: 0.42,
  clay: 0.42,
};

/** A tinta que uma pasta ABERTA deste tom aceita por cima. */
export function toneInk(tone: FolderTone): { ink: string; muted: string } {
  return tone === "dark"
    ? { ink: "#f1ede5", muted: "#c2bcb0" }
    : { ink: "#171615", muted: "#3c3a37" };
}

/**
 * A tinta do rótulo de uma aba, que depende de a pasta estar aberta ou não.
 *
 * Este é o único ponto em que a landing se afasta do `FolderSheet` do
 * produto, e por um motivo mensurável. Lá o rótulo usa sempre a tinta do
 * tom; aqui, sobre uma aba FECHADA, isso reprovava no contraste: o véu de
 * 42% leva o sage de `#aeb9a2` para algo em torno de `#656b5e`, e tinta
 * `#171615` sobre isso dá ~3,2:1 — abaixo do mínimo de 4,5:1.
 *
 * A mesma tinta clara sobre a mesma superfície velada dá ~4,6:1. O véu não
 * escurece só a pasta: ele inverte qual das duas tintas é legível.
 */
export function tabInk(tone: FolderTone, active: boolean): string {
  if (active) return toneInk(tone).ink;
  return "#f1ede5";
}

/**
 * A superfície da pasta: cor pigmentada, granulado e véu de repouso.
 *
 * Devolve as mesmas camadas para a faixa de topo e para o corpo, mudando só
 * a fase vertical do ladrilho. É essa igualdade — mesmo recurso, mesma
 * ordem, mesmo blend — que faz aba e corpo serem indistinguíveis na junção,
 * apesar de serem dois elementos.
 *
 * `offsetY` é onde o elemento começa dentro da folha: a faixa começa em 0, o
 * corpo começa embaixo da aba, e o ladrilho continua de onde parou.
 */
export function paperSurface(
  tone: FolderTone,
  active: boolean,
  offsetY: number,
): CSSProperties {
  const scrim = active ? 0 : RESTING_SCRIM[tone];

  return {
    backgroundColor: TONE_FILL[tone],
    /* O ladrilho vem de uma variável para que `base.css` possa desligá-lo em
       `prefers-reduced-transparency` sem derrubar o véu junto — um é
       acabamento, o outro é hierarquia. */
    "--folder-tile": PAPER_TILE,
    backgroundImage: `linear-gradient(rgb(0 0 0 / ${scrim}), rgb(0 0 0 / ${scrim})), var(--folder-tile)`,
    backgroundPosition: `0 0, 0 ${-offsetY}px`,
    backgroundSize: `auto, ${TILE}px ${TILE}px`,
    backgroundRepeat: "no-repeat, repeat",
    /* `overlay` e não `multiply`: multiply com ruído cinza médio escurece a
       superfície inteira antes de texturizá-la, e a pasta clara perde
       pigmento. Overlay modula em torno do meio-tom. */
    backgroundBlendMode: "normal, overlay",
  } as CSSProperties;
}

/** A sombra da folha. Deslocada e comprimida para nunca alcançar a aba —
    uma sombra atravessando a base da aba seria a emenda de volta. */
export function paperShadow(active: boolean): string {
  return active
    ? "0 20px 26px -10px rgb(0 0 0 / 0.5), inset 1px 0 0 rgb(255 255 255 / 0.05), inset -1px 0 0 rgb(255 255 255 / 0.05), inset 0 -1px 0 rgb(0 0 0 / 0.14)"
    : "0 8px 12px -6px rgb(0 0 0 / 0.5)";
}

/** O mesmo, como `filter`, para a faixa recortada por clip-path — onde
    `box-shadow` desenharia o retângulo, e não a silhueta. */
export function bandShadow(active: boolean): string {
  return active
    ? "drop-shadow(0 1px 1px rgb(0 0 0 / 0.5)) drop-shadow(0 10px 14px rgb(0 0 0 / 0.4))"
    : "drop-shadow(0 2px 4px rgb(0 0 0 / 0.5))";
}
