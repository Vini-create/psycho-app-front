"use client";

import { useRef } from "react";
import { formatTime, useEnterOnMount } from "@sinapsa/ui";
import type { Message } from "@sinapsa/api-client";
import type { ReactNode } from "react";

/* Brand Book V2 §19 — "Diário conversacional, não mensageiro."

   O princípio: o chat deve parecer uma página onde uma conversa está sendo
   escrita ao longo do tempo. Não é WhatsApp e não é ChatGPT.

   Duas vozes, duas naturezas tipográficas — e essa é a decisão inteira:

   - a Si não tem bolha. O que ela responde é tipografado direto na
     página, em Newsreader 18–20, na medida de leitura. Texto numa folha.
   - a pessoa escreve num bloco pastel assimétrico, à direita, com no máximo
     72% da coluna no desktop. É um recado colado na página, com matéria.

   Bolhas simétricas dos dois lados atenderiam a letra de "distinguir quem
   fala" e errariam o espírito: viram messenger, e o produto é editorial. */

export function MessageBubble({
  message,
  footer,
  showTime,
  entering = false,
}: {
  message: Message;
  footer?: ReactNode;
  /** Só a última mensagem de um bloco mostra a hora — o resto é ruído. */
  showTime?: boolean;
  /**
   * Mensagem que chegou com a conversa já aberta. Só ela anima: encenar a
   * entrada do histórico inteiro a cada abertura seria irritante (§20).
   */
  entering?: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  useEnterOnMount(ref, { enabled: entering });
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <li
        ref={ref}
        data-message-id={message.id}
        className="flex flex-col items-end gap-2"
      >
        <div
          className={[
            // 72% desktop / 88% mobile — §19.
            "max-w-[88%] sm:max-w-[72%]",
            // radius.md com um canto fechado: a assimetria que o brandbook
            // pede, e que faz o bloco apontar para quem escreveu.
            "rounded-md rounded-br-xs bg-message-user px-5 py-4",
            "text-body-l whitespace-pre-wrap text-on-panel",
          ].join(" ")}
        >
          <span className="sr-only">Você escreveu:</span>
          {message.content}
        </div>

        {(showTime || footer) && (
          <div className="flex flex-row-reverse flex-wrap items-center justify-start gap-x-4 gap-y-1">
            {showTime && (
              <time dateTime={message.created_at} className="type-meta text-tertiary">
                {formatTime(message.created_at)}
              </time>
            )}
            {footer}
          </div>
        )}
      </li>
    );
  }

  return (
    <li ref={ref} data-message-id={message.id} className="flex flex-col gap-2">
      {/* Sem container, sem filete, sem avatar. A resposta É a página. */}
      <div className="measure font-editorial text-body-l whitespace-pre-wrap text-primary">
        <span className="sr-only">Si respondeu:</span>
        {message.content}
        {message.generation_status === "pending" && (
          <span aria-hidden="true" className="si-stream-caret ml-1 inline-block h-[1em] w-px bg-accent-lavender align-[-0.12em]" />
        )}
      </div>

      {(showTime || footer) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {showTime && (
            <time dateTime={message.created_at} className="type-meta text-tertiary">
              {formatTime(message.created_at)}
            </time>
          )}
          {footer}
        </div>
      )}
    </li>
  );
}

/**
 * Marca temporal — §19, "tempo como elemento visual".
 *
 * Alinhada à esquerda, com um único filete que corre até a margem. O
 * separador centrado entre dois filetes é gramática de mensageiro; este é
 * um índice de seção editorial que por acaso marca um dia.
 */
export function DaySeparator({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-4 pt-4">
      <span className="type-eyebrow shrink-0 text-tertiary">{label}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-hairline" />
    </li>
  );
}

/** Abertura da conversa: a página em branco precisa convidar. */
export function ConversationOpening() {
  return (
    <li className="flex flex-col gap-4 pb-2">
      <p className="type-eyebrow text-tertiary">Este espaço é seu</p>
      <p className="font-editorial text-h2 text-balance text-primary">
        Conte como foi.
      </p>
      <p className="measure text-body-l text-secondary">
        Não precisa ser organizado, importante, nem bonito de ler. O que vier
        já serve. Seu histórico bruto nunca é aberto ao profissional.
      </p>
    </li>
  );
}
