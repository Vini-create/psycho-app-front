"use client";

import Link from "next/link";
import {
  Alert,
  EditorialList,
  EditorialRow,
  Icon,
  Masthead,
  MetaStrip,
  Skeleton,
  buttonStyles,
  formatDate,
  pluralize,
} from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { AppShell } from "@/components/AppShell";
import { AuthGate, MfaGate, OnboardingGate } from "@/components/Gates";
import { usePatientInsights } from "@/lib/queries";
import { ENGAGEMENT_LABEL } from "@/lib/insights";

/* Brand Book V2 §17 e §34 — "Pacientes: rows editoriais com contexto novo.
   Não: grid de cards idênticos."

   O V1 era um grid de dois cards por linha, cada paciente numa caixa com
   badge, seta e "Abrir acompanhamento" repetido. Com vinte pacientes isso
   vira uma parede de caixas iguais onde nada se destaca — e a decisão que
   o profissional precisa tomar (quem abrir primeiro) fica invisível.

   Agora cada pessoa é uma linha: nome grande, última leitura, o que ela
   autoriza, quanto conversou. Divisórias e tipografia fazem o trabalho
   visual; a ordem da lista já é a recomendação de leitura. */

function lastContextLabel(days: number | null, endIso?: string): string {
  if (days === null || !endIso) return "nenhum contexto recebido";
  if (days <= 0) return "contexto chegou hoje";
  if (days === 1) return "contexto de ontem";
  if (days < 30) return `contexto de ${days} dias atrás`;
  return `contexto de ${formatDate(endIso)}`;
}

function Pacientes() {
  const { insights, isPending, error } = usePatientInsights();

  const active = insights.filter(
    (insight) => insight.connection.status === "active",
  );
  const ended = insights.filter(
    (insight) => insight.connection.status !== "active",
  );

  // Quem tem contexto novo primeiro; depois quem está há mais tempo sem nada.
  const ordered = [...active].sort((a, b) => {
    const aDays = a.daysSinceLatest ?? Number.MAX_SAFE_INTEGER;
    const bDays = b.daysSinceLatest ?? Number.MAX_SAFE_INTEGER;
    return aDays - bDays;
  });

  return (
    <div className="flex flex-col gap-14 sm:gap-16">
      <Masthead
        className="reveal pt-2"
        eyebrow="Acompanhamentos"
        tone="editorial"
        deck="Você não tem acesso ao histórico de conversas. O que chega aqui são contextos de período, apenas nos vínculos que autorizaram esse escopo."
        meta={
          <MetaStrip
            className="md:justify-end"
            items={[
              pluralize(active.length, "vínculo ativo", "vínculos ativos"),
              ended.length > 0
                ? pluralize(ended.length, "encerrado", "encerrados")
                : null,
            ]}
          />
        }
        actions={
          <Link
            href="/convites"
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            Convidar paciente
          </Link>
        }
      >
        Quem você acompanha
      </Masthead>

      {error && <Alert tone="danger">{describeError(error).message}</Alert>}

      {isPending && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20" aria-label="Carregando acompanhamentos" />
          <Skeleton className="h-20" />
        </div>
      )}

      {!isPending && insights.length === 0 && (
        <section className="reveal reveal-1 flex flex-col items-start gap-6 py-10">
          <h2 className="max-w-[22ch] font-editorial text-h2 text-balance text-primary">
            Nenhum acompanhamento vinculado.
          </h2>
          <p className="measure text-body-l text-secondary">
            Envie um convite por e-mail. A pessoa cria a conta e escolhe os
            escopos do vínculo antes que qualquer contexto exista.
          </p>
          <Link href="/convites" className={buttonStyles()}>
            Criar convite
          </Link>
        </section>
      )}

      {ordered.length > 0 && (
        <section className="reveal reveal-1 flex flex-col">
          <EditorialList as="ul">
            {ordered.map((insight) => {
              const days = insight.daysSinceLatest;

              return (
                <li key={insight.connectionId}>
                  <EditorialRow
                    href={`/pacientes/${insight.connectionId}`}
                    linkComponent={Link}
                    title={insight.connection.patient_display_name ?? "Paciente"}
                    lead={
                      insight.connection.activated_at
                        ? formatDate(insight.connection.activated_at)
                        : undefined
                    }
                    badge={
                      !insight.allowsReports && (
                        <span className="type-meta inline-flex items-center gap-1.5 rounded-xs bg-inset px-2 py-1 text-tertiary">
                          <Icon name="privacy" size={16} />
                          Sem contexto autorizado
                        </span>
                      )
                    }
                    meta={
                      <MetaStrip
                        className="md:justify-end"
                        items={[
                          ENGAGEMENT_LABEL[insight.engagement],
                          insight.latest
                            ? pluralize(
                                insight.latest.coverage.active_day_count,
                                "dia com registro",
                                "dias com registro",
                              )
                            : null,
                        ]}
                      />
                    }
                  >
                    {lastContextLabel(days, insight.latest?.period_end)}
                    {insight.latest ? `. ${insight.latest.summary}` : "."}
                  </EditorialRow>
                </li>
              );
            })}
          </EditorialList>
        </section>
      )}

      {ended.length > 0 && (
        <section className="reveal reveal-2 flex flex-col gap-2">
          <p className="type-eyebrow border-b border-hairline pb-3 text-tertiary">
            Acompanhamentos encerrados
          </p>
          <EditorialList as="ul" className="border-t-0">
            {ended.map((insight) => (
              <li key={insight.connectionId}>
                <EditorialRow
                  href={`/pacientes/${insight.connectionId}`}
                  linkComponent={Link}
                  title={insight.connection.patient_display_name ?? "Paciente"}
                  lead={
                    insight.connection.activated_at
                      ? formatDate(insight.connection.activated_at)
                      : undefined
                  }
                  meta={<MetaStrip className="md:justify-end" items={["encerrado"]} />}
                >
                  Os contextos recebidos continuam acessíveis; novos não podem
                  ser solicitados.
                </EditorialRow>
              </li>
            ))}
          </EditorialList>
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
