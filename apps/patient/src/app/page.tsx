"use client";

import Link from "next/link";
import {
  Alert,
  EmptyState,
  Metadata,
  Overline,
  Prose,
  Skeleton,
  TextureLayer,
  buttonStyles,
  formatDayLabel,
} from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { ConsentGate } from "@/components/ConsentGate";
import { useConversations } from "@/lib/queries";
import { useSession } from "@/lib/session";
import { EditorialReveal } from "@/components/EditorialReveal";
import { RotatingPhrase } from "@/components/RotatingPhrase";

function Conversas() {
  const { account } = useSession();
  const { data, isPending, error } = useConversations();

  const conversations = data?.conversations ?? [];
  const firstName = account?.display_name.split(" ")[0];

  return (
    <EditorialReveal>
      <div className="flex flex-col gap-16 sm:gap-20">
        <section className="grid border-y border-border-subtle lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
          <div className="flex min-h-[31rem] flex-col justify-between py-8 pr-0 lg:py-12 lg:pr-12">
            <div className="js-editorial-reveal flex items-center justify-between gap-4">
              <Overline>Seu espaço · edição particular</Overline>
              <Metadata>Nº 01</Metadata>
            </div>

            <div className="flex flex-col gap-6 py-12">
              <h1 className="js-editorial-reveal font-editorial text-display-xl leading-[0.92] tracking-[-0.04em] text-primary text-balance">
                {firstName ? `Olá, ${firstName}.` : "Olá."}
                <span className="mt-3 block font-normal italic text-brand">
                  <RotatingPhrase />
                </span>
              </h1>
              <Prose className="js-editorial-reveal max-w-[48ch] text-body-lg">
                <p>
                  Escreva sem organizar antes. O que parecer pequeno, confuso
                  ou inacabado também pode começar uma boa conversa.
                </p>
              </Prose>
            </div>

            <div className="js-editorial-reveal flex flex-wrap items-center gap-4">
              <Link href="/chat" className={buttonStyles({ size: "lg" })}>
                Conversar com a Sinapsa
              </Link>
              <Metadata>privado · no seu ritmo · sob seu controle</Metadata>
            </div>
          </div>

          <div className="js-editorial-reveal relative -mx-5 min-h-[25rem] overflow-hidden rounded-t-[4.5rem] border-x border-t border-border-subtle bg-inverse lg:mx-0 lg:min-h-[31rem] lg:rounded-t-none lg:rounded-bl-[6rem] lg:border-r-0 lg:border-y-0 lg:border-l">
            <TextureLayer variant="chromatic" />
            <div className="absolute inset-0 flex flex-col justify-between p-8 text-on-action sm:p-10">
              <div className="flex items-center justify-between gap-3">
                <span className="type-overline rounded-sm bg-action/80 px-2 py-1 text-on-action backdrop-blur-sm">Sinapsa.</span>
                <span className="metadata rounded-sm bg-action/80 px-2 py-1 text-on-action backdrop-blur-sm">AGORA</span>
              </div>
              <p className="max-w-[12ch] font-editorial text-heading-xl font-normal italic leading-[1.02]">
                Aqui, sentir não precisa virar desempenho.
              </p>
            </div>
          </div>
        </section>

        {error && <Alert tone="danger">{describeError(error).message}</Alert>}
        <section className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
          <div className="js-editorial-reveal flex flex-col gap-4">
            <Overline as="h2" className="text-secondary">Índice recente</Overline>
            <p className="font-editorial text-heading-lg leading-tight text-primary">
              Retome de onde a ideia ficou.
            </p>
            <Metadata>{conversations.length} registros neste caderno</Metadata>
          </div>

          <div className="js-editorial-reveal">

            {isPending && (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-24" aria-label="Carregando conversas" />
                <Skeleton className="h-24" />
              </div>
            )}

            {!isPending && conversations.length === 0 && (
              <EmptyState
                title="A primeira página ainda está em branco."
                description="Quando você começar, suas conversas aparecem aqui como um índice para retomar quando quiser."
                action={
                  <Link href="/chat" className={buttonStyles()}>
                    Começar a conversar
                  </Link>
                }
              />
            )}

            {conversations.length > 0 && (
              <ol className="divide-y divide-border-subtle border-y border-border-subtle">
                {conversations.map((conversation, index) => (
                  <li key={conversation.id}>
                    <Link href={`/chat?c=${conversation.id}`} className="group grid min-h-24 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 py-4 sm:grid-cols-[3.5rem_minmax(0,1fr)_10rem_2rem] sm:gap-5">
                      <span className="metadata text-brand">{String(index + 1).padStart(2, "0")}</span>
                      <span className="font-editorial text-heading-md font-medium leading-tight text-primary transition-[font-style,transform] group-hover:translate-x-1 group-hover:italic">
                        {conversation.title}
                      </span>
                      <Metadata className="hidden text-right sm:block">
                        {formatDayLabel(conversation.updated_at)}
                      </Metadata>
                      <span className="font-editorial text-heading-md text-brand" aria-hidden="true">↗</span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>
    </EditorialReveal>
  );
}

export default function HomePage() {
  return (
    <AuthGate>
      <AppShell>
        <ConsentGate>
          <Conversas />
        </ConsentGate>
      </AppShell>
    </AuthGate>
  );
}
