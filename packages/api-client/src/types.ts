/**
 * Tipos do contrato v1 (FRONTEND_API_CONTRACT.md).
 * JSON é snake_case e o backend REJEITA campos desconhecidos — por isso
 * nunca espalhe (`...`) um objeto de resposta dentro de um corpo de request.
 */

export type Audience = "app" | "professional";

export type IssuedToken = {
  access_token: string;
  token_type: "Bearer";
  expires_at: string;
};

export type Session = {
  id: string;
  created_ip: string;
  last_used_ip: string;
  user_agent: string;
  mfa_verified: boolean;
  expires_at: string;
  last_used_at: string;
  created_at: string;
  revoked_at: string | null;
  current_session: boolean;
};

export type Account = {
  id: string;
  email: string;
  display_name: string;
  status: string;
  email_verified_at: string | null;
  audience: Audience;
  mfa_verified: boolean;
};

export type RegisterResponse = {
  account_id: string;
  email: string;
  verification_required: boolean;
  /** Só existe em development. Nunca exibir fora dele. */
  development_token?: string;
};

export type GenericAcceptedResponse = {
  message: string;
  development_token?: string;
};

/* ---------------------------------------------------------------- passkeys */

export type PasskeyCeremony = {
  ceremony_token: string;
  /** Payload opaco produzido pelo backend; entregar direto ao WebAuthn. */
  public_key: Record<string, unknown>;
};

export type Passkey = {
  id: string;
  label: string;
  created_at: string;
  last_used_at?: string | null;
};

export type PasskeyRegistrationResult = {
  passkey: Passkey;
  /** Só no cadastro da primeira passkey. Exibir uma vez, nunca persistir. */
  recovery_codes?: string[];
  access_token: string;
  token_type: "Bearer";
  expires_at: string;
};

/**
 * Login profissional é uma união de estados, não um objeto fixo.
 * Ver FRONTEND_API_CONTRACT.md §"Passkeys dos profissionais".
 */
export type ProfessionalLoginResponse =
  | {
      passkey_required: true;
      passkey_ceremony: PasskeyCeremony;
      tokens?: undefined;
    }
  | {
      passkey_required: false;
      passkey_enrollment_needed?: boolean;
      tokens: IssuedToken;
    };

export type AppLoginResponse = {
  tokens: IssuedToken;
  passkey_required: false;
};

/* ------------------------------------------------------------- consentimentos */

export type ConsentType = "terms" | "privacy" | "ai_processing";

export type Consent = {
  type: ConsentType;
  policy_version: string;
  granted_at: string;
};

/* ------------------------------------------------------------------ conversas */

export type Conversation = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type MessageRole = "user" | "assistant";

export type GenerationStatus = "completed" | "pending" | "failed" | "blocked";

export type Message = {
  id: string;
  conversation_id: string;
  sequence: number;
  role: MessageRole;
  content: string;
  in_reply_to_message_id?: string;
  generation_status: GenerationStatus;
  /** Rastreabilidade apenas. A UI NUNCA decide nada por estes campos. */
  ai_provider?: string;
  ai_model?: string;
  prompt_version?: string;
  failure_code?: string;
  created_at: string;
};

export type AssistantStatus = "completed" | "blocked" | "failed" | "pending";

export type SendMessageResponse = {
  user_message: Message;
  assistant_message?: Message;
  assistant_status: AssistantStatus;
};

/* -------------------------------------------------------- convites e vínculos */

export type ConsentScope = "summaries" | "events" | "marked_topics";

export type Invitation = {
  id: string;
  email: string;
  invitation_token?: string;
  status: string;
  expires_at: string;
  created_at: string;
};

export type InvitationPreview = {
  professional_display_name: string;
  profession_type: string;
  organization_name: string;
  masked_email: string;
  expires_at: string;
};

export type Connection = {
  id: string;
  connection_id?: string;
  status: string;
  organization_name?: string;
  patient_display_name?: string;
  patient_email?: string;
  professional_display_name?: string;
  profession_type?: string;
  consent_scopes: ConsentScope[];
  activated_at: string | null;
  ended_at: string | null;
  created_at: string;
};

/* ------------------------------------------------------------- profissional */

export type ProfessionType =
  | "psychologist"
  | "psychiatrist"
  | "psychoanalyst"
  | "therapist"
  | "psychotherapist"
  | "occupational_therapist"
  | "counselor"
  | "other";

export type ProfessionalProfileInput = {
  profession_type: ProfessionType;
  registration_country_code: string;
  registration_region: string;
  registration_number: string;
  bio: string;
  certifications: string[];
};

export type ProfessionalProfile = ProfessionalProfileInput & {
  id?: string;
  organization?: { id: string; name: string } | null;
  membership?: { role: string } | null;
  plan?: { code: string; status: string } | null;
};

/* ---------------------------------------------------------------- relatórios */

export type ReportCoverage = {
  conversation_count: number;
  user_message_count: number;
  active_day_count: number;
  completeness: "limited" | "partial" | "substantial" | (string & {});
  note?: string | null;
};

export type TimelineEntry = {
  id: string;
  description: string;
  occurred_at?: string | null;
};

export type ContextItemKind =
  | "priority"
  | "event"
  | "challenge"
  | "emotion"
  | "thought"
  | "behavior"
  | "strategy"
  | "support"
  | "change"
  | "open_topic"
  | "safety_context"
  | (string & {});

export type EvidenceStrength =
  | "explicit_once"
  | "explicit_repeated"
  | "uncertain"
  | "contradictory"
  | (string & {});

export type EmotionalValence =
  | "pleasant"
  | "unpleasant"
  | "mixed"
  | "neutral";

export type ContextItem = {
  id: string;
  kind: ContextItemKind;
  title: string;
  description: string;
  impact?: string;
  evidence_strength: EvidenceStrength;
  emotional_valence?: EmotionalValence;
  occurred_at?: string | null;
  limitations: string[];
  included: boolean;
};

export type ContextReport = {
  id: string;
  connection_id: string;
  schema_version: string;
  title: string;
  period_start: string;
  period_end: string;
  coverage: ReportCoverage;
  summary: string;
  timeline: TimelineEntry[];
  items: ContextItem[];
  limitations: string[];
  provider: string;
  model: string;
  prompt_version: string;
  graph_version: string;
  review_status:
    | "pending_review"
    | "approved"
    | "rejected"
    | (string & {});
  reviewed_at?: string | null;
  created_at: string;
};

export type ContextReportRequestStatus =
  | "pending"
  | "processing"
  | "sent"
  | "declined"
  | "expired"
  | "failed";

/**
 * Metadados da solicitação. O produto do paciente recebe apenas este objeto,
 * nunca o ContextReport produzido a partir dele.
 */
export type ContextReportRequest = {
  id: string;
  connection_id: string;
  professional_display_name?: string;
  patient_display_name?: string;
  period_start: string;
  period_end: string;
  status: ContextReportRequestStatus;
  requested_at: string;
  sent_at: string | null;
};
