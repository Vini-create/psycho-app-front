"use client";

import type {
  ComponentType,
  CSSProperties,
  FocusEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
} from "react";

/**
 * Componente de link da app hospedeira — `next/link` nas duas apps.
 *
 * O design system não importa o router de ninguém: quem monta o shell passa
 * o componente de navegação. O tipo lista exatamente o que as abas precisam
 * repassar, incluindo os handlers de ponteiro que disparam a intenção física
 * antes de a rota mudar.
 */
export type NavLinkComponent = ComponentType<{
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  "aria-label"?: string;
  "aria-current"?: "page" | undefined;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onPointerDown?: (event: PointerEvent<HTMLAnchorElement>) => void;
  onMouseEnter?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onFocus?: (event: FocusEvent<HTMLAnchorElement>) => void;
  onBlur?: (event: FocusEvent<HTMLAnchorElement>) => void;
}>;

export const DefaultNavLink: NavLinkComponent = ({ href, children, ...props }) => (
  <a href={href} {...props}>
    {children}
  </a>
);
