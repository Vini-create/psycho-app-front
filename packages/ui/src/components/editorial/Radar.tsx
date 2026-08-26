import { cx } from "../../lib/cx";
import { VisuallyHidden } from "../VisuallyHidden";

/* Radar de médias de um check-in.

   O que este gráfico responde é "qual a forma do período entre as perguntas
   deste check-in" — uma comparação de várias medidas na mesma régua, que é
   o caso em que um radar é honesto. Ele só funciona porque a escala do
   produto é fixa (1 a 5 em toda pergunta): eixos com réguas diferentes
   produziriam uma forma que mente sobre a proporção.

   Três decisões que o mantêm legível:

   - o eixo é rotulado pelo índice (01, 02…), nunca pelo enunciado. Doze
     enunciados em volta de um polígono colidem em qualquer largura; a lista
     de escalas abaixo do gráfico é a legenda, e usa os mesmos números.
   - o valor de cada ponta aparece como texto, em tinta de texto. A régua do
     produto é pastel e não alcança 3:1 contra o papel — cor sozinha não pode
     carregar o dado (§29).
   - abaixo de três perguntas não existe polígono. O componente devolve null
     e quem chama mostra só as escalas. */

export type RadarAxis = {
  id: string;
  /** Índice exibido na ponta do eixo e na legenda. */
  index: string;
  label: string;
  /** Posição na régua de 0 a 1. */
  value: number;
  /** Como o número é lido em texto: "3,4 de 5". */
  display: string;
};

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 108;
const RINGS = [0.25, 0.5, 0.75, 1];

function pointAt(index: number, total: number, radius: number) {
  // Começa no topo e caminha no sentido horário: a leitura de um relógio.
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  };
}

function polygon(radii: number[], total: number): string {
  return radii
    .map((radius, index) => {
      const { x, y } = pointAt(index, total, radius);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function RadarChart({
  axes,
  label,
  className,
}: {
  axes: RadarAxis[];
  /** Rótulo acessível: o gráfico precisa se explicar sem a imagem. */
  label: string;
  className?: string;
}) {
  if (axes.length < 3) return null;

  const total = axes.length;
  const shape = polygon(
    axes.map((axis) => Math.max(0, Math.min(1, axis.value)) * RADIUS),
    total,
  );

  return (
    <figure className={cx("flex flex-col gap-3", className)}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-full max-w-[22rem]"
        role="img"
        aria-label={label}
      >
        {/* Malha recessiva: linha fina, tinta de borda, sem preenchimento. */}
        {RINGS.map((ring) => (
          <polygon
            key={ring}
            points={polygon(
              axes.map(() => ring * RADIUS),
              total,
            )}
            fill="none"
            stroke="var(--border-hairline, currentColor)"
            strokeWidth={1}
            className="text-hairline opacity-70"
          />
        ))}

        {axes.map((axis, index) => {
          const outer = pointAt(index, total, RADIUS);
          return (
            <line
              key={axis.id}
              x1={CENTER}
              y1={CENTER}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--border-hairline, currentColor)"
              strokeWidth={1}
              className="opacity-70"
            />
          );
        })}

        <polygon
          points={shape}
          fill="var(--chart-1)"
          fillOpacity={0.28}
          stroke="var(--ink-lavender)"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {axes.map((axis, index) => {
          const value = Math.max(0, Math.min(1, axis.value));
          const vertex = pointAt(index, total, value * RADIUS);
          const outer = pointAt(index, total, RADIUS + 20);
          const anchor =
            Math.abs(outer.x - CENTER) < 12
              ? "middle"
              : outer.x > CENTER
                ? "start"
                : "end";
          return (
            <g key={axis.id}>
              {/* 8px de diâmetro: o mínimo para um marcador ser alvo e leitura. */}
              <circle
                cx={vertex.x}
                cy={vertex.y}
                r={4}
                fill="var(--ink-lavender)"
                stroke="var(--surface-raised)"
                strokeWidth={2}
              />
              <text
                x={outer.x}
                y={outer.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-tertiary text-[0.6875rem] tracking-[0.08em]"
              >
                {axis.index}
              </text>
            </g>
          );
        })}
      </svg>

      {/* A mesma informação em tabela: a forma é o resumo, não a fonte. */}
      <VisuallyHidden>
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">Pergunta</th>
              <th scope="col">Média relatada</th>
            </tr>
          </thead>
          <tbody>
            {axes.map((axis) => (
              <tr key={axis.id}>
                <th scope="row">
                  {axis.index} {axis.label}
                </th>
                <td>{axis.display}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </VisuallyHidden>
    </figure>
  );
}

/**
 * ScaleRow — a média de uma pergunta sobre a régua inteira dela.
 *
 * É o par exato do radar: mesmo número de índice, mesma ordem, e aqui o
 * enunciado cabe por extenso. O radar dá a forma; esta linha dá o número e
 * os extremos da escala, que é o que impede a média de ser lida como nota.
 */
export function ScaleRow({
  index,
  label,
  value,
  display,
  scale,
  answerCount,
  className,
}: {
  index: string;
  label: string;
  /** Posição na régua de 0 a 1. */
  value: number;
  display: string;
  /** Extremos da escala, como texto: "1" e "5". */
  scale: [string, string];
  answerCount: string;
  className?: string;
}) {
  const position = Math.max(0, Math.min(1, value)) * 100;

  return (
    <div className={cx("flex flex-col gap-2 py-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="flex min-w-0 items-baseline gap-3">
          <span className="type-eyebrow shrink-0 text-tertiary tabular-nums">
            {index}
          </span>
          <span className="min-w-0 font-editorial text-body-l break-words text-primary">
            {label}
          </span>
        </p>
        <span className="type-display shrink-0 text-h3 text-primary" data-numeric>
          {display}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="type-meta w-3 shrink-0 text-right text-tertiary tabular-nums">
          {scale[0]}
        </span>
        <div className="relative h-1.5 min-w-0 flex-1 rounded-xs bg-chart-track">
          <span
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-raised bg-[var(--ink-lavender)]"
            style={{ left: `${position}%` }}
          />
        </div>
        <span className="type-meta w-3 shrink-0 text-tertiary tabular-nums">
          {scale[1]}
        </span>
      </div>

      <p className="type-meta text-tertiary">{answerCount}</p>
    </div>
  );
}
