"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Icon,
  TextField,
  pluralize,
} from "@sinapsa/ui";
import {
  CHECKIN_OPTIONS_PER_QUESTION,
  describeError,
  type CheckinTemplate,
  type CheckinTemplateInput,
} from "@sinapsa/api-client";
import {
  useCreateCheckinTemplate,
  useUpdateCheckinTemplate,
} from "@/lib/queries";

/* O construtor de check-in.

   A escala é fixa em cinco alternativas de 1 a 5, e isso não é uma limitação
   da tela: é o que permite perguntas diferentes dividirem os mesmos eixos de
   um radar sem que a forma minta sobre a proporção. O profissional escreve os
   cinco rótulos, do mais baixo para o mais alto — a ordem é a escala.

   Os rótulos vêm preenchidos com uma escala neutra porque a decisão que
   importa é o enunciado, não reescrever "Muito ruim" toda vez. */

const DEFAULT_OPTIONS = [
  "Muito ruim",
  "Ruim",
  "Nem bom nem ruim",
  "Bom",
  "Muito bom",
];

const MAX_QUESTIONS = 12;

type QuestionDraft = {
  prompt: string;
  legend: string;
  options: string[];
};

function emptyQuestion(): QuestionDraft {
  return { prompt: "", legend: "", options: [...DEFAULT_OPTIONS] };
}

export function CheckinTemplateBuilder({
  template,
  onSaved,
  onCancel,
}: {
  template?: CheckinTemplate;
  onSaved: (templateId: string) => void;
  onCancel: () => void;
}) {
  const create = useCreateCheckinTemplate();
  const update = useUpdateCheckinTemplate();

  const [title, setTitle] = useState(template?.title ?? "");
  const [legend, setLegend] = useState(template?.legend ?? "");
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    template?.questions.map((question) => ({
      prompt: question.prompt,
      legend: question.legend ?? "",
      options: question.options.map((option) => option.label),
    })) ?? [emptyQuestion()],
  );

  function patchQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((current) =>
      current.map((question, position) =>
        position === index ? { ...question, ...patch } : question,
      ),
    );
  }

  const trimmedTitle = title.trim();
  const error = ((): string | null => {
    if (trimmedTitle.length < 1 || trimmedTitle.length > 120) {
      return "Dê um nome ao check-in, com até 120 caracteres.";
    }
    if (legend.trim().length > 500) return "A instrução geral passou de 500 caracteres.";
    for (const [index, question] of questions.entries()) {
      const prompt = question.prompt.trim();
      if (prompt.length < 1 || prompt.length > 200) {
        return `A pergunta ${index + 1} precisa de um enunciado com até 200 caracteres.`;
      }
      if (question.legend.trim().length > 300) {
        return `A orientação da pergunta ${index + 1} passou de 300 caracteres.`;
      }
      if (
        question.options.some(
          (option) => option.trim().length < 1 || option.trim().length > 60,
        )
      ) {
        return `As cinco alternativas da pergunta ${index + 1} precisam de rótulo, com até 60 caracteres.`;
      }
    }
    return null;
  })();

  async function submit() {
    if (error) return;
    const input: CheckinTemplateInput = {
      title: trimmedTitle,
      legend: legend.trim(),
      questions: questions.map((question) => ({
        prompt: question.prompt.trim(),
        legend: question.legend.trim(),
        options: question.options.map((option) => ({ label: option.trim() })),
      })),
    };
    const saved = template
      ? await update.mutateAsync({ templateId: template.id, input })
      : await create.mutateAsync(input);
    onSaved(saved.id);
  }

  const mutation = template ? update : create;

  return (
    <div className="flex flex-col gap-8">
      {mutation.error && (
        <Alert tone="danger">{describeError(mutation.error).message}</Alert>
      )}

      <div className="flex flex-col gap-4">
        <TextField
          label="Nome do check-in"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Humor, sono e energia"
          required
        />
        <TextField
          label="Instrução geral"
          help="Aparece uma vez, no topo, quando a pessoa vai responder."
          value={legend}
          onChange={(event) => setLegend(event.target.value)}
          placeholder="Responda pensando no dia como um todo."
        />
      </div>

      <div className="flex flex-col gap-10">
        {questions.map((question, index) => (
          <fieldset key={index} className="flex flex-col gap-4">
            <legend className="flex w-full items-baseline justify-between gap-4 border-b border-hairline pb-2">
              <span className="type-eyebrow text-tertiary tabular-nums">
                Pergunta {String(index + 1).padStart(2, "0")}
              </span>
              {questions.length > 1 && (
                <Button
                  size="sm"
                  variant="text"
                  className="text-destructive hover:text-destructive"
                  onClick={() =>
                    setQuestions((current) =>
                      current.filter((_, position) => position !== index),
                    )
                  }
                >
                  Remover
                </Button>
              )}
            </legend>

            <TextField
              label="Enunciado"
              value={question.prompt}
              onChange={(event) =>
                patchQuestion(index, { prompt: event.target.value })
              }
              placeholder="Como estava seu humor hoje?"
              required
            />
            <TextField
              label="Orientação para responder"
              help="O texto que a pessoa lê junto da pergunta. Use para dizer o que considerar — e o que não considerar."
              value={question.legend}
              onChange={(event) =>
                patchQuestion(index, { legend: event.target.value })
              }
              placeholder="Pense no dia todo, não no pior momento."
            />

            <div className="flex flex-col gap-3">
              <p className="type-meta text-tertiary">
                As cinco alternativas, do extremo mais baixo ao mais alto. A
                ordem é a escala: a primeira vale 1 e a última vale 5.
              </p>
              {question.options.map((option, optionIndex) => (
                <TextField
                  key={optionIndex}
                  // A nota é o rótulo do campo: assim o número que a resposta
                  // vale fica visível para quem escreve a escala.
                  label={`Nota ${optionIndex + 1}`}
                  help={
                    optionIndex === 0
                      ? "O extremo mais baixo da escala."
                      : optionIndex === CHECKIN_OPTIONS_PER_QUESTION - 1
                        ? "O extremo mais alto da escala."
                        : undefined
                  }
                  value={option}
                  onChange={(event) =>
                    patchQuestion(index, {
                      options: question.options.map((current, position) =>
                        position === optionIndex ? event.target.value : current,
                      ),
                    })
                  }
                  required
                />
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {questions.length < MAX_QUESTIONS && (
        <Button
          variant="secondary"
          className="self-start"
          onClick={() => setQuestions((current) => [...current, emptyQuestion()])}
        >
          <Icon name="add" size={16} />
          Adicionar pergunta
        </Button>
      )}

      {error && <p className="type-meta text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-5">
        <Button
          loading={mutation.isPending}
          disabled={error !== null}
          onClick={submit}
        >
          {template ? "Salvar alterações" : "Salvar modelo"}
        </Button>
        <Button variant="text" onClick={onCancel}>
          Cancelar
        </Button>
        <span className="type-meta text-tertiary">
          {pluralize(questions.length, "pergunta", "perguntas")} · uma resposta por dia
        </span>
      </div>
    </div>
  );
}
