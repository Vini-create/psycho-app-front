"use client";

import Link from "next/link";
import {
  Alert,
  Badge,
  Card,
  CardMeta,
  CardTitle,
  EmptyState,
  Overline,
  PageTitle,
  Prose,
  Skeleton,
  buttonStyles,
  formatDate,
} from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { AppShell } from "@/components/AppShell";
import { AuthGate, MfaGate, OnboardingGate } from "@/components/Gates";
import { usePatients } from "@/lib/queries";

function Pacientes() {
  const { data, isPending, error } = usePatients();
  const patients = data?.patients ?? [];

  return (
    <div className="flex flex-col gap-10 sm:gap-16">
      <header className="flex flex-col gap-3">
        <Overline>Pacientes</Overline>
        <PageTitle>Acompanhamentos.</PageTitle>
        <Prose>
          <p>
            Você não tem acesso ao histórico de conversas. O que chega aqui são
            relatórios gerados nos acompanhamentos que autorizaram esse escopo.
          </p>
        </Prose>
      </header>

      {error && <Alert tone="danger">{describeError(error).message}</Alert>}
      {isPending && <Skeleton className="h-40" aria-label="Carregando pacientes" />}

      {!isPending && patients.length === 0 && (
        <EmptyState
          title="Nenhum paciente vinculado."
          description="Envie um convite por e-mail para começar um acompanhamento."
          action={
            <Link href="/convites" className={buttonStyles()}>
              Criar convite
            </Link>
          }
        />
      )}

      {patients.length > 0 && (
        <section className="flex flex-col gap-4">
          <p className="rounded-md bg-brand-surface px-4 py-3 font-utility text-label-md font-bold text-brand">
            Selecione um paciente para ver observações, solicitações e relatórios do acompanhamento.
          </p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {patients.map((patient) => {
              const connectionId = patient.connection_id ?? patient.id;
              const active = patient.status === "active";
              return (
                <Card
                  key={patient.id}
                  as="li"
                  variant="interactive"
                  className="group relative gap-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <CardTitle>
                      <Link
                        href={`/pacientes/${connectionId}`}
                        className="after:absolute after:inset-0 after:content-['']"
                      >
                        {patient.patient_display_name ?? "Paciente"}
                      </Link>
                    </CardTitle>
                    <Badge tone={active ? "success" : "neutral"}>
                      {active ? "Ativo" : "Encerrado"}
                    </Badge>
                  </div>
                  <CardMeta>
                    {patient.activated_at
                      ? `Desde ${formatDate(patient.activated_at)}`
                      : "Aguardando aceite"}
                  </CardMeta>
                  <span className="mt-auto inline-flex items-center gap-2 pt-2 font-utility text-label-md font-bold text-brand">
                    Abrir acompanhamento
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </Card>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function PacientesPage() {
  return (
    <AuthGate>
      <MfaGate>
        <OnboardingGate>
          <AppShell>
            <Pacientes />
          </AppShell>
        </OnboardingGate>
      </MfaGate>
    </AuthGate>
  );
}
