"use client";

import { cx } from "../lib/cx";
import { useTheme } from "../theme/ThemeProvider";

/** Sol editorial: núcleo duplo e raios com ritmos diferentes. */
function SunIcon({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={compact ? "size-5" : "size-6"}
    >
      <circle cx="12" cy="12" r="3.35" />
      <circle cx="12" cy="12" r="1.05" fill="currentColor" stroke="none" />
      <path d="M12 2.25v2.2M12 19.55v2.2M2.25 12h2.2M19.55 12h2.2" />
      <path d="m5.3 5.3 1.5 1.5m10.4 10.4 1.5 1.5M18.7 5.3l-1.5 1.5M6.8 17.2l-1.5 1.5" />
    </svg>
  );
}

/** Lua Sinapsa: crescente aberto com uma pequena estrela de quatro pontas. */
function MoonIcon({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={compact ? "size-5" : "size-6"}
    >
      <path d="M19.35 15.45A8.25 8.25 0 0 1 8.55 4.65a7.9 7.9 0 1 0 10.8 10.8Z" />
      <path d="M17.6 4.1v2.35M16.42 5.28h2.36" />
      <circle cx="20.1" cy="9" r=".72" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Um único gesto alterna claro/escuro. A preferência do sistema continua
 * sendo o estado inicial; o primeiro clique assume uma escolha explícita.
 */
export function ThemeToggle({
  className,
  size = "default",
}: {
  className?: string;
  size?: "default" | "compact";
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const compact = size === "compact";
  const nextLabel = dark ? "Ativar tema claro" : "Ativar tema escuro";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cx(
        "group relative inline-flex shrink-0 items-center rounded-full border border-border-control text-primary",
        compact ? "touch-target h-10 w-[4.25rem] p-1" : "h-11 w-[4.75rem] p-1",
        "transition-[background-color,border-color] duration-200 ease-sinapsa",
        "hover:border-action focus-visible:border-action",
        dark ? "bg-action" : "bg-sunken",
        className,
      )}
      role="switch"
      aria-checked={dark}
      aria-label={nextLabel}
      title={nextLabel}
    >
      <span
        className={cx(
          "grid place-items-center rounded-full bg-raised",
          "transition-transform duration-200 ease-sinapsa group-active:scale-95",
          compact ? "size-8" : "size-9",
          dark
            ? compact
              ? "translate-x-7"
              : "translate-x-8"
            : "translate-x-0",
        )}
      >
        {dark ? <MoonIcon compact={compact} /> : <SunIcon compact={compact} />}
      </span>
    </button>
  );
}
