import { useLayoutEffect, useRef } from "react";

import { gsap, prefersReducedMotion, SplitText } from "./gsap";

/* A tipografia que se monta na frente do leitor.

   Tudo aqui usa o mesmo gesto: a letra chega DESFOCADA e entra em foco. É
   uma escolha e não um efeito — o texto parece estar sendo lembrado, o que é
   exatamente o assunto do produto. E resolve um problema estrutural de
   quebra: a versão anterior trazia as linhas de dentro de uma máscara, e
   bastava a fonte assentar depois da divisão para duas linhas ocuparem a
   mesma faixa e se sobreporem. Letra que só muda `filter` e `opacity` não
   sai do fluxo, então não existe sobreposição possível.

   Os cuidados que separam um efeito de um bug:

   - `document.fonts.ready` antes de dividir. Medir na fonte de fallback e
     trocar depois muda a quebra embaixo do usuário.
   - `autoSplit` + `onSplit`: redimensionar refaz a divisão.
   - `revert()` no cleanup — o SplitText reescreve o DOM, e sem devolver o
     original o React e o leitor de tela veem um título picado.
   - nada roda sob `prefers-reduced-motion`. */

/** Quanto borrão a letra carrega ao nascer. Acima disso ela vira mancha. */
const BLUR = 14;

function split(
  element: HTMLElement,
  type: string,
  build: (self: SplitText) => void,
): () => void {
  let instance: SplitText | undefined;
  let cancelled = false;

  void document.fonts.ready.then(() => {
    if (cancelled) return;
    instance = SplitText.create(element, {
      type,
      autoSplit: true,
      onSplit: (self) => build(self),
    });
  });

  return () => {
    cancelled = true;
    instance?.revert();
  };
}

/**
 * Aplica o gesto a um conjunto de caracteres.
 *
 * `will-change` é ligado no começo e DESLIGADO no fim, de propósito. Borrão
 * é filtro, e filtro em dezenas de elementos promovidos a camada própria
 * custa memória de GPU; deixar a promoção ligada depois que a animação
 * acabou é o caminho mais curto para uma página que trava ao rolar.
 */
function blurIn(chars: Element[], stagger: number, from: "start" | "random") {
  gsap.set(chars, { willChange: "filter, opacity, transform" });

  return gsap.fromTo(
    chars,
    { opacity: 0, filter: `blur(${BLUR}px)`, yPercent: 24, scale: 1.06 },
    {
      opacity: 1,
      filter: "blur(0px)",
      yPercent: 0,
      scale: 1,
      ease: "power2.out",
      duration: 0.9,
      stagger: { each: stagger, from },
      onComplete: () => gsap.set(chars, { willChange: "auto", filter: "none" }),
    },
  );
}

/**
 * O masthead da primeira dobra. É o momento de chamar atenção.
 *
 * Letra a letra, saindo do borrão, da esquerda para a direita. É a única vez
 * na página em que a divisão desce ao caractere com a página parada: aqui o
 * título É o conteúdo da tela.
 *
 * `start` existe porque a animação não pode começar junto com o
 * carregamento — ela espera a cortina sair, senão acontece atrás dela e o
 * usuário chega depois do fim.
 */
export function useHeroHeadline<T extends HTMLElement>(start: boolean) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !start || prefersReducedMotion()) return;

    document.documentElement.dataset.anim = "ready";

    const context = gsap.context(() => {
      const revert = split(element, "lines,chars", (self) => {
        blurIn(self.chars, 0.021, "start");

        /* A saída é da rolagem: a manchete desfoca de volta enquanto a
           primeira dobra entrega a página ao texto. O mesmo gesto ao
           contrário — não um fade genérico. */
        gsap.to(self.lines, {
          opacity: 0,
          filter: `blur(${BLUR * 0.6}px)`,
          ease: "none",
          stagger: 0.05,
          scrollTrigger: {
            trigger: element,
            start: "top 10%",
            end: "bottom 4%",
            scrub: 0.5,
          },
        });
      });
      return revert;
    }, element);

    return () => context.revert();
  }, [start]);

  return ref;
}

/**
 * As manchetes de seção. A rolagem é quem revela as letras.
 *
 * Com `scrub`, cada caractere tem a sua fatia do trecho de rolagem: quem
 * desce devagar vê o título entrar em foco palavra por palavra, e quem sobe
 * o vê desfocar de volta. O texto deixa de ser algo que aparece uma vez e
 * passa a ser algo que a rolagem opera.
 *
 * A saída existe, mas é curta e discreta. Texto que some enquanto ainda está
 * sendo lido é hostil; o que se quer é a sensação de a página virar.
 */
export function useScrollSplit<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;

    document.documentElement.dataset.anim = "ready";

    const context = gsap.context(() => {
      const revert = split(element, "lines,chars", (self) => {
        gsap.set(self.chars, { willChange: "filter, opacity, transform" });

        gsap.fromTo(
          self.chars,
          { opacity: 0, filter: `blur(${BLUR}px)`, yPercent: 20 },
          {
            opacity: 1,
            filter: "blur(0px)",
            yPercent: 0,
            ease: "power1.out",
            stagger: { each: 0.012, from: "start" },
            scrollTrigger: {
              trigger: element,
              start: "top 92%",
              end: "top 46%",
              scrub: 0.7,
            },
          },
        );

        gsap.to(self.lines, {
          opacity: 0.12,
          filter: `blur(${BLUR * 0.45}px)`,
          ease: "none",
          stagger: 0.04,
          scrollTrigger: {
            trigger: element,
            start: "bottom 30%",
            end: "bottom 2%",
            scrub: 0.7,
          },
        });
      });
      return revert;
    }, element);

    return () => context.revert();
  }, []);

  return ref;
}

/**
 * Um bloco de texto que entra palavra a palavra, também saindo do borrão.
 *
 * Para decks e frases de fecho. Sem saída: parágrafo que evapora enquanto
 * está sendo lido é o oposto do que esta página quer.
 */
export function useWordReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;

    document.documentElement.dataset.anim = "ready";

    const context = gsap.context(() => {
      const revert = split(element, "lines,words", (self) => {
        gsap.set(self.words, { willChange: "filter, opacity, transform" });

        gsap.fromTo(
          self.words,
          { opacity: 0, filter: "blur(9px)", yPercent: 30 },
          {
            opacity: 1,
            filter: "blur(0px)",
            yPercent: 0,
            duration: 0.8,
            ease: "power2.out",
            stagger: 0.03,
            scrollTrigger: { trigger: element, start: "top 88%", once: true },
            onComplete: () =>
              gsap.set(self.words, { willChange: "auto", filter: "none" }),
          },
        );
      });
      return revert;
    }, element);

    return () => context.revert();
  }, []);

  return ref;
}
