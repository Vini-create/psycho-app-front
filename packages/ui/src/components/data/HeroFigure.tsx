import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

/**
 * O número que a tela lidera. Exatamente um por vista.
 *
 * Grande e na condensada utilitária — pela mesma razão do StatTile: dado é
 * função. A serif fica com a frase ao lado, que é leitura.
 */
export function HeroFigure({
  value,
  unit,
  children,
  className,
}: {
  value: ReactNode;
  unit?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-3", className)}>
      <p className="flex items-baseline gap-3">
        <span className="font-utility text-[3.5rem] leading-[0.9] font-bold text-primary sm:text-[4.5rem]">
          {value}
        </span>
        {unit && (
          <span className="font-editorial text-heading-lg text-secondary">
            {unit}
          </span>
        )}
      </p>
      {children}
    </div>
  );
}
