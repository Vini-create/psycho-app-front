import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cx } from "../lib/cx";

/* Altura mínima 48px, raio 12px, borda de controle acessível — design.md §8. */
/* Brand Book V2 §15 — "TextField: label acima; 44–48px; border 1px;
   background paper."

   O que mudou do V1: raio 12 → 8 (radius.sm é o dos inputs; 12 é de card
   funcional, §12), corpo em UI sans em vez de serif (a serif é para leitura,
   não para digitar), e a borda escurece no foco além do anel — um campo
   focado precisa se destacar por conta própria, não só pelo outline. */
const CONTROL_BASE =
  "w-full min-h-11 rounded-sm border border-border-control bg-raised px-4 py-2.5 " +
  "text-primary font-ui text-body placeholder:text-tertiary " +
  "transition-[border-color] duration-140 ease-sinapsa " +
  "hover:border-primary/60 focus:border-primary " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "aria-[invalid=true]:border-destructive";

type FieldShellProps = {
  label: string;
  /** O id do controle; liga <label>, ajuda e erro. */
  htmlFor: string;
  help?: ReactNode;
  error?: ReactNode;
  helpId: string;
  errorId: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

function FieldShell({
  label,
  htmlFor,
  help,
  error,
  helpId,
  errorId,
  required,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      {/* Label sempre visível acima do campo. Placeholder é exemplo, não label. */}
      <label
        htmlFor={htmlFor}
        className="type-ui text-ui font-semibold text-primary"
      >
        {label}
        {required && (
          <span className="ml-1 text-secondary" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {/* Ajuda e erro ficam abaixo do campo. O erro não depende só de cor:
          vem acompanhado de texto e do estado aria-invalid. */}
      {help && !error && (
        <p id={helpId} className="type-meta max-w-none text-tertiary">
          {help}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="type-ui text-ui-sm max-w-none font-semibold text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function useFieldIds(providedId?: string) {
  const generated = useId();
  const id = providedId ?? generated;
  return { id, helpId: `${id}-help`, errorId: `${id}-error` };
}

function describedBy(
  help: ReactNode,
  error: ReactNode,
  helpId: string,
  errorId: string,
) {
  if (error) return errorId;
  if (help) return helpId;
  return undefined;
}

export type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className"
> & {
  label: string;
  help?: ReactNode;
  error?: ReactNode;
  className?: string;
  inputClassName?: string;
};

export function TextField({
  label,
  help,
  error,
  className,
  inputClassName,
  id: providedId,
  required,
  ...rest
}: TextFieldProps) {
  const { id, helpId, errorId } = useFieldIds(providedId);
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      help={help}
      error={error}
      helpId={helpId}
      errorId={errorId}
      required={required}
      className={className}
    >
      <input
        {...rest}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(help, error, helpId, errorId)}
        className={cx(CONTROL_BASE, inputClassName)}
      />
    </FieldShell>
  );
}

export type TextAreaFieldProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className"
> & {
  label: string;
  help?: ReactNode;
  error?: ReactNode;
  className?: string;
  textareaClassName?: string;
};

export function TextAreaField({
  label,
  help,
  error,
  className,
  textareaClassName,
  id: providedId,
  required,
  rows = 4,
  ...rest
}: TextAreaFieldProps) {
  const { id, helpId, errorId } = useFieldIds(providedId);
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      help={help}
      error={error}
      helpId={helpId}
      errorId={errorId}
      required={required}
      className={className}
    >
      <textarea
        {...rest}
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(help, error, helpId, errorId)}
        className={cx(CONTROL_BASE, "resize-y leading-relaxed", textareaClassName)}
      />
    </FieldShell>
  );
}

export type SelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "className"
> & {
  label: string;
  help?: ReactNode;
  error?: ReactNode;
  className?: string;
  selectClassName?: string;
};

export function SelectField({
  label,
  help,
  error,
  className,
  selectClassName,
  id: providedId,
  required,
  children,
  ...rest
}: SelectFieldProps) {
  const { id, helpId, errorId } = useFieldIds(providedId);
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      help={help}
      error={error}
      helpId={helpId}
      errorId={errorId}
      required={required}
      className={className}
    >
      <select
        {...rest}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(help, error, helpId, errorId)}
        className={cx(CONTROL_BASE, "appearance-none pr-10", selectClassName)}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  label: ReactNode;
  help?: ReactNode;
  className?: string;
};

/** Alvo de toque de 44px garantido pelo padding da <label>. */
export function Checkbox({
  label,
  help,
  className,
  id: providedId,
  ...rest
}: CheckboxProps) {
  const { id, helpId } = useFieldIds(providedId);
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-start gap-3 py-2"
      >
        <input
          {...rest}
          id={id}
          type="checkbox"
          aria-describedby={help ? helpId : undefined}
          className="mt-0.5 size-5 shrink-0 accent-[var(--action-primary)]"
        />
        <span className="text-body text-primary">{label}</span>
      </label>
      {help && (
        <p id={helpId} className="metadata ml-8 max-w-none text-secondary">
          {help}
        </p>
      )}
    </div>
  );
}
