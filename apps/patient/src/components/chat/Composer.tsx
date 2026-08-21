"use client";

import {
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
  type SVGProps,
} from "react";
import { VisuallyHidden, cx } from "@sinapsa/ui";

const MAX_LENGTH = 8_000;
const MAX_ROWS_PX = 160;

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

function ProcessingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="7.5" y="7.5" width="9" height="9" rx="1" />
    </svg>
  );
}

/**
 * Superfície de escrita, não campo de formulário.
 *
 * A caixa é a folha: sem borda interna, tipografada na serif de leitura, e
 * cresce com o texto. O botão vive dentro dela. Um input cinza com um botão
 * ao lado transformaria o gesto de escrever num preenchimento de cadastro.
 *
 * O rascunho é controlado pela página, não daqui: ele precisa SOBREVIVER a uma
 * falha de envio (design.md §8), e este componente pode remontar.
 */
export function Composer({
  value,
  onChange,
  onSubmit,
  sending,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  sending: boolean;
  disabled?: boolean;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);

  // Cresce com o texto até um teto, para a conversa não sumir da tela.
  useEffect(() => {
    const element = textarea.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, MAX_ROWS_PX)}px`;
  }, [value]);

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
      onSubmit={handleSubmit}
      // O deslocamento acima da barra de navegação é padding DENTRO do
      // elemento pegajoso, não um offset de `bottom`: com `bottom-14` ele
      // flutuaria acima da própria posição no fluxo e cobriria a última
      // mensagem quando a conversa estivesse rolada até o fim.
      className="sticky bottom-0 -mx-4 shrink-0 bg-transparent px-4 pt-1 pb-4 sm:-mx-5 sm:px-5 sm:pt-1.5 sm:pb-5"
    >
      <div className="flex items-end gap-2 rounded-full border border-border-control bg-surface py-1 pr-1 pl-4 shadow-overlay focus-within:border-action">
        <VisuallyHidden>
          <label htmlFor="composer">Escreva sua mensagem</label>
        </VisuallyHidden>

        <textarea
          id="composer"
          ref={textarea}
          rows={1}
          value={value}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Como foi seu dia?"
          className="min-h-9 min-w-0 flex-1 resize-none bg-transparent py-1.5 font-editorial text-body-md leading-6 text-primary outline-none placeholder:text-secondary/70 disabled:opacity-55"
        />

        <button
          type="submit"
          disabled={sending || !value.trim() || disabled}
          className={cx(
            "grid size-9 shrink-0 place-items-center rounded-full transition-[background-color,color,transform,opacity] active:scale-95 disabled:cursor-not-allowed",
            sending
              ? "bg-primary text-canvas disabled:opacity-100"
              : "bg-primary text-canvas hover:opacity-85 disabled:opacity-40",
          )}
          aria-label={sending ? "Resposta em andamento" : "Enviar mensagem"}
          aria-busy={sending || undefined}
        >
          <VisuallyHidden>
            {sending ? "Resposta em andamento" : "Enviar mensagem"}
          </VisuallyHidden>
          {sending ? (
            <ProcessingIcon className="size-4" />
          ) : (
            <SendIcon className="size-[1.15rem]" />
          )}
        </button>
      </div>
    </form>
  );
}
