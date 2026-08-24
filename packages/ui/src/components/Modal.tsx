"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cx } from "../lib/cx";
import { useDialogMotion } from "../motion/useDialogMotion";
import { IconButton } from "./Button";

/* Brand Book V2 §26 — "A interface não deve quebrar a sensação de página."

   Usa <dialog> nativo: foco preso, Esc fecha e o resto da página inerte vêm
   do browser, sem reimplementar. Fechado, o elemento é `display:none` pela
   folha do agente e some da árvore de acessibilidade — por isso o título
   de um modal fechado não polui a estrutura de headings da página.

   Modal é só para decisão bloqueante ou confirmação. Detalhe auxiliar,
   fonte, filtro e permissão pedem drawer, não isto.

   O overlay é 40% de ink com blur leve de 8px, e a sombra é a única
   permitida no sistema — modal é a superfície flutuante de verdade (§12). */
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

  useDialogMotion(ref, open);

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
        // radius.lg — superfície editorial, não a bolha de 32px do V1.
        "m-auto w-[min(32rem,calc(100vw-2.5rem))] rounded-lg border border-hairline",
        "bg-raised p-0 text-primary shadow-(--shadow-2)",
        "backdrop:bg-[rgb(23_22_21/0.4)] backdrop:backdrop-blur-[8px]",
        className,
      )}
      onCancel={(event) => {
        // Mantém o diálogo aberto por alguns milissegundos para que Esc
        // também percorra a animação de saída antes do close nativo.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Clique no backdrop (fora do conteúdo) fecha.
        if (event.target === ref.current) onClose();
      }}
    >
      <div className={cx("relative flex flex-col gap-6 p-6", contentClassName)}>
        {/* Quadrado, sem rotação no hover: o V1 girava 3° ao passar o mouse,
            que é exatamente o "gimmick" que o §53 proíbe. */}
        <IconButton
          icon="close"
          label="Fechar"
          onClick={onClose}
          className="absolute top-3 right-3"
        />

        <h2
          id={titleId}
          className="pr-12 font-editorial text-h3 text-balance text-primary"
        >
          {title}
        </h2>
        {description && (
          <div className="measure text-body text-secondary">{description}</div>
        )}
        {children}
        {footer && (
          <div className="flex flex-wrap justify-end gap-3 pt-2">{footer}</div>
        )}
      </div>
    </dialog>
  );
}
