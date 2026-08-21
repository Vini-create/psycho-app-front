"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { cx } from "@sinapsa/ui";

/** Entrada curta de página. O conteúdo continua visível sem JavaScript. */
export function EditorialReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        ".js-editorial-reveal",
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.72,
          stagger: 0.075,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform",
        },
      );
    }, root);

    return () => context.revert();
  }, []);

  return (
    <div ref={root} className={cx("contents", className)}>
      {children}
    </div>
  );
}
