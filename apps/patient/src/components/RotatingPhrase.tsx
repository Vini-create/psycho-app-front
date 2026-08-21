"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { cx } from "@sinapsa/ui";

const PHRASES = [
  "O que atravessa o dia merece espaço.",
  "Nem tudo precisa chegar pronto.",
  "Uma conversa pode mudar o contorno das coisas.",
  "Dar nome também é um jeito de respirar.",
];

export function RotatingPhrase({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const phrase = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const element = phrase.current;
    if (!element) return;

    const interval = window.setInterval(() => {
      gsap.to(element, {
        autoAlpha: 0,
        y: -8,
        duration: 0.28,
        ease: "power2.in",
        onComplete: () => {
          setIndex((current) => (current + 1) % PHRASES.length);
          gsap.fromTo(
            element,
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, y: 0, duration: 0.48, ease: "power3.out" },
          );
        },
      });
    }, 5_200);

    return () => {
      window.clearInterval(interval);
      gsap.killTweensOf(element);
    };
  }, []);

  return (
    <span
      ref={phrase}
      className={cx("inline-block text-balance", className)}
    >
      {PHRASES[index]}
    </span>
  );
}
