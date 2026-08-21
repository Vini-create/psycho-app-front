"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { PageTitle } from "./Typography";

/**
 * Usa <dialog> nativo: foco preso, Esc fecha e inerte no resto da página vêm
 * do browser, sem reimplementar. Sombra é permitida aqui — modal é superfície
 * flutuante, a única categoria que design.md §7 autoriza a ter sombra.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // 'close' cobre Esc, o botão de fechar e close() programático.
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={cx(
        "m-auto w-[min(32rem,calc(100vw-2.5rem))] rounded-2xl border-0",
        "bg-elevated p-0 text-primary shadow-[0_24px_80px_-24px_rgb(0_0_0/0.55)]",
        "backdrop:bg-[rgb(29_25_30/0.42)] backdrop:backdrop-blur-[8px]",
        className,
      )}
      onClick={(event) => {
        // Clique no backdrop (fora do conteúdo) fecha.
        if (event.target === ref.current) onClose();
      }}
    >
      <div className={cx("relative flex flex-col gap-6 p-6", contentClassName)}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-surface text-secondary transition-[background-color,color,transform] duration-140 hover:rotate-3 hover:bg-subtle hover:text-primary active:scale-95"
          aria-label="Fechar modal"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            aria-hidden="true"
            className="size-5"
          >
            <path d="M6.75 6.75 17.25 17.25M17.25 6.75 6.75 17.25" />
          </svg>
        </button>

        <PageTitle as="h2" id={titleId} className="pr-14 text-heading-lg">
          {title}
        </PageTitle>
        {description && (
          <div className="text-body-md text-secondary">{description}</div>
        )}
        {children}
        {footer && (
          <div className="flex flex-wrap justify-end gap-3 pt-2">{footer}</div>
        )}
      </div>
    </dialog>
  );
}
