import { FolderStack, type Folder } from "./FolderStack";
import { useReveal } from "@/motion/useReveal";
import { useScrollSplit } from "@/motion/useSplitText";
import { SectionHead } from "./primitives";

/* 03 — O que oferecemos.

   Quatro pastas, e cada uma existe no produto. A checagem foi feita contra o
   código e o README antes de virar texto de marketing, que é o que o
   CLAUDE.md exige: conversa em streaming com a Si, check-ins diários
   autorados pelo profissional com aceite explícito, relatórios de contexto
   por período com proveniência e limitações declaradas, e escopos de
   compartilhamento por vínculo com revogação.

   Nada aqui promete eficácia, número ou resultado. Cada folha descreve um
   gesto que a plataforma de fato executa.

   Os tons são os quatro do §09 — lavanda, sage, clay e dark —, exatamente os
   da navegação do aplicativo do paciente, aplicados pela mesma
   `paperSurface()` que o produto usa. As âncoras são irregulares porque
   arquivo de verdade não é tabulado por planilha. */

const FOLDERS: readonly Folder[] = [
  {
    id: "conversa",
    label: "A conversa",
    anchor: 0.02,
    tone: "lavender",
    eyebrow: "Com a Si",
    audience: "PACIENTE",
    title: "Comece de onde você está.",
    body: "Conte o que aconteceu do seu jeito, mesmo que pareça confuso ou incompleto. A Si conversa com você e ajuda a manter o fio do que foi dito — sem diagnosticar e sem ocupar o lugar de quem acompanha você.",
    points: [
      "Uma frase já pode ser o começo; você não precisa organizar tudo antes.",
      "As conversas ficam reunidas para você retomar o assunto depois.",
      "Você pode renomear e excluir o que quiser, quando quiser.",
    ],
  },
  {
    id: "checkins",
    label: "Os check-ins",
    anchor: 0.26,
    tone: "sage",
    eyebrow: "Perguntas curtas",
    audience: "PACIENTE · PROFISSIONAL",
    title: "Perguntas de quem conhece seu acompanhamento.",
    body: "Os check-ins são preparados pelo seu profissional para acompanhar pontos específicos do período. Você escolhe quando responder, pode rever suas respostas e continua no controle do envio.",
    points: [
      "Cada check-in tem perguntas definidas pelo profissional.",
      "Responder é sempre voluntário.",
      "O compartilhamento depende da sua autorização.",
    ],
  },
  {
    id: "contexto",
    label: "O contexto",
    anchor: 0.52,
    tone: "clay",
    eyebrow: "Entre sessões",
    audience: "PROFISSIONAL",
    title: "A próxima sessão não precisa começar do zero.",
    body: "Com sua autorização, o profissional recebe um contexto organizado do período solicitado. Cada ponto mantém sua origem e seus limites, para apoiar a conversa sem substituir a leitura clínica.",
    points: [
      "O pedido cobre um período definido.",
      "Cada ponto pode ser conferido na origem.",
      "Os limites do contexto ficam explícitos.",
    ],
  },
  {
    id: "permissoes",
    label: "As permissões",
    anchor: 0.76,
    tone: "dark",
    eyebrow: "O que sai daqui",
    audience: "PACIENTE",
    title: "Você escolhe o que atravessa essa porta.",
    body: "O profissional pode solicitar contexto, mas o envio depende de uma ação sua. Cada vínculo tem permissões próprias, que você pode revisar ou revogar quando quiser.",
    points: [
      "Você aceita cada vínculo individualmente.",
      "Cada profissional recebe apenas o que foi autorizado para aquela relação.",
      "Revogar uma permissão não apaga seus registros.",
    ],
  },
];

export function Offer() {
  const intro = useReveal<HTMLDivElement>();
  const headline = useScrollSplit<HTMLHeadingElement>();

  return (
    <section id="oferecemos" className="frame scroll-mt-24 py-28 sm:py-36">
      <SectionHead index="03" eyebrow="O que oferecemos" meta="04 PASTAS">
        <div ref={intro} className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2
              ref={headline}
              className="font-editorial text-h1-editorial text-primary"
            >
              Cada parte do intervalo encontra o seu lugar.
            </h2>
          </div>

          <div className="reveal flex flex-col gap-4 lg:col-span-4 lg:col-start-9 rule-l">
            <p className="text-body text-secondary">
              Conversas, check-ins, contexto e permissões trabalham juntos para
              que o que aconteceu entre sessões possa ser retomado com clareza.
            </p>
            <p className="type-meta text-tertiary">
              Clique nas abas, ou use as setas do teclado.
            </p>
          </div>
        </div>
      </SectionHead>

      <div className="mt-16 sm:mt-20">
        <FolderStack folders={FOLDERS} />
      </div>
    </section>
  );
}
