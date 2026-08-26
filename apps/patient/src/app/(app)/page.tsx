"use client";

import Link from "next/link";
import {
  Alert,
  EditorialList,
  EditorialRow,
  Masthead,
  MetaStrip,
  PullQuote,
  SectionIndex,
  Skeleton,
  buttonStyles,
  formatDayMark,
  pluralize,
} from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { TodayCheckins } from "@/components/checkin/TodayCheckins";
import { localDay, useCheckins, useConversations } from "@/lib/queries";
import { useSession } from "@/lib/session";

/* Brand Book V2 §08, §14 e §17.

   Esta é a página que dá ao paciente um motivo de abrir o Sinapsa além de
   digitar no chat: o índice do próprio caderno. Ela responde "o que eu já
   escrevi e onde parei", que é uma pergunta diferente de "o que eu quero
   escrever agora".

   O que saiu do V1:

   - o painel escuro com textura forte e a frase em itálico dentro dele. Um
     bloco preto de 31rem ao lado do título é hero decorativo — §53. A frase
     continua na página, agora como PullQuote, que é o lugar editorial dela.
   - a frase rotativa. Texto que troca sozinho é movimento que atrapalha a
     leitura (§27) e não carrega informação.
   - a coreografia de entrada em GSAP, substituída pelo `.reveal` em CSS. */

function Caderno() {
  const { account } = useSession();
  const { data, isPending, error } = useConversations();
  // A mesma consulta da seção de check-in; o TanStack resolve as duas com uma
  // requisição. Aqui ela serve só para numerar as seções na ordem certa.
  const checkins = useCheckins(localDay());

  const conversations = data?.conversations ?? [];
  const firstName = account?.display_name.split(" ")[0];
  const hasCheckins = (checkins.data?.checkins.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-14 sm:gap-20">
      <Masthead
        className="reveal pt-2"
        eyebrow="Seu caderno"
        tone="editorial"
        deck="Escreva sem organizar antes. O que parecer pequeno, confuso ou inacabado também pode começar uma boa conversa."
        meta={
          <MetaStrip
            className="md:justify-end"
            items={["privado", "no seu ritmo", "sob seu controle"]}
          />
        }
        actions={
          <Link href="/chat" className={buttonStyles({ size: "lg" })}>
            Conversar com a Si
          </Link>
        }
      >
        {firstName ? `Olá, ${firstName}.` : "Olá."}
      </Masthead>

      <div className="reveal reveal-1">
        <PullQuote attribution="Si">
          Aqui, sentir não precisa virar desempenho.
        </PullQuote>
      </div>

      {error && <Alert tone="danger">{describeError(error).message}</Alert>}

      <div className="reveal reveal-2">
        <TodayCheckins index="01" />
      </div>

      <section className="reveal reveal-3 flex flex-col gap-2">
        <SectionIndex
          index={hasCheckins ? "02" : "01"}
          meta={
            conversations.length > 0
              ? pluralize(conversations.length, "registro", "registros")
              : undefined
          }
        >
          Retome de onde a ideia ficou
        </SectionIndex>

        {isPending && (
          <div className="flex flex-col gap-3 pt-4">
            <Skeleton className="h-20" aria-label="Carregando conversas" />
            <Skeleton className="h-20" />
          </div>
        )}

        {!isPending && conversations.length === 0 && (
          <div className="flex flex-col items-start gap-5 py-12">
            <h3 className="max-w-[24ch] font-editorial text-h2 text-balance text-primary">
              A primeira página ainda está em branco.
            </h3>
            <p className="measure text-body-l text-secondary">
              Quando você começar, suas conversas aparecem aqui como um índice
              para retomar quando quiser, sem precisar reler tudo.
            </p>
            <Link href="/chat" className={buttonStyles()}>
              Começar a conversar
            </Link>
          </div>
        )}

        {conversations.length > 0 && (
          <EditorialList as="ol" className="border-t-0">
            {conversations.map((conversation, index) => (
              <li key={conversation.id}>
                <EditorialRow
                  href={`/chat?c=${conversation.id}`}
                  linkComponent={Link}
                  lead={String(index + 1).padStart(2, "0")}
                  title={conversation.title}
                  meta={
                    <MetaStrip
                      className="md:justify-end"
                      items={[formatDayMark(conversation.updated_at)]}
                    />
                  }
                />
              </li>
            ))}
          </EditorialList>
        )}
      </section>
    </div>
  );
}

export default function HomePage() {
  return <Caderno />;
}
