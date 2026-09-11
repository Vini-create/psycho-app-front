import { useLayoutEffect, useRef } from "react";

import { cx } from "@/lib/cx";
import { gsap, prefersReducedMotion } from "@/motion/gsap";
import { useReveal } from "@/motion/useReveal";
import { useScrollSplit, useWordReveal } from "@/motion/useSplitText";
import { SectionHead } from "./primitives";

/* 01 — O intervalo. O storytelling da página.

   A premissa não é invenção de marketing: está no README do produto. "Um
   contexto importante costuma se perder entre as consultas: acontecimentos
   são esquecidos, padrões são difíceis de reconstruir, e a próxima conversa
   depende do que a pessoa consegue lembrar naquele momento."

   A seção mostra isso em vez de afirmar. Catorze dias em régua; alguns
   trazem um fragmento do que aconteceu; e, conforme a rolagem avança, os
   fragmentos se apagam — exatamente o que o intervalo faz com eles. O que
   sobra no fim é o que a memória entrega à sessão seguinte.

   O movimento aqui é scrub: ele é a informação, não o enfeite. Por isso é o
   único lugar da página onde a amplitude passa dos 24px — e mesmo assim, sob
   `prefers-reduced-motion` a seção não anima nada e mostra os catorze
   fragmentos legíveis de uma vez, que é a leitura correta sem o gesto. */

interface Day {
  day: string;
  note?: string;
  /* Quanto o fragmento resiste. Os que têm peso alto são os que a pessoa
     ainda lembraria; é isso que separa "sumiu tudo" de "sobrou o que foi
     mais forte", que é como a memória de fato se comporta. */
  hold?: number;
}

const DAYS: Day[] = [
  { day: "01", note: "a conversa difícil no trabalho" },
  { day: "02" },
  { day: "03", note: "dormiu mal de novo" },
  { day: "04", note: "o comentário da sua mãe", hold: 0.35 },
  { day: "05" },
  { day: "06", note: "um dia bom, sem motivo claro" },
  { day: "07", note: "evitou responder o grupo" },
  { day: "08" },
  { day: "09", note: "a crise de sexta à noite", hold: 0.85 },
  { day: "10", note: "voltou a correr" },
  { day: "11" },
  { day: "12", note: "brigou por uma bobagem" },
  { day: "13", note: "quase cancelou a sessão", hold: 0.5 },
  { day: "14" },
];

export function Interval() {
  const head = useReveal<HTMLDivElement>();
  const headline = useScrollSplit<HTMLHeadingElement>();
  const stripRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip || prefersReducedMotion()) return;

    const context = gsap.context(() => {
      const notes = gsap.utils.toArray<HTMLElement>("[data-note]");

      notes.forEach((note) => {
        const hold = Number(note.dataset.hold ?? 0);

        /* Cada fragmento tem o seu próprio trecho de rolagem para sumir. O
           `hold` empurra o início para frente: o que é mais marcante demora
           mais a apagar, e o intervalo termina com poucos sobreviventes. */
        gsap.to(note, {
          opacity: 0.07,
          filter: "blur(3px)",
          y: -6,
          ease: "none",
          scrollTrigger: {
            trigger: strip,
            start: `top ${68 - hold * 26}%`,
            end: `bottom ${34 - hold * 20}%`,
            scrub: 0.8,
          },
        });
      });

      /* A régua se acende da esquerda para a direita: é o tempo passando,
         e é o que dá sentido ao apagamento acontecendo em cima dela. */
      gsap.from("[data-rule]", {
        scaleX: 0,
        transformOrigin: "left center",
        ease: "none",
        scrollTrigger: {
          trigger: strip,
          start: "top 78%",
          end: "bottom 60%",
          scrub: 0.5,
        },
      });
    }, strip);

    return () => context.revert();
  }, []);

  return (
    <section id="intervalo" className="frame scroll-mt-24 py-28 sm:py-36">
      <SectionHead index="01" eyebrow="O intervalo" meta="14 DIAS">
        <div ref={head} className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2
              ref={headline}
              className="font-editorial text-h1-editorial text-primary"
            >
              A vida não espera a próxima sessão. A memória entrega só uma
              parte dela.
            </h2>
          </div>

          <div className="reveal flex flex-col gap-5 lg:col-span-4 lg:col-start-9 rule-l">
            <p className="text-body text-secondary">
              Uma conversa difícil, uma noite sem dormir, um dia que surpreendeu.
              No momento da sessão, nem sempre é fácil reconstruir o que
              aconteceu e como cada coisa foi sentida.
            </p>
            <p className="text-body text-secondary">
              A Siouve dá um lugar a esses registros enquanto eles ainda estão
              próximos de você.
            </p>
          </div>
        </div>
      </SectionHead>

      {/* A régua. No telefone ela rola na horizontal em vez de espremer
          catorze colunas em 320px — o gesto continua, a leitura também. */}
      <div ref={stripRef} className="mt-20 sm:mt-28">
        <div
          data-rule
          className="h-px w-full bg-linear-to-r from-accent-lavender/60 via-hairline-strong to-transparent"
        />

        <ol className="-mx-[--gutter] flex snap-x gap-0 overflow-x-auto px-[--gutter] pb-4 md:mx-0 md:grid md:grid-cols-7 md:overflow-visible md:px-0 lg:grid-cols-14">
          {DAYS.map((entry) => (
            <li
              key={entry.day}
              className="hairline-l flex min-h-52 w-[9.5rem] shrink-0 snap-start flex-col gap-3 px-3 pt-3 md:w-auto"
            >
              <span className="type-meta text-hairline-strong">{entry.day}</span>
              {entry.note && (
                <span
                  data-note
                  data-hold={entry.hold ?? 0}
                  className={cx(
                    "font-editorial text-[0.95rem] leading-snug text-balance",
                    entry.hold && entry.hold > 0.6
                      ? "text-primary"
                      : "text-secondary",
                  )}
                >
                  {entry.note}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>

      <ClosingLine />
    </section>
  );
}

/** A virada da seção: o que a Siouve faz com o intervalo.

    Palavra a palavra, e não um fade do bloco inteiro: esta é a frase que
    responde os catorze dias que acabaram de se apagar acima, e ela merece
    ser montada na frente do leitor. */
function ClosingLine() {
  const ref = useWordReveal<HTMLParagraphElement>();

  return (
    <p
      ref={ref}
      className="mt-16 max-w-(--container-read) font-editorial text-h2 text-balance text-primary sm:mt-20"
    >
      Menos tempo da consulta reconstruindo o que aconteceu. Mais tempo para
      falar sobre o que importa.
    </p>
  );
}
