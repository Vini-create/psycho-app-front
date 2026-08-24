"use client";

import Link from "next/link";
import {
  Alert,
  BarStrip,
  EditorialList,
  EditorialRow,
  Icon,
  MetaStrip,
  PaperPanel,
  ProvenanceLabel,
  SectionIndex,
  Skeleton,
  StatBlock,
  StoryBlock,
  buttonStyles,
  cx,
  pluralize,
} from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { useInvitations, usePatientInsights } from "@/lib/queries";
import { itemKindLabel } from "@/lib/report-labels";
import {
  ENGAGEMENT_LABEL,
  aggregateActivity,
  attentionItems,
  recentlyGenerated,
} from "@/lib/insights";

/* Brand Book V2 §21 — "Abrir o Sinapsa deve parecer abrir a edição do dia."

   O que mudou em relação ao painel V1, e por quê:

   - o hero card com saudação de 76px ("Boa tarde, Rui.") saiu. Saudação não
     é informação: ocupava a dobra inteira com zero contexto clínico. A
     manchete agora é a única pergunta que importa às 9h da manhã — quanta
     coisa nova há para ler antes das sessões de hoje.
   - o gráfico "cobertura dos contextos" desceu para a zona instrumental.
     §21 é explícito: "o gráfico de uso da base não deve competir com o
     motivo principal de visita".
   - as quatro StatTiles em grid viraram StatBlocks tipográficos numa faixa
     secundária. Eram quatro caixas idênticas competindo pelo mesmo peso —
     exatamente o que a regra 1–2–N do §06 proíbe.
   - a fila de pacientes virou issue list numerada: stories com manchete
     narrativa, não linhas de tabela. */

const EDITION_DATE = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const DAY_MONTH = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Sao_Paulo",
});

const DAY_ONLY = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const MONTH_OF = new Intl.DateTimeFormat("pt-BR", {
  month: "numeric",
  timeZone: "America/Sao_Paulo",
});

/**
 * "14–21 AGO" — carimbo técnico, não pill glossy (§16).
 *
 * Dentro do mesmo mês o nome aparece uma vez só. Repetir "15 DE AGO – 22 DE
 * AGO" estourava a coluna de índice em três linhas e transformava a
 * metadata em ruído.
 */
function periodTag(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameMonth = MONTH_OF.format(start) === MONTH_OF.format(end);

  const text = sameMonth
    ? `${DAY_ONLY.format(start)}–${DAY_MONTH.format(end)}`
    : `${DAY_MONTH.format(start)}–${DAY_MONTH.format(end)}`;

  return text.replace(/\./g, "").replace(/ de /g, " ").toUpperCase();
}

function Painel() {
  const { insights, subscription, isPending, error } = usePatientInsights();
  const invitations = useInvitations();

  const active = insights.filter(
    (insight) => insight.connection.status === "active",
  );
  const pendingInvitations =
    invitations.data?.invitations.filter(
      (invitation) => invitation.status === "pending",
    ) ?? [];

  const attention = attentionItems({
    insights,
    invitations: invitations.data?.invitations ?? [],
    subscription,
  });
  const fresh = recentlyGenerated(insights);
  const baseActivity = aggregateActivity(active);

  // Quem tem contexto novo aparece primeiro; depois quem está há mais tempo
  // sem nada. A ordem da lista já é uma recomendação de leitura.
  const ordered = [...active].sort((a, b) => {
    const aDays = a.daysSinceLatest ?? Number.MAX_SAFE_INTEGER;
    const bDays = b.daysSinceLatest ?? Number.MAX_SAFE_INTEGER;
    return aDays - bDays;
  });

  const reportCount = insights.reduce(
    (total, insight) => total + insight.reports.length,
    0,
  );
  const withoutReportAccess = active.filter(
    (insight) => !insight.allowsReports,
  ).length;
  const conversingNow = active.filter(
    (insight) => insight.engagement === "regular",
  ).length;

  const today = EDITION_DATE.format(new Date()).replace(/\./g, "");

  return (
    <div className="flex flex-col gap-14 sm:gap-20">
      {/* ==================================================================
          ZONA A — Editorial. A capa da edição.
          ================================================================== */}
      <header className="reveal flex flex-col gap-10 pt-2">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="flex flex-col gap-6 lg:col-span-8">
            <p className="type-eyebrow text-tertiary">
              Edição / {today}
            </p>

            {fresh.length > 0 ? (
              // O número é elemento gráfico (§14). Ele e a frase dividem a
              // linha de base: o algarismo carrega a escala, a serif carrega
              // a voz.
              <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
                <span
                  className="type-display text-display-2xl text-primary"
                  data-numeric
                >
                  {fresh.length}
                </span>
                <h1 className="max-w-[11ch] pb-2 font-editorial text-h1-editorial text-balance text-primary sm:pb-4">
                  {fresh.length === 1
                    ? "contexto novo para ler"
                    : "contextos novos para ler"}
                </h1>
              </div>
            ) : (
              <h1 className="max-w-[18ch] font-editorial text-h1-editorial text-balance text-primary">
                Nada novo desde a sua última visita.
              </h1>
            )}

            <p className="measure-narrow text-body-l text-secondary">
              {fresh.length > 0
                ? "O que está aqui é relato organizado pelas próprias pessoas. A leitura clínica continua sendo sua."
                : "Os contextos aparecem depois que você solicita um período e a pessoa confirma o envio em Minha rede."}
            </p>
          </div>

          {/* Coluna 4 — instrumento. Silenciosa, alinhada à direita no
              desktop; vira faixa acima no mobile (ordem de colapso §30). */}
          <aside className="flex flex-col gap-5 border-t border-hairline pt-5 lg:col-span-4 lg:border-t-0 lg:border-l lg:pt-1 lg:pl-8">
            <div className="flex flex-col gap-1">
              <p className="type-eyebrow text-tertiary">Assinatura</p>
              <p
                className={cx(
                  "type-ui text-ui",
                  subscription.active ? "text-primary" : "text-destructive",
                )}
              >
                {subscription.label}
              </p>
            </div>

            <MetaStrip
              className="flex-col items-start gap-1"
              items={[
                pluralize(
                  active.length,
                  "acompanhamento ativo",
                  "acompanhamentos ativos",
                ),
                pluralize(reportCount, "contexto recebido", "contextos recebidos"),
                pendingInvitations.length > 0
                  ? pluralize(
                      pendingInvitations.length,
                      "convite aguardando",
                      "convites aguardando",
                    )
                  : null,
              ]}
            />

            <Link
              href="/convites"
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              Convidar paciente
            </Link>
          </aside>
        </div>
      </header>

      {error && <Alert tone="danger">{describeError(error).message}</Alert>}

      {/* ==================================================================
          ZONA B — Conteúdo. As histórias priorizadas.
          ================================================================== */}
      {fresh.length > 0 && (
        <section className="reveal reveal-1 flex flex-col gap-2">
          <SectionIndex index="01" meta="ordenado por chegada">
            Para ler antes das sessões
          </SectionIndex>

          <div className="flex flex-col">
            {fresh.slice(0, 6).map(({ insight, report }, position) => {
              // A manchete é o item mais saliente do relatório — organizado
              // pela IA, e rotulado como tal. Sem item, o título do próprio
              // relatório assume, que também é organizado.
              const lead = report.items.find((item) => item.included) ?? report.items[0];
              const name =
                insight.connection.patient_display_name ?? "Paciente";

              return (
                <StoryBlock
                  key={report.id}
                  index={`${String(position + 1).padStart(2, "0")} / ${name}`}
                  headline={lead?.title ?? report.title}
                  href={`/pacientes/${insight.connectionId}`}
                  linkComponent={Link}
                  provenance={<ProvenanceLabel kind="organized" />}
                  flush={position === Math.min(fresh.length, 6) - 1}
                  meta={
                    <MetaStrip
                      items={[
                        periodTag(report.period_start, report.period_end),
                        lead ? itemKindLabel(lead.kind) : null,
                        pluralize(
                          report.items.length,
                          "ponto observado",
                          "pontos observados",
                        ),
                      ]}
                    />
                  }
                >
                  {lead?.description ?? report.summary}
                </StoryBlock>
              );
            })}
          </div>
        </section>
      )}

      {/* Fila de atenção: só existe quando há decisão a tomar. */}
      {attention.length > 0 && (
        <section className="reveal reveal-2 flex flex-col gap-6">
          <SectionIndex
            index="02"
            meta={pluralize(attention.length, "pendência", "pendências")}
          >
            Precisa de você
          </SectionIndex>

          <div className="flex flex-col gap-4">
            {attention.map((item) => (
              <Alert
                key={item.id}
                tone={item.tone}
                title={item.title}
                action={
                  item.href && (
                    <Link
                      href={item.href}
                      className={buttonStyles({ variant: "secondary", size: "sm" })}
                    >
                      {item.actionLabel ?? "Abrir"}
                    </Link>
                  )
                }
              >
                {item.detail}
              </Alert>
            ))}
          </div>
        </section>
      )}

      {/* ==================================================================
          Acompanhamentos — rows editoriais, não grid de cards (§17).
          ================================================================== */}
      <section className="reveal reveal-3 flex flex-col gap-2">
        <SectionIndex
          index={fresh.length > 0 ? "03" : "01"}
          meta="por contexto mais recente"
        >
          Acompanhamentos
        </SectionIndex>

        {isPending && (
          <div className="flex flex-col gap-3 pt-4">
            <Skeleton className="h-20" aria-label="Carregando acompanhamentos" />
            <Skeleton className="h-20" />
          </div>
        )}

        {!isPending && ordered.length === 0 && (
          <div className="flex flex-col items-start gap-6 py-14">
            <h3 className="max-w-[20ch] font-editorial text-h2 text-balance text-primary">
              Nenhum acompanhamento ainda.
            </h3>
            <p className="measure text-body-l text-secondary">
              Convide alguém por e-mail. A pessoa recebe um link, cria a conta
              e escolhe os escopos do vínculo antes que qualquer contexto
              possa ser solicitado.
            </p>
            <Link href="/convites" className={buttonStyles()}>
              Criar o primeiro convite
            </Link>
          </div>
        )}

        {ordered.length > 0 && (
          <EditorialList as="ul" className="border-t-0">
            {ordered.map((insight) => {
              const name =
                insight.connection.patient_display_name ?? "Paciente";
              const latest = insight.latest;

              return (
                <li key={insight.connectionId}>
                  <EditorialRow
                    href={`/pacientes/${insight.connectionId}`}
                    linkComponent={Link}
                    title={name}
                    lead={
                      latest
                        ? periodTag(latest.period_start, latest.period_end)
                        : undefined
                    }
                    meta={
                      <MetaStrip
                        className="md:justify-end"
                        items={[
                          ENGAGEMENT_LABEL[insight.engagement],
                          insight.daysSinceLatest === null
                            ? null
                            : insight.daysSinceLatest === 0
                              ? "chegou hoje"
                              : `há ${pluralize(insight.daysSinceLatest, "dia", "dias")}`,
                        ]}
                      />
                    }
                    badge={
                      !insight.allowsReports && (
                        <span className="type-meta inline-flex items-center gap-1.5 rounded-xs bg-inset px-2 py-1 text-tertiary">
                          <Icon name="privacy" size={16} />
                          Sem contexto autorizado
                        </span>
                      )
                    }
                  >
                    {latest?.summary ??
                      "Ainda sem contexto recebido neste acompanhamento."}
                  </EditorialRow>
                </li>
              );
            })}
          </EditorialList>
        )}
      </section>

      {/* ==================================================================
          ZONA C — Instrumento. Números operacionais, peso mínimo.
          ================================================================== */}
      <section className="reveal reveal-4 flex flex-col gap-8">
        <SectionIndex meta="atualizado nesta visita">
          Pulso da base
        </SectionIndex>

        <div className="grid gap-10 lg:grid-cols-12">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:col-span-7">
            <StatBlock
              size="sm"
              label="Ativos"
              value={active.length}
              context={
                conversingNow > 0
                  ? `${conversingNow} com conversas regulares`
                  : "nenhum com conversa regular"
              }
            />
            <StatBlock
              size="sm"
              label="Contextos"
              value={reportCount}
              context="só em vínculos autorizados"
            />
            <StatBlock
              size="sm"
              label="Sem autorização"
              value={withoutReportAccess}
              context="não compartilham contexto"
            />
          </div>

          {baseActivity.length > 0 && (
            <div className="lg:col-span-5">
              <BarStrip
                label="Dias com registro por período, nos contextos mais recentes"
                family="fogblue"
                points={baseActivity.map((point) => ({
                  label: point.label,
                  value: point.value,
                }))}
              />
              <p className="type-meta pt-3 text-tertiary">
                {baseActivity.at(-1)!.value} de {baseActivity.at(-1)!.total} dias
                com registro no período mais recente
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Fechamento: o limite do produto aparece onde a leitura termina,
          não numa página de termos. */}
      <PaperPanel
        family="fogblue"
        eyebrow="Como ler o que chega aqui"
        title="O sistema descreve. Você interpreta."
        className="reveal reveal-4"
      >
        <p className="measure">
          Os contextos registram o que a pessoa relatou, com o período e a
          cobertura declarados. Não há diagnóstico, avaliação nem hipótese, e
          você nunca tem acesso ao histórico bruto das conversas.
        </p>
      </PaperPanel>
    </div>
  );
}

export default function PainelPage() {
  return <Painel />;
}
