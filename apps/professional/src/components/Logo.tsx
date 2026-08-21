import { cx } from "@sinapsa/ui";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "font-editorial text-[1.5rem] font-normal tracking-[-0.04em] text-primary",
        className,
      )}
    >
      Sinapsa.
    </span>
  );
}
