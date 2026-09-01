"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
  Checkbox,
  Overline,
  PageTitle,
  Prose,
  Spinner,
} from "@sinapsa/ui";
import { describeError, type ConsentType } from "@sinapsa/api-client";
import { AuthGate } from "@/components/AuthGate";
import { useConsents, useGrantConsents } from "@/lib/queries";

type ConsentCopy = {
  type: ConsentType;
  title: string;
  summary: string;
  points: string[];
};

/**
 * O paciente precisa saber, em texto claro e antes de escrever qualquer coisa:
 * que conversa com uma IA, que ela não substitui profissional, o que é
 * processado e o que o profissional consegue ver.
 * A versão vigente da política é escolhida pelo backend — nunca a enviamos.
 */
const CONSENTS: ConsentCopy[] = [
  {
    type: "terms",
    title: "Termos de uso",
    summary: "Como funciona a plataforma e o que ela não é.",
    points: [
      "A Sinapsa é um espaço de registro e acompanhamento, não um serviço de emergência.",
      "Em situação de risco imediato, procure atendimento presencial ou os serviços de emergência.",
    ],
  },
  {
    type: "privacy",
    title: "Privacidade",
    summary: "Quais dados guardamos e por quanto tempo.",
    points: [
      "Suas mensagens são armazenadas cifradas.",
      "Seu profissional nunca lê o histórico bruto das conversas.",
      "Você pode encerrar um vínculo e revogar consentimentos quando quiser.",
    ],
  },
  {
    type: "ai_processing",
    title: "Conversa com inteligência artificial",
    summary: "Como suas conversas são lidas por um sistema automático.",
    points: [
      "Você conversa com Si, uma inteligência artificial, não com uma pessoa.",
      "Si não faz diagnóstico, não avalia e não substitui acompanhamento profissional.",
      "Uma solicitação profissional não gera nada sozinha; você confirma o período em Minha rede antes do processamento.",
      "O relatório completo existe apenas no app do profissional; seu histórico bruto nunca é compartilhado.",
    ],
  },
];

function Consentimentos() {
  const router = useRouter();
  const { data, isPending, error } = useConsents();
  const grant = useGrantConsents();

  const [accepted, setAccepted] = useState<Set<ConsentType>>(new Set());

  const missing = data?.missing ?? [];
  const pendingCopy = CONSENTS.filter((consent) =>
    missing.includes(consent.type),
  );
  const allAccepted = pendingCopy.every((consent) =>
    accepted.has(consent.type),
  );

  function toggle(type: ConsentType, checked: boolean) {
    setAccepted((current) => {
      const next = new Set(current);
      if (checked) next.add(type);
      else next.delete(type);
      return next;
    });
  }

  async function handleSubmit() {
    await grant.mutateAsync(pendingCopy.map((consent) => consent.type));
    router.replace("/");
  }

  if (isPending) {
    return (
      <div role="status" className="flex min-h-dvh items-center justify-center">
        <Spinner className="text-[1.5rem] text-secondary" />
      </div>
    );
  }

  if (data?.complete) {
    router.replace("/");
    return null;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-(--container-conversation) flex-col gap-10 px-5 py-12 sm:gap-16 sm:px-8 sm:py-16">
      <header className="flex flex-col gap-3">
        <Overline>Antes de começar</Overline>
        <PageTitle>Três coisas que você precisa saber.</PageTitle>
        <Prose>
          <p>
            Seu histórico de conversa nunca é aberto ao profissional. Você
            decide quais escopos cada vínculo pode usar e pode revogá-los.
          </p>
        </Prose>
      </header>

      {error && <Alert tone="danger">{describeError(error).message}</Alert>}
      {grant.error && (
        <Alert tone="danger">{describeError(grant.error).message}</Alert>
      )}

      <div className="flex flex-col gap-4">
        {pendingCopy.map((consent) => (
          <Card key={consent.type} variant="standard" className="gap-4">
            <CardTitle>{consent.title}</CardTitle>
            <CardBody className="flex flex-col gap-3">
              <p className="text-secondary">{consent.summary}</p>
              <ul className="flex list-disc flex-col gap-2 pl-5">
                {consent.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </CardBody>
            <Checkbox
              checked={accepted.has(consent.type)}
              onChange={(event) => toggle(consent.type, event.target.checked)}
              label={`Li e aceito: ${consent.title.toLowerCase()}`}
            />
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          disabled={!allAccepted}
          loading={grant.isPending}
          onClick={handleSubmit}
        >
          Aceitar e continuar
        </Button>
        {/* `disabled` não substitui explicação (Brand Book V2 §15). */}
        {!allAccepted && (
          <p className="metadata max-w-none text-secondary">
            Marque os três itens acima para continuar.
          </p>
        )}
      </div>
    </div>
  );
}

export default function ConsentimentosPage() {
  return (
    <AuthGate>
      <Consentimentos />
    </AuthGate>
  );
}
