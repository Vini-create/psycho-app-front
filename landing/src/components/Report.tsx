import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { cx } from "@/lib/cx";
import { folderPath, folderShape } from "@/lib/folder-shape";
import {
  bandShadow,
  paperShadow,
  paperSurface,
  toneInk,
} from "@/lib/folder-paper";
import { duration, ease, gsap, prefersReducedMotion } from "@/motion/gsap";
import { useReveal } from "@/motion/useReveal";
import { useScrollSplit } from "@/motion/useSplitText";
import {
  SAMPLE_REPORT as R,
  formatDate,
  formatDayMark,
  formatPeriod,
  type ItemFamily,
} from "@/lib/report-sample";
import { SectionHead } from "./primitives";

/* 04 — Como chega um relatório.

   A seção das pastas diz que existe um contexto; esta mostra o documento.
   A dúvida que ela responde é a primeira que um profissional faz: "o que
   exatamente eu recebo?". Descrever isso em prosa seria propaganda; mostrar
   o documento é verificável.

   A forma é a do produto em dois tempos, e não por estilo: um relatório
   CHEGA fechado. O que existe na lista do painel é uma pasta com período,
   cobertura e nada mais; a leitura é um gesto separado, e a seção repete
   esse gesto — a pasta preta é o §09 (a cor pertence à pasta física), e a
   abertura é o modal do §26, a única superfície flutuante do sistema.

   Dentro, a ordem dos blocos, os rótulos, as tags, a régua de origem e o
   rodapé de proveniência são os do `ReportView.tsx` do painel, e o conteúdo
   é o fixture que `dev:design` serve — ver `lib/report-sample.ts`. O que
   muda é só a matéria: a landing é dark-only e não tem os utilitários
   `bg-panel-*` do produto, então os pastéis entram por estilo em linha, com
   os mesmos hexadecimais do §28.

   O §31 é o motivo de o bloco de origem não ser opcional aqui. Um relatório
   sem a declaração de cobertura e de limites seria outro produto, e a
   landing não pode anunciar um produto mais confiante do que o que existe. */

const TAG_FILL: Record<ItemFamily, string> = {
  lavender: "#4f455b",
  sage: "#465045",
  clay: "#5a443c",
  ochre: "#595337",
  fogblue: "#3e4a53",
  dustrose: "#584149",
};

const TONE = "dark" as const;
const INK = toneInk(TONE);
const BAND = folderShape.bandHeight;
/** A aba fica à esquerda: é pasta única, não pilha — não há vizinha para desviar. */
const TAB_ANCHOR = 0.06;

/* A anatomia, na mesma ordem em que o documento a apresenta. É o índice que
   o profissional lê antes de abrir o exemplo. */
const ANATOMY = [
  {
    index: "01",
    title: "Panorama",
    body: "A síntese do período em prosa, marcada como organizada pela IA. É onde a semana ganha forma antes do detalhe.",
  },
  {
    index: "02",
    title: "Linha do tempo",
    body: "Os acontecimentos relatados, ancorados por data. Não é gráfico nem escala: é a ordem em que as coisas foram ditas.",
  },
  {
    index: "03",
    title: "Pontos observados",
    body: "Cada ponto traz tipo, força do relato e, quando existe, o que o modelo não pôde afirmar.",
  },
  {
    index: "04",
    title: "Origem e limites",
    body: "Quantas conversas e dias o relatório observou, e o que ele reconhece não cobrir. Sempre presente.",
  },
];

export function Report() {
  const intro = useReveal<HTMLDivElement>();
  const headline = useScrollSplit<HTMLHeadingElement>();
  const body = useReveal<HTMLDivElement>({ stagger: 0.08 });

  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <section id="relatorio" className="frame scroll-mt-24 py-28 sm:py-36">
      <SectionHead index="04" eyebrow="Como chega um relatório" meta="EXEMPLO">
        <div ref={intro} className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2
              ref={headline}
              className="font-editorial text-h1-editorial text-primary"
            >
              O documento que você abre na segunda-feira.
            </h2>
          </div>

          <div className="reveal flex flex-col gap-4 lg:col-span-4 lg:col-start-9 rule-l">
            <p className="text-body text-secondary">
              Quando o vínculo autoriza e o período é solicitado, é isto que
              aparece no painel profissional: uma leitura organizada do que foi
              relatado, com a origem e os limites declarados em cada parte.
            </p>
            <p className="type-meta text-tertiary">
              Exemplo com dados fictícios, na mesma estrutura do produto.
            </p>
          </div>
        </div>
      </SectionHead>

      <div
        ref={body}
        className="mt-16 grid gap-12 lg:grid-cols-12 lg:gap-16 sm:mt-20"
      >
        <div className="reveal lg:col-span-7">
          <ReportFolder onOpen={() => setOpen(true)} />
        </div>

        {/* A anatomia. Cada item tem o índice na própria coluna e o fio
            atravessa só a largura do texto: a versão anterior encostava a
            prosa na régua e na borda da seção ao mesmo tempo, e o bloco lia
            como tabela apertada em vez de índice. */}
        <aside className="reveal flex flex-col lg:col-span-4 lg:col-start-9">
          <p className="type-eyebrow pb-4 text-tertiary">O que vem dentro</p>
          <dl className="flex flex-col">
            {ANATOMY.map((block) => (
              <div
                key={block.index}
                className="hairline-t grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 py-6"
              >
                <dt className="type-eyebrow text-accent-lavender">
                  {block.index}
                </dt>
                <div className="flex flex-col gap-2 pr-2">
                  <dt className="type-eyebrow text-primary">{block.title}</dt>
                  <dd className="text-body text-secondary">{block.body}</dd>
                </div>
              </div>
            ))}
          </dl>
        </aside>
      </div>

      <ReportModal open={open} onClose={close} />
    </section>
  );
}

/* --------------------------------------------------------------------------
   A pasta fechada.

   Mesma geometria e mesma matéria da pilha do §03 — `folder-shape.ts` e
   `folder-paper.ts`, sem reinterpretação —, só que sozinha e sempre no tom
   `dark`. A faixa de topo é recortada por `clip-path` e o corpo é um
   retângulo pintado com a mesma imagem deslocada: é o que faz a junção
   entre aba e folha sumir.
   -------------------------------------------------------------------------- */

function ReportFolder({ onOpen }: { onOpen: () => void }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(0);
  const [tabWidth, setTabWidth] = useState(0);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  /* A largura da aba vem do rótulo já renderizado — estimar por número de
     caracteres erra feio em fonte proporcional, e o erro aparece como a aba
     cortando a própria palavra. */
  const measure = useCallback(() => {
    const label = labelRef.current;
    if (!label) return;
    const text = label.getBoundingClientRect().width;
    const padding = Math.min(
      folderShape.tabPaddingMax,
      Math.max(folderShape.tabPadding, text * 0.45),
    );
    setTabWidth(Math.ceil(text + padding * 2));
  }, []);

  useLayoutEffect(() => {
    measure();
    void document.fonts.ready.then(measure);
  }, [measure, width]);

  const ready = width > 0 && tabWidth > 0;
  /* A âncora é uma preferência; o que manda é caber. Em 320px a aba larga
     empurraria o próprio rótulo para fora da folha. */
  const tabX = Math.max(
    0,
    Math.min(TAB_ANCHOR * width, width - tabWidth - folderShape.tabGap),
  );

  const clip = ready
    ? `path("${folderPath({
        width,
        height: BAND,
        tabX,
        tabWidth,
        tabHeight: folderShape.tabHeight,
        bottom: "flat",
      })}")`
    : undefined;

  return (
    <div>
      <div
        ref={frameRef}
        className="relative"
        style={{ height: BAND }}
        aria-hidden="true"
      >
        {ready && (
          <>
            <div
              className="absolute inset-0"
              style={{
                clipPath: clip,
                WebkitClipPath: clip,
                ...paperSurface(TONE, true, 0),
                filter: bandShadow(true),
              }}
            />
            {/* Filete de luz na aresta de cima: espessura de papel, não
                borda de UI. Recortado pela mesma silhueta, então acompanha a
                curva dos ombros. */}
            <div
              className="absolute inset-0"
              style={{
                clipPath: clip,
                WebkitClipPath: clip,
                background:
                  "linear-gradient(rgb(255 255 255 / 0.12), rgb(255 255 255 / 0) 5px)",
              }}
            />
          </>
        )}

        {/* O rótulo da aba. Fora da silhueta recortada, senão o clip cortaria
            a tinta junto com o papel. */}
        <span
          className="type-eyebrow absolute top-0 flex items-center justify-center"
          style={{
            left: tabX,
            width: tabWidth || undefined,
            height: folderShape.tabHeight,
            color: INK.ink,
          }}
        >
          <span ref={labelRef} className="whitespace-nowrap">
            Relatório de contexto
          </span>
        </span>
      </div>

      <div
        className="relative -mt-px rounded-b-[16px] px-6 pb-8 pt-2 sm:px-9 sm:pb-10"
        style={{
          ...paperSurface(TONE, true, folderShape.tabHeight),
          boxShadow: paperShadow(true),
        }}
      >
        <p
          className="type-eyebrow flex items-center gap-3"
          style={{ color: INK.muted }}
        >
          <span style={{ color: "var(--color-accent-lavender)" }}>◆</span>
          Contexto autorizado
          <span
            className="leader"
            aria-hidden="true"
            style={{ borderColor: "currentColor", opacity: 0.35 }}
          />
          <span className="opacity-80">PRO.SIOUVE.COM</span>
        </p>

        <p className="type-meta mt-6" style={{ color: INK.muted }}>
          {formatPeriod(R.periodStart, R.periodEnd)}
        </p>

        <h3
          className="mt-2 font-editorial text-h2 text-balance"
          style={{ color: INK.ink }}
        >
          {R.title}
        </h3>

        {/* A lombada: o que a pasta declara sem ser aberta. É a mesma
            informação que a lista do painel mostra antes da leitura. */}
        <dl className="mt-8 grid grid-cols-3 gap-x-4">
          {[
            ["Dias com registro", `${R.coverage.activeDayCount}/${R.coverage.periodDays}`],
            ["Acontecimentos", String(R.timeline.length)],
            ["Pontos", String(R.items.length)],
          ].map(([term, value]) => (
            <div
              key={term}
              className="flex flex-col gap-1.5 border-t pt-3"
              style={{ borderColor: "rgb(255 255 255 / 0.14)" }}
            >
              <dt className="type-meta" style={{ color: INK.muted }}>
                {term}
              </dt>
              <dd
                data-numeric
                className="font-ui text-h3 font-bold"
                style={{ color: INK.ink }}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
          {/* O único controle da landing que não é âncora, e por um motivo:
              ele não leva a lugar nenhum — abre o documento aqui mesmo. */}
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-action px-6 font-ui text-ui font-semibold whitespace-nowrap text-on-action transition-colors duration-[--duration-fast] ease-[--ease-enter] hover:bg-action-hover active:translate-y-px"
          >
            Abrir relatório
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-4 shrink-0"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>

          <span className="type-meta" style={{ color: INK.muted }}>
            {R.coverage.completeness}
          </span>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   O modal.

   `<dialog>` nativo, como no produto: foco preso, Esc, backdrop e o resto da
   página inerte vêm do browser. A animação é a do §26 — sobe e assenta, sem
   deslocamento lateral, para não disputar com a troca de pasta.
   -------------------------------------------------------------------------- */

function ReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      if (prefersReducedMotion()) {
        gsap.set(dialog, { clearProps: "all" });
        return;
      }
      gsap.fromTo(
        dialog,
        { autoAlpha: 0, y: 8, scale: 0.985 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: duration.ui,
          ease: ease.enter,
          overwrite: "auto",
          clearProps: "opacity,visibility,transform",
        },
      );
      return;
    }

    if (!dialog.open) return;
    if (prefersReducedMotion()) {
      dialog.close();
      return;
    }
    gsap.to(dialog, {
      autoAlpha: 0,
      y: 6,
      duration: duration.fast,
      ease: ease.exit,
      overwrite: "auto",
      onComplete: () => {
        dialog.close();
        gsap.set(dialog, { clearProps: "all" });
      },
    });
  }, [open]);

  /* `showModal` deixa o resto da página inerte, mas não impede a rolagem do
     documento atrás do backdrop. */
  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={cx(
        "m-auto max-h-[88vh] w-[min(58rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg",
        "border border-hairline bg-page p-0 text-primary",
        "shadow-[0_18px_50px_-18px_rgb(0_0_0/0.66)]",
        "backdrop:bg-[rgb(20_19_18/0.72)] backdrop:backdrop-blur-[8px]",
      )}
      onCancel={(event) => {
        /* O close nativo do Esc pularia a animação de saída. */
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="flex max-h-[88vh] flex-col">
        <div className="hairline-b flex shrink-0 items-center gap-4 bg-sunken px-5 py-3 sm:px-8">
          <span className="type-meta text-tertiary">pro.siouve.com</span>
          <span className="leader" aria-hidden="true" />
          <span className="type-meta hidden text-tertiary sm:inline">
            {R.schemaVersion}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar relatório"
            className="touch-target -mr-1 grid size-8 shrink-0 place-items-center rounded-xs text-secondary transition-colors duration-[--duration-fast] hover:text-primary"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              aria-hidden="true"
              className="size-4"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-8 sm:px-8 sm:py-10">
          <ReportDocument titleId={titleId} />
        </div>
      </div>
    </dialog>
  );
}

/* --------------------------------------------------------------------------
   O documento. Espelho do `ReportView.tsx` do painel profissional.
   -------------------------------------------------------------------------- */

/** A marca de conteúdo organizado por modelo — o `ProvenanceLabel` do produto. */
function Organized() {
  return (
    <span className="type-eyebrow inline-flex items-center gap-1.5 text-accent-lavender">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-3.5 shrink-0"
      >
        <path d="M12 3.5 13.8 9l5.7 1.9-5.7 1.9L12 18.3l-1.8-5.5-5.7-1.9L10.2 9z" />
      </svg>
      Organizado pela IA
    </span>
  );
}

/** Índice de bloco dentro do documento — o `SectionIndex` do produto. */
function BlockIndex({
  index,
  children,
  meta,
}: {
  index: string;
  children: string;
  meta?: string;
}) {
  return (
    <div className="hairline-b flex flex-wrap items-baseline gap-x-4 gap-y-1 pb-3">
      <span className="type-eyebrow text-tertiary">{index}</span>
      <h4 className="flex-1 font-ui text-ui font-semibold tracking-wide text-primary uppercase">
        {children}
      </h4>
      {meta && <span className="type-meta text-tertiary">{meta}</span>}
    </div>
  );
}

function ReportDocument({ titleId }: { titleId: string }) {
  const { coverage } = R;
  const ratio = Math.round(
    (coverage.activeDayCount / coverage.periodDays) * 100,
  );

  return (
    <article className="flex flex-col gap-10 sm:gap-12">
      <header className="flex flex-col gap-3">
        <p className="type-eyebrow text-tertiary">
          {formatPeriod(R.periodStart, R.periodEnd)}
        </p>
        <h3
          id={titleId}
          className="font-editorial text-h2 text-balance text-primary"
        >
          {R.title}
        </h3>
      </header>

      {/* Ritmo do período — o único número do relatório inteiro, e ele conta
          dias com registro, não humor, nota ou progresso. §24: a plataforma
          não pontua ninguém. */}
      <div className="flex flex-col gap-5 rounded-md bg-sunken p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="type-eyebrow text-tertiary">Ritmo do período</span>
            <p className="flex items-end gap-2">
              <span
                data-numeric
                className="font-ui text-[3rem] leading-[0.82] font-bold tracking-[-0.04em] text-primary"
              >
                {ratio}%
              </span>
              <span className="max-w-[11ch] pb-1 text-ui leading-tight text-secondary">
                dos dias com registros
              </span>
            </p>
          </div>
          <span className="type-meta text-tertiary">
            {coverage.activeDayCount}/{coverage.periodDays} dias
          </span>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-hairline"
          role="img"
          aria-label={`${ratio}% dos dias do período tiveram registros`}
        >
          <span
            className="block h-full rounded-full bg-accent-sage"
            style={{ width: `${ratio}%` }}
          />
        </div>

        <dl className="grid grid-cols-2 gap-x-6">
          {[
            ["Conversas", coverage.conversationCount],
            ["Mensagens", coverage.userMessageCount],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="hairline-t flex flex-col gap-1 pt-3"
            >
              <dt className="type-eyebrow text-tertiary">{label}</dt>
              <dd data-numeric className="font-ui text-h3 font-bold text-primary">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="flex flex-col gap-4">
        <BlockIndex index="01">Panorama</BlockIndex>
        <Organized />
        <p className="measure font-editorial text-body-l whitespace-pre-line text-primary">
          {R.summary}
        </p>
      </section>

      <section className="flex flex-col gap-6">
        <BlockIndex index="02" meta={`${R.timeline.length} acontecimentos`}>
          Linha do tempo
        </BlockIndex>

        {/* O trilho do §20: linha de 1px, nó pequeno, peso na tipografia do
            acontecimento. Nunca uma pilha de cards. */}
        <ol className="flex flex-col">
          {R.timeline.map((entry, index) => {
            const last = index === R.timeline.length - 1;
            return (
              <li
                key={entry.id}
                className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-5"
              >
                <div className="relative flex w-4 justify-center">
                  <span
                    aria-hidden="true"
                    className={cx(
                      "absolute top-0 w-px bg-hairline",
                      last ? "h-4" : "h-full",
                    )}
                  />
                  <span
                    aria-hidden="true"
                    className="relative mt-1.5 size-4 rounded-full border border-hairline-strong bg-page"
                  />
                </div>

                <div
                  className={cx("flex flex-col gap-2", last ? "pb-0" : "pb-7")}
                >
                  <span className="type-eyebrow text-tertiary">
                    {formatDayMark(entry.occurredAt)}
                  </span>
                  <p className="measure text-body text-secondary">
                    {entry.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="flex flex-col gap-2">
        <BlockIndex index="03" meta={`${R.items.length} pontos`}>
          Pontos observados
        </BlockIndex>

        <div className="flex flex-col">
          {R.items.map((item, index) => (
            <article
              key={item.id}
              className={cx(
                "flex flex-col gap-3 py-6",
                index < R.items.length - 1 && "hairline-b",
              )}
            >
              <Organized />

              <h5 className="font-editorial text-h3 text-balance text-primary">
                {item.title}
              </h5>

              <div className="measure text-body text-secondary">
                <p>{item.description}</p>
                {item.impact && (
                  <p className="mt-2 text-tertiary">{item.impact}</p>
                )}

                {/* O que o modelo NÃO pôde afirmar é informação clínica tanto
                    quanto o resto — §31. */}
                {item.limitations.length > 0 && (
                  <div className="mt-3 border-l-2 border-accent-fogblue pl-4">
                    <span className="type-eyebrow block text-accent-fogblue">
                      Limitações registradas
                    </span>
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {item.limitations.map((limitation) => (
                        <li key={limitation} className="type-meta text-tertiary">
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <span
                  className="type-meta inline-flex min-h-6 items-center rounded-xs px-2 py-1 text-on-panel uppercase"
                  style={{ backgroundColor: TAG_FILL[item.family] }}
                >
                  {item.kind}
                </span>
                <ul className="type-meta flex flex-wrap items-center gap-x-4 gap-y-1 text-tertiary">
                  {[
                    item.evidence,
                    item.valence,
                    item.occurredAt ? formatDate(item.occurredAt) : null,
                  ]
                    .filter((value): value is string => Boolean(value))
                    .map((value) => (
                      <li
                        key={value}
                        className="before:mr-4 before:text-hairline-strong before:content-['·'] first:before:hidden"
                      >
                        {value}
                      </li>
                    ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Origem deste conteúdo — o `AIProvenance` do produto, e a parte que
          não pode faltar em nenhum relatório. */}
      <aside className="flex flex-col gap-3 rounded-md bg-sunken p-5 sm:p-6">
        <span className="type-eyebrow text-accent-lavender">
          Origem deste conteúdo
        </span>

        <p className="text-body text-primary">
          Organizado automaticamente a partir das conversas incluídas no
          período. É um registro do que foi relatado. Não é diagnóstico nem
          avaliação.
        </p>

        <dl className="flex flex-col gap-2">
          {[
            ["Período", formatPeriod(R.periodStart, R.periodEnd)],
            [
              "Base",
              `${coverage.conversationCount} conversas · ${coverage.userMessageCount} mensagens do paciente · ${coverage.activeDayCount} dias ativos`,
            ],
            ["Alcance", coverage.completeness],
          ].map(([term, value]) => (
            <div key={term} className="flex flex-wrap items-baseline gap-2">
              <dt className="type-eyebrow text-secondary">{term}</dt>
              <dd className="type-meta text-primary">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="text-body text-secondary">{coverage.note}</p>

        <div className="flex flex-col gap-2 rounded-sm bg-raised p-4">
          <h4 className="type-eyebrow text-secondary">
            O que este relatório não cobre
          </h4>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-body text-secondary">
            {R.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </div>
      </aside>

      <ul className="type-meta flex flex-wrap items-center gap-x-4 gap-y-1 text-tertiary">
        {[
          "organizado automaticamente",
          R.schemaVersion,
          formatDate(R.createdAt),
        ].map((value) => (
          <li
            key={value}
            className="before:mr-4 before:text-hairline-strong before:content-['·'] first:before:hidden"
          >
            {value}
          </li>
        ))}
      </ul>
    </article>
  );
}
