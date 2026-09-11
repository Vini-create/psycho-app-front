import { useReveal } from "@/motion/useReveal";
import { useScrollSplit } from "@/motion/useSplitText";
import { SectionHead } from "./primitives";

/* 02 — Quem somos.

   A parte mais fácil de errar da página inteira, porque é onde a tentação de
   prometer mora. O contrato do CLAUDE.md é explícito: nada de eficácia
   clínica, certificações, número de usuários, depoimentos, preços ou
   funcionalidades inventadas; e nada que sugira substituir acompanhamento
   profissional ou atender emergência.

   A saída editorial é transformar o limite em conteúdo. A lista do que a
   Siouve NÃO é vem do §01 do brandbook, que já a escreve para a identidade
   visual — aqui ela vale para o produto. Dizer o que não se faz é a coisa
   mais confiável que uma plataforma de saúde mental pode publicar, e
   editorialmente é mais forte que qualquer adjetivo. */

const NOT = [
  {
    title: "não é terapia",
    body: "A Siouve não atende, não conduz tratamento e não ocupa o lugar de quem o faz.",
  },
  {
    title: "a Si não diagnostica",
    body: "Ela organiza o que você relatou. Interpretação clínica continua sendo do profissional.",
  },
  {
    title: "não decide por você",
    body: "Nada sai do seu espaço sem uma ação sua. Compartilhar é sempre um gesto explícito.",
  },
  {
    title: "não atende emergências",
    body: "Em situação de risco, procure atendimento imediato. A Siouve não é um canal de urgência.",
  },
];

export function Who() {
  const intro = useReveal<HTMLDivElement>();
  const headline = useScrollSplit<HTMLHeadingElement>();
  const grid = useReveal<HTMLUListElement>({ stagger: 0.07 });

  return (
    <section id="quem-somos" className="frame scroll-mt-24 py-28 sm:py-36">
      <SectionHead index="02" eyebrow="Quem somos" meta="MANIFESTO">
        <div ref={intro} className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="flex flex-col gap-8 lg:col-span-7">
            <h2
              ref={headline}
              className="font-editorial text-h1-editorial text-primary"
            >
              O que você vive ganha continuidade.
            </h2>

            <div className="reveal flex flex-col gap-5">
              <p className="text-body-l text-secondary">
                A Siouve reúne o que você registra ao longo do tempo em um
                contexto que pode ser lido, corrigido e retomado. Sem transformar
                sua experiência em diagnóstico, nota ou desempenho.
              </p>
              <p className="text-body-l text-secondary">
                Quando você decide compartilhar, o profissional recebe uma
                leitura organizada do período e consegue retomar os assuntos
                que importam. Você continua no controle do que sai do seu espaço.
              </p>
            </div>

            {/* A tese em serif grande — o PullQuote do produto, §17. */}
            <blockquote className="reveal mt-2 border-l border-accent-lavender/50 pl-6">
              <p className="font-editorial text-h3 text-balance text-primary italic">
                O que importa não deveria depender do que você conseguiu lembrar.
              </p>
              <footer className="type-meta mt-3 text-tertiary">Si</footer>
            </blockquote>
          </div>

          {/* A coluna da direita fica VAZIA de propósito.

              Antes havia aqui uma marca-d'água em SVG. Ela saiu quando a
              peça de cromo passou a atravessar a página: a trilha do WebGL
              tem um ponto exatamente nesta seção, e duas marcas-d'água no
              mesmo lugar são uma a mais. O espaço em branco do §08 não é
              buraco — é o respiro que a peça vem ocupar. */}
        </div>
      </SectionHead>

      <div className="mt-24 sm:mt-32">
        <div className="hairline-t flex items-baseline gap-4 pt-4">
          <p className="type-eyebrow text-tertiary">O que a Siouve não é</p>
          <span className="leader" aria-hidden="true" />
          <span className="type-meta shrink-0 text-tertiary">04 LIMITES</span>
        </div>

        <ul ref={grid} className="mt-10 grid gap-px bg-hairline sm:grid-cols-2 xl:grid-cols-4">
          {NOT.map((item, index) => (
            <li
              key={item.title}
              className="reveal flex flex-col gap-3 bg-ambient p-6 sm:p-7"
            >
              <span className="type-meta text-hairline-strong">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-h3 text-primary">{item.title}</h3>
              <p className="text-body text-secondary">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
