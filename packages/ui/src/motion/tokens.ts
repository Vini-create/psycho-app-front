/* Tokens de movimento — a única fonte de números do sistema.

   Nenhuma timeline do produto escreve duração, ease ou amplitude literal.
   Os valores espelham os tokens CSS de §27 do brandbook (--duration-*,
   --ease-sinapsa) e os estendem com o que só o GSAP consome. */

/** Segundos — a unidade do GSAP. */
export const duration = {
  /** Resposta tátil: press, feedback imediato. */
  instant: 0.12,
  /** Hover, foco, troca de ícone. */
  fast: 0.18,
  /** Mudança de estado de um componente: seleção, indicador, accordion. */
  ui: 0.26,
  /** Entrada e assentamento da pasta nova. Curta de propósito: é o gesto
      que mais se repete no dia, e peso não se comunica com duração — se
      comunica com a curva e com o assentamento no fim. */
  folder: 0.36,
  /** Entrada de conteúdo de uma página. */
  page: 0.3,
} as const;

export const ease = {
  /** Chegada: desacelera até parar. Tudo que entra em cena. */
  enter: "power3.out",
  /** Saída: acelera para fora. Tudo que recua. */
  exit: "power2.in",
  /** Objeto pesado que sai do repouso e volta ao repouso — a pasta. */
  folder: "power3.inOut",
  /** Microinteração: curta demais para precisar de aceleração inicial. */
  ui: "power2.out",
  /** O mais próximo de "spring" que o produto admite. Sem overshoot. */
  springLike: "power2.out",
} as const;

/* Amplitudes em pixels. A troca física de pasta é a única coreografia que
   ultrapassa 10px: o deslocamento maior pertence à folha inteira, combinado
   com perspectiva e rotação mínima, e não ao conteúdo como um slide. */
export const distance = {
  hair: 1,
  nudge: 2,
  step: 4,
  lift: 6,
  shift: 8,
  folderTravel: 18,
} as const;

/** Escalas. Sempre entre 0.99 e 1 — deformação percebida, nunca vista. */
export const scale = {
  press: 0.995,
  sheet: 0.994,
  panel: 0.985,
} as const;

export const stagger = {
  tight: 0.03,
  list: 0.04,
  block: 0.055,
} as const;

/**
 * Camadas de empilhamento. Referência única para z-index no shell.
 *
 * Os valores são baixos de propósito: quem precisa ficar por cima resolve
 * com ordem de camada, não com número grande.
 */
export const layer = {
  base: 0,
  /* A pilha de pastas resolve a própria profundidade em
     `components/shell/folder-shape.ts`, com um valor por folha: aqui só
     entram as camadas que precisam ficar acima dela. */
  content: 10,
  navigation: 30,
  popover: 40,
  modal: 50,
  toast: 60,
} as const;

export type MotionScale = "desktop" | "mobile" | "reduced";
