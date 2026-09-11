import { APP_URL, PRO_URL } from "@/lib/links";
import { useReveal } from "@/motion/useReveal";
import { Action, Arrow, SectionHead } from "./primitives";

/* 04 — Por onde entrar.

   A razão de a landing existir no domínio raiz. Duas portas, lado a lado,
   com o mesmo peso visual: quem chega em siouve.com pode ser qualquer um dos
   dois públicos, e a página não deve fazer o profissional procurar a dele
   num rodapé.

   As duas ações da barra reaparecem aqui em tamanho grande. Repetir não é
   redundância: quem rolou a página inteira está no momento de decidir, e
   mandar essa pessoa de volta ao topo seria perder a decisão no caminho. */

const DOORS = [
  {
    id: "paciente",
    eyebrow: "Para quem escreve",
    title: "Paciente",
    body: "Seu espaço para registrar o que viveu, conversar com a Si e responder aos check-ins de quem acompanha você. Você decide o que compartilhar.",
    points: ["Conversa e registro", "Check-ins do seu profissional", "Controle do que é compartilhado"],
    cta: "Entrar",
    href: APP_URL,
    domain: "app.siouve.com",
    accent: "var(--color-accent-lavender)",
    surface: "#4f455b",
    variant: "primary" as const,
  },
  {
    id: "profissional",
    eyebrow: "Para quem acompanha",
    title: "Profissional",
    body: "Receba o contexto que o paciente escolheu compartilhar, crie check-ins e retome a próxima sessão com uma visão mais clara do intervalo.",
    points: ["Relatórios de contexto por período", "Autoria dos check-ins", "Convites, vínculos e acessos"],
    cta: "Sou profissional",
    href: PRO_URL,
    domain: "pro.siouve.com",
    accent: "var(--color-accent-sage)",
    surface: "#465045",
    variant: "outline" as const,
  },
];

export function Doors() {
  const grid = useReveal<HTMLDivElement>({ stagger: 0.1 });

  return (
    <section id="portas" className="frame scroll-mt-24 py-28 sm:py-36">
      <SectionHead index="04" eyebrow="Por onde entrar" meta="02 PORTAS">
        <div ref={grid} className="grid gap-px bg-hairline lg:grid-cols-2">
          {DOORS.map((door) => (
            <article
              key={door.id}
              className="reveal group/door relative flex flex-col gap-8 overflow-hidden bg-ambient p-8 sm:p-10 lg:p-12"
            >
              {/* O pastel entra como um sopro na quina, não como fundo do
                  card: §04 reserva 10–20% da tela ao pastel, e dois painéis
                  cheios lado a lado estourariam isso sozinhos. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full opacity-25 blur-3xl transition-opacity duration-[--duration-folder] ease-[--ease-enter] group-hover/door:opacity-40"
                style={{ backgroundColor: door.surface }}
              />

              <div className="relative flex flex-col gap-4">
                <p className="type-eyebrow flex items-center gap-3 text-tertiary">
                  <span style={{ color: door.accent }}>◆</span>
                  {door.eyebrow}
                </p>
                <h3 className="font-display text-display-xl text-primary">
                  {door.title}
                </h3>
              </div>

              <p className="relative measure-narrow text-body-l text-secondary">
                {door.body}
              </p>

              <ul className="relative flex flex-col">
                {door.points.map((point) => (
                  <li
                    key={point}
                    className="hairline-t type-meta flex items-center gap-3 py-3 text-secondary"
                  >
                    <span className="size-1 rounded-full" style={{ backgroundColor: door.accent }} />
                    {point}
                  </li>
                ))}
              </ul>

              <div className="relative mt-auto flex flex-wrap items-center gap-4 pt-2">
                <Action href={door.href} variant={door.variant} size="lg">
                  {door.cta}
                  <Arrow className="transition-transform duration-[--duration-fast] group-hover/action:translate-x-0.5" />
                </Action>
                <span className="type-meta text-tertiary">{door.domain}</span>
              </div>
            </article>
          ))}
        </div>
      </SectionHead>
    </section>
  );
}
