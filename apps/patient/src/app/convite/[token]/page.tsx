"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardMeta,
  CardTitle,
  Overline,
  Prose,
  Skeleton,
  formatDate,
} from "@sinapsa/ui";
import { describeError, type ConsentScope } from "@sinapsa/api-client";
import { AuthCard } from "@/components/AuthCard";
import { ScopePicker } from "@/components/ScopePicker";
import { useAcceptInvitation, useInvitationPreview } from "@/lib/queries";
import { useSession } from "@/lib/session";

const PROFESSION_LABEL: Record<string, string> = {
  psychologist: "Psicólogo(a)",
  psychiatrist: "Psiquiatra",
  psychoanalyst: "Psicanalista",
  therapist: "Terapeuta",
  psychotherapist: "Psicoterapeuta",
  occupational_therapist: "Terapeuta ocupacional",
  counselor: "Orientador(a)",
  other: "Profissional de saúde mental",
};

function Convite({ token }: { token: string }) {
  const router = useRouter();
  const { status } = useSession();
  const { data, isPending, error } = useInvitationPreview(token);
  const accept = useAcceptInvitation(token);

  // Começa com tudo marcado, mas cada item é explicitamente desmarcável.
  const [scopes, setScopes] = useState<ConsentScope[]>([
    "summaries",
    "events",
    "marked_topics",
  ]);

  async function handleAccept() {
    await accept.mutateAsync(scopes);
    router.replace("/vinculos");
  }

  if (isPending) {
    return (
      <AuthCard title="Carregando convite…">
        <Skeleton className="h-40" aria-label="Carregando convite" />
      </AuthCard>
    );
  }

  if (error || !data) {
    return (
      <AuthCard overline="Convite" title="Este convite não está disponível.">
        <Alert tone="danger">
          {error
            ? describeError(error).message
            : "O link pode ter expirado ou já ter sido usado."}
        </Alert>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      overline="Convite"
      title="Um profissional quer te acompanhar."
      description="Você decide o que ele pode receber — e pode mudar isso depois."
    >
      <Card variant="editorial" className="gap-3">
        <Overline>Quem está convidando</Overline>
        <CardTitle>{data.professional_display_name}</CardTitle>
        <CardBody>
          <p className="max-w-none text-secondary">
            {PROFESSION_LABEL[data.profession_type] ?? data.profession_type}
            {data.organization_name ? ` · ${data.organization_name}` : ""}
          </p>
        </CardBody>
        <CardMeta>
          Convite enviado para {data.masked_email} · expira em{" "}
          {formatDate(data.expires_at)}
        </CardMeta>
      </Card>

      {status !== "authenticated" ? (
        <div className="flex flex-col gap-4">
          <Alert tone="info" title="Entre para aceitar">
            O convite precisa ser aceito pela conta com o mesmo e-mail que o
            recebeu.
          </Alert>
          <Button
            size="lg"
            fullWidth
            onClick={() => router.push(`/entrar?convite=${token}`)}
          >
            Entrar para aceitar
          </Button>
          <Link
            href="/criar-conta"
            className="self-start font-utility text-label-md font-bold text-brand underline"
          >
            Ainda não tenho conta
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {accept.error && (
            <Alert tone="danger">{describeError(accept.error).message}</Alert>
          )}

          <ScopePicker selected={scopes} onChange={setScopes} />

          <Prose>
            <p className="text-secondary">
              Você pode encerrar este vínculo a qualquer momento, e nada novo
              será compartilhado a partir daí.
            </p>
          </Prose>

          <Button
            size="lg"
            fullWidth
            loading={accept.isPending}
            onClick={handleAccept}
          >
            Aceitar convite
          </Button>
        </div>
      )}
    </AuthCard>
  );
}

export default function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  return <Convite token={token} />;
}
