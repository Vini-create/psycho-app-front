import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import { Icon, type IconName } from "../../icons";

/* Brand Book V2 §22 e §28 — rastreabilidade.

   "A UI diferencia 'relato', 'organizado pela IA' e 'marcado pelo paciente'.
   Essa transparência é parte da identidade premium, não apenas requisito
   técnico."

   Este é o componente mais carregado de produto do sistema. A regra que ele
   existe para impor: nada agregado por modelo aparece na tela sem dizer que
   foi agregado por modelo. A IA não é fonte da verdade (§28), e a interface
   precisa tornar isso visível antes de o profissional interpretar.

   Cada origem é marcada por TRÊS coisas simultâneas — rótulo textual, ícone
   e régua lateral. Nunca só cor: a distinção sobrevive em grayscale (§34)
   e para quem não distingue matiz (§29). */

export type ProvenanceKind =
  /** Palavra do paciente, como foi escrita. A fonte primária. */
  | "reported"
  /** Agregação feita pelo modelo a partir de relatos. Sempre inspecionável. */
  | "organized"
  /** Sinal declarado explicitamente pelo paciente — o mais confiável de todos. */
  | "marked"
  /** Metadata do sistema: datas, contagens, estados operacionais. */
  | "system";

interface ProvenanceSpec {
  label: string;
  icon: IconName;
  /** Régua lateral. Pastel classifica natureza de conteúdo, não estado. */
  rule: string;
  tint: string;
}

const SPEC: Record<ProvenanceKind, ProvenanceSpec> = {
  reported: {
    label: "Relato",
    icon: "quote",
    rule: "border-accent-clay",
    tint: "text-ink-clay",
  },
  organized: {
    label: "Organizado pela IA",
    icon: "ai",
    rule: "border-accent-lavender",
    tint: "text-ink-lavender",
  },
  marked: {
    label: "Marcado pelo paciente",
    icon: "for-session",
    rule: "border-accent-ochre",
    tint: "text-ink-ochre",
  },
  system: {
    label: "Registro do sistema",
    icon: "context",
    rule: "border-accent-fogblue",
    tint: "text-ink-fogblue",
  },
};

/**
 * Etiqueta de origem. Use sempre que o conteúdo ao lado não for a palavra
 * literal do paciente.
 */
export function ProvenanceLabel({
  kind,
  children,
  className,
}: {
  kind: ProvenanceKind;
  /** Sobrescreve o rótulo padrão quando o contexto pede precisão maior. */
  children?: ReactNode;
  className?: string;
}) {
  const spec = SPEC[kind];

  return (
    <span
      className={cx(
        "type-eyebrow inline-flex items-center gap-1.5",
        spec.tint,
        className,
      )}
    >
      <Icon name={spec.icon} size={16} className="shrink-0" />
      {children ?? spec.label}
    </span>
  );
}

/**
 * Bloco com régua de origem à esquerda.
 *
 * A régua é o que permite ler a procedência sem ler o rótulo — o olho
 * percorre a coluna e vê onde o modelo falou e onde o paciente falou.
 */
export function ProvenanceBlock({
  kind,
  label,
  children,
  source,
  className,
}: {
  kind: ProvenanceKind;
  label?: ReactNode;
  children: ReactNode;
  /** Affordance de rastreabilidade: normalmente um <SourceTrace />. */
  source?: ReactNode;
  className?: string;
}) {
  const spec = SPEC[kind];

  return (
    <div className={cx("flex flex-col gap-2 border-l-2 pl-4", spec.rule, className)}>
      <ProvenanceLabel kind={kind}>{label}</ProvenanceLabel>
      <div className="text-body text-primary">{children}</div>
      {source && <div className="pt-0.5">{source}</div>}
    </div>
  );
}

/* --------------------------------------------------------------------------
   SourceTrace — §16 e §22.
   "Toda afirmação agregada deve ter affordance 'ver fontes'."
   -------------------------------------------------------------------------- */

export function SourceTrace({
  count,
  onClick,
  href,
  label,
  className,
}: {
  count: number;
  onClick?: () => void;
  href?: string;
  /** Substitui "Ver N relatos relacionados" quando a natureza da fonte muda. */
  label?: string;
  className?: string;
}) {
  if (count <= 0) return null;

  // §31 — "Ver 3 relatos relacionados", não "Ver evidências". A linguagem
  // clínica rígida é justamente o que o produto evita.
  const text =
    label ?? `Ver ${count} ${count === 1 ? "relato relacionado" : "relatos relacionados"}`;

  const content = (
    <>
      <Icon name="source" size={16} className="shrink-0" />
      <span className="type-ui text-ui-sm">{text}</span>
      <span aria-hidden="true" className="transition-transform duration-140 group-hover:translate-x-0.5">
        →
      </span>
    </>
  );

  const styles = cx(
    "group inline-flex min-h-11 items-center gap-2 text-accent",
    "transition-colors duration-140 hover:text-primary",
    className,
  );

  if (href) {
    return (
      <a href={href} className={styles}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={styles}>
      {content}
    </button>
  );
}
