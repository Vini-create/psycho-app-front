"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  Alert,
  Badge,
  Card,
  CardTitle,
  EmptyState,
  ActivityBars,
  Metadata,
  Overline,
  Prose,
  Skeleton,
  StatTile,
  TextureLayer,
  buttonStyles,
  formatDate,
  pluralize,
} from "@sinapsa/ui";
import { describeError } from "@sinapsa/api-client";
import { AppShell } from "@/components/AppShell";
import { AuthGate, MfaGate, OnboardingGate } from "@/components/Gates";
import { PatientRow } from "@/components/PatientRow";
import { useInvitations, usePatientInsights } from "@/lib/queries";
import {
  emotionalValenceLabel,
  evidenceLabel,
  itemKindLabel,
} from "@/lib/report-labels";
import {
  aggregateActivity,
  attentionItems,
  recentlyGenerated,
} from "@/lib/insights";
import { useSession } from "@/lib/session";

const TODAY = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  timeZone: "America/Sao_Paulo",
});

const HOUR = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  hour12: false,
  timeZone: "America/Sao_Paulo",
});

function greetingFor(date: Date): string {
  const hour = Number(HOUR.format(date));
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function Painel() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { account } = useSession();
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

  const conversingNow = active.filter(
    (insight) => insight.engagement === "regular",
  ).length;
  const reportCount = insights.reduce(
    (total, insight) => total + insight.reports.length,
    0,
  );
  const withoutReportAccess = active.filter(
    (insight) => !insight.allowsReports,
  ).length;
  const observationSignals = active
    .flatMap((insight) => {
      return (insight.latest?.items ?? []).map((item) => ({ insight, item }));
    })
    .sort((a, b) => {
      const strengthPriority: Record<string, number> = {
        contradictory: 0,
        explicit_repeated: 1,
        uncertain: 2,
        explicit_once: 3,
      };
      const kindPriority: Record<string, number> = {
        safety_context: 0,
        priority: 1,
        open_topic: 2,
        change: 3,
      };
      return (
        (strengthPriority[a.item.evidence_strength] ?? 4) -
          (strengthPriority[b.item.evidence_strength] ?? 4) ||
        (kindPriority[a.item.kind] ?? 4) - (kindPriority[b.item.kind] ?? 4)
      );
    })
    .slice(0, 6);
  const firstName = account?.display_name.split(" ")[0] ?? "profissional";
  const greeting = greetingFor(new Date());

  useLayoutEffect(() => {
    const root = dashboardRef.current;
    if (!root || isPending) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let observer: IntersectionObserver | undefined;
    const counterTweens: gsap.core.Tween[] = [];
    const animateCounter = (element: HTMLElement, delay = 0) => {
      const target = Number(element.dataset.countTo ?? element.textContent ?? 0);
      const counter = { value: 0 };
      element.textContent = "0";
      counterTweens.push(gsap.to(counter, {
        value: target,
        duration: 1.15,
        delay,
        ease: "power3.out",
        snap: { value: 1 },
        onUpdate: () => {
          element.textContent = String(counter.value);
        },
      }));
    };

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .fromTo(
          "[data-dashboard-kicker] > *",
          { autoAlpha: 0, y: -10 },
          { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.07 },
        )
        .fromTo(
          "[data-dashboard-hero-copy] > :not([data-dashboard-kicker])",
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.09 },
          "-=0.22",
        )
        .fromTo(
          "[data-dashboard-activity]",
          { autoAlpha: 0, x: 26, rotate: 1.2 },
          { autoAlpha: 1, x: 0, rotate: 0, duration: 0.8 },
          "-=0.55",
        )
        .fromTo(
          "[data-dashboard-hero] [data-activity-fill]",
          { scaleY: 0, transformOrigin: "bottom" },
          { scaleY: 1, duration: 0.75, stagger: 0.045, ease: "back.out(1.5)" },
          "-=0.48",
        );

      const heroCounter = root.querySelector<HTMLElement>("[data-hero-count]");
      if (heroCounter) animateCounter(heroCounter, 0.22);

      const sections = Array.from(
        root.querySelectorAll<HTMLElement>("[data-dashboard-section]"),
      );
      gsap.set(sections, { autoAlpha: 0, y: 28 });

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const section = entry.target as HTMLElement;
            const items = section.querySelectorAll<HTMLElement>(
              "[data-dashboard-item], [data-dashboard-row], .dashboard-stat",
            );
            gsap.to(section, {
              autoAlpha: 1,
              y: 0,
              duration: 0.65,
              ease: "power3.out",
              clearProps: "opacity,visibility,transform",
            });
            if (items.length > 0) {
              gsap.fromTo(
                items,
                { autoAlpha: 0, y: 18 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.55,
                  stagger: 0.065,
                  ease: "power3.out",
                  clearProps: "opacity,visibility,transform",
                },
              );
            }
            section
              .querySelectorAll<HTMLElement>("[data-count-to]")
              .forEach((counter, index) => animateCounter(counter, index * 0.06));
            gsap.fromTo(
              section.querySelectorAll("[data-activity-fill]"),
              { scaleY: 0, transformOrigin: "bottom" },
              { scaleY: 1, duration: 0.65, stagger: 0.035, ease: "power3.out" },
            );
            observer?.unobserve(section);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -6%" },
      );
      sections.forEach((section) => observer?.observe(section));
    }, root);

    return () => {
      observer?.disconnect();
      counterTweens.forEach((tween) => tween.kill());
      context.revert();
    };
  }, [isPending]);

  return (
    <div ref={dashboardRef} className="flex flex-col gap-12 sm:gap-20">
      {/* Cabeçalho editorial: é aqui que o painel deixa de ser um relatório de
          sistema e vira a página de preparação do dia. */}
      <header data-dashboard-hero className="relative -mx-5 overflow-hidden rounded-b-2xl bg-card px-5 pb-10 pt-8 sm:-mx-8 sm:px-8 sm:pb-14 sm:pt-12 lg:-mx-12 lg:px-12">
        <TextureLayer variant="paper" />
        <span aria-hidden="true" className="pointer-events-none absolute -right-4 -bottom-24 font-editorial text-[17rem] leading-none italic text-brand opacity-[0.055] sm:right-8 sm:text-[24rem]">S</span>

        <div className={baseActivity.length > 0 ? "relative grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)] lg:items-end lg:gap-14" : "relative"}>
          <div data-dashboard-hero-copy className="flex flex-col gap-7">
            <p className="max-w-none font-utility text-[2.75rem] leading-[0.9] font-bold uppercase tracking-[-0.035em] text-primary sm:text-[4.75rem]">
              {greeting}, {firstName}.
            </p>
            <div data-dashboard-kicker className="flex flex-wrap items-center gap-3">
              <Metadata className="uppercase tracking-[0.12em]">
                {TODAY.format(new Date())}
              </Metadata>
              <Badge tone={subscription.active ? "brand" : "danger"}>
                {subscription.label}
              </Badge>
            </div>

            {/* Um herói só existe quando há número que valha liderar. Abrir a
                tela com "0" seria um anticlímax diário — quando não há nada
                novo, quem lidera é a frase. */}
            {fresh.length > 0 ? (
              <div className="flex flex-col gap-5">
                <p className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-4">
                  <span data-hero-count data-count-to={fresh.length} className="font-utility text-[5.25rem] leading-[0.78] font-bold tracking-[-0.05em] text-primary sm:text-[7rem]">{fresh.length}</span>
                  <span className="max-w-[12ch] pb-1 font-editorial text-heading-lg leading-[1.02] text-secondary sm:text-heading-xl">
                    {fresh.length === 1 ? "contexto novo para ler" : "contextos novos para ler"}
                  </span>
                </p>
                <Prose className="max-w-[52ch]">
                  <p>
                    O que está aqui é relato organizado pelas próprias pessoas
                    — a leitura clínica continua sendo sua.
                  </p>
                </Prose>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="font-editorial text-display-md text-primary text-balance">
                  Nada novo desde a última visita.
                </p>
                <Prose className="max-w-[52ch]">
                  <p>
                    Os relatórios aparecem depois que você solicita um período
                    e a pessoa confirma o envio em Minha rede.
                  </p>
                </Prose>
              </div>
            )}

            {fresh.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {fresh.slice(0, 5).map(({ insight, report }) => (
                  <li key={report.id}>
                    <Link
                      href={`/pacientes/${insight.connectionId}`}
                      className={buttonStyles({ variant: "secondary", size: "sm" })}
                    >
                      {insight.connection.patient_display_name ?? "Paciente"} ·{" "}
                      {formatDate(report.period_end)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cobertura agregada apenas dos períodos presentes nos relatórios. */}
          {baseActivity.length > 0 && (
            <Card data-dashboard-activity variant="inverse" className="min-h-64 justify-between gap-6 p-6 sm:p-7">
              <Overline as="h2" className="text-on-inverse-muted">
                Cobertura dos contextos
              </Overline>
              <ActivityBars points={baseActivity} height={112} showLegend />
              <Metadata className="text-on-inverse-muted">
                {baseActivity.at(-1)!.value} de {baseActivity.at(-1)!.total}{" "}
                dias com registros nos relatórios mais recentes
              </Metadata>
            </Card>
          )}
        </div>
      </header>

      {error && <Alert tone="danger">{describeError(error).message}</Alert>}

      <section data-dashboard-section className="flex flex-col gap-6">
        <div data-dashboard-item className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Overline as="h2" className="text-secondary">Pulso da base</Overline>
            <p className="font-editorial text-heading-lg leading-tight text-primary">
              Um retrato rápido antes da leitura.
            </p>
          </div>
          <Metadata>atualizado nesta visita</Metadata>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            className="dashboard-stat min-h-44 justify-between p-4 sm:p-5"
            label="Pacientes ativos"
            value={<span data-count-to={active.length}>{active.length}</span>}
            hint={
              conversingNow > 0
                ? `${conversingNow} com conversas regulares`
                : "Nenhum com conversa regular no último período"
            }
          />
          <StatTile
            className="dashboard-stat min-h-44 justify-between p-4 sm:p-5"
            label="Contextos recebidos"
            value={<span data-count-to={reportCount}>{reportCount}</span>}
            hint="Gerados apenas para acompanhamentos autorizados"
          />
          <StatTile
            className="dashboard-stat min-h-44 justify-between p-4 sm:p-5"
            label="Convites pendentes"
            value={<span data-count-to={pendingInvitations.length}>{pendingInvitations.length}</span>}
            hint={pendingInvitations.length > 0 ? "Aguardando aceite" : "Nenhum convite aberto"}
          />
          <StatTile
            className="dashboard-stat min-h-44 justify-between p-4 sm:p-5"
            label="Sem autorização"
            value={<span data-count-to={withoutReportAccess}>{withoutReportAccess}</span>}
            tone={withoutReportAccess > 0 ? "attention" : "neutral"}
            hint="Não compartilham relatórios"
          />
        </div>
      </section>

      {/* Fila de atenção: só aparece quando existe decisão a tomar. */}
      {attention.length > 0 && (
        <section data-dashboard-section className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
          <div data-dashboard-item className="flex flex-col gap-3">
            <Overline as="h2" className="text-secondary">Precisa de você</Overline>
            <p className="font-editorial text-heading-lg leading-tight text-primary">
              O que pede decisão vem antes do restante.
            </p>
            <Metadata>{pluralize(attention.length, "pendência", "pendências")}</Metadata>
          </div>
          <div className="flex flex-col gap-4">
            {attention.map((item) => (
              <div key={item.id} data-dashboard-item>
                <Alert
                  tone={item.tone}
                  title={item.title}
                  action={
                    item.href && (
                      <Link href={item.href} className={buttonStyles({ variant: "secondary", size: "sm" })}>
                        {item.actionLabel ?? "Abrir"}
                      </Link>
                    )
                  }
                >
                  {item.detail}
                </Alert>
              </div>
            ))}
          </div>
        </section>
      )}

      {observationSignals.length > 0 && (
        <section data-dashboard-section className="grid gap-7 rounded-2xl bg-card p-5 sm:p-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
          <div data-dashboard-item className="flex flex-col gap-3">
            <Overline as="h2" className="text-secondary">
              Observações recentes
            </Overline>
            <p className="font-editorial text-heading-lg leading-tight text-primary">
              Pistas de leitura organizadas nos últimos relatórios.
            </p>
            <Metadata>relatos rastreáveis, sem pontuação clínica</Metadata>
          </div>

          <ol className="flex flex-col gap-2">
            {observationSignals.map(({ insight, item }) => (
              <li key={`${insight.connectionId}-${item.id}`} data-dashboard-item>
                <Link
                  href={`/pacientes/${insight.connectionId}`}
                  className="group grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg bg-surface px-4 py-3 transition-colors hover:bg-brand-surface sm:grid-cols-[10rem_minmax(0,1fr)_11rem]"
                >
                  <span className="min-w-0">
                    <span className="block font-editorial text-heading-md font-medium text-primary">
                      {insight.connection.patient_display_name ?? "Paciente"}
                    </span>
                    <span className="mt-0.5 block truncate font-utility text-caption font-bold text-secondary sm:hidden">
                      {item.title}
                    </span>
                  </span>
                  <span className="hidden min-w-0 sm:block">
                    <span className="block truncate font-utility text-label-md font-bold text-primary transition-transform group-hover:translate-x-1">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block font-utility text-caption text-secondary">
                      {itemKindLabel(item.kind)}
                      {item.emotional_valence &&
                        ` · ${emotionalValenceLabel(item.emotional_valence)}`}
                    </span>
                  </span>
                  <Badge tone={item.evidence_strength === "contradictory" ? "warning" : "brand"}>
                    {evidenceLabel(item.evidence_strength)}
                  </Badge>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section data-dashboard-section className="flex flex-col gap-6">
        <div data-dashboard-item className="flex flex-wrap items-end justify-between gap-4">
          <Overline as="h2" className="text-secondary">
            Pacientes · por contexto mais recente
          </Overline>
          <Link
            href="/convites"
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            Convidar paciente
          </Link>
        </div>

        {isPending && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24" aria-label="Carregando pacientes" />
            <Skeleton className="h-24" />
          </div>
        )}

        {!isPending && ordered.length === 0 && (
          <EmptyState
            overline="Comece por aqui"
            title="Nenhum paciente ainda."
            description="Convide alguém por e-mail. A pessoa recebe um link, cria a conta e escolhe os escopos do vínculo antes que qualquer relatório possa ser solicitado."
            action={
              <Link href="/convites" className={buttonStyles()}>
                Criar o primeiro convite
              </Link>
            }
          />
        )}

        {ordered.length > 0 && (
          <ul className="flex flex-col gap-4">
            {ordered.map((insight) => (
              <PatientRow key={insight.connectionId} insight={insight} />
            ))}
          </ul>
        )}
      </section>

      {/* Bloco editorial de fechamento: reafirma o limite do produto onde o
          profissional termina a leitura, não numa página de termos. */}
      <Card data-dashboard-section variant="editorial" className="gap-4">
        <Overline>Como ler o que chega aqui</Overline>
        <CardTitle className="font-normal italic">
          O sistema descreve. Você interpreta.
        </CardTitle>
        <Prose>
          <p>
            Os relatórios registram o que a pessoa relatou, com o período e a
            cobertura declarados. Não há diagnóstico, avaliação nem hipótese —
            e você nunca tem acesso ao histórico bruto das conversas.
          </p>
          <p className="text-secondary">
            {pluralize(active.length, "acompanhamento ativo", "acompanhamentos ativos")}
            {" · "}
            {pluralize(
              reportCount,
              "relatório gerado",
              "relatórios gerados",
            )}
          </p>
        </Prose>
      </Card>
    </div>
  );
}

export default function PainelPage() {
  return (
    <AuthGate>
      <MfaGate>
        <OnboardingGate>
          <AppShell>
            <Painel />
          </AppShell>
        </OnboardingGate>
      </MfaGate>
    </AuthGate>
  );
}
