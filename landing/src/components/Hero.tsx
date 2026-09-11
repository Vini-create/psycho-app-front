import { APP_URL, PRO_URL } from "@/lib/links";
import { useReveal } from "@/motion/useReveal";
import { useHeroHeadline, useWordReveal } from "@/motion/useSplitText";
import { Action, Arrow, MetaStrip } from "./primitives";

/* A primeira dobra.

   §06 pede uma manchete, um eixo e um silêncio; §08 pede que a dobra ocupe
   pelo menos 65% da largura útil com estrutura intencional. Aqui a manchete
   toma a esquerda, a peça de cromo do WebGL toma a direita, e a faixa
   técnica de rodapé fecha a composição de ponta a ponta — não sobra buraco
   morto no meio, que é o erro que o §08 nomeia.

   O contraste de família da manchete é regra, não enfeite (§06): a parte
   estrutural é Archivo, a parte humana é Newsreader em itálico. Duas
   famílias, mais a mono da metadata. Três por viewport — o teto do §05. */

export function Hero({ start }: { start: boolean }) {
  const headline = useHeroHeadline<HTMLHeadingElement>(start);
  const body = useReveal<HTMLDivElement>({ stagger: 0.07 });
  const deck = useWordReveal<HTMLParagraphElement>();

  return (
    <section
      id="topo"
      className="relative flex min-h-dvh flex-col justify-center pt-28 pb-12 sm:pt-32"
    >
      <div className="frame w-full">
        <div className="grid gap-y-10 lg:grid-cols-12">
          <div className="flex flex-col gap-8 lg:col-span-8 xl:col-span-7">
            <div ref={body} className="flex flex-col gap-8">
              <p className="type-eyebrow reveal flex flex-wrap items-center gap-x-3 gap-y-1 text-tertiary">
                <span className="text-accent-lavender">◆</span>
                <span>Contexto contínuo entre sessões</span>
              </p>

              <h1
                ref={headline}
                className="font-display text-display-2xl text-primary"
              >
                A vida acontece{" "}
                <em className="font-editorial font-normal italic tracking-[-0.03em] text-accent-lavender">
                  entre uma sessão
                </em>{" "}
                e outra.
              </h1>

              <p ref={deck} className="measure text-body-l text-secondary">
                Registre o que viveu, converse com a Si e escolha o que
                compartilhar com quem acompanha você. Na próxima sessão, o
                contexto não precisa depender só da memória.
              </p>

              <div className="reveal flex flex-wrap items-center gap-3">
                <Action href={APP_URL} size="lg">
                  Entrar
                  <Arrow className="transition-transform duration-[--duration-fast] group-hover/action:translate-x-0.5" />
                </Action>
                <Action href={PRO_URL} variant="outline" size="lg">
                  Sou profissional
                </Action>
              </div>

              <MetaStrip
                className="reveal"
                items={["privado por princípio", "sob seu controle", "sem diagnóstico"]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Faixa técnica de rodapé da dobra — o enquadramento das referências
          3 e 10. Ela não decora: carrega o que a página é, e serve de régua
          inferior para a composição inteira. */}
      <div className="frame mt-auto w-full pt-16">
        <dl className="hairline-t type-meta grid grid-cols-2 gap-x-6 gap-y-4 pt-4 text-tertiary md:grid-cols-4">
          {[
            ["PLATAFORMA", "Contexto longitudinal"],
            ["PACIENTE", "Registro, conversa e check-ins"],
            ["PROFISSIONAL", "Leitura entre sessões"],
            ["COMPARTILHAMENTO", "Só com autorização"],
          ].map(([term, value]) => (
            <div key={term} className="flex flex-col gap-1.5">
              <dt className="text-hairline-strong">{term}</dt>
              <dd className="text-secondary">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
