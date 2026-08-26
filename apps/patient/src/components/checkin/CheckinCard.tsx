"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Icon,
  MetaStrip,
  cx,
  pluralize,
} from "@sinapsa/ui";
import { describeError, type CheckinAssignment } from "@sinapsa/api-client";
import { useSubmitCheckinEntry } from "@/lib/queries";

function OptionButton({
  label,
  selected,
  onSelect,
  disabled,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cx(
        "touch-target flex min-h-11 w-full items-center gap-2 rounded-sm border px-3 py-2.5",
        "type-ui text-ui-sm text-left transition-colors duration-140",
        "disabled:cursor-not-allowed disabled:opacity-60",
        selected
          ? "border-primary bg-sunken font-semibold text-primary"
          : "border-border-control text-secondary hover:border-primary hover:text-primary",
      )}
    >
      <span
        className={cx(
          "grid size-5 shrink-0 place-items-center rounded-full border",
          selected ? "border-primary bg-primary text-on-action" : "border-border-strong",
        )}
        aria-hidden="true"
      >
        {selected && <Icon name="confirm" size={16} />}
      </span>
      {label}
    </button>
  );
}

export function CheckinCard({
  assignment,
  day,
  onSubmitted,
}: {
  assignment: CheckinAssignment;
  day: string;
  onSubmitted?: () => void;
}) {
  const submit = useSubmitCheckinEntry(day);
  const questions = assignment.template.questions;
  const answered = assignment.answered_today;
  const [choices, setChoices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (assignment.today_entry?.answers ?? []).map((answer) => [
        answer.question_id,
        answer.option_id,
      ]),
    ),
  );

  const answeredCount = questions.filter((question) => choices[question.id]).length;
  const complete = answeredCount === questions.length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-7">
      {assignment.template.legend && (
        <p className="measure border-l-2 border-accent-sage pl-4 text-body text-secondary">
          {assignment.template.legend}
        </p>
      )}

      <div className="flex flex-col gap-2" aria-live="polite">
        <MetaStrip
          items={[
            `${answeredCount} de ${questions.length} respondidas`,
            answered ? "você pode corrigir as escolhas de hoje" : null,
          ]}
        />
        <div className="h-1 overflow-hidden rounded-full bg-sunken" aria-hidden="true">
          <div
            className="h-full bg-accent-sage transition-[width] duration-200 ease-sinapsa"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-9">
        {questions.map((question, index) => (
          <fieldset key={question.id} className="flex flex-col gap-4">
            <legend className="flex w-full flex-col gap-1.5 border-b border-hairline pb-3">
              <span className="type-eyebrow text-tertiary tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-editorial text-body-l text-balance text-primary">
                {question.prompt}
              </span>
              {question.legend && (
                <span className="measure type-meta text-tertiary">{question.legend}</span>
              )}
            </legend>

            <div className="grid gap-2 sm:grid-cols-2">
              {question.options.map((option) => (
                <OptionButton
                  key={option.id}
                  label={option.label}
                  selected={choices[question.id] === option.id}
                  disabled={submit.isPending}
                  onSelect={() =>
                    setChoices((current) => ({
                      ...current,
                      [question.id]: option.id,
                    }))
                  }
                />
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="sticky bottom-0 flex flex-col gap-3 border-t border-hairline bg-raised py-4">
        {submit.error && <Alert tone="danger">{describeError(submit.error).message}</Alert>}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            loading={submit.isPending}
            disabled={!complete}
            onClick={async () => {
              await submit.mutateAsync({
                assignmentId: assignment.id,
                answers: questions.map((question) => ({
                  question_id: question.id,
                  option_id: choices[question.id]!,
                })),
              });
              onSubmitted?.();
            }}
          >
            {answered ? "Salvar correção" : "Registrar o dia"}
          </Button>
          {!complete && (
            <span className="type-meta text-tertiary">
              Falta responder{" "}
              {pluralize(
                questions.filter((question) => !choices[question.id]).length,
                "pergunta",
                "perguntas",
              )}.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
