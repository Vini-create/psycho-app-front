/* Registro único dos plugins, e o único lugar do projeto que importa GSAP
   diretamente. Uma página marca blocos com `.reveal` e chama um hook; ela
   nunca escreve duração, ease nem amplitude literal — MOTION.md §2.

   A regra que governa tudo aqui é a §6: **repouso é CSS**. O JavaScript só
   faz a ponte entre dois estados que o CSS já sabe desenhar. Se este módulo
   nunca executar, a página continua legível e operável. */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };

/** MOTION.md §2 — nada passa de 420ms, e só a troca de pasta chega perto. */
export const duration = {
  instant: 0.12,
  fast: 0.18,
  ui: 0.26,
  folder: 0.36,
  page: 0.3,
  /* Exclusivo da landing: a entrada de um bloco editorial que ocupa meia
     tela. Não existe no produto porque lá nenhum bloco é tão grande. */
  editorial: 0.72,
} as const;

export const ease = {
  enter: "power3.out",
  exit: "power2.in",
  folder: "power3.inOut",
  ui: "power2.out",
} as const;

/** Amplitudes. O produto vive entre 1px e 8px; a landing sobe até 24px
    apenas em bloco editorial inteiro, onde 8px não seria percebido como
    entrada — e nunca em controle, aba ou item de lista. */
export const distance = {
  hair: 2,
  small: 4,
  medium: 8,
  editorial: 24,
} as const;

export const stagger = {
  tight: 0.03,
  list: 0.055,
  block: 0.09,
} as const;

/**
 * A preferência do sistema, lida na hora — não no import.
 *
 * Alguns sistemas permitem trocar a preferência com a aba aberta, e um valor
 * congelado no módulo faria a página continuar animando depois de o usuário
 * ter pedido o contrário.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
