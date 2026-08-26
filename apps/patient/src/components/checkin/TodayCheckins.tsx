"use client";

import { useState } from "react";
import {
  Alert,
  Icon,
  MetaStrip,
  Modal,
  SectionIndex,
  Skeleton,
  cx,
  pluralize,
} from "@sinapsa/ui";
import { describeError, type CheckinAssignment } from "@sinapsa/api-client";
import { CheckinCard } from "./CheckinCard";
import { localDay, useCheckins } from "@/lib/queries";

const ACCENT_RULES = [
  "border-l-accent-sage",
  "border-l-accent-lavender",
  "border-l-accent-fogblue",
  "border-l-accent-clay",
] as const;

export function TodayCheckins({ index }: { index: string }) {
  const day = localDay();
  const { data, isPending, error } = useCheckins(day);
  const [selected, setSelected] = useState<CheckinAssignment | null>(null);

  const checkins = data?.checkins ?? [];
  const pending = checkins.filter((item) => !item.answered_today);
  const done = checkins.filter((item) => item.answered_today);
  const ordered = [...pending, ...done];

  if (isPending) {
    return <Skeleton className="h-32" aria-label="Carregando check-ins" />;
  }

  if (error) {
    return <Alert tone="danger">{describeError(error).message}</Alert>;
  }

  if (checkins.length === 0) return null;

  return (
    <section className="flex flex-col gap-5">
      <SectionIndex
        index={index}
        meta={
          pending.length > 0
            ? `${pluralize(pending.length, "resposta pendente", "respostas pendentes")} hoje`
            : "tudo respondido hoje"
        }
      >
        Check-in de hoje
      </SectionIndex>

      <ul className="flex flex-col overflow-hidden rounded-sm border border-hairline bg-raised/35">
        {ordered.map((assignment, position) => {
          const answered = assignment.answered_today;
          return (
            <li key={assignment.id} className="border-b border-hairline last:border-b-0">
              <button
                type="button"
                onClick={() => setSelected(assignment)}
                className={cx(
                  "group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-l-2 px-4 py-4 text-left sm:px-5",
                  "transition-colors duration-140 hover:bg-sunken/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus",
                  ACCENT_RULES[position % ACCENT_RULES.length],
                )}
              >
                <span
                  className={cx(
                    "grid size-9 place-items-center rounded-full border",
                    answered
                      ? "border-positive/35 text-positive"
                      : "border-border-strong text-primary",
                  )}
                  aria-hidden="true"
                >
                  <Icon name={answered ? "confirm" : "next"} size={16} />
                </span>

                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-editorial text-body-l break-words text-primary">
                    {assignment.template.title}
                  </span>
                  <MetaStrip
                    items={[
                      assignment.professional_display_name
                        ? `de ${assignment.professional_display_name}`
                        : "de seu profissional",
                      pluralize(
                        assignment.template.questions.length,
                        "pergunta",
                        "perguntas",
                      ),
                      answered ? "respondido hoje" : "pendente hoje",
                    ]}
                  />
                </span>

                <span className="type-ui hidden items-center gap-2 text-ui-sm font-semibold text-accent group-hover:text-primary sm:flex">
                  {answered ? "Rever" : "Responder"}
                  <Icon name="next" size={16} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="type-meta measure text-tertiary">
        Abra apenas o check-in que quiser responder. Seus registros ficam com
        você e só são compartilhados quando você autoriza um envio.
      </p>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.template.title ?? "Check-in de hoje"}
        description={
          selected
            ? `Check-in de ${selected.professional_display_name ?? "seu profissional"}. Responder é opcional e você pode corrigir suas escolhas durante o dia.`
            : undefined
        }
        className="w-[min(52rem,calc(100vw-1.25rem))]"
        contentClassName="max-h-[calc(100dvh-1.25rem)] overflow-hidden p-5 sm:p-7"
      >
        {selected && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 sm:pr-2">
            <CheckinCard
              key={`${selected.id}-${selected.answered_today ? "answered" : "pending"}`}
              assignment={selected}
              day={day}
              onSubmitted={() => setSelected(null)}
            />
          </div>
        )}
      </Modal>
    </section>
  );
}
