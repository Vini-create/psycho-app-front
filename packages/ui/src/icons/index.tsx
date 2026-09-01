/* ==========================================================================
   Sinapsa — camada de curadoria de ícones
   Brand Book V2 §10.

   Lucide é a base; esta camada é o que impede a sensação de "ícones
   aleatórios de biblioteca". Regras aplicadas aqui, uma vez, para todo o
   produto:

   - grid 24×24, stroke 1.5 (1.25 em tamanhos grandes), caps/joins round;
   - tamanhos 16 / 20 / 24 e nada entre eles;
   - currentColor sempre — nunca um ícone colorido por conta própria;
   - o consumidor pede um CONCEITO ("fonte", "para sessão"), não um desenho.
     Trocar o glifo de um conceito é uma decisão de design feita neste
     arquivo, não espalhada por trinta telas.

   Proibido pelo brandbook e ausente por construção: emoji, cérebro,
   coração, robô para IA e sparkles em toda ação.
   ========================================================================== */

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Copy,
  Download,
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Layers,
  Link2,
  ListFilter,
  Lock,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Plus,
  Quote,
  Search,
  Send,
  Settings,
  Shield,
  Trash2,
  User,
  Users,
  Waypoints,
  X,
  type LucideProps,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

/* --------------------------------------------------------------------------
   Glifos próprios. Existem porque o brandbook pede um símbolo que a
   biblioteca não tem — não por preferência estética.
   -------------------------------------------------------------------------- */

/** Marca de IA: asterisco de quatro pontas (§10). Nunca um robô, nunca
    sparkles. Uma forma só, geométrica, sem brilho. */
function AiMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2.5c0 5.25 4.25 9.5 9.5 9.5-5.25 0-9.5 4.25-9.5 9.5 0-5.25-4.25-9.5-9.5-9.5 5.25 0 9.5-4.25 9.5-9.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Timeline: linha + pontos. O brandbook proíbe explicitamente o relógio
    como símbolo de linha do tempo (§10) — tempo aqui é sequência, não hora. */
function TimelineMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 3v18" />
      <circle cx="6" cy="7.5" r="2" />
      <circle cx="6" cy="16.5" r="2" />
      <path d="M10.5 7.5H20M10.5 16.5H16.5" />
    </svg>
  );
}

/** Busca contextual: lupa + nós. Distingue "procurar no texto" de
    "procurar no contexto longitudinal" (§10). */
function ContextSearchMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.2-4.2" />
      <circle cx="8" cy="9" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <path d="m8.9 9.6 3.2 1.9" />
    </svg>
  );
}

type Glyph = ComponentType<LucideProps> | ComponentType<SVGProps<SVGSVGElement>>;

/* --------------------------------------------------------------------------
   Registro por conceito.
   A chave descreve o que a coisa significa no produto; o valor é o desenho.
   -------------------------------------------------------------------------- */
const REGISTRY = {
  // Conceitos centrais do Sinapsa — §10, "famílias de símbolos"
  context: Layers,
  timeline: TimelineMark,
  "for-session": Bookmark,
  relation: Waypoints,
  privacy: Shield,
  lock: Lock,
  source: Link2,
  quote: Quote,
  document: FileText,
  ai: AiMark,
  "context-search": ContextSearchMark,

  // Navegação e estrutura
  menu: Menu,
  close: X,
  back: ArrowLeft,
  forward: ArrowRight,
  "open-external": ArrowUpRight,
  "external-link": ExternalLink,
  expand: ChevronDown,
  next: ChevronRight,
  more: Ellipsis,
  filter: ListFilter,
  search: Search,

  // Pessoas
  person: User,
  people: Users,

  // Ações
  add: Plus,
  edit: Pencil,
  remove: Trash2,
  send: Send,
  copy: Copy,
  install: Download,
  confirm: Check,
  settings: Settings,
  "sign-out": LogOut,
  mail: Mail,
  show: Eye,
  hide: EyeOff,
  alert: CircleAlert,
} satisfies Record<string, Glyph>;

export type IconName = keyof typeof REGISTRY;

/** Os três tamanhos permitidos. Nada entre eles — §10. */
export type IconSize = 16 | 20 | 24;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: IconSize;
}

/**
 * Ponto único de uso de ícone no produto.
 *
 * Sempre `aria-hidden`: um ícone acompanha rótulo textual. Quando ele for
 * de fato o único conteúdo de um controle, quem rotula é o `aria-label` do
 * botão — não o SVG.
 */
export function Icon({ name, size = 20, ...props }: IconProps) {
  const Glyph = REGISTRY[name] as ComponentType<SVGProps<SVGSVGElement>>;

  return (
    <Glyph
      width={size}
      height={size}
      // Stroke afina no tamanho grande para o peso óptico não crescer junto.
      strokeWidth={size >= 24 ? 1.25 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  );
}
