import type {
  Connection,
  ContextReport,
  Invitation,
  Passkey,
  ProfessionalProfile,
} from "@sinapsa/api-client";
import { ago, ahead } from "./shared";
import { contextReports } from "./app";

export const profile: ProfessionalProfile = {
  profession_type: "psychologist",
  registration_country_code: "BR",
  registration_region: "SP",
  registration_number: "06/123456",
  bio: "Atendo adultos em terapia cognitivo-comportamental, com foco em ansiedade e questões relacionadas a trabalho.",
  certifications: [
    "Formação em terapia cognitivo-comportamental — Instituto Beck",
    "Especialização em saúde mental do trabalhador — USP",
  ],
  organization: { id: "org-1", name: "Consultório Rui Andrade" },
  membership: { role: "owner" },
  plan: { code: "single", status: "trialing" },
};

/**
 * Pacientes em estados diferentes de propósito: um com tudo compartilhado,
 * um que revogou os relatórios (mostra o aviso na tela de detalhe), um recém
 * aceito sem relatório ainda, e um acompanhamento encerrado.
 */
export const patients: Connection[] = [
  {
    id: "conn-rui",
    connection_id: "conn-rui",
    status: "active",
    organization_name: "Consultório Rui Andrade",
    patient_display_name: "Helena Marques",
    patient_email: "helena@exemplo.com",
    consent_scopes: ["summaries", "events", "marked_topics"],
    activated_at: ago(90),
    ended_at: null,
    created_at: ago(92),
  },
  {
    id: "conn-teresa",
    connection_id: "conn-teresa",
    status: "active",
    organization_name: "Consultório Rui Andrade",
    patient_display_name: "Teresa Lopes",
    patient_email: "teresa@exemplo.com",
    // Revogou os relatórios: a tela precisa explicar em vez de só travar.
    consent_scopes: ["events"],
    activated_at: ago(45),
    ended_at: null,
    created_at: ago(46),
  },
  {
    id: "conn-caio",
    connection_id: "conn-caio",
    status: "active",
    organization_name: "Consultório Rui Andrade",
    patient_display_name: "Caio Ferraz",
    patient_email: "caio@exemplo.com",
    consent_scopes: ["summaries", "marked_topics"],
    activated_at: ago(4),
    ended_at: null,
    created_at: ago(5),
  },
  {
    id: "conn-antiga",
    connection_id: "conn-antiga",
    status: "ended",
    organization_name: "Consultório Rui Andrade",
    patient_display_name: "Marina Duarte",
    patient_email: "marina@exemplo.com",
    consent_scopes: [],
    activated_at: ago(300),
    ended_at: ago(60),
    created_at: ago(302),
  },
];

/**
 * Histórico semanal, para as faixas de atividade do painel terem o que
 * mostrar. Os números de `active_day_count` variam de propósito: períodos com
 * cobertura regular, um período limitado e um vínculo com pouco histórico.
 */
function weeklyReport(
  connectionId: string,
  weeksAgo: number,
  activeDays: number,
): ContextReport {
  const base = contextReports[0]!;
  return {
    ...structuredClone(base),
    id: `${connectionId}-w${weeksAgo}`,
    connection_id: connectionId,
    period_start: ago(weeksAgo * 7 + 7),
    period_end: ago(weeksAgo * 7),
    coverage: {
      conversation_count: Math.max(1, Math.round(activeDays / 2)),
      user_message_count: activeDays * 4,
      active_day_count: activeDays,
      completeness: activeDays >= 5 ? "substantial" : activeDays <= 1 ? "limited" : "partial",
      note:
        activeDays === 0
          ? "Nenhuma conversa registrada neste período."
          : "Cobre apenas os assuntos mencionados.",
    },
    timeline: base.timeline.map((entry, index) => ({
      ...entry,
      id: `${connectionId}-w${weeksAgo}-timeline-${index}`,
      occurred_at: ago(weeksAgo * 7 + Math.max(1, 6 - index)),
    })),
    items: base.items.map((item, index) => ({
      ...item,
      id: `${connectionId}-w${weeksAgo}-item-${index}`,
      occurred_at: item.occurred_at
        ? ago(weeksAgo * 7 + Math.max(1, 6 - index))
        : undefined,
    })),
    created_at: ago(weeksAgo * 7),
  };
}

/** O profissional enxerga apenas relatórios dos próprios vínculos autorizados. */
export const patientContexts: Record<string, ContextReport[]> = {
  // Conversa regular, com uma semana de silêncio no meio.
  "conn-rui": [
    ...[6, 4, 5, 1, 6, 5, 4].map((days, index) =>
      weeklyReport("conn-rui", 6 - index, days),
    ),
    ...contextReports,
  ],
  // Revogou o consentimento de relatórios: nada chega.
  "conn-teresa": [],
  // Recém chegado, ainda com pouco histórico.
  "conn-caio": [2, 1].map((days, index) => weeklyReport("conn-caio", 1 - index, days)),
  "conn-antiga": [],
};

export const invitations: Invitation[] = [
  {
    id: "inv-1",
    email: "caio@exemplo.com",
    invitation_token: "token-aceito-caio",
    status: "accepted",
    expires_at: ago(-3),
    created_at: ago(5),
  },
  {
    id: "inv-2",
    email: "joana.pires@exemplo.com",
    invitation_token: "token-pendente-joana",
    status: "pending",
    expires_at: ahead(4),
    created_at: ago(3),
  },
  {
    id: "inv-3",
    email: "antigo@exemplo.com",
    invitation_token: "token-expirado",
    status: "expired",
    expires_at: ago(10),
    created_at: ago(24),
  },
];

export const passkeys: Passkey[] = [
  {
    id: "passkey-mac",
    label: "MacBook do consultório",
    created_at: ago(200),
    last_used_at: ago(0, 2),
  },
  {
    id: "passkey-phone",
    label: "iPhone",
    created_at: ago(150),
    last_used_at: ago(6),
  },
];

export const recoveryCodes = [
  "H4KP-9WQZ-2MRT",
  "B7XN-3LVD-8CFG",
  "R2JS-6YHK-4PWM",
  "T9QE-1ZBN-7XVC",
  "M5DL-8RGA-3KJP",
  "W1FC-4NTS-9HBY",
];
