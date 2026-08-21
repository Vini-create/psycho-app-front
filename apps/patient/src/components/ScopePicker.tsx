"use client";

import { Checkbox } from "@sinapsa/ui";
import type { ConsentScope } from "@sinapsa/api-client";

type ScopeCopy = {
  scope: ConsentScope;
  label: string;
  help: string;
};

/**
 * O backend deliberadamente NÃO permite compartilhar mensagens brutas.
 * O texto aqui precisa deixar isso explícito: o profissional recebe conteúdo
 * estruturado apenas nos escopos autorizados, nunca a conversa bruta.
 */
export const SCOPES: ScopeCopy[] = [
  {
    scope: "summaries",
    label: "Relatórios de período",
    help: "Permite receber pedidos deste profissional. O relatório só é gerado quando você confirma uma solicitação em Minha rede e o conteúdo completo não aparece no seu app.",
  },
  {
    scope: "events",
    label: "Acontecimentos",
    help: "Fatos que você mencionou, organizados em linha do tempo.",
  },
  {
    scope: "marked_topics",
    label: "Assuntos para a próxima sessão",
    help: "O que você marcar como algo que quer conversar pessoalmente.",
  },
];

export function ScopePicker({
  selected,
  onChange,
  disabled,
}: {
  selected: ConsentScope[];
  onChange: (scopes: ConsentScope[]) => void;
  disabled?: boolean;
}) {
  function toggle(scope: ConsentScope, checked: boolean) {
    onChange(
      checked
        ? [...selected, scope]
        : selected.filter((current) => current !== scope),
    );
  }

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="type-overline max-w-none text-secondary">
        O que este profissional pode receber
      </legend>
      {SCOPES.map((item) => (
        <Checkbox
          key={item.scope}
          checked={selected.includes(item.scope)}
          disabled={disabled}
          onChange={(event) => toggle(item.scope, event.target.checked)}
          label={item.label}
          help={item.help}
        />
      ))}
      <p className="metadata max-w-none text-secondary">
        Seu profissional nunca lê o histórico das conversas. A permissão não
        gera relatórios sozinha: cada período precisa de uma solicitação e da
        sua confirmação em Minha rede.
      </p>
    </fieldset>
  );
}
