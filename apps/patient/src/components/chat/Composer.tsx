"use client";

import {
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type SVGProps,
} from "react";
import { cx } from "@sinapsa/ui";

const MAX_LENGTH = 8_000;
const MAX_ROWS_PX = 168;

function SendIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 19V5" />
      <path d="m6.5 10.5 5.5-5.5 5.5 5.5" />
    </svg>
  );
}

/* Brand Book V2 §19 — "Composer: linha/painel baixo integrado à moldura;
   52–64px."

   O V1 era uma pílula flutuante com sombra pesada, pairando sobre a
   conversa. Isso é a gramática de mensageiro que o §19 recusa, e a sombra
   contraria o §12 ("sombra é rara; borda antes de sombra").

   O composer é o instrumento no rodapé da folha: uma superfície própria,
   de baixa elevação, com foco aplicado ao conjunto inteiro. A escrita
   continua na serif de leitura e cresce com o texto, mas agora campo e
   ação formam uma única peça reconhecível como entrada de conversa.

   O rascunho é controlado pela página, não daqui: ele precisa SOBREVIVER a
   uma falha de envio, e este componente pode remontar. */

export function Composer({
  value,
  onChange,
  onSubmit,
  sending,
  disabled,
  onHeightChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  sending: boolean;
  disabled?: boolean;
  onHeightChange?: (height: number) => void;
}) {
  const form = useRef<HTMLFormElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  // Cresce com o texto até um teto, para a conversa não sumir da tela.
  useEffect(() => {
    const element = textarea.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, MAX_ROWS_PX)}px`;
  }, [value]);

  // O compositor flutua sobre a conversa. A área de leitura usa esta
  // medida para criar apenas o respiro necessário sob a última mensagem,
  // inclusive quando o textarea cresce para várias linhas.
  useEffect(() => {
    const element = form.current;
    if (!element || !onHeightChange) return;

    const report = () => onHeightChange(element.getBoundingClientRect().height);
    report();

    const observer = new ResizeObserver(report);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onHeightChange]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim() || sending) return;
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter envia; Shift+Enter quebra linha.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (value.trim() && !sending) onSubmit();
    }
  }

  return (
    <form
      ref={form}
      onSubmit={handleSubmit}
      className="absolute inset-x-0 bottom-0 z-20 bg-transparent px-4 pt-2 pb-3 sm:px-6 sm:pb-4"
    >
      <div className="mx-auto w-full max-w-(--container-conversation)">
        <div
          className={cx(
            "flex items-end gap-2 rounded-lg border border-hairline bg-raised/70 p-2 pl-3",
            "transition-[border-color,background-color] duration-200",
            "focus-within:border-strong/55 focus-within:bg-raised/80",
          )}
          style={{
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          <div className="flex min-w-0 flex-1 flex-col px-1 py-0.5">
            <label htmlFor="composer" className="type-meta text-tertiary">
              Mensagem
            </label>
            <textarea
              id="composer"
              ref={textarea}
              rows={1}
              value={value}
              maxLength={MAX_LENGTH}
              disabled={disabled}
              aria-describedby="composer-hint"
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva o que está passando pela sua cabeça…"
              className={cx(
                "min-h-8 min-w-0 resize-none bg-transparent py-1",
                "font-editorial text-body-l leading-relaxed text-primary outline-none",
                "placeholder:text-tertiary disabled:opacity-50",
              )}
            />
          </div>

          <button
            type="submit"
            disabled={sending || !value.trim() || disabled}
            className={cx(
              "grid size-11 shrink-0 place-items-center rounded-full",
              "bg-action text-on-action transition-[transform,background-color,color] duration-140",
              "hover:-translate-y-px hover:bg-action-hover active:translate-y-0",
              "disabled:cursor-not-allowed disabled:bg-sunken disabled:text-tertiary disabled:hover:translate-y-0",
            )}
            aria-label={sending ? "Resposta em andamento" : "Enviar mensagem"}
            aria-busy={sending || undefined}
          >
            {sending ? (
              // Quadrado estático: "em andamento" sem spinner girando dentro
              // do gesto de escrever.
              <span aria-hidden="true" className="size-3 rounded-xs bg-current" />
            ) : (
              <SendIcon className="size-5" />
            )}
          </button>
        </div>

        <p id="composer-hint" className="type-meta mt-2 hidden px-1 text-tertiary sm:block">
          Enter envia · Shift + Enter cria uma nova linha
        </p>
      </div>
    </form>
  );
}
