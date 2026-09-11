import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { cx } from "@/lib/cx";
import { folderPath, folderShape, layoutTabs, type TabSlot } from "@/lib/folder-shape";
import {
  bandShadow,
  paperShadow,
  paperSurface,
  tabInk,
  toneInk,
  type FolderTone,
} from "@/lib/folder-paper";
import { duration, ease, gsap, prefersReducedMotion } from "@/motion/gsap";

/* A pilha de pastas, interativa.

   Esta é a única parte da landing que não ilustra o produto: ela É o
   produto. A silhueta vem de `folder-shape.ts` e a matéria de
   `folder-paper.ts` — os dois copiados do design system, não reinterpretados.

   A primeira versão pintava cada pasta com um `fill` de SVG chapado. Era
   plástico: faltavam as três camadas que fazem uma pasta do produto ler como
   papel — a fibra do granulado, o VÉU de repouso que empurra a pasta fechada
   para a sombra, e o filete de luz na aresta de cima da aba. Agora a pintura
   é a mesma do aplicativo, e por isso a faixa passou a ser recortada por
   `clip-path` em vez de desenhada como `path`: só assim aba e corpo
   compartilham o mesmo recurso de imagem e a granulação atravessa a junção
   sem ruptura.

   As cores também são as do produto: os quatro tons de PASTA, que são
   pastéis claros mesmo no dark. É o §09 — "a cor pertence à aba física,
   nunca à página". A pasta não muda de cor porque a sala está escura.

   É um `tablist` de verdade: setas, Home e End funcionam, o painel é
   rotulado pela aba, e trocar de pasta não depende de ver a animação.

   Abaixo de `md` a pilha não existe — §30, a mesma regra do produto. */

export interface Folder {
  id: string;
  label: string;
  /* Fração da largura onde a aba prefere ficar. Irregular por desenho:
     arquivo de verdade não é tabulado por planilha. */
  anchor: number;
  tone: FolderTone;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  audience: string;
}

const BAND = folderShape.bandHeight;

export function FolderStack({ folders }: { folders: readonly Folder[] }) {
  const [active, setActive] = useState(0);
  const [width, setWidth] = useState(0);
  const [tabWidths, setTabWidths] = useState<number[]>([]);

  const frameRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const sheetRefs = useRef<Array<HTMLDivElement | null>>([]);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const mobileTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  /* A largura da ABA vem do rótulo já renderizado. Estimar por número de
     caracteres erra feio em fonte proporcional, e o erro aparece como a aba
     cortando a própria palavra. */
  const measureLabels = useCallback(() => {
    setTabWidths(
      labelRefs.current.map((label) => {
        if (!label) return 0;
        const text = label.getBoundingClientRect().width;
        const padding = Math.min(
          folderShape.tabPaddingMax,
          Math.max(folderShape.tabPadding, text * 0.45),
        );
        return Math.ceil(text + padding * 2);
      }),
    );
  }, []);

  useLayoutEffect(() => {
    measureLabels();
    void document.fonts.ready.then(measureLabels);
  }, [measureLabels, width]);

  const slots: TabSlot[] = folders.map((folder, index) => ({
    anchor: folder.anchor,
    width: tabWidths[index] ?? 0,
  }));

  const ready = width > 0 && tabWidths.length === folders.length;
  const positions = ready ? layoutTabs(width, slots) : [];

  /* A coreografia. A pasta ativa vem à frente e assenta; as outras recuam em
     degraus. É transform puro — nenhuma timeline escreve cor, porque cor
     aqui é o véu do `paperSurface` (MOTION.md §5). */
  useLayoutEffect(() => {
    const sheets = sheetRefs.current.filter(Boolean) as HTMLDivElement[];
    if (sheets.length === 0) return;

    const reduced = prefersReducedMotion();

    sheets.forEach((sheet, index) => {
      const depth = (index - active + sheets.length) % sheets.length;
      const y = depth === 0 ? 0 : folderShape.stackStep * depth;

      sheet.style.zIndex = String(sheets.length - depth);

      const tab = tabRefs.current[index];
      const targets = tab ? [sheet, tab] : [sheet];

      if (reduced) gsap.set(targets, { y });
      else
        gsap.to(targets, {
          y,
          duration: duration.folder,
          ease: ease.folder,
          overwrite: "auto",
        });
    });
  }, [active, folders.length]);

  const onKeyDown = (
    event: React.KeyboardEvent,
    refs = tabRefs.current,
  ) => {
    const last = folders.length - 1;
    let next: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = active === last ? 0 : active + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = active === 0 ? last : active - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;

    if (next !== null) {
      event.preventDefault();
      setActive(next);
      refs[next]?.focus();
    }
  };

  return (
    <>
      {/* ---------- Telefone: sem pilha, §30 ---------- */}
      <div className="md:hidden">
        <div
          role="tablist"
          aria-label="Áreas da Siouve"
          className="grid grid-cols-4 items-end gap-1 px-1"
          onKeyDown={(event) => onKeyDown(event, mobileTabRefs.current)}
        >
          {folders.map((folder, index) => {
            const selected = index === active;
            const ink = toneInk(folder.tone);
            const shortLabel = folder.label.replace(/^(A|As|O|Os) /, "");
            return (
              <button
                key={folder.id}
                ref={(node) => {
                  mobileTabRefs.current[index] = node;
                }}
                role="tab"
                id={`${baseId}-mobile-tab-${folder.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-mobile-panel-${folder.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                className="relative flex min-w-0 items-center justify-center overflow-hidden rounded-t-lg px-1 text-center font-mono text-[0.55rem] font-semibold uppercase leading-tight tracking-[0.06em] transition-[height,opacity] duration-[--duration-folder]"
                style={{
                  ...paperSurface(folder.tone, selected, 0),
                  height: selected ? 52 : 42,
                  color: ink.ink,
                  opacity: selected ? 1 : 0.7,
                }}
              >
                {shortLabel}
              </button>
            );
          })}
        </div>

        <article
          id={`${baseId}-mobile-panel-${folders[active].id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-mobile-tab-${folders[active].id}`}
          className="relative -mt-px overflow-hidden rounded-b-lg px-5 pb-6 pt-5"
          style={{
            ...paperSurface(folders[active].tone, true, folderShape.tabHeight),
            boxShadow: paperShadow(true),
          }}
        >
          <Panel folder={folders[active]} active />
        </article>
      </div>

      {/* ---------- Desktop: a pilha ---------- */}
      <div className="hidden md:block">
        <div
          role="tablist"
          aria-label="Áreas da Siouve"
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          /* `overflow-hidden` recorta as folhas recuadas, que são retângulos
             de largura inteira deslocados para baixo. Sem isso elas escapam
             por baixo da faixa como listras atravessando o topo do painel. */
          className="relative overflow-hidden"
          ref={frameRef}
          style={{ height: BAND }}
        >
          {/* CAMADA 1 — as silhuetas.

              Cada folha carrega o seu `z-index`, e é por isso que os rótulos
              NÃO podem morar aqui dentro. `z-index` cria contexto de
              empilhamento: um botão dentro da folha de trás não consegue
              subir acima da folha da frente por mais alto que seja o seu
              próprio z-index. Foi exatamente esse o bug — a folha aberta,
              que é a mais alta da pilha e ocupa a largura inteira, cobria os
              rótulos das outras e comia o clique. */}
          {folders.map((folder, index) => {
            const selected = index === active;
            const x = positions[index] ?? 0;
            const w = tabWidths[index] ?? 0;

            const clip = ready
              ? `path("${folderPath({
                  width,
                  height: BAND,
                  tabX: x,
                  tabWidth: w,
                  tabHeight: folderShape.tabHeight,
                  bottom: "flat",
                })}")`
              : undefined;

            return (
              <div
                key={folder.id}
                ref={(node) => {
                  sheetRefs.current[index] = node;
                }}
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 will-change-transform"
                style={{ height: BAND }}
              >
                {ready && (
                  <>
                    {/* A silhueta, com a mesma matéria do corpo. */}
                    <div
                      className="absolute inset-0"
                      style={{
                        clipPath: clip,
                        WebkitClipPath: clip,
                        ...paperSurface(folder.tone, selected, 0),
                        filter: bandShadow(selected),
                      }}
                    />
                    {/* Filete de luz na aresta de cima: espessura de papel,
                        não borda de UI. Recortado pela mesma silhueta, então
                        acompanha a curva dos ombros em vez de desenhar um
                        retângulo. */}
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
              </div>
            );
          })}

          {/* CAMADA 2 — os rótulos, irmãos das folhas e acima de todas elas.

              O botão não tem fundo, borda nem sombra: é só tinta e área de
              clique pousadas sobre a região da silhueta que já foi desenhada
              como aba. Ele viaja junto com a sua folha porque a timeline
              anima os dois com o mesmo `y`. */}
          {folders.map((folder, index) => {
            const selected = index === active;
            const depth = (index - active + folders.length) % folders.length;
            const coveredHeight = selected ? 0 : folderShape.stackStep * depth;
            return (
              <button
                key={folder.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                role="tab"
                id={`${baseId}-tab-${folder.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${folder.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                className="type-eyebrow absolute top-0 z-20 flex items-center justify-center rounded-t-[9px] transition-opacity duration-[--duration-ui]"
                style={{
                  left: positions[index] ?? 0,
                  width: tabWidths[index] || undefined,
                  /* Só centraliza o título na parte da aba que continua
                     visível acima das folhas à frente. Assim nenhum rótulo
                     desce para a área coberta quando a pilha muda de ordem. */
                  height: folderShape.tabHeight - coveredHeight,
                  color: tabInk(folder.tone, selected),
                  opacity: selected ? 1 : 0.92,
                  /* O anel de foco não pode herdar o do documento: a pasta
                     fechada está sob um véu escuro, e a lavanda clara
                     desaparece nele. */
                  ["--color-focus" as string]:
                    selected && folder.tone !== "dark" ? "#171615" : "#f1ede5",
                }}
              >
                <span
                  ref={(node) => {
                    labelRefs.current[index] = node;
                  }}
                  className="whitespace-nowrap"
                >
                  {folder.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* O corpo da folha. Fica fora da faixa porque daí para baixo a pasta
            é um retângulo — e retângulo o CSS pinta de graça, sem mandar
            redesenhar a silhueta quando o conteúdo muda de altura. A fase do
            ladrilho continua de onde a faixa parou, e é isso que faz a
            junção sumir. */}
        <div
          className="relative -mt-px rounded-b-[16px] px-8 pb-10 pt-2 lg:px-12 lg:pb-14"
          style={{
            ...paperSurface(folders[active].tone, true, folderShape.tabHeight),
            boxShadow: paperShadow(true),
          }}
        >
          {folders.map((folder, index) => (
            <div
              key={folder.id}
              role="tabpanel"
              id={`${baseId}-panel-${folder.id}`}
              aria-labelledby={`${baseId}-tab-${folder.id}`}
              hidden={index !== active}
            >
              <Panel folder={folder} active={index === active} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Panel({ folder, active }: { folder: Folder; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !active || prefersReducedMotion()) return;

    const context = gsap.context(() => {
      gsap.from(element.querySelectorAll("[data-enter]"), {
        opacity: 0,
        y: 8,
        duration: duration.page,
        ease: ease.enter,
        stagger: 0.04,
      });
    }, element);

    return () => context.revert();
  }, [active]);

  return (
    <div ref={ref} className="grid gap-10 py-8 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7">
        <SheetBody folder={folder} />
      </div>
      <div className="lg:col-span-4 lg:col-start-9">
        <PointList folder={folder} />
      </div>
    </div>
  );
}

function PointList({ folder, className }: { folder: Folder; className?: string }) {
  const ink = toneInk(folder.tone);
  return (
    <ul data-enter className={cx("flex flex-col", className)}>
      {folder.points.map((point, index) => (
        <li
          key={point}
          className="flex gap-4 border-t py-4 text-body"
          style={{
            color: ink.muted,
            borderColor:
              folder.tone === "dark" ? "rgb(255 255 255 / 0.14)" : "rgb(0 0 0 / 0.16)",
          }}
        >
          <span className="type-meta pt-1 opacity-60">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}

function SheetBody({ folder }: { folder: Folder }) {
  const ink = toneInk(folder.tone);
  return (
    <>
      <p
        data-enter
        className="type-eyebrow flex items-center gap-3"
        style={{ color: ink.muted }}
      >
        <span style={{ color: ink.ink }}>◆</span>
        {folder.eyebrow}
        <span
          className="leader"
          aria-hidden="true"
          style={{ borderColor: "currentColor", opacity: 0.35 }}
        />
        <span className="opacity-80">{folder.audience}</span>
      </p>

      <h3
        data-enter
        className="mt-5 font-editorial text-h2 text-balance"
        style={{ color: ink.ink }}
      >
        {folder.title}
      </h3>

      <p data-enter className="mt-4 text-body-l" style={{ color: ink.muted }}>
        {folder.body}
      </p>
    </>
  );
}
