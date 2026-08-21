import { formatTime } from "@sinapsa/ui";
import type { Message } from "@sinapsa/api-client";
import type { ReactNode } from "react";

/**
 * A conversa é lida, não "trocada".
 *
 * design.md §8 pede fundo de marca para o paciente e superfície neutra para a
 * Sinapsa, sem avatar humano. Duas bolhas simétricas atendem a letra da regra
 * e erram o espírito: viram messenger, e o produto é editorial.
 *
 * Então: o que a pessoa escreve tem a forma de um recado — bloco de marca,
 * alinhado à direita, curto. O que a Sinapsa responde é tipografado na página,
 * em medida de leitura, com um filete roxo no lugar do avatar. Uma voz escreve
 * bilhetes; a outra responde em prosa.
 */
export function MessageBubble({
  message,
  footer,
  showTime,
}: {
  message: Message;
  footer?: ReactNode;
  /** Só a última mensagem de um bloco mostra a hora — o resto é ruído. */
  showTime?: boolean;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <li data-message-id={message.id} className="flex flex-col items-end gap-1.5">
        <div className="isolate max-w-[min(85%,34rem)] transform-gpu overflow-hidden rounded-xl rounded-br-sm bg-brand-surface px-5 py-3.5 text-body-lg whitespace-pre-wrap text-primary [backface-visibility:hidden] [background-clip:padding-box]">
          <span className="sr-only">Você escreveu:</span>
          {message.content}
        </div>
        {(showTime || footer) && (
          <div className="flex flex-row-reverse flex-wrap items-center justify-start gap-x-3 gap-y-1">
            {showTime && (
              <time dateTime={message.created_at} className="metadata text-secondary">
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
    <li data-message-id={message.id} className="flex flex-col gap-1.5">
      <div className="flex gap-4">
        {/* O filete substitui o avatar: marca quem fala sem inventar um rosto. */}
        <span
          aria-hidden="true"
          className="mt-1.5 w-px shrink-0 self-stretch bg-brand-surface-strong"
        />
        <div className="text-body-lg whitespace-pre-wrap text-primary">
          <span className="sr-only">Sinapsa respondeu:</span>
          {message.content}
        </div>
      </div>
      {(showTime || footer) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-5">
          {showTime && (
            <time dateTime={message.created_at} className="metadata text-secondary">
              {formatTime(message.created_at)}
            </time>
          )}
          {footer}
        </div>
      )}
    </li>
  );
}

/** Separador de dia. Filete fino e data em mono — marca de página. */
export function DaySeparator({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-4 pt-6 pb-2" aria-hidden="true">
      <span className="h-px flex-1 bg-border-subtle" />
      <span className="metadata uppercase tracking-[0.12em] text-secondary">
        {label}
      </span>
      <span className="h-px flex-1 bg-border-subtle" />
    </li>
  );
}

/** Abertura da conversa: a página em branco precisa convidar. */
export function ConversationOpening() {
  return (
    <li className="flex flex-col gap-3 pb-4">
      <p className="type-overline max-w-none text-brand">Este espaço é seu</p>
      <p className="font-editorial text-heading-lg text-primary text-balance">
        Conte como foi.
      </p>
      <p className="text-body-md text-secondary">
        Não precisa ser organizado, importante, nem bonito de ler. O que vier
        já serve — seu histórico bruto nunca é aberto ao profissional.
      </p>
    </li>
  );
}
