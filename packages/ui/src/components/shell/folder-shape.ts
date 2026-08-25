/* Geometria da pasta física — §09 do brandbook, levada ao pé da letra.

   Este módulo existe por um motivo único e não negociável: aba e corpo
   precisam ser UMA silhueta. Enquanto a aba era um elemento com fundo
   próprio apoiado sobre a folha, sempre haveria alguma emenda — uma borda,
   um degrau de tom, um pixel de textura que não continua. A única forma de
   eliminar a emenda por construção é desenhar as duas em um mesmo contorno
   fechado e pintar esse contorno uma vez só.

   Daí a divisão de responsabilidades:

   - aqui mora a matemática (o `d` do path e a distribuição das abas);
   - `FolderSheet` pinta esse path uma vez, com uma cor, uma textura e uma
     sombra;
   - `FolderStack` move o objeto inteiro com transform.

   Nada neste arquivo conhece React, GSAP ou DOM. É geometria pura, e por
   isso pode ser conferida de cabeça. */

/** Medidas de repouso da pilha, em pixels CSS. */
export const folderShape = {
  /** Altura visível da aba acima do topo do corpo. Igual em todas as pastas:
      é o que permite que a troca seja um transform rígido, sem redesenho. */
  tabHeight: 46,
  /** Abaixo disto a pilha vira doca. Espelha `--breakpoint-sm` (48rem) e a
      media query de `--folder-tab-height` em base.css. */
  compactQuery: "(min-width: 48rem)",
  /** Raio dos cantos do corpo. */
  bodyRadius: 16,
  /** Raio dos cantos de cima da aba. */
  tabRadius: 9,
  /** Filete côncavo que liga a lateral da aba ao topo do corpo. */
  shoulder: 13,
  /** Recuo do topo da aba em relação à base — a leve conicidade do papel. */
  slant: 5,
  /** Respiro mínimo entre o rótulo e as laterais da aba — telas apertadas. */
  tabPadding: 20,
  /** Respiro máximo. A aba larga do desktop, quando há papel de sobra. */
  tabPaddingMax: 86,
  /** Distância mínima entre duas abas vizinhas. */
  tabGap: 12,
  /** Degrau vertical entre duas folhas consecutivas da pilha. */
  stackStep: 6,
  /**
   * Altura da faixa de topo — a única parte da folha cuja forma é complexa.
   *
   * Abaixo dela a pasta é um retângulo de cantos arredondados, e um
   * retângulo o CSS pinta de graça. Separar as duas é o que torna a pintura
   * da pilha independente da altura da página: crescer o conteúdo deixa de
   * mandar redesenhar quatro silhuetas do tamanho do documento.
   */
  bandHeight: 46 + 13 + 18,
} as const;

export interface FolderPathInput {
  width: number;
  height: number;
  /** Borda esquerda da aba, na base dela. */
  tabX: number;
  tabWidth: number;
  /** 0 desenha um retângulo arredondado puro — o modo compacto. */
  tabHeight: number;
  /** Raio do corpo. Zero no full-bleed do mobile, onde a folha é a tela. */
  radius?: number;
  /**
   * `"round"` fecha a folha inteira. `"flat"` corta em `height` sem
   * arredondar — é a faixa de topo, que termina dentro da folha e não na
   * borda dela.
   */
  bottom?: "round" | "flat";
}

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Contorno fechado do conjunto aba + corpo.
 *
 * Percorrido em sentido horário a partir da lateral esquerda: sobe pela
 * esquerda, entra na aba pelo ombro côncavo, atravessa o topo da aba, desce
 * pelo ombro direito, contorna o corpo e fecha. Um único `d`.
 */
export function folderPath({
  width,
  height,
  tabX,
  tabWidth,
  tabHeight,
  radius = folderShape.bodyRadius,
  bottom = "round",
}: FolderPathInput): string {
  const w = Math.max(1, width);
  const h = Math.max(1, height);

  const r = Math.max(0, Math.min(radius, w / 2, h / 2));

  const foot =
    bottom === "flat"
      ? [`L ${round(w)} ${round(h)}`, `L 0 ${round(h)}`]
      : [
          `L ${round(w)} ${round(h - r)}`,
          `A ${r} ${r} 0 0 1 ${round(w - r)} ${round(h)}`,
          `L ${round(r)} ${round(h)}`,
          `A ${r} ${r} 0 0 1 0 ${round(h - r)}`,
        ];

  if (tabHeight <= 0 || tabWidth <= 0) {
    return [
      `M 0 ${round(h - r)}`,
      `L 0 ${round(r)}`,
      `A ${r} ${r} 0 0 1 ${round(r)} 0`,
      `L ${round(w - r)} 0`,
      `A ${r} ${r} 0 0 1 ${round(w)} ${round(r)}`,
      ...foot,
      "Z",
    ].join(" ");
  }

  const bodyTop = Math.min(tabHeight, h / 2);
  /* O ombro nunca pode passar da borda da folha nem invadir a aba vizinha:
     quando a aba encosta no canto, ele encolhe em vez de furar o contorno. */
  const shoulder = Math.max(
    0,
    Math.min(folderShape.shoulder, tabX, w - (tabX + tabWidth), bodyTop - 2),
  );
  const slant = Math.min(folderShape.slant, tabWidth / 6);
  const tabRadius = Math.max(
    0,
    Math.min(folderShape.tabRadius, tabWidth / 2 - slant, bodyTop - shoulder),
  );

  const left = tabX;
  const right = tabX + tabWidth;

  return [
    `M 0 ${round(h - r)}`,
    // Lateral esquerda do corpo, subindo até o canto superior esquerdo.
    `L 0 ${round(bodyTop + r)}`,
    `A ${r} ${r} 0 0 1 ${round(r)} ${round(bodyTop)}`,
    // Topo do corpo até o pé da aba.
    `L ${round(left - shoulder)} ${round(bodyTop)}`,
    // Ombro côncavo: sweep 0 curva para dentro da aba, não para fora.
    `A ${shoulder} ${shoulder} 0 0 0 ${round(left)} ${round(bodyTop - shoulder)}`,
    // Lateral esquerda da aba, levemente cônica.
    `L ${round(left + slant)} ${round(tabRadius)}`,
    `Q ${round(left + slant)} 0 ${round(left + slant + tabRadius)} 0`,
    // Topo da aba.
    `L ${round(right - slant - tabRadius)} 0`,
    `Q ${round(right - slant)} 0 ${round(right - slant)} ${round(tabRadius)}`,
    // Lateral direita da aba e ombro côncavo de volta ao corpo.
    `L ${round(right)} ${round(bodyTop - shoulder)}`,
    `A ${shoulder} ${shoulder} 0 0 0 ${round(right + shoulder)} ${round(bodyTop)}`,
    // Topo do corpo à direita, e o resto do retângulo.
    `L ${round(w - r)} ${round(bodyTop)}`,
    `A ${r} ${r} 0 0 1 ${round(w)} ${round(bodyTop + r)}`,
    ...foot,
    "Z",
  ].join(" ");
}

/**
 * A aba sozinha — sem corpo.
 *
 * No desktop a aba nunca aparece separada: ela é um trecho do contorno da
 * pasta. Na doca do mobile, sim: ali cada destino é uma aba pendurada na
 * folha, e o que se vê é exatamente esta forma, com a aresta arredondada e a
 * conicidade voltadas para a borda da tela em vez de para cima.
 *
 * `edge` diz de que lado fica a ponta: `"top"` é a orientação do desktop,
 * `"bottom"` é a mesma aba de cabeça para baixo.
 */
export function folderTabPath({
  width,
  height,
  radius = folderShape.tabRadius,
  slant = folderShape.slant,
  edge = "top",
}: {
  width: number;
  height: number;
  radius?: number;
  slant?: number;
  edge?: "top" | "bottom";
}): string {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const sl = Math.max(0, Math.min(slant, w / 6));
  const r = Math.max(0, Math.min(radius, w / 2 - sl, h / 2));

  /* A ponta é sempre desenhada em `y = 0`; quando ela deve olhar para baixo,
     o eixo é espelhado na hora de emitir cada coordenada. Assim existe uma
     geometria só, e não duas que podem divergir com o tempo. */
  const y = (value: number) => round(edge === "top" ? value : h - value);

  return [
    `M 0 ${y(h)}`,
    `L ${round(sl)} ${y(r)}`,
    `Q ${round(sl)} ${y(0)} ${round(sl + r)} ${y(0)}`,
    `L ${round(w - sl - r)} ${y(0)}`,
    `Q ${round(w - sl)} ${y(0)} ${round(w - sl)} ${y(r)}`,
    `L ${round(w)} ${y(h)}`,
    "Z",
  ].join(" ");
}

export interface TabSlot {
  /** Posição preferida da aba, como fração da largura da folha. */
  anchor: number;
  /** Largura desejada, já medida a partir do rótulo. */
  width: number;
}

/**
 * Distribui as abas ao longo do topo da folha.
 *
 * As âncoras são deliberadamente irregulares — arquivos reais não são
 * tabulados por planilha. Mas irregularidade não pode virar colisão: cada
 * aba é empurrada para a direita da anterior quando o espaço aperta, e se
 * ainda assim o conjunto transbordar, tudo é comprimido de volta para dentro
 * da folha. O resultado degrada de "irregular" para "encostadas", nunca para
 * "sobrepostas".
 */
export function layoutTabs(width: number, slots: readonly TabSlot[]): number[] {
  if (slots.length === 0) return [];

  const gap = folderShape.tabGap;
  const positions: number[] = [];

  let cursor = 0;
  slots.forEach((slot, index) => {
    const preferred = slot.anchor * width;
    const x = index === 0 ? Math.max(0, preferred) : Math.max(preferred, cursor);
    positions.push(x);
    cursor = x + slot.width + gap;
  });

  const overflow = cursor - gap - width;
  if (overflow <= 0) return positions;

  /* Transbordou: reencosta todas à esquerda com o gap mínimo e, se ainda
     assim não couber, deixa o excesso escapar pela direita — o `FolderStack`
     reduz o rótulo antes de chegar aqui. */
  let packed = 0;
  return slots.map((slot) => {
    const x = packed;
    packed = x + slot.width + gap;
    return x;
  });
}

/** Largura total exigida por um conjunto de abas encostadas. */
export function packedTabsWidth(slots: readonly TabSlot[]): number {
  if (slots.length === 0) return 0;
  return (
    slots.reduce((total, slot) => total + slot.width, 0) +
    folderShape.tabGap * (slots.length - 1)
  );
}
